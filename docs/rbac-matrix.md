# EduAI Ultimate — RBAC Matrix

## Roles

| Role | Scope | Description |
|------|-------|-------------|
| `SUPER_ADMIN` | Platform-wide | Full access to all tenants, platform configuration, billing |
| `SCHOOL_ADMIN` | Tenant | Manages school: teachers, students, courses, ERP |
| `UNIVERSITY_ADMIN` | Tenant | Manages university: faculties, programs, enrollments |
| `TEACHER` | Tenant | Creates/manages own courses, students in their classes |
| `STUDENT` | Tenant | Accesses enrolled courses, AI tutors, assignments |
| `PARENT` | Tenant | Read-only view of linked children's progress |

---

## Module Access Matrix

Legend: ✅ Full Access · 📖 Read-Only · 🔑 Own Records · ❌ No Access · 🔧 Configure Only

### Authentication & Users

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Register/Login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all users in tenant | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Deactivate users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change user roles | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| MFA setup (own) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enforce MFA tenant-wide | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Multi-Tenant Administration

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| View all tenants | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create tenant | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Deactivate tenant | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage own tenant settings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Impersonate users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit logs (own tenant) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Audit logs (all tenants) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Courses & Content

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Browse published courses | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create course | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit any course | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit own course | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete any course | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete own course | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Publish course | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Enroll in course | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View enrolled course content | ✅ | ✅ | ✅ | ✅ | 🔑 | ❌ |
| Submit assignment | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Grade assignment | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View all submissions | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Submit review | ✅ | ✅ | ✅ | ✅ | 🔑 | ❌ |

### AI Education Suite

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| AI Tutor chat | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Homework Assistant | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Exam Generator | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| AI Lesson Generator | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| AI Flashcards | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Mind Maps | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Research Assistant | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Translator | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View AI usage stats (own) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View AI usage stats (all) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| AI Plagiarism Detection | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| AI Recommendation Engine | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Performance Prediction | ✅ | ✅ | ✅ | ✅ | 📖 | 📖 |
| AI Dropout Prediction | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### AI Agents Platform

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Study Planner agent | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Homework Assistant agent | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Research Assistant agent | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Career Advisor agent | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Performance Coach agent | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View all agent sessions (tenant) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Live Classroom

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Create session | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Start/End own session | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| End any session | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Join session | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Toggle mic/camera (own) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Mute participants | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Chat in session | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Share screen | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Use whiteboard | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Raise hand | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View session recordings | ✅ | ✅ | ✅ | ✅ | 🔑 | ❌ |

### Teacher Ecosystem

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| List all teachers | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View teacher profile | ✅ | ✅ | ✅ | 🔑 | 📖 | ❌ |
| View teacher performance stats | ✅ | ✅ | ✅ | 🔑 | ❌ | ❌ |
| View teacher schedule | ✅ | ✅ | ✅ | 🔑 | ❌ | ❌ |
| Assign teacher to class | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Student Ecosystem

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| List all students | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View student profile | ✅ | ✅ | ✅ | ✅ | 🔑 | 🔑 |
| View student progress | ✅ | ✅ | ✅ | ✅ | 🔑 | 🔑 |
| View student submissions | ✅ | ✅ | ✅ | ✅ | 🔑 | 📖 |
| View performance summary | ✅ | ✅ | ✅ | ✅ | 🔑 | 🔑 |
| Enroll student in course | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### Parent Portal

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| List parents | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View parent profile | ✅ | ✅ | ✅ | ❌ | ❌ | 🔑 |
| Link child | ✅ | ✅ | ✅ | ❌ | ❌ | 🔑 |
| View linked children | ✅ | ✅ | ✅ | ❌ | ❌ | 🔑 |
| View child progress | ✅ | ✅ | ✅ | ✅ | ❌ | 🔑 |
| View child attendance | ✅ | ✅ | ✅ | ✅ | ❌ | 🔑 |
| Message teacher | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

### Gamification

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| View leaderboard | ✅ | ✅ | ✅ | ✅ | ✅ | 📖 |
| View own achievements | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Award points (manual) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create achievements | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View all user points | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Certificates

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Issue certificate | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View own certificates | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View all tenant certificates | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Revoke certificate | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create certificate template | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Verify certificate (public) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Messaging

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Create conversation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send message | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own conversations | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all tenant conversations | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete any message | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete own message | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Marketplace

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Browse courses | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Purchase course | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| List own courses for sale | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View sales analytics | ✅ | ✅ | ✅ | 🔑 | ❌ | ❌ |
| Manage marketplace settings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Billing & Subscriptions

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| View subscription | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Upgrade/Downgrade plan | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cancel subscription | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View invoices | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage payment methods | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Apply coupon | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View all tenant billing (super) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Analytics & Reporting

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Platform-wide analytics | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Tenant analytics | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Course analytics | ✅ | ✅ | ✅ | 🔑 | ❌ | ❌ |
| Student performance report | ✅ | ✅ | ✅ | ✅ | 🔑 | 🔑 |
| AI usage report | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Revenue report | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export reports (CSV/PDF) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### White Label

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Configure branding | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Set custom domain | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Set custom CSS | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure email templates | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### API Ecosystem

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Create API key | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Revoke API key | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Register webhook | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Use API (with key) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View API logs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Plugin Marketplace

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Browse plugins | ✅ | ✅ | ✅ | 📖 | ❌ | ❌ |
| Install plugin | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Uninstall plugin | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Enable/Disable plugin | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure plugin | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Publish plugin to marketplace | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### School ERP

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Manage departments | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage classes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage timetable | ✅ | ✅ | ❌ | 📖 | 📖 | 📖 |
| View ERP overview | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage attendance | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

### University ERP

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Manage faculties | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage academic programs | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage enrollments | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View academic records | ✅ | ❌ | ✅ | 📖 | 🔑 | ❌ |
| Award degree | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

### Storage

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Upload files | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete own files | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete any tenant file | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View storage usage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Guard Implementation

Guards are applied at the NestJS controller/route level:

```typescript
// Typical guard stack on a protected endpoint
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
@Get('/:id')
findOne(@Param('id') id: string, @Req() req: any) { ... }
```

### Guard Chain

1. **`JwtAuthGuard`** — validates the Bearer token, attaches `req.user`
2. **`TenantGuard`** — resolves tenant from subdomain/header, validates user belongs to it, attaches `req.tenantId`
3. **`RolesGuard`** — checks `req.user.role` against `@Roles(...)` decorator
4. **`AuditGuard`** (selective) — logs the action to `AuditLog` table

### Ownership Check Pattern

For records where only the owner may edit (🔑), services implement:

```typescript
if (record.userId !== req.user.id && !isAdmin(req.user.role)) {
  throw new ForbiddenException('You can only manage your own records');
}
```

---

## ABAC Extensions

Beyond RBAC, these attribute-based conditions apply:

| Condition | Applied To |
|-----------|-----------|
| `tenantId` must match | All tenant-scoped resources |
| `isPublished === true` | Course visibility for students |
| `isActive === true` | User account access |
| `session.status === 'LIVE'` | Live session join |
| Enrollment exists | Course content access, review submission |
| `maxParticipants` not exceeded | Live session join |
| Subscription plan allows feature | AI modules, white-label, advanced analytics |
