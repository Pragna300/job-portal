# Job Platform Backend

This is the backend API for the Job Platform application, built with Node.js, Express.js, and PostgreSQL.

## Features

- User authentication with JWT
- Role-based access control (Admin, Manager, Client)
- Job posting and application management
- File uploads to Cloudinary
- Email notifications

## Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

   ```bash
   npm install
   ```

4. Set up environment variables in `.env` file (copy from `.env` template)

5. Set up PostgreSQL database:
   ```bash
   psql -U postgres
   CREATE DATABASE job_platform;
   \c job_platform;
   \i database/schema.sql;
   ```

## Running the Application

```bash
npm run dev  # Development mode with nodemon
npm start    # Production mode
```

The server will run on port 5000 by default.

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user

### Admin (requires admin role)

- `GET /admin/companies` - Get all companies
- `GET /admin/revenue` - Get revenue data
- `PUT /admin/companies/:id/approve` - Approve company registration

### Company (requires manager role)

- `GET /company/profile` - Get company profile
- `PUT /company/profile` - Update company profile

### Jobs

- `GET /jobs` - Get all open jobs
- `GET /jobs/:id` - Get job details
- `POST /jobs` - Create job (manager only)
- `PUT /jobs/:id` - Update job (manager only)
- `DELETE /jobs/:id` - Delete job (manager only)

### Applications

- `POST /applications` - Apply for job (client only)
- `GET /applications/my` - Get user's applications (client only)
- `GET /applications/job/:id` - Get applications for job (manager only)
- `PUT /applications/:id` - Update application status (manager only)

### Users

- `GET /users/profile` - Get user profile (client only)
- `PUT /users/profile` - Update user profile (client only)

## Technologies Used

- Node.js
- Express.js
- PostgreSQL
- JWT for authentication
- bcrypt for password hashing
- Multer for file uploads
- Cloudinary for file storage
- Nodemailer for emails
