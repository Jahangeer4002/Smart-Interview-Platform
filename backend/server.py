from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
import requests
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
import asyncio
import statistics

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://smart-interview-platform-seven.vercel.app"
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'interview_platform_secret_key_2025_secure')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 1440))

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', '')

# Create the main app without a prefix
app = FastAPI(title="Smart Interview Scheduling Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= MODELS =============

class UserRole:
    ADMIN = "ADMIN"
    HR = "HR"
    INTERVIEWER = "INTERVIEWER"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: str
    hashed_password: str
    google_tokens: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class Candidate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    position: str
    resume_link: Optional[str] = None
    status: str = "pending"  # pending, scheduled, interviewed, rejected, hired
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CandidateCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    position: str
    resume_link: Optional[str] = None

class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    resume_link: Optional[str] = None
    status: Optional[str] = None

class Interview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    candidate_name: str
    interviewer_id: str
    interviewer_name: str
    scheduled_at: datetime
    duration_minutes: int = 60
    meeting_link: Optional[str] = None
    google_event_id: Optional[str] = None
    status: str = "scheduled"  # scheduled, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InterviewSchedule(BaseModel):
    candidate_id: str
    interviewer_id: str
    preferred_date: str  # YYYY-MM-DD

class Feedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    interview_id: str
    candidate_id: str
    interviewer_id: str
    interviewer_name: str
    technical_score: float  # 0-10
    communication_score: float  # 0-10
    cultural_fit_score: float  # 0-10
    feedback_comment: str
    sentiment_type: Optional[str] = None  # positive, neutral, negative
    sentiment_score: Optional[float] = None  # -1 to 1
    sentiment_weight: Optional[float] = None  # 0-10
    final_score: Optional[float] = None
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeedbackCreate(BaseModel):
    interview_id: str
    candidate_id: str
    technical_score: float
    communication_score: float
    cultural_fit_score: float
    feedback_comment: str

class CandidateRanking(BaseModel):
    candidate_id: str
    candidate_name: str
    position: str
    final_score: float
    technical_score: float
    communication_score: float
    cultural_fit_score: float
    sentiment_weight: float
    feedback_count: int
    bias_warnings: List[str]

# ============= AUTHENTICATION =============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"email": email}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

async def require_role(user: dict, allowed_roles: List[str]):
    if user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

# ============= AUTH ROUTES =============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    valid_roles = [UserRole.ADMIN, UserRole.HR, UserRole.INTERVIEWER]
    if user_data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
    
    # Create user
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        hashed_password=hash_password(user_data.password)
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    )

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "role": current_user["role"]
    }

# ============= CANDIDATE ROUTES =============

@api_router.post("/candidates", response_model=Candidate)
async def create_candidate(candidate_data: CandidateCreate, current_user: dict = Depends(get_current_user)):
    await require_role(current_user, [UserRole.ADMIN, UserRole.HR])
    
    candidate = Candidate(**candidate_data.model_dump())
    doc = candidate.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.candidates.insert_one(doc)
    return candidate

@api_router.get("/candidates", response_model=List[Candidate])
async def get_candidates(current_user: dict = Depends(get_current_user)):
    candidates = await db.candidates.find({}, {"_id": 0}).to_list(1000)
    for c in candidates:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
        if isinstance(c.get('updated_at'), str):
            c['updated_at'] = datetime.fromisoformat(c['updated_at'])
    return candidates

@api_router.get("/candidates/{candidate_id}", response_model=Candidate)
async def get_candidate(candidate_id: str, current_user: dict = Depends(get_current_user)):
    candidate = await db.candidates.find_one({"id": candidate_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    if isinstance(candidate.get('created_at'), str):
        candidate['created_at'] = datetime.fromisoformat(candidate['created_at'])
    if isinstance(candidate.get('updated_at'), str):
        candidate['updated_at'] = datetime.fromisoformat(candidate['updated_at'])
    return candidate

@api_router.put("/candidates/{candidate_id}", response_model=Candidate)
async def update_candidate(
    candidate_id: str,
    update_data: CandidateUpdate,
    current_user: dict = Depends(get_current_user)
):
    await require_role(current_user, [UserRole.ADMIN, UserRole.HR])
    
    candidate = await db.candidates.find_one({"id": candidate_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.candidates.update_one({"id": candidate_id}, {"$set": update_dict})
    
    updated_candidate = await db.candidates.find_one({"id": candidate_id}, {"_id": 0})
    if isinstance(updated_candidate.get('created_at'), str):
        updated_candidate['created_at'] = datetime.fromisoformat(updated_candidate['created_at'])
    if isinstance(updated_candidate.get('updated_at'), str):
        updated_candidate['updated_at'] = datetime.fromisoformat(updated_candidate['updated_at'])
    
    return updated_candidate

@api_router.delete("/candidates/{candidate_id}")
async def delete_candidate(candidate_id: str, current_user: dict = Depends(get_current_user)):
    await require_role(current_user, [UserRole.ADMIN, UserRole.HR])
    
    result = await db.candidates.delete_one({"id": candidate_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return {"message": "Candidate deleted successfully"}

# ============= GOOGLE CALENDAR ROUTES =============

@api_router.get("/oauth/calendar/login")
async def google_calendar_login(current_user: dict = Depends(get_current_user)):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Google Calendar API not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
        )
    
    auth_url = (
        "https://accounts.google.com/o/oauth2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        "response_type=code&"
        "scope=https://www.googleapis.com/auth/calendar&"
        "access_type=offline&"
        "prompt=consent&"
        f"state={current_user['email']}"
    )
    
    return {"authorization_url": auth_url}

@api_router.get("/oauth/calendar/callback")
async def google_calendar_callback(code: str, state: str):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google Calendar API not configured")
    
    # Exchange code for tokens
    token_resp = requests.post('https://oauth2.googleapis.com/token', data={
        'code': code,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'redirect_uri': GOOGLE_REDIRECT_URI,
        'grant_type': 'authorization_code'
    }).json()
    
    if 'error' in token_resp:
        raise HTTPException(status_code=400, detail=token_resp.get('error_description', 'OAuth failed'))
    
    # Save tokens to user
    user_email = state
    await db.users.update_one(
        {"email": user_email},
        {"$set": {"google_tokens": token_resp}}
    )
    
    return RedirectResponse(url=f"{FRONTEND_URL}/?calendar_connected=true")


async def get_google_credentials(user_email: str):
    user = await db.users.find_one({"email": user_email}, {"_id": 0})
    if not user or not user.get('google_tokens'):
        raise HTTPException(status_code=401, detail="Google Calendar not connected. Please authorize first.")
    
    tokens = user['google_tokens']
    creds = Credentials(
        token=tokens['access_token'],
        refresh_token=tokens.get('refresh_token'),
        token_uri='https://oauth2.googleapis.com/token',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )
    
    # Auto-refresh if expired
    if creds.expired and creds.refresh_token:
        creds.refresh(GoogleRequest())
        await db.users.update_one(
            {"email": user_email},
            {"$set": {"google_tokens.access_token": creds.token}}
        )
    
    return creds

@api_router.get("/calendar/availability/{interviewer_id}")
async def get_interviewer_availability(interviewer_id: str, date: str, current_user: dict = Depends(get_current_user)):
    # Get interviewer
    interviewer = await db.users.find_one({"id": interviewer_id}, {"_id": 0})
    if not interviewer:
        raise HTTPException(status_code=404, detail="Interviewer not found")
    
    try:
        creds = await get_google_credentials(interviewer['email'])
        service = build('calendar', 'v3', credentials=creds)
        
        # Get events for the specified date
        start_time = datetime.fromisoformat(f"{date}T00:00:00Z")
        end_time = datetime.fromisoformat(f"{date}T23:59:59Z")
        
        events_result = service.events().list(
            calendarId='primary',
            timeMin=start_time.isoformat(),
            timeMax=end_time.isoformat(),
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        # Find free slots (9 AM - 6 PM in 1-hour blocks)
        busy_times = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            busy_times.append({"start": start, "end": end})
        
        # Generate free slots
        free_slots = []
        for hour in range(9, 18):  # 9 AM to 6 PM
            slot_start = start_time.replace(hour=hour, minute=0, second=0)
            slot_end = slot_start + timedelta(hours=1)
            
            # Check if slot is free
            is_free = True
            for busy in busy_times:
                busy_start = datetime.fromisoformat(busy['start'].replace('Z', '+00:00'))
                busy_end = datetime.fromisoformat(busy['end'].replace('Z', '+00:00'))
                
                if not (slot_end <= busy_start or slot_start >= busy_end):
                    is_free = False
                    break
            
            if is_free:
                free_slots.append({
                    "start": slot_start.isoformat(),
                    "end": slot_end.isoformat()
                })
        
        return {"free_slots": free_slots, "busy_times": busy_times}
    
    except Exception as e:
        logger.error(f"Error fetching availability: {str(e)}")
        # Return mock data if Google Calendar not configured
        return {
            "free_slots": [
                {"start": f"{date}T10:00:00Z", "end": f"{date}T11:00:00Z"},
                {"start": f"{date}T14:00:00Z", "end": f"{date}T15:00:00Z"},
                {"start": f"{date}T16:00:00Z", "end": f"{date}T17:00:00Z"}
            ],
            "busy_times": [],
            "note": "Mock data - Google Calendar not configured"
        }

# ============= INTERVIEW SCHEDULING ROUTES =============

@api_router.post("/interviews/schedule", response_model=Interview)
async def schedule_interview(schedule_data: InterviewSchedule, current_user: dict = Depends(get_current_user)):
    await require_role(current_user, [UserRole.ADMIN, UserRole.HR])
    
    # Get candidate and interviewer
    candidate = await db.candidates.find_one({"id": schedule_data.candidate_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    interviewer = await db.users.find_one({"id": schedule_data.interviewer_id}, {"_id": 0})
    if not interviewer:
        raise HTTPException(status_code=404, detail="Interviewer not found")
    
    # Get availability
    availability = await get_interviewer_availability(
        schedule_data.interviewer_id,
        schedule_data.preferred_date,
        current_user
    )
    
    if not availability['free_slots']:
        raise HTTPException(status_code=400, detail="No available time slots found")
    
    # Book first available slot
    first_slot = availability['free_slots'][0]
    scheduled_time = datetime.fromisoformat(first_slot['start'].replace('Z', '+00:00'))
    
    # Create interview record
    # interview = Interview(
    #     candidate_id=candidate['id'],
    #     candidate_name=candidate['name'],
    #     interviewer_id=interviewer['id'],
    #     interviewer_name=interviewer['full_name'],
    #     scheduled_at=scheduled_time,
    #     meeting_link=f"https://meet.google.com/{str(uuid.uuid4())[:12]}"
    # )
    interview = Interview(
    candidate_id=candidate['id'],
    candidate_name=candidate['name'],
    interviewer_id=interviewer['id'],
    interviewer_name=interviewer['full_name'],
    scheduled_at=scheduled_time,
    meeting_link=None
)
    
    # Try to create Google Calendar event
    try:
        creds = await get_google_credentials(interviewer['email'])
        service = build('calendar', 'v3', credentials=creds)
        
        event = {
            'summary': f'Interview: {candidate["name"]} - {candidate["position"]}',
            'description': f'Interview with {candidate["name"]} for {candidate["position"]} position',
            'start': {
                'dateTime': scheduled_time.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': (scheduled_time + timedelta(minutes=60)).isoformat(),
                'timeZone': 'UTC',
            },
            'conferenceData': {
                'createRequest': {
                    'requestId': str(uuid.uuid4()),
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                }
            },
            'attendees': [
                {'email': candidate['email']},
                {'email': interviewer['email']}
            ]
        }
        
        created_event = service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1
        ).execute()
        
        interview.google_event_id = created_event['id']
        # if created_event.get('hangoutLink'):
        #     interview.meeting_link = created_event['hangoutLink']

        # Extract Google Meet link safely
        if created_event.get("hangoutLink"):
            interview.meeting_link = created_event["hangoutLink"]
        elif created_event.get("conferenceData"):
            entry_points = created_event["conferenceData"].get("entryPoints", [])
            if entry_points:
                interview.meeting_link = entry_points[0].get("uri")
    
    except Exception as e:
        logger.warning(f"Could not create Google Calendar event: {str(e)}")
    
    # Save interview
    doc = interview.model_dump()
    doc['scheduled_at'] = doc['scheduled_at'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.interviews.insert_one(doc)
    
    # Update candidate status
    await db.candidates.update_one(
        {"id": candidate['id']},
        {"$set": {"status": "scheduled"}}
    )
    
    return interview

@api_router.get("/interviews", response_model=List[Interview])
async def get_interviews(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user['role'] == UserRole.INTERVIEWER:
        query = {"interviewer_id": current_user['id']}
    
    interviews = await db.interviews.find(query, {"_id": 0}).to_list(1000)
    for i in interviews:
        if isinstance(i.get('scheduled_at'), str):
            i['scheduled_at'] = datetime.fromisoformat(i['scheduled_at'])
        if isinstance(i.get('created_at'), str):
            i['created_at'] = datetime.fromisoformat(i['created_at'])
    return interviews

# ============= FEEDBACK & SENTIMENT ANALYSIS ROUTES =============

async def analyze_sentiment(text: str) -> Dict[str, Any]:
    """Analyze sentiment using OpenAI GPT-5.2"""
    try:
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=str(uuid.uuid4()),
            system_message="You are a sentiment analysis expert. Analyze the feedback text and respond ONLY with a JSON object containing: sentiment_type (positive/neutral/negative) and sentiment_score (a float between -1 and 1, where -1 is most negative, 0 is neutral, and 1 is most positive)."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(
            text=f"Analyze this interview feedback: {text}"
        )
        
        response = await chat.send_message(user_message)
        
        # Parse response
        import json
        response_text = response.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        result = json.loads(response_text)
        
        # Convert sentiment score to 0-10 scale
        sentiment_weight = ((result['sentiment_score'] + 1) / 2) * 10
        
        return {
            "sentiment_type": result['sentiment_type'],
            "sentiment_score": result['sentiment_score'],
            "sentiment_weight": sentiment_weight
        }
    except Exception as e:
        logger.error(f"Sentiment analysis error: {str(e)}")
        # Fallback: neutral sentiment
        return {
            "sentiment_type": "neutral",
            "sentiment_score": 0.0,
            "sentiment_weight": 5.0
        }

@api_router.post("/feedback", response_model=Feedback)
async def submit_feedback(feedback_data: FeedbackCreate, current_user: dict = Depends(get_current_user)):
    await require_role(current_user, [UserRole.INTERVIEWER, UserRole.ADMIN,UserRole.HR])
    
    # Validate interview exists
    interview = await db.interviews.find_one({"id": feedback_data.interview_id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Analyze sentiment
    sentiment = await analyze_sentiment(feedback_data.feedback_comment)
    
    # Calculate final score
    technical = feedback_data.technical_score
    communication = feedback_data.communication_score
    cultural_fit = feedback_data.cultural_fit_score
    sentiment_weight = sentiment['sentiment_weight']
    
    final_score = (
        (technical * 0.5) +
        (communication * 0.3) +
        (cultural_fit * 0.1) +
        (sentiment_weight * 0.1)
    )
    
    # Create feedback
    feedback = Feedback(
        interview_id=feedback_data.interview_id,
        candidate_id=feedback_data.candidate_id,
        interviewer_id=current_user['id'],
        interviewer_name=current_user['full_name'],
        technical_score=technical,
        communication_score=communication,
        cultural_fit_score=cultural_fit,
        feedback_comment=feedback_data.feedback_comment,
        sentiment_type=sentiment['sentiment_type'],
        sentiment_score=sentiment['sentiment_score'],
        sentiment_weight=sentiment_weight,
        final_score=final_score
    )
    
    doc = feedback.model_dump()
    doc['submitted_at'] = doc['submitted_at'].isoformat()
    await db.feedbacks.insert_one(doc)
    
    # Update interview status
    await db.interviews.update_one(
        {"id": feedback_data.interview_id},
        {"$set": {"status": "completed"}}
    )
    
    # Update candidate status
    await db.candidates.update_one(
        {"id": feedback_data.candidate_id},
        {"$set": {"status": "interviewed"}}
    )
    
    return feedback

@api_router.get("/feedback/candidate/{candidate_id}", response_model=List[Feedback])
async def get_candidate_feedback(candidate_id: str, current_user: dict = Depends(get_current_user)):
    feedbacks = await db.feedbacks.find({"candidate_id": candidate_id}, {"_id": 0}).to_list(1000)
    for f in feedbacks:
        if isinstance(f.get('submitted_at'), str):
            f['submitted_at'] = datetime.fromisoformat(f['submitted_at'])
    return feedbacks


# ============= DELETE INTERVIEW (ADMIN ONLY) =============

@api_router.delete("/interviews/{interview_id}")
async def delete_interview(interview_id: str, current_user: dict = Depends(get_current_user)):
    
    # Allow only Admin
    if current_user.get("role", "").upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Only admin can delete interviews")

    # Find interview in database
    interview = await db.interviews.find_one({"id": interview_id})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # If interview has Google Calendar event, delete it
    if interview.get("calendar_event_id"):
        try:
            creds = await get_google_credentials(interview["interviewer_email"])
            service = build('calendar', 'v3', credentials=creds)

            service.events().delete(
                calendarId='primary',
                eventId=interview["calendar_event_id"]
            ).execute()

        except Exception as e:
            logger.error(f"Failed to delete Google Calendar event: {str(e)}")

    # Delete interview from MongoDB
    await db.interviews.delete_one({"id": interview_id})

    return {"message": "Interview deleted successfully"}


# ============= BIAS DETECTION =============

async def detect_bias(interviewer_id: str, feedbacks: List[dict]) -> List[str]:
    """Detect potential bias in interviewer feedback"""
    warnings = []
    
    if not feedbacks:
        return warnings
    
    # Get all scores
    all_scores = [f['final_score'] for f in feedbacks]
    technical_scores = [f['technical_score'] for f in feedbacks]
    
    # Check 1: Consistently low scores
    avg_score = statistics.mean(all_scores)
    if avg_score < 4.0:
        warnings.append("Consistently low scores detected (avg < 4.0)")
    
    # Check 2: Low variance (always giving similar scores)
    if len(all_scores) >= 3:
        variance = statistics.variance(all_scores)
        if variance < 1.0:
            warnings.append("Low score variance - may indicate bias or rating pattern")
    
    # Check 3: Extreme deviation from other interviewers
    all_feedbacks = await db.feedbacks.find({}, {"_id": 0}).to_list(1000)
    other_feedbacks = [f for f in all_feedbacks if f['interviewer_id'] != interviewer_id]
    
    if other_feedbacks and len(other_feedbacks) >= 3:
        other_avg = statistics.mean([f['final_score'] for f in other_feedbacks])
        if abs(avg_score - other_avg) > 2.5:
            warnings.append(f"Large deviation from other interviewers (±2.5 points)")
    
    # Check 4: Only negative sentiment
    sentiments = [f.get('sentiment_type') for f in feedbacks]
    if all(s == 'negative' for s in sentiments) and len(sentiments) >= 2:
        warnings.append("Only negative sentiment in feedback comments")
    
    return warnings

# ============= RANKING DASHBOARD =============

@api_router.get("/ranking", response_model=List[CandidateRanking])
async def get_candidate_rankings(current_user: dict = Depends(get_current_user)):
    # Get all candidates
    candidates = await db.candidates.find({}, {"_id": 0}).to_list(1000)
    
    rankings = []
    for candidate in candidates:
        # Get all feedback for this candidate
        feedbacks = await db.feedbacks.find({"candidate_id": candidate['id']}, {"_id": 0}).to_list(1000)
        
        if not feedbacks:
            continue
        
        # Calculate average scores
        avg_final = statistics.mean([f['final_score'] for f in feedbacks])
        avg_technical = statistics.mean([f['technical_score'] for f in feedbacks])
        avg_communication = statistics.mean([f['communication_score'] for f in feedbacks])
        avg_cultural = statistics.mean([f['cultural_fit_score'] for f in feedbacks])
        avg_sentiment = statistics.mean([f['sentiment_weight'] for f in feedbacks])
        
        # Detect bias for each interviewer
        all_warnings = []
        interviewer_ids = list(set([f['interviewer_id'] for f in feedbacks]))
        for interviewer_id in interviewer_ids:
            interviewer_feedbacks = [f for f in feedbacks if f['interviewer_id'] == interviewer_id]
            warnings = await detect_bias(interviewer_id, interviewer_feedbacks)
            if warnings:
                interviewer = await db.users.find_one({"id": interviewer_id}, {"_id": 0})
                interviewer_name = interviewer['full_name'] if interviewer else "Unknown"
                for warning in warnings:
                    all_warnings.append(f"{interviewer_name}: {warning}")
        
        rankings.append(CandidateRanking(
            candidate_id=candidate['id'],
            candidate_name=candidate['name'],
            position=candidate['position'],
            final_score=round(avg_final, 2),
            technical_score=round(avg_technical, 2),
            communication_score=round(avg_communication, 2),
            cultural_fit_score=round(avg_cultural, 2),
            sentiment_weight=round(avg_sentiment, 2),
            feedback_count=len(feedbacks),
            bias_warnings=all_warnings
        ))
    
    # Sort by final score descending
    rankings.sort(key=lambda x: x.final_score, reverse=True)
    return rankings

# ============= USERS ROUTE =============

# ============= USERS ROUTE =============

@api_router.get("/users/interviewers")
async def get_interviewers(current_user: dict = Depends(get_current_user)):

    # ✅ Allow ADMIN + HR
    if current_user["role"] not in [UserRole.ADMIN, UserRole.HR, UserRole.INTERVIEWER]:
        raise HTTPException(status_code=403, detail="Not allowed")

    interviewers = await db.users.find(
        {"role": UserRole.INTERVIEWER},
        {"_id": 0, "hashed_password": 0, "google_tokens": 0}
    ).to_list(1000)

    return interviewers


@api_router.get("/users/hrs")
async def get_hrs(current_user: dict = Depends(get_current_user)):
    hrs = await db.users.find(
        {"role": "HR"},
        {"_id": 0, "hashed_password": 0, "google_tokens": 0}
    ).to_list(1000)

    return hrs


@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):

    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can delete users")

    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user["role"] == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot delete admin")

    await db.users.delete_one({"id": user_id})

    return {"message": "User deleted successfully"}

# ============= ADMIN USER MANAGEMENT =============

@api_router.get("/users/hr")
async def get_hr_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can view HRs")

    hrs = await db.users.find(
        {"role": UserRole.HR},
        {"_id": 0, "hashed_password": 0, "google_tokens": 0}
    ).to_list(1000)

    return hrs


@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):

    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can delete users")

    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent deleting admin
    if user["role"] == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot delete admin")

    await db.users.delete_one({"id": user_id})

    return {"message": "User deleted successfully"}

# ============= ROOT ROUTE =============

@api_router.get("/")
async def root():
    return {
        "message": "Smart Interview Scheduling & Evaluation Platform API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth/register, /api/auth/login, /api/auth/me",
            "candidates": "/api/candidates",
            "interviews": "/api/interviews",
            "feedback": "/api/feedback",
            "ranking": "/api/ranking",
            "calendar": "/api/oauth/calendar/login, /api/calendar/availability"
        }
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://smart-interview-platform-seven.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()