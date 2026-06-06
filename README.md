🚀 Smart Interview Scheduling & Evaluation Platform
A full-stack recruitment automation platform that streamlines interview scheduling, candidate evaluation, and hiring decisions using AI-powered sentiment analysis, automated ranking, and bias detection. The platform integrates Google Calendar for scheduling and provides secure role-based access control for Admins, HRs, and Interviewers.

📌 Features
🔐 Authentication & Authorization

Keycloak-based authentication

JWT-secured APIs

Role-Based Access Control (RBAC)

Email verification for new user registration

Password reset functionality

👑 Admin Module

Manage HR and Interviewer accounts

Assign and update roles

View system-wide analytics

Monitor bias detection reports

Configure scoring settings

Access audit logs

👩‍💼 HR Module

Add, update, and delete candidates

Upload candidate resume links

Assign interviewers

Schedule interviews automatically

View candidate rankings

Track interview status

Make hiring decisions

👨‍💻 Interviewer Module

View assigned interviews

Access meeting links

Review candidate details and resumes

Submit structured feedback

View personal evaluation history

📅 Smart Interview Scheduling

Google Calendar integration

Automatic availability detection

Google Meet link generation

Email notifications for participants

Calendar event synchronization

📝 Candidate Evaluation

Technical Skills Score

Communication Skills Score

Cultural Fit Score

Open-ended feedback comments

🤖 AI Sentiment Analysis

Analyze interviewer comments

Classify sentiment as Positive, Neutral, or Negative

Generate sentiment score

Integrate sentiment into candidate ranking

🏆 Candidate Ranking

Weighted scoring algorithm

Real-time ranking dashboard

Detailed score breakdown

Top candidate highlighting

⚖️ Bias Detection

Detect abnormal scoring patterns

Identify consistently low/high ratings

Statistical anomaly detection

Fair hiring recommendations

🏗️ System Architecture
Frontend

React.js

Axios

React Router

Context API / Redux

Backend

Python

FastAPI

REST APIs

JWT Authentication

Database

MongoDB Atlas

AI Service

FastAPI

Hugging Face Transformers

External Services

Google Calendar API

Google Meet

SMTP Email Service

🛠️ Technology Stack
CategoryTechnologyFrontendReact.jsBackendSpring BootDatabaseMongoDB AtlasAuthenticationKeycloak, JWTAIFastAPI, Hugging FaceSchedulingGoogle Calendar APIMeetingsGoogle MeetEmailJava Mail SenderDeploymentDocker

📊 Scoring Formula
Final Score =(Technical Score × 0.5)+ (Communication Score × 0.3)+ (Cultural Fit Score × 0.1)+ (Sentiment Score × 0.1)

📁 Project Structure
smart-interview-platform/│├── frontend/│ ├── src/│ ├── components/│ ├── pages/│ ├── services/│ └── context/│├── backend/│ ├── controller/│ ├── service/│ ├── repository/│ ├── model/│ ├── dto/│ ├── security/│ └── config/│├── ai-service/│ ├── app/│ ├── models/│ ├── routes/│ └── requirements.txt│├── docker-compose.yml└── README.md

🚀 Installation
Clone Repository
git clone https://github.com/yourusername/smart-interview-platform.gitcd smart-interview-platform
Backend Setup
cd backendmvn clean installmvn spring-boot:run
Frontend Setup
cd frontendnpm installnpm start
AI Service Setup
cd ai-servicepip install -r requirements.txtuvicorn main:app --reload

🔑 Environment Variables
Backend
MONGODB_URI=your_mongodb_uriDB_NAME=interview_schedulerKEYCLOAK_URL=your_keycloak_urlKEYCLOAK_REALM=your_realmKEYCLOAK_CLIENT_ID=your_clientMAIL_USERNAME=your_emailMAIL_PASSWORD=your_passwordGOOGLE_CLIENT_ID=your_client_idGOOGLE_CLIENT_SECRET=your_client_secret
Frontend
REACT_APP_API_URL=http://localhost:8080/api

🎯 Future Enhancements

Resume parsing using AI

Candidate-job matching engine

Video interview recording analysis

Real-time interview analytics

Multi-company support

AI-generated interview questions

Recruitment performance dashboards

👥 Team Members
Team Size: 3
Roles

Team Leader & Full Stack Development

Backend & Database Development

Frontend & AI Integration

📄 License
This project is developed for educational and recruitment automation purposes.

⭐ If you find this project useful, give it a star on GitHub! ⭐
