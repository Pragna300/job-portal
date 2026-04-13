# Job Platform Frontend

React + Vite client for a multi-role job platform (`admin`, `company`, `user`) with protected routes and API integration.

## Tech Stack

- React 19
- Vite 8
- React Router
- Axios
- Tailwind CSS 4

## Project Structure

- `src/routes` - app and protected route definitions
- `src/context` - auth and theme providers
- `src/layouts` - role-specific app shells
- `src/pages` - pages for public, auth, admin, company, user
- `src/services/api.js` - Axios client and auth header interceptor

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` in `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

`VITE_API_BASE_URL` is used by `src/services/api.js`. If omitted, it defaults to `http://localhost:5000`.

## Run

```bash
npm run dev
```

App default: `http://localhost:5173`

## Routing Overview

- Public: `/`, `/legal/terms`, `/legal/privacy`
- Auth: `/login`, `/register`
- User area: `/user/*`
- Admin area: `/admin/*`
- Company area: `/company/*`

Role-based protection is handled by `ProtectedRoute` using auth state from `AuthContext`.

## Authentication Flow

- On login, user + token are stored in `localStorage`.
- Axios automatically sends `Authorization: Bearer <token>` when token exists.
- Logout clears local auth state and storage.

## Notes

- Start backend before using authenticated flows.
- Ensure role names from backend match frontend route guards (`admin`, `company`, `user` mapping).
