# 🤖 AI Interviewer — Autonomous AI-Powered Hiring Platform

> **Hackathon Project** · Built with passion to revolutionize how companies discover talent.

<div align="center">

![AI Interviewer](https://img.shields.io/badge/AI%20Interviewer-v1.0-6366F1?style=for-the-badge&logo=robot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google-Gemini%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

**AI Interviewer** is a fully autonomous, end-to-end intelligent recruitment platform that eliminates manual screening by conducting AI-driven technical interviews — complete with voice interaction, real-time proctoring, anti-cheating measures, and instant AI-scored reports.

</div>

---

## 🎯 The Problem We're Solving

Traditional hiring is broken:
- **Recruiters waste 80%** of their time on initial screenings that yield little signal
- **Candidates wait weeks** for feedback after submitting applications
- **Bias creeps in** at every human touchpoint — from resume review to phone screens
- **Scaling is impossible** — a team of 5 can't screen 500 applicants fairly

**AI Interviewer** automates the entire first-round process — from resume analysis to AI-scored interview reports — in under 15 minutes, with zero human effort.

---

## ✨ Core Features

### 🎙️ AI Voice Interview Engine
- Candidate speaks naturally; AI asks intelligent, role-specific follow-up questions
- Powered by **Groq LLaMA** for ultra-low latency voice responses
- Real-time speech-to-text transcription with 4-second silence detection
- Full conversation history for context-aware follow-up questions
- Automatic session recording uploaded to Cloudinary

### 📄 Resume Intelligence (AI Resume Parsing)
- Upload any PDF resume — AI extracts skills, experience, and key competencies
- **Google Gemini** generates 10–15 custom questions tailored to the exact resume + role
- MCQ assessment or voice interview mode, selectable per candidate

### 🧠 AI-Powered Question Generation
- Dynamic question bank generated fresh per session — no repeat questions
- Role-aware difficulty scaling (Beginner → Expert)
- Technical MCQ with distractors, or open-ended voice questions
- Built-in Question Bank for admins to manually curate and store questions

### 🛡️ Real-Time Anti-Cheating Proctoring
- **Face detection** via TensorFlow.js (coco-ssd model) — detects multiple faces
- **Object detection** — flags mobile phones, books, papers in camera frame
- **Tab-switch monitoring** — records and penalizes focus loss events
- All violations logged and surfaced in the admin report dashboard

### 📊 Admin Command Center
- **Live Monitoring Dashboard** — real-time feed of all ongoing interviews via Socket.IO
- **Hiring Analytics** — completion rates, average scores, top-performing candidates
- **Role Management** — create, activate/deactivate job postings with interview codes
- **Question Bank** — curated question library with difficulty tags
- **Session Manager** — full history of all candidate interviews with video playback
- **Workspace View** — per-session detailed breakdown with candidate list
- **Platform Settings** — configure AI model, proctoring strictness, timeouts
- **Admin Profile** — role management and platform access control

### 👤 Candidate Portal
- **Available Positions** — live list of active job openings
- **Join by Code** — private sessions with 6-digit interview codes
- **AI Practice Mode** — unlimited practice interviews tailored to any job role
- **ATS Score Checker** — upload resume and get ATS compatibility score + improvement tips
- **My Reports** — full history of past assessment reports with AI feedback
- **PDF Report Export** — download official, verified assessment certificates
- **Help & Support** — in-platform FAQ and support ticketing

### 📧 Email Notification System
- Automated result emails sent to candidates post-assessment
- Recruiter alerts for completed sessions
- Powered by **Nodemailer**

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **React Router v6** | Client-side routing with protected routes |
| **Vite** | Lightning-fast build tool with HMR |
| **Framer Motion** | Smooth page and component animations |
| **Lucide React** | Consistent icon library |
| **Socket.IO Client** | Real-time live monitoring |
| **TensorFlow.js** | In-browser face/object detection for proctoring |
| **Tailwind CSS v4** | Utility CSS (+ custom design system) |
| **Axios** | HTTP client with request deduplication |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **MongoDB Atlas + Mongoose** | Database and ODM |
| **Socket.IO** | Real-time bidirectional communication |
| **Google Gemini AI** | Resume parsing + question generation |
| **Groq SDK (LLaMA)** | Ultra-fast voice interview AI responses |
| **Cloudinary** | Video recording storage and streaming |
| **JWT + bcryptjs** | Authentication and security |
| **Multer + pdf-parse** | Resume file upload and text extraction |
| **Nodemailer** | Email notifications |

### Infrastructure
| Service | Role |
|---|---|
| **MongoDB Atlas** | Cloud database |
| **Render.com** | Backend deployment |
| **Cloudinary** | Media CDN |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key
- Groq API key
- Cloudinary account

### 1. Clone the Repository
```bash
git clone https://github.com/Anmol-Malviya/RAW_CODER.git
cd RAW_CODER
```

### 2. Install Root Dependencies
```bash
npm install
```

### 3. Configure Server Environment
Create `server/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key

# AI Services
GEMINI_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# Media Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

### 4. Configure Client Environment
Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Install All Dependencies
```bash
# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 6. Run the Platform
```bash
# From root directory — starts both server and client
npm run dev
```

Or run separately:
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🗺️ Application Routes

### Public Routes
| Route | Page |
|---|---|
| `/` | Landing page with demo assessment |
| `/login` | Login / Register |

### Candidate Routes (Protected)
| Route | Page |
|---|---|
| `/candidate` | Dashboard — Available jobs + reports |
| `/apply/:jobId` | Job application + interview mode selector |
| `/check` | System check — camera, mic, browser permissions |
| `/assessment` | Live MCQ assessment with proctoring |
| `/voice-interview` | AI voice interview session |
| `/coding` | In-browser coding test |
| `/results` | Post-interview AI report |
| `/candidate/practice` | Unlimited AI practice sessions |
| `/candidate/profile` | Profile + performance history |
| `/candidate/ats` | ATS resume score checker |
| `/candidate/support` | Help & support center |

### Admin Routes (Protected)
| Route | Page |
|---|---|
| `/admin` | Main dashboard — KPIs & overview |
| `/admin/roles` | Create and manage job postings |
| `/admin/live` | Real-time interview monitoring |
| `/admin/questions` | Question bank management |
| `/admin/sessions` | All interview session history |
| `/admin/sessions/:id/candidates` | Per-session candidate breakdown |
| `/admin/analytics` | Hiring analytics and insights |
| `/admin/settings` | Platform configuration |
| `/admin/profile` | Admin profile & permissions |
| `/admin/workspace` | Workspace overview |
| `/admin/workspace/session/:id` | Detailed workspace session view |

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register candidate or admin |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/auth/profile` | Get current user profile |
| `PUT` | `/api/auth/profile` | Update user profile |

### Jobs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs` | List all active jobs |
| `POST` | `/api/jobs` | Create new job (admin) |
| `PUT` | `/api/jobs/:id/status` | Toggle job active/inactive |
| `GET` | `/api/jobs/code/:code` | Validate interview join code |
| `GET` | `/api/jobs/:id/candidates` | List candidates for a job |

### Assessment
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate-mcq` | Upload resume → generate questions |
| `POST` | `/api/generate-practice` | Generate practice session |
| `POST` | `/api/submit-assessment` | Submit answers → get AI score |
| `POST` | `/api/voice-chat` | Voice interview turn (Groq AI) |
| `GET` | `/api/session/:id` | Get session details |
| `GET` | `/api/sessions/user` | Get current user's sessions |
| `GET` | `/api/sessions/all` | Get all sessions (admin) |

### Media
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload-recording` | Upload webcam recording |
| `POST` | `/api/upload-screen` | Upload screen recording |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics` | Hiring analytics data |
| `GET` | `/api/questions` | Question bank |
| `POST` | `/api/questions` | Add question to bank |
| `DELETE` | `/api/questions/:id` | Remove question |
| `GET` | `/api/settings` | Platform settings |
| `POST` | `/api/settings` | Update setting value |

---

## 👥 User Flows

### Candidate Flow
```
Register → Browse Jobs → Apply Now → System Check
→ Upload Resume → AI Generates Questions
→ Choose Mode (Voice/MCQ) → Live Interview with Proctoring
→ Submit → AI Scores + Generates Detailed Report
→ Download PDF Certificate
```

### Admin Flow
```
Register (as Recruiter) → Create Job Posting → Share Interview Code
→ Monitor Live Interviews → Review Completed Reports
→ View Analytics → Export Candidate Rankings
```

### Quick Demo Flow (No Login Required)
```
Visit / → Enter Job Role → Upload Any PDF Resume
→ Instant AI Assessment Generated → Take Live Demo Test → See Results
```

---

## 🧪 Testing

### Automated API Test Suite
```bash
cd test
node automated_api_tests.js
```

Tests cover: registration → job creation → MCQ generation → submission → feedback.

### Manual Test Plan
See [`test case/manual_test_plan.md`](../test%20case/manual_test_plan.md) for a complete 40+ scenario manual test plan covering all user flows.

---

## 🔒 Security

- **JWT Authentication** — all API routes are protected, tokens expire in 7 days
- **Role-Based Access Control** — admin vs candidate routes enforced server-side
- **bcryptjs Password Hashing** — passwords never stored in plain text
- **Input Validation** — all user inputs sanitized before DB operations
- **CORS Configuration** — restricted to known origins in production

---

## 🏆 What Makes This Hackathon-Worthy

| Feature | Why It Matters |
|---|---|
| 🎙️ Real Voice AI | Candidates speak naturally — no typing, no multiple choice bias |
| 🧠 Resume-Aware Questions | Every interview is unique — generated fresh from the actual resume |
| 🛡️ Multi-Layer Proctoring | TensorFlow face detection + tab monitoring + object detection |
| ⚡ Sub-second AI | Groq delivers LLaMA responses in <500ms for natural conversation flow |
| 📊 Instant Reports | Full AI-scored report with per-question breakdown in <10 seconds |
| 🔁 End-to-End Automation | Zero human effort from posting to ranked shortlist |
| 📱 Fully Responsive | Works on any device — phone, tablet, desktop |

---

## 👨‍💻 Team

Built with ❤️ for the hackathon by the **RAW_CODER** team.

---

## 📄 License

This project is built for hackathon demonstration purposes.

---

<div align="center">

**⭐ If this project impressed you, give it a star!**

*Powered by Google Gemini · Groq AI · MongoDB Atlas · React · Node.js*

</div>
