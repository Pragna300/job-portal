# Job Platform

Full-stack job posting and recruitment platform with separate `backend` and `frontend` apps.

## Repository Layout

- `backend` - Express + PostgreSQL API
- `frontend` - React + Vite web client

## Features

- JWT authentication and role-based access
- Admin dashboard for platform management
- Company workflows for job posting and applicant handling
- User workflows for browsing and applying to jobs
- Resume upload pipeline with ATS/interview-related integrations

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+

## Quick Start

### 1) Backend

```bash
cd backend
npm install
```

Create `backend/.env` with your own credentials/secrets, then:

```bash
npm run migrate
node create_ai_tables.js
npm run dev
```

Backend runs on `http://localhost:5000` by default.

### 2) Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Then run:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Useful Commands

- Backend dev: `cd backend && npm run dev`
- Backend production: `cd backend && npm start`
- Frontend dev: `cd frontend && npm run dev`
- Frontend build: `cd frontend && npm run build`
- Frontend lint: `cd frontend && npm run lint`

## Documentation

- Backend details: `backend/README.md`
- API references: `backend/API_DOCUMENTATION.md`, `backend/ATS_API_DOCUMENTATION.md`
- Frontend details: `frontend/README.md`

## Security Notes

- Never commit real `.env` values.
- Rotate secrets immediately if credentials were exposed.
