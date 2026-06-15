# Smart Interview Scheduling & Evaluation Platform

## Overview

The Smart Interview Scheduling & Evaluation Platform is a full-stack web application designed to streamline the recruitment process. The platform enables HR teams and interviewers to manage candidates, schedule interviews, integrate with Google Calendar, generate Google Meet links, collect interview feedback, and rank candidates based on performance.

## Features

### Authentication & Authorization

* JWT-based authentication
* Role-based access control

  * Admin
  * HR
  * Interviewer
* Secure user registration and login

### Candidate Management

* Add, update, view, and delete candidates
* Track candidate information and interview status

### Interview Scheduling

* Schedule interviews with candidates
* Google Calendar integration
* Automatic Google Meet link generation
* Interview availability management

### Feedback & Evaluation

* Submit interview feedback
* Store interviewer evaluations
* Candidate performance tracking
* Automated candidate ranking

### Dashboard

* HR dashboard
* Interviewer dashboard
* Candidate ranking system
* Interview management interface

---

## Tech Stack

### Frontend

* React.js
* Axios
* Context API
* React Router
* CSS

### Backend

* FastAPI
* Python
* JWT Authentication
* Google Calendar API
* Google OAuth 2.0

### Database

* MongoDB
* Motor (Async MongoDB Driver)

### Deployment

* Frontend: Vercel
* Backend: Render

---

## System Architecture

Frontend (React)
↓
FastAPI Backend
↓
MongoDB Database
↓
Google Calendar API
↓
Google Meet Integration

---

## Live Demo

Frontend:
https://smart-interview-platform-seven.vercel.app

Backend API:
https://smart-interview-platform-wvdo.onrender.com

API Documentation:
https://smart-interview-platform-wvdo.onrender.com/docs

---

## Installation

### Clone Repository

```bash
git clone https://github.com/Jahangeer4002/Smart-Interview-Platform.git
cd Smart-Interview-Platform
```

### Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

uvicorn server:app --reload
```

### Frontend Setup

```bash
cd frontend

npm install

npm start
```

---

## Environment Variables

### Backend (.env)

```env
MONGO_URL=your_mongodb_connection_string
DB_NAME=smart_interview_db

JWT_SECRET=your_secret_key

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GOOGLE_REDIRECT_URI=http://localhost:8000/api/oauth/calendar/callback

FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

---

## API Endpoints

### Authentication

* POST /api/auth/register
* POST /api/auth/login
* GET /api/auth/me

### Candidates

* GET /api/candidates
* POST /api/candidates
* PUT /api/candidates/{id}
* DELETE /api/candidates/{id}

### Interviews

* POST /api/interviews/schedule
* GET /api/interviews
* DELETE /api/interviews/{id}

### Feedback

* POST /api/feedback
* GET /api/feedback/candidate/{candidate_id}

### Google Calendar

* GET /api/oauth/calendar/login
* GET /api/oauth/calendar/callback
* GET /api/calendar/availability/{interviewer_id}

---

## Project Highlights

* Implemented secure JWT authentication and role-based access control.
* Integrated Google OAuth 2.0 and Google Calendar APIs.
* Automated interview scheduling with Google Meet link generation.
* Built a candidate evaluation and ranking system.
* Developed a responsive React frontend and FastAPI backend.
* Deployed the complete application using Vercel and Render.

---

## Future Enhancements

* Email notifications for interview scheduling
* AI-powered candidate evaluation
* Resume parsing and analysis
* Interview analytics dashboard
* Multi-company support
* Real-time notifications

---

## Author

Md Jahangeer

GitHub:
https://github.com/Jahangeer4002

LinkedIn:
https://www.linkedin.com/in/md-jahangeer-11b69328b/

---

## License

This project is developed for educational and portfolio purposes.
