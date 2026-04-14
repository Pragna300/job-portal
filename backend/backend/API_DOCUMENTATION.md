# Backend ATS API Endpoints Documentation

Here are the complete specifications for the new API endpoints built into the backend. These can be mapped into your frontend (or provided to your third-party assessment platform).

---

### 1. Apply For Job (Triggers Mistral ATS Evaluation)
Used by candidates to submit their application. The backend halts until Mistral-7B scores the PDF before responding.

**Endpoint:** `POST /applications`
**Headers:** `Authorization: Bearer <Candidate_JWT>`
**Content-Type:** `multipart/form-data`

**Request Format:**
```javascript
// Form-Data
job_id: 1                       // (Required) Integer
resume: File                    // (Required) Valid PDF, JPG, or PNG string (Max: 5MB)
cover_letter: "string"          // (Optional) Text
college_name: "string"          // (Optional) Text
cgpa: 3.8                       // (Optional) Decimal
willing_to_relocate: true       // (Optional) Boolean
experience_years: 2             // (Optional) Integer
```

**Response (Success 201):**
```json
{
  "message": "Application submitted successfully",
  "applicationId": 5,
  "ats_score": 75,
  "status": "shortlisted",      // Will be 'shortlisted' (>=70) or 'rejected' (<70)
  "candidate_name": "Sneha",
  "job_role": "Backend Developer"
}
```

---

### 2. Update Assessment Score 
Used securely by the third-party coding platform (`assessment.shnoor.com`) to instantly push candidate scores right back into your backend. This auto-switches the application status to `test_completed`.

**Endpoint:** `POST /applications/update-test-score`
**Content-Type:** `application/json`

**Request Format:**
```json
{
  "application_id": 5,          // The ID of the application
  "test_score": 92.5            // Any Integer or Decimal score
}
```

**Response (Success 200):**
```json
{
  "candidate_name": "Sneha",
  "job_role": "Backend Developer",
  "ats_score": 75.00,
  "test_score": 92.5,
  "status": "test_completed"
}
```

---

### 3. Manager Approve For Interview
Used by your Manager frontend Dashboard to manually bump a tested candidate into the final interview stage. It shoots off the "Interview Shortlist" confirmation email instantly.

**Endpoint:** `PATCH /applications/manager-approve/:application_id`
**Headers:** `Authorization: Bearer <Manager_JWT>`
**Content-Type:** `application/json`

*(No Body required. Just pass the `application_id` directly in the URL!)*

**Response (Success 200):**
```json
{
  "candidate_name": "Sneha",
  "job_role": "Backend Developer",
  "ats_score": 75.00,
  "test_score": 92.5,
  "status": "interview_ready",
  "message": "Candidate approved for interview successfully"
}
```

---

### 4. Live Proctoring: Start Session
Used by the frontend to initialize a candidate's live proctoring session, set the integrity score to 100, and ensure readiness for monitoring.

**Endpoint:** `POST /proctoring/start-session`
**Content-Type:** `application/json`

**Request Format:**
```json
{
  "candidateId": 1
}
```

**Response (Success 200):**
```json
{
  "message": "Session started successfully",
  "sessionId": 5
}
```

---

### 5. Live Proctoring: Report Violation
Hit by the client-side AI/monitoring scripts to report negative behaviors (e.g., leaving the tab, no face detected, etc.) during an active interview. This dynamically reduces the session's integrity score and saves an audit log.

**Endpoint:** `POST /proctoring/report-violation`
**Content-Type:** `application/json`

**Request Format:**
```json
{
  "candidateId": 1,
  "sessionId": 5,
  "violationType": "TAB_SWITCH" // Options: 'TAB_SWITCH', 'FACE_NOT_DETECTED', 'CAMERA_OFF', 'MULTIPLE_FACES'
}
```

**Response (Success 200):**
```json
{
  "message": "Violation reported",
  "integrityScore": 90
}
```
*(If violations trigger more than 3 warnings, this endpoint will automatically terminate the interview).*

---

### 6. Admin Panel: Send Warning
Used by Admin/Proctor via the Live Dashboard to explicitly send a warning notification to a candidate's screen. If the warning cap (3) is exceeded, the interview is forcefully terminated.

**Endpoint:** `POST /proctoring/send-warning`
**Headers:** `Authorization: Bearer <Admin_JWT>`
**Content-Type:** `application/json`

**Request Format:**
```json
{
  "candidateId": 1,
  "sessionId": 5
}
```

**Response (Success 200):**
```json
{
  "message": "Warning sent",
  "warningNumber": 1
}
```

---

### 7. Admin Panel: Terminate Interview
Used by Admin/Proctor to explicitly and instantaneously terminate a candidate's live interview session due to extreme violations.

**Endpoint:** `POST /proctoring/terminate-interview`
**Headers:** `Authorization: Bearer <Admin_JWT>`
**Content-Type:** `application/json`

**Request Format:**
```json
{
  "candidateId": 1,
  "sessionId": 5
}
```

**Response (Success 200):**
```json
{
  "message": "Interview terminated",
  "reason": "ADMIN_TERMINATED"
}
```

---

### 8. Admin Panel: Get Live Candidates
Fetches an aggregated list of all currently active proctoring sessions for the Admin/Manager dashboard, complete with violation metrics.

**Endpoint:** `GET /proctoring/live-candidates`
**Headers:** `Authorization: Bearer <Admin_JWT>`

**Response (Success 200):**
```json
[
  {
    "session_id": 5,
    "candidate_id": 1,
    "candidate_name": "Sneha",
    "email": "sneha@example.com",
    "status": "ACTIVE",
    "integrity_score": 90,
    "start_time": "2023-10-15T10:00:00.000Z",
    "violation_count": 1,
    "warnings_count": 0
  }
]
```

---

### 9. Admin Panel: Get Session Summary
Provides a comprehensive overview of a candidate's concluded session—detailing final scores, AI recommendations, all registered warnings, and a breakdown of categorized violations.

**Endpoint:** `GET /proctoring/session-summary/:candidateId`
**Headers:** `Authorization: Bearer <Admin_JWT>`

*(No Body required. Pass `candidateId` as URL parameter).*

**Response (Success 200):**
```json
{
  "candidateName": "Sneha",
  "status": "TERMINATED",
  "integrityScore": 65,
  "totalViolations": 3,
  "violationBreakdown": [
    {
      "violation_type": "TAB_SWITCH",
      "count": 2
    },
    {
      "violation_type": "FACE_NOT_DETECTED",
      "count": 1
    }
  ],
  "warningsCount": 2,
  "terminationReason": "MAX_WARNINGS_EXCEEDED",
  "startTime": "2023-10-15T10:00:00.000Z",
  "endTime": "2023-10-15T10:45:00.000Z",
  "duration": 2700,
  "questionsAsked": 5,
  "questionsAnswered": 5,
  "averageScore": 8.5,
  "overallScore": 85,
  "aiRecommendation": "HIRE",
  "summary": "Candidate demonstrated strong backend skills..."
}
```
