# EduAI Ultimate — API Reference

Base URL: `https://api.eduai.app/api/v1`  
Auth: `Authorization: Bearer <accessToken>` + `X-Tenant-ID: <tenantId>`  
Swagger UI: `https://api.eduai.app/api/docs`

---

## Authentication

### POST /auth/register
Create a new tenant with an admin user.

**Request**
```json
{
  "tenantName": "Lincoln High School",
  "tenantSlug": "lincoln-high",
  "tenantType": "SCHOOL",
  "adminEmail": "admin@lincolnhigh.edu",
  "adminPassword": "SecurePass123!",
  "adminFirstName": "Jane",
  "adminLastName": "Smith"
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "expiresIn": 900
    },
    "user": {
      "id": "usr_01HXYZ",
      "email": "admin@lincolnhigh.edu",
      "role": "ADMIN",
      "tenantId": "ten_01HXYZ"
    }
  }
}
```

**Errors**: `400` (validation), `409` (slug taken)

---

### POST /auth/login
```json
{ "email": "admin@school.edu", "password": "SecurePass123!" }
```
Headers: `X-Tenant-ID: <tenantId>`

**Response 200** — same `tokens` object as register.  
**Errors**: `401` (wrong credentials), `403` (MFA required → triggers `/auth/mfa/verify`)

---

### POST /auth/refresh
```json
{ "refreshToken": "eyJhbGci..." }
```
**Response 200** — new `tokens` object.

---

### POST /auth/mfa/verify
```json
{ "token": "123456" }
```
Headers: `Authorization: Bearer <mfaSessionToken>`  
**Response 200** — full `tokens` object.

---

## Users

### GET /users/me
Returns the authenticated user's full profile.

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "usr_01HXYZ",
    "email": "alice@school.edu",
    "firstName": "Alice",
    "lastName": "Smith",
    "role": "STUDENT",
    "mfaEnabled": false,
    "profile": { "timezone": "America/New_York", "language": "en" }
  }
}
```

### GET /users?page=1&limit=20&role=TEACHER&search=jane
List users (ADMIN+).

### PATCH /users/:id
```json
{ "firstName": "Alice", "phone": "+1-555-0100" }
```

### DELETE /users/:id
Soft-delete (sets `isActive: false`). ADMIN/SUPER_ADMIN only.

### PATCH /users/:id/role
```json
{ "role": "TEACHER" }
```
ADMIN+ only.

---

## Courses

### GET /courses?page=1&limit=20&level=BEGINNER&category=Mathematics
**Response 200**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "crs_01HXYZ",
        "title": "Algebra I",
        "slug": "algebra-i",
        "level": "BEGINNER",
        "price": 0,
        "rating": 4.7,
        "enrollCount": 320,
        "isPublished": true,
        "teacher": { "user": { "firstName": "Jane", "lastName": "Smith" } }
      }
    ],
    "total": 45,
    "page": 1,
    "totalPages": 3
  }
}
```

### POST /courses
```json
{
  "title": "Advanced Calculus",
  "description": "Multi-variable calculus and integration techniques",
  "level": "ADVANCED",
  "price": 49.99,
  "category": "Mathematics",
  "tags": ["calculus", "math", "advanced"]
}
```

### GET /courses/:id
Full course with sections, lessons, and enrollment status.

### POST /courses/:id/progress
```json
{ "lessonId": "les_01HXYZ", "progressPercent": 75 }
```

---

## Students

### GET /students?page=1&limit=20&search=alice
### GET /students/:id
### GET /students/:id/performance

**Performance Response**
```json
{
  "success": true,
  "data": {
    "averageProgress": 72.5,
    "completedCourses": 3,
    "submissionsCount": 8,
    "averageQuizScore": 85.2,
    "totalPoints": 450
  }
}
```

---

## Teachers

### GET /teachers?page=1&limit=20&search=jane
### GET /teachers/:id
### GET /teachers/:id/stats

**Stats Response**
```json
{
  "success": true,
  "data": {
    "courseCount": 5,
    "totalEnrollments": 480,
    "averageRating": 4.7,
    "totalSessions": 32,
    "averageAttendance": 18.5
  }
}
```

---

## AI Education Suite

### POST /ai/tutor/chat
```json
{
  "message": "Explain the chain rule in calculus",
  "conversationId": "conv_01HXYZ",
  "subject": "Mathematics",
  "level": "INTERMEDIATE"
}
```
**Response 200**
```json
{
  "success": true,
  "data": {
    "response": "The chain rule is used to differentiate composite functions...",
    "conversationId": "conv_01HXYZ",
    "usage": { "inputTokens": 120, "outputTokens": 340 }
  }
}
```

### POST /ai/exam/generate
```json
{
  "subject": "Physics",
  "topic": "Newton's Laws",
  "difficulty": "MEDIUM",
  "questionCount": 10,
  "questionTypes": ["MCQ", "SHORT_ANSWER"]
}
```

### POST /ai/lesson/generate
```json
{
  "topic": "Photosynthesis",
  "targetGrade": "8",
  "duration": 45,
  "learningObjectives": ["Understand chlorophyll", "Explain the Calvin cycle"]
}
```

### GET /ai/usage
Returns token usage and cost analytics for the tenant.

---

## AI Agents Platform

### GET /ai/agents
List available agent types.

**Response 200**
```json
[
  { "type": "STUDY_PLANNER", "name": "Study Planner", "description": "...", "icon": "📅" },
  { "type": "HOMEWORK_ASSISTANT", "name": "Homework Assistant", "description": "...", "icon": "📝" },
  { "type": "RESEARCH_ASSISTANT", "name": "Research Assistant", "description": "...", "icon": "🔍" },
  { "type": "CAREER_ADVISOR", "name": "Career Advisor", "description": "...", "icon": "🎯" },
  { "type": "PERFORMANCE_COACH", "name": "Performance Coach", "description": "...", "icon": "📈" }
]
```

### GET /ai/agents/sessions
List the authenticated user's agent sessions.

### POST /ai/agents/chat
```json
{
  "agentType": "STUDY_PLANNER",
  "message": "I have 3 exams next week, help me create a study plan",
  "sessionId": "sess_01HXYZ"
}
```

---

## Billing

### GET /billing/plans
Returns all available subscription plans with features and pricing.

### POST /billing/subscribe
```json
{ "plan": "PROFESSIONAL", "paymentMethodId": "pm_xxx" }
```

### POST /billing/cancel
Cancel the current subscription at period end.

### GET /billing/portal
Returns a Stripe Customer Portal URL for self-service billing management.

### GET /billing/invoices
List invoices for the tenant.

---

## Live Classroom

### GET /live/sessions?status=SCHEDULED
### POST /live/sessions
```json
{
  "title": "Algebra Q&A",
  "description": "Weekly review session",
  "scheduledAt": "2025-03-15T14:00:00Z",
  "duration": 60,
  "maxParticipants": 50
}
```

### POST /live/sessions/:id/start
### POST /live/sessions/:id/join
### POST /live/sessions/:id/end

**WebSocket Events** (connect to `/live`):
- `join-session` `{ sessionId }` → join room
- `offer` / `answer` / `ice-candidate` → WebRTC signaling
- `chat-message` `{ content }` → broadcast to room
- `participant-joined` / `participant-left` → room events

---

## Marketplace

### GET /marketplace/courses?page=1&limit=20&category=Mathematics&sort=popular
### POST /marketplace/courses/:id/enroll
### GET /marketplace/courses/:id/reviews
### POST /marketplace/courses/:id/reviews
```json
{ "rating": 5, "comment": "Excellent course!" }
```

---

## Gamification

### GET /gamification/points
### POST /gamification/points/award
```json
{ "userId": "usr_01HXYZ", "points": 50, "reason": "lesson_completed" }
```

### GET /gamification/leaderboard?limit=10
### GET /gamification/achievements
### GET /gamification/achievements/user/:userId

---

## Certificates

### GET /certificates
### POST /certificates/issue
```json
{ "studentId": "stu_01HXYZ", "courseId": "crs_01HXYZ", "templateId": "tpl_01HXYZ" }
```

### GET /certificates/:id/verify
Public endpoint — no auth required.

### GET /certificates/:id/download
Returns a signed S3 URL for the PDF certificate.

---

## Notifications

### GET /notifications?page=1&limit=20
### GET /notifications/unread/count
### PATCH /notifications/:id/read
### PATCH /notifications/read-all

---

## Messaging

### GET /messaging/conversations
### POST /messaging/conversations/direct
```json
{ "userId": "usr_01HXYZ" }
```

### POST /messaging/conversations/group
```json
{ "name": "Study Group", "participantIds": ["usr_01", "usr_02", "usr_03"] }
```

### GET /messaging/conversations/:id/messages?page=1
### POST /messaging/conversations/:id/messages
```json
{ "content": "Hello everyone!", "type": "text" }
```

---

## Analytics

### GET /analytics/platform
Platform-wide stats (ADMIN+).

### GET /analytics/users/growth?days=30
Daily user signups over the last N days.

### GET /analytics/courses
Top 10 courses by enrollment.

### GET /analytics/students/activity?days=7
### GET /analytics/revenue?months=6
### GET /analytics/ai/usage

---

## School ERP

### GET /school-erp/schools
### POST /school-erp/schools
### GET /school-erp/schools/:id
### GET /school-erp/schools/:id/stats
### POST /school-erp/schools/:id/departments
### POST /school-erp/schools/:id/classes
### GET /school-erp/classes/:id/timetable
### POST /school-erp/classes/:id/timetable

---

## University ERP

### GET /university-erp/universities
### POST /university-erp/universities
### POST /university-erp/universities/:id/faculties
### POST /university-erp/universities/:id/programs
### GET /university-erp/universities/:id/programs
### POST /university-erp/programs/:id/enroll
### GET /university-erp/programs/:id/enrollments
### PATCH /university-erp/enrollments/:id/status

---

## Tenants

### GET /tenants (SUPER_ADMIN only)
### POST /tenants (SUPER_ADMIN only)
### GET /tenants/:id
### PATCH /tenants/:id
### DELETE /tenants/:id (SUPER_ADMIN only)
### GET /tenants/:id/stats
### PATCH /tenants/:id/settings

---

## White Label

### GET /white-label
### PUT /white-label
```json
{
  "brandName": "AcadeMe",
  "primaryColor": "#1a73e8",
  "secondaryColor": "#34a853",
  "logoUrl": "https://cdn.example.com/logo.png",
  "customCss": ".hero { background: linear-gradient(...) }"
}
```

### GET /white-label/theme.css (public, by domain)

---

## Plugins

### GET /plugins/marketplace?search=quiz&category=Assessment
### GET /plugins/installed
### POST /plugins/:id/install
### DELETE /plugins/:id/uninstall
### PATCH /plugins/:id/toggle
```json
{ "isEnabled": true }
```

### PATCH /plugins/:id/config
```json
{ "config": { "apiKey": "...", "webhookUrl": "..." } }
```

---

## API Ecosystem

### GET /api-ecosystem/keys
### POST /api-ecosystem/keys
```json
{ "name": "CI/CD Bot", "scopes": ["read:courses", "write:grades"], "rateLimit": 5000 }
```

### DELETE /api-ecosystem/keys/:id
### GET /api-ecosystem/webhooks
### POST /api-ecosystem/webhooks
```json
{ "url": "https://your-server.com/hook", "events": ["course.created", "enrollment.created"] }
```

---

## Search

### GET /search/courses?q=algebra&category=Mathematics&level=BEGINNER&page=1
Full-text search with fuzzy matching across title, description, tags, and instructor.

---

## Storage

### POST /storage/upload
`multipart/form-data` with `file` field.

**Response 200**
```json
{ "key": "uploads/uuid.jpg", "url": "https://cdn.eduai.app/uploads/uuid.jpg" }
```

### POST /storage/presign
```json
{ "filename": "lecture.mp4", "contentType": "video/mp4", "folder": "lesson-videos" }
```
Returns `{ "uploadUrl": "...", "key": "...", "publicUrl": "..." }` for direct browser upload.

---

## Health

### GET /health
Public endpoint. Returns `{ "status": "ok", "timestamp": "...", "uptime": 3600 }`.

---

## Error Format

All errors follow:
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Course not found",
  "error": "Not Found",
  "timestamp": "2025-03-15T14:00:00.000Z",
  "path": "/api/v1/courses/bad-id"
}
```

## Rate Limits

| Tier | Requests/min |
|------|-------------|
| API Key (default) | 1,000 |
| JWT (free plan) | 120 |
| JWT (pro+) | 600 |
| AI endpoints | 60 |
| Auth endpoints | 10 |
