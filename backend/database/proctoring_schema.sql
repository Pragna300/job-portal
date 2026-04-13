-- Proctoring Sessions Table
CREATE TABLE IF NOT EXISTS proctoring_sessions (
  id SERIAL PRIMARY KEY,
  candidate_id INT NOT NULL REFERENCES users(id),
  application_id INT NOT NULL REFERENCES applications(id),
  token UUID NOT NULL,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'TERMINATED')),
  integrity_score INT DEFAULT 100,
  violation_count INT DEFAULT 0,
  warnings_sent INT DEFAULT 0,
  termination_reason VARCHAR(255),
  session_summary TEXT, -- Stores the AI generated summary
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Violations Log Table
CREATE TABLE IF NOT EXISTS violations_log (
  id SERIAL PRIMARY KEY,
  proctoring_session_id INT NOT NULL REFERENCES proctoring_sessions(id),
  violation_type VARCHAR(50) NOT NULL, -- 'TAB_SWITCH', 'CAMERA_OFF', 'FACE_NOT_DETECTED', etc.
  description TEXT,
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

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_proctoring_candidate ON proctoring_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_status ON proctoring_sessions(status);
