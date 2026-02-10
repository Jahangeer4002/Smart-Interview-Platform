# API Documentation

## Base URL
```
https://your-domain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "role": "INTERVIEWER"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "INTERVIEWER"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:** Same as register

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "INTERVIEWER"
}
```

### Candidates

#### List Candidates
```http
GET /api/candidates
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "candidate-uuid",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "position": "Software Engineer",
    "resume_link": "https://example.com/resume.pdf",
    "status": "pending",
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  }
]
```

#### Get Candidate
```http
GET /api/candidates/{candidate_id}
Authorization: Bearer <token>
```

#### Create Candidate
```http
POST /api/candidates
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "position": "Software Engineer",
  "resume_link": "https://example.com/resume.pdf"
}
```

**Permissions:** ADMIN, HR

#### Update Candidate
```http
PUT /api/candidates/{candidate_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Smith Updated",
  "status": "scheduled"
}
```

**Permissions:** ADMIN, HR

#### Delete Candidate
```http
DELETE /api/candidates/{candidate_id}
Authorization: Bearer <token>
```

**Permissions:** ADMIN, HR

### Interviews

#### List Interviews
```http
GET /api/interviews
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "interview-uuid",
    "candidate_id": "candidate-uuid",
    "candidate_name": "Jane Smith",
    "interviewer_id": "interviewer-uuid",
    "interviewer_name": "John Doe",
    "scheduled_at": "2025-01-20T14:00:00Z",
    "duration_minutes": 60,
    "meeting_link": "https://meet.google.com/abc-defg-hij",
    "google_event_id": "event123",
    "status": "scheduled",
    "created_at": "2025-01-15T10:00:00Z"
  }
]
```

**Note:** Interviewers only see their own interviews

#### Schedule Interview
```http
POST /api/interviews/schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "candidate_id": "candidate-uuid",
  "interviewer_id": "interviewer-uuid",
  "preferred_date": "2025-01-20"
}
```

**Permissions:** ADMIN, HR

**Response:**
```json
{
  "id": "interview-uuid",
  "candidate_id": "candidate-uuid",
  "candidate_name": "Jane Smith",
  "interviewer_id": "interviewer-uuid",
  "interviewer_name": "John Doe",
  "scheduled_at": "2025-01-20T14:00:00Z",
  "duration_minutes": 60,
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "status": "scheduled"
}
```

#### Get Interviewer Availability
```http
GET /api/calendar/availability/{interviewer_id}?date=2025-01-20
Authorization: Bearer <token>
```

**Response:**
```json
{
  "free_slots": [
    {
      "start": "2025-01-20T10:00:00Z",
      "end": "2025-01-20T11:00:00Z"
    },
    {
      "start": "2025-01-20T14:00:00Z",
      "end": "2025-01-20T15:00:00Z"
    }
  ],
  "busy_times": [
    {
      "start": "2025-01-20T09:00:00Z",
      "end": "2025-01-20T10:00:00Z"
    }
  ]
}
```

### Feedback

#### Submit Feedback
```http
POST /api/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "interview_id": "interview-uuid",
  "candidate_id": "candidate-uuid",
  "technical_score": 8.5,
  "communication_score": 7.0,
  "cultural_fit_score": 9.0,
  "feedback_comment": "Excellent problem-solving skills and great team fit!"
}
```

**Permissions:** INTERVIEWER, ADMIN

**Response:**
```json
{
  "id": "feedback-uuid",
  "interview_id": "interview-uuid",
  "candidate_id": "candidate-uuid",
  "interviewer_id": "interviewer-uuid",
  "interviewer_name": "John Doe",
  "technical_score": 8.5,
  "communication_score": 7.0,
  "cultural_fit_score": 9.0,
  "feedback_comment": "Excellent problem-solving skills and great team fit!",
  "sentiment_type": "positive",
  "sentiment_score": 0.85,
  "sentiment_weight": 9.25,
  "final_score": 8.175,
  "submitted_at": "2025-01-20T15:30:00Z"
}
```

**Scoring Formula:**
```
final_score = (technical × 0.5) + (communication × 0.3) + (cultural_fit × 0.1) + (sentiment_weight × 0.1)
```

#### Get Candidate Feedback
```http
GET /api/feedback/candidate/{candidate_id}
Authorization: Bearer <token>
```

### Rankings

#### Get Candidate Rankings
```http
GET /api/ranking
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "candidate_id": "candidate-uuid",
    "candidate_name": "Jane Smith",
    "position": "Software Engineer",
    "final_score": 8.25,
    "technical_score": 8.5,
    "communication_score": 7.8,
    "cultural_fit_score": 9.0,
    "sentiment_weight": 8.5,
    "feedback_count": 3,
    "bias_warnings": [
      "John Interviewer: Low score variance - may indicate bias"
    ]
  }
]
```

**Permissions:** ADMIN, HR

**Note:** Rankings are sorted by final_score in descending order

### OAuth

#### Initiate Google Calendar OAuth
```http
GET /api/oauth/calendar/login
Authorization: Bearer <token>
```

**Response:**
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/auth?client_id=..."
}
```

**Usage:** Redirect user to `authorization_url` to authorize Google Calendar access

#### OAuth Callback
```http
GET /api/oauth/calendar/callback?code=<auth_code>&state=<user_email>
```

**Note:** This endpoint is called automatically by Google after authorization

### Users

#### List Interviewers
```http
GET /api/users/interviewers
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "interviewer-uuid",
    "email": "interviewer@example.com",
    "full_name": "John Doe",
    "role": "INTERVIEWER",
    "created_at": "2025-01-10T08:00:00Z"
  }
]
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid authentication credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

No rate limiting is currently implemented. Consider adding rate limiting for production:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/candidates")
@limiter.limit("100/minute")
async def get_candidates():
    ...
```

## Pagination

Currently, all list endpoints return all results. For production, implement pagination:

```http
GET /api/candidates?page=1&limit=20
```

## Filtering

Add filtering support:

```http
GET /api/candidates?status=pending&position=Software Engineer
```

## Sorting

Add sorting support:

```http
GET /api/ranking?sort_by=final_score&order=desc
```