# EduAI Ultimate — RBAC Matrix

## Roles

| Role | Scope | Description |
|------|-------|-------------|
| `SUPER_ADMIN` | Platform-wide | Full access to all tenants, platform configuration, billing |
| `ADMIN` | Tenant | Generic tenant administrator (alias for SCHOOL_ADMIN in school contexts) |
| `SCHOOL_ADMIN` | Tenant | Manages school: teachers, students, courses, ERP |
| `UNIVERSITY_ADMIN` | Tenant | Manages university: faculties, programs, enrollments |
| `TEACHER` | Tenant | Creates/manages own courses, students in their classes |
| `STUDENT` | Tenant | Accesses enrolled courses, AI tutors, assignments |
| `PARENT` | Tenant | Read-only view of linked children's progress |

---

## Permission Matrix

Legend: ✅ Full Access · 📖 Read-Only · 🔑 Own Records Only · ❌ No Access · 🔧 Configure Only

### 1. Multi-Tenant SaaS

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| View all tenants | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create tenant | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Deactivate / suspend tenant | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage own tenant settings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Impersonate users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View tenant usage metrics | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure tenant feature flags | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Invite tenant admins | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### 2. Super Admin

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Access super admin panel | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View platform-wide stats | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage all tenants | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View global audit logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage platform billing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Deploy system updates | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage global plugins | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit tenant audit logs (cross-tenant) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3. School ERP

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| View ERP overview / dashboard | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage departments | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage classes / sections | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create / edit timetable | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View timetable | ✅ | ✅ | ❌ | 📖 | 📖 | 📖 |
| Mark attendance | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| View attendance records | ✅ | ✅ | ❌ | ✅ | 🔑 | 🔑 |
| Manage school calendar | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View school calendar | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Generate ERP reports | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 4. University ERP

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| View university dashboard | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage faculties | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage academic departments | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage academic programs | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage semesters | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage course enrollments | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View academic records / transcripts | ✅ | ❌ | ✅ | 📖 | 🔑 | ❌ |
| Award / revoke degree | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Add faculty members | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View university reports | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

### 5. AI Education Suite

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| AI Tutor chat | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Homework Assistant | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Exam Generator | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| AI Lesson Generator | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| AI Curriculum Generator | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| AI Flashcards | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Mind Maps | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Research Assistant | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Translator | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Speech-to-Text | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Text-to-Speech | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Recommendation Engine | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Career Advisor | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Performance Prediction | ✅ | ✅ | ✅ | ✅ | 📖 | 📖 |
| AI Dropout Prediction | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| AI Content Moderation | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| AI Plagiarism Detection | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View AI usage stats (own) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View AI usage stats (all) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### 6. Teacher Ecosystem

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| List all teachers | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View teacher profile | ✅ | ✅ | ✅ | 🔑 | 📖 | ❌ |
| Update teacher profile | ✅ | ✅ | ✅ | 🔑 | ❌ | ❌ |
| View teacher performance stats | ✅ | ✅ | ✅ | 🔑 | ❌ | ❌ |
| View teacher schedule | ✅ | ✅ | ✅ | 🔑 | ❌ | ❌ |
| Assign teacher to class | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Verify teacher credentials | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View teacher's course analytics | ✅ | ✅ | ✅ | 🔑 | ❌ | ❌ |

### 7. Student Ecosystem

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| List all students | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View student profile | ✅ | ✅ | ✅ | ✅ | 🔑 | 🔑 |
| Update student profile | ✅ | ✅ | ✅ | ❌ | 🔑 | ❌ |
| View student progress | ✅ | ✅ | ✅ | ✅ | 🔑 | 🔑 |
| View student submissions | ✅ | ✅ | ✅ | ✅ | 🔑 | 📖 |
| View performance summary | ✅ | ✅ | ✅ | ✅ | 🔑 | 🔑 |
| Enroll student in course | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View learning path | ✅ | ✅ | ✅ | ✅ | 🔑 | ❌ |

### 8. Parent Portal

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| List parents | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View parent profile | ✅ | ✅ | ✅ | ❌ | ❌ | 🔑 |
| Link child to account | ✅ | ✅ | ✅ | ❌ | ❌ | 🔑 |
| View linked children | ✅ | ✅ | ✅ | ❌ | ❌ | 🔑 |
| View child academic progress | ✅ | ✅ | ✅ | ✅ | ❌ | 🔑 |
| View child attendance records | ✅ | ✅ | ✅ | ✅ | ❌ | 🔑 |
| View child assignment results | ✅ | ✅ | ✅ | ✅ | ❌ | 🔑 |
| Message teacher | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Receive notifications about child | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

### 9. Marketplace

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Browse published courses | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Purchase course | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| List own courses for sale | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View sales analytics (own) | ✅ | ✅ | ✅ | 🔑 | ❌ | ❌ |
| View all marketplace analytics | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage marketplace settings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve/reject submitted course | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Submit review / rating | ✅ | ✅ | ✅ | ✅ | 🔑 | ❌ |
| Apply promotional codes | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### 10. Live Classroom

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Create live session | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Start / End own session | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| End any session | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Join live session | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Toggle own mic / camera | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Mute participants | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Remove participant | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Chat in session | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Share screen | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Use whiteboard | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Raise hand | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Access session recording | ✅ | ✅ | ✅ | ✅ | 🔑 | ❌ |
| Delete session recording | ✅ | ✅ | ✅ | 🔑 | ❌ | ❌ |

### 11. Certificate System

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Create certificate template | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit certificate template | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Issue certificate | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Revoke certificate | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View own certificates | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View all tenant certificates | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Verify certificate (public link) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Download certificate PDF | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### 12. Communication Center

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Create conversation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send direct message | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own conversations | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all tenant conversations | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete any message | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete own message | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send announcement | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage notification settings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Broadcast to all students | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### 13. Gamification

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| View leaderboard | ✅ | ✅ | ✅ | ✅ | ✅ | 📖 |
| View own achievements | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View another user's achievements | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Award points (manual) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create achievements / badges | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure XP rules | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View all user points | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage streaks | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### 14. White Label System

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Configure branding (logo, colors) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Set custom domain | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Validate custom domain DNS | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Set custom CSS | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure email templates | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export branding snapshot | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Import branding snapshot | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reset to platform defaults | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View public branding (bootstrap) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 15. Billing

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| View subscription | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Upgrade / Downgrade plan | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cancel subscription | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View invoices | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Download invoice PDF | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage payment methods | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Apply coupon code | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create coupons (admin-only) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View revenue analytics | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View all tenant billing (platform) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage free-trial settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configure tax settings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### 16. Analytics BI

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Platform-wide analytics | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Tenant analytics | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Course analytics (own courses) | ✅ | ✅ | ✅ | 🔑 | ❌ | ❌ |
| Student performance report | ✅ | ✅ | ✅ | ✅ | 🔑 | 🔑 |
| AI usage report | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Revenue report | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export reports (CSV/PDF) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create custom dashboards | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Schedule automated reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View engagement analytics | ✅ | ✅ | ✅ | 🔑 | ❌ | ❌ |

### 17. Plugin Marketplace

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Browse available plugins | ✅ | ✅ | ✅ | 📖 | ❌ | ❌ |
| Install plugin | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Uninstall plugin | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Enable / Disable plugin | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure installed plugin | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Publish plugin to marketplace | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Review / rate plugin | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage plugin billing | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### 18. API Ecosystem

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Create API key | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Revoke API key | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Toggle API key (enable/disable) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View own API key usage | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View all API keys (tenant) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Register webhook endpoint | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete webhook endpoint | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View webhook delivery logs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Use API with key (service calls) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View API rate-limit stats | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### 19. Mobile Apps

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Register device for push | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Receive push notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage own push preferences | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send broadcast push | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Access offline content (download) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View mobile app analytics | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### 20. AI Agents Platform

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Study Planner agent | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Homework Assistant agent | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Research Assistant agent | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Career Advisor agent | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Performance Coach agent | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Run custom agent pipeline | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create / configure agent | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View own agent sessions | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View all agent sessions (tenant) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Monitor agent performance | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage agent tool integrations | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Cross-Cutting Permissions

### Authentication & Users

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Register / Login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all users in tenant | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Deactivate users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change user roles | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| MFA setup (own) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enforce MFA tenant-wide | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Audit logs (own tenant) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Audit logs (all tenants) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Storage & Files

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Upload files | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete own files | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete any tenant file | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View storage usage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Get presigned URL | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### Notifications

| Action | SUPER_ADMIN | SCHOOL_ADMIN | UNIV_ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|--------------|------------|---------|---------|--------|
| Receive in-app notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage own notification preferences | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mark notifications read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send broadcast notification | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Configure notification templates | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

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
| `parentChildLink` exists and is verified | Parent portal access to child data |
| `certificate.isRevoked === false` | Certificate verification |
| `apiKey.isActive === true` | API key authentication |
| `apiKey.expiresAt > now` | API key validity |
| Webhook URL passes validation | Webhook registration |
| Storage quota not exceeded | File upload |
