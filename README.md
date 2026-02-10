# Smart Interview Scheduling & Evaluation Platform

A production-ready full-stack web application that automates interview scheduling, collects structured feedback, performs AI-based sentiment analysis, ranks candidates using weighted scoring, and detects bias in evaluations.

## 🚀 Features

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control (ADMIN, HR, INTERVIEWER)
- Secure password hashing with bcrypt
- Token-based API security

### 2. Candidate Management
- Add, update, and delete candidates
- Store candidate information (name, email, phone, position, resume link)
- Search and filter capabilities
- Status tracking (pending, scheduled, interviewed, rejected, hired)

### 3. Interview Scheduling
- Google Calendar API integration
- Automatic availability detection
- Smart slot booking
- Meeting link generation
- Email notifications (configurable)

### 4. Feedback & Evaluation
- Structured feedback forms
- Technical score (0-10, weight: 50%)
- Communication score (0-10, weight: 30%)
- Cultural fit score (0-10, weight: 10%)
- Open-ended feedback comments

### 5. AI Sentiment Analysis
- Powered by OpenAI GPT-5.2
- Analyzes feedback comments
- Returns sentiment type (positive/neutral/negative)
- Sentiment score (-1 to 1)
- Converts to weighted score (0-10, weight: 10%)

### 6. Weighted Scoring System
```
Final Score = (Technical × 0.5) + (Communication × 0.3) + (Cultural Fit × 0.1) + (Sentiment × 0.1)
```

### 7. Candidate Ranking Dashboard
- Sorted by final score (descending)
- Detailed score breakdown
- Feedback count
- Top candidate highlight
- Visual score indicators

### 8. Bias Detection
- Consistently low scores detection
- Low variance analysis
- Deviation from other interviewers
- Negative sentiment patterns
- Warning flags with detailed descriptions

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT with python-jose
- **Password Hashing**: bcrypt
- **AI Integration**: OpenAI GPT-5.2 via emergentintegrations
- **Calendar**: Google Calendar API
- **ORM**: Motor (async MongoDB driver)

### Frontend
- **Framework**: React 19
- **Routing**: React Router v7
- **UI Components**: Shadcn/UI (Radix UI)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Notifications**: Sonner

### Infrastructure
- **Process Management**: Supervisor
- **Hot Reload**: Enabled for both frontend and backend
- **CORS**: Configured for cross-origin requests

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (local or cloud)
- Google Cloud Project (for Calendar API)
- OpenAI API Key (or use Emergent LLM Key)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
cd /app
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd /app/backend
pip install -r requirements.txt
```

#### Configure Environment Variables
Edit `/app/backend/.env`:

```env
# Database
MONGO_URL="mongodb://localhost:27017"
DB_NAME="interview_platform"

# Security
JWT_SECRET=your_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI (Choose one)
EMERGENT_LLM_KEY=sk-emergent-0E221658f39C24fD4A
# OR
# OPENAI_API_KEY=your_openai_key_here

# Google Calendar API (see setup guide below)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/oauth/calendar/callback

# CORS
CORS_ORIGINS="*"
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd /app/frontend
yarn install
```

#### Configure Environment Variables
Edit `/app/frontend/.env`:

```env
REACT_APP_BACKEND_URL=https://your-domain.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

### 4. Google Calendar API Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Name it: `interview-platform`

#### Step 2: Enable Google Calendar API
1. Navigate to **APIs & Services → Library**
2. Search for "Google Calendar API"
3. Click **Enable**

#### Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** → Create
3. Fill in:
   - App name: `Smart Interview Platform`
   - User support email: your email
   - Developer contact email: your email
4. Click **Save and Continue**
5. Under **Scopes** → Add:
   - `https://www.googleapis.com/auth/calendar`
6. Under **Test users** → Add your Google email
7. Click **Save and Continue**

#### Step 4: Create OAuth Credentials
1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Choose **Web application**
4. Name it: `interview-platform-web`
5. Add:
   - **Authorized JavaScript origins**: `https://your-domain.com`
   - **Authorized redirect URIs**: `https://your-domain.com/api/oauth/calendar/callback`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret** to `.env`

### 5. Start the Application

#### Using Supervisor (Recommended)
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
sudo supervisorctl status
```

#### Manual Start (Development)

**Backend:**
```bash
cd /app/backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Frontend:**
```bash
cd /app/frontend
yarn start
```

### 6. Access the Application

- **Frontend**: `http://localhost:3000` (development) or your configured domain
- **Backend API**: `http://localhost:8001/api` (development) or `https://your-domain.com/api`
- **API Documentation**: `https://your-domain.com/docs`

## 👥 User Roles & Permissions

### ADMIN
- Full access to all features
- Manage candidates
- Schedule interviews
- Submit feedback
- View rankings
- Detect bias

### HR
- Manage candidates
- Schedule interviews
- View rankings
- View bias reports

### INTERVIEWER
- View assigned interviews
- Submit feedback
- Connect Google Calendar

## 🔐 Default Users

Create users via the registration page with these roles:

```json
{
  "email": "admin@example.com",
  "password": "admin123",
  "full_name": "Admin User",
  "role": "ADMIN"
}
```

```json
{
  "email": "hr@example.com",
  "password": "hr123",
  "full_name": "HR Manager",
  "role": "HR"
}
```

```json
{
  "email": "interviewer@example.com",
  "password": "int123",
  "full_name": "Senior Interviewer",
  "role": "INTERVIEWER"
}
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Candidates
- `GET /api/candidates` - List all candidates
- `GET /api/candidates/{id}` - Get candidate details
- `POST /api/candidates` - Create candidate
- `PUT /api/candidates/{id}` - Update candidate
- `DELETE /api/candidates/{id}` - Delete candidate

### Interviews
- `GET /api/interviews` - List interviews
- `POST /api/interviews/schedule` - Schedule interview
- `GET /api/calendar/availability/{interviewer_id}` - Get availability

### Feedback
- `POST /api/feedback` - Submit feedback (includes AI sentiment analysis)
- `GET /api/feedback/candidate/{id}` - Get candidate feedback

### Rankings
- `GET /api/ranking` - Get candidate rankings with bias detection

### OAuth
- `GET /api/oauth/calendar/login` - Initiate Google Calendar OAuth
- `GET /api/oauth/calendar/callback` - OAuth callback handler

### Users
- `GET /api/users/interviewers` - List all interviewers

## 🧪 Testing

### Backend Testing
```bash
cd /app/backend
pytest tests/
```

### API Testing with cURL

**Register:**
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "full_name": "Test User",
    "role": "ADMIN"
  }'
```

**Login:**
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' | \
  python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
echo $TOKEN
```

**Create Candidate:**
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -X POST "$API_URL/api/candidates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "position": "Software Engineer",
    "resume_link": "https://example.com/resume.pdf"
  }'
```

## 🤖 AI Sentiment Analysis

### How It Works

1. **Input**: Feedback comment text
2. **Processing**: OpenAI GPT-5.2 analyzes the text
3. **Output**: 
   - `sentiment_type`: positive/neutral/negative
   - `sentiment_score`: -1 (most negative) to 1 (most positive)
   - `sentiment_weight`: Converted to 0-10 scale

### Formula
```python
sentiment_weight = ((sentiment_score + 1) / 2) * 10
```

### Example
```json
{
  "feedback_comment": "Excellent problem-solving skills and great communication!",
  "sentiment_type": "positive",
  "sentiment_score": 0.85,
  "sentiment_weight": 9.25
}
```

## 🚨 Bias Detection Algorithm

### Detection Criteria

1. **Consistently Low Scores**
   - Average score < 4.0
   - Warning: "Consistently low scores detected"

2. **Low Variance**
   - Variance < 1.0 (with 3+ evaluations)
   - Warning: "Low score variance - may indicate bias"

3. **Large Deviation**
   - |interviewer_avg - other_interviewers_avg| > 2.5
   - Warning: "Large deviation from other interviewers"

4. **Only Negative Sentiment**
   - All feedbacks have negative sentiment (2+ feedbacks)
   - Warning: "Only negative sentiment in feedback comments"

## 🎨 UI/UX Features

- **Modern Design**: Gradient accents, clean typography (Manrope + Work Sans)
- **Responsive**: Mobile-first design with Tailwind CSS
- **Smooth Animations**: Card hovers, button transitions
- **Badge System**: Color-coded status indicators
- **Toast Notifications**: Real-time feedback with Sonner
- **Loading States**: Spinners for async operations
- **Form Validation**: Client and server-side validation

## 📊 Database Schema

### Collections

**users**
```json
{
  "id": "uuid",
  "email": "string",
  "full_name": "string",
  "role": "ADMIN|HR|INTERVIEWER",
  "hashed_password": "string",
  "google_tokens": {"access_token": "...", "refresh_token": "..."},
  "created_at": "ISO datetime"
}
```

**candidates**
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "phone": "string",
  "position": "string",
  "resume_link": "string",
  "status": "pending|scheduled|interviewed|rejected|hired",
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

**interviews**
```json
{
  "id": "uuid",
  "candidate_id": "uuid",
  "candidate_name": "string",
  "interviewer_id": "uuid",
  "interviewer_name": "string",
  "scheduled_at": "ISO datetime",
  "duration_minutes": 60,
  "meeting_link": "string",
  "google_event_id": "string",
  "status": "scheduled|completed|cancelled",
  "created_at": "ISO datetime"
}
```

**feedbacks**
```json
{
  "id": "uuid",
  "interview_id": "uuid",
  "candidate_id": "uuid",
  "interviewer_id": "uuid",
  "interviewer_name": "string",
  "technical_score": 8.5,
  "communication_score": 7.0,
  "cultural_fit_score": 9.0,
  "feedback_comment": "string",
  "sentiment_type": "positive",
  "sentiment_score": 0.75,
  "sentiment_weight": 8.75,
  "final_score": 8.125,
  "submitted_at": "ISO datetime"
}
```

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- CORS configuration
- Input validation with Pydantic
- SQL injection prevention (NoSQL with MongoDB)
- XSS protection
- HTTPS recommended for production

## 🚀 Deployment

### Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure production MongoDB URL
- [ ] Set up HTTPS with SSL certificates
- [ ] Configure CORS for production domain
- [ ] Set up environment-specific `.env` files
- [ ] Enable Google Calendar API in production
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for MongoDB
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Load testing

### Docker Deployment (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

## 📝 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## 📧 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@example.com

## 🎯 Future Enhancements

- [ ] Email notifications via SendGrid/Resend
- [ ] SMS reminders via Twilio
- [ ] Advanced analytics dashboard
- [ ] Export reports to PDF
- [ ] Video interview integration
- [ ] Calendar sync for candidates
- [ ] Interview recording transcription
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Slack/Teams integration

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Google Calendar API](https://developers.google.com/calendar)
- [Shadcn/UI Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Built with ❤️ using FastAPI, React, MongoDB, and OpenAI**