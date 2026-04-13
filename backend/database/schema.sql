-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('admin', 'manager', 'client')) NOT NULL,
  profile_pic VARCHAR(500),
  resume_url VARCHAR(500),
  skills TEXT,
  bio TEXT,
  title VARCHAR(255),
  custom_url VARCHAR(255),
  status VARCHAR(20) CHECK (status IN ('active', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  logo_url VARCHAR(500),
  banner_url VARCHAR(500),
  about TEXT,
  industry VARCHAR(255),
  location VARCHAR(255),
  website VARCHAR(255),
  manager_id INT,
  approved BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) CHECK (status IN ('active', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  company_id INT NOT NULL,
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  location VARCHAR(255),
  type VARCHAR(50) CHECK (type IN ('full-time', 'part-time', 'remote')) NOT NULL,
  status VARCHAR(50) CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  is_taken_down BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  job_id INT NOT NULL,
  user_id INT NOT NULL,
  cover_letter TEXT,
  resume_url VARCHAR(500),
  college_name VARCHAR(255),
  cgpa DECIMAL(4,2),
  willing_to_relocate BOOLEAN DEFAULT FALSE,
  experience_years INT DEFAULT 0,
  status VARCHAR(50) CHECK (status IN ('applied', 'shortlisted', 'interview', 'hired', 'rejected')) DEFAULT 'applied',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Saved jobs table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  job_id INT NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- Migration: Run these ALTER statements if the tables already exist
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS title VARCHAR(255);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_url VARCHAR(255);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
-- ALTER TABLE companies ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
-- ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_taken_down BOOLEAN DEFAULT FALSE;
-- ALTER TABLE applications ADD COLUMN IF NOT EXISTS college_name VARCHAR(255);
-- ALTER TABLE applications ADD COLUMN IF NOT EXISTS cgpa DECIMAL(4,2);
-- ALTER TABLE applications ADD COLUMN IF NOT EXISTS willing_to_relocate BOOLEAN DEFAULT FALSE;
-- ALTER TABLE applications ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 0;
-- Migration: ATS Automated Shortlisting
-- ALTER TABLE applications ADD COLUMN IF NOT EXISTS ats_score DECIMAL(5,2);
-- ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
-- ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('applied', 'shortlisted', 'interview', 'hired', 'rejected', 'test_completed', 'interview_ready'));
-- ALTER TABLE applications ADD COLUMN IF NOT EXISTS test_status VARCHAR(20) DEFAULT 'not_started' CHECK (test_status IN ('not_started', 'sent', 'completed'));
-- ALTER TABLE applications ADD COLUMN IF NOT EXISTS test_score DECIMAL(5,2);
-- ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_status VARCHAR(50) DEFAULT 'Not Scheduled';
-- ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_link VARCHAR(500);
-- ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_notified BOOLEAN DEFAULT FALSE;

-- AI Interview System Migration
CREATE TABLE IF NOT EXISTS interview_links (
  id SERIAL PRIMARY KEY,
  token UUID UNIQUE NOT NULL,
  user_id INT NOT NULL REFERENCES users(id),
  application_id INT NOT NULL REFERENCES applications(id),
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proctoring Sessions Table
CREATE TABLE IF NOT EXISTS proctoring_sessions (
  id SERIAL PRIMARY KEY,
  candidate_id INT NOT NULL REFERENCES users(id),
  application_id INT NOT NULL REFERENCES applications(id),
  token UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'TERMINATED')),
  integrity_score INT DEFAULT 100,
  violation_count INT DEFAULT 0,
  warnings_sent INT DEFAULT 0,
  termination_reason VARCHAR(255),
  session_summary TEXT,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Violations Log Table
CREATE TABLE IF NOT EXISTS violations_log (
  id SERIAL PRIMARY KEY,
  proctoring_session_id INT NOT NULL REFERENCES proctoring_sessions(id),
  violation_type VARCHAR(50) NOT NULL,
  integrity_reduction INT DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warnings Log Table
CREATE TABLE IF NOT EXISTS warnings_log (
  id SERIAL PRIMARY KEY,
  proctoring_session_id INT NOT NULL REFERENCES proctoring_sessions(id),
  warning_number INT NOT NULL,
  message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update interview_results if necessary (already exists, but ensuring columns)
-- ALTER TABLE interview_results ADD COLUMN IF NOT EXISTS questions_asked INT DEFAULT 0;
-- ALTER TABLE interview_results ADD COLUMN IF NOT EXISTS questions_answered INT DEFAULT 0;
-- ALTER TABLE interview_results ADD COLUMN IF NOT EXISTS average_score DECIMAL(3,2) DEFAULT 0;
