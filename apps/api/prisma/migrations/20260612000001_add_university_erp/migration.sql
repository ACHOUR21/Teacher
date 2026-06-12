-- Migration: add_university_erp (Phase 6a)
-- Adds UniCourseDepartment, FacultyMember, Semester, UniCourse, UniversityEnrollment

-- UniCourseDepartment
CREATE TABLE "UniCourseDepartment" (
    "id"            TEXT NOT NULL,
    "tenantId"      TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "code"          TEXT NOT NULL,
    "headFacultyId" TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UniCourseDepartment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UniCourseDepartment_tenantId_code_key" ON "UniCourseDepartment"("tenantId", "code");

ALTER TABLE "UniCourseDepartment"
    ADD CONSTRAINT "UniCourseDepartment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FacultyMember
CREATE TABLE "FacultyMember" (
    "id"              TEXT NOT NULL,
    "tenantId"        TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "departmentId"    TEXT,
    "title"           TEXT NOT NULL DEFAULT 'Lecturer',
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FacultyMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FacultyMember_userId_key" ON "FacultyMember"("userId");

ALTER TABLE "FacultyMember"
    ADD CONSTRAINT "FacultyMember_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FacultyMember"
    ADD CONSTRAINT "FacultyMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FacultyMember"
    ADD CONSTRAINT "FacultyMember_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "UniCourseDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Semester
CREATE TABLE "Semester" (
    "id"        TEXT NOT NULL,
    "tenantId"  TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate"   TIMESTAMP(3) NOT NULL,
    "isActive"  BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Semester_tenantId_name_key" ON "Semester"("tenantId", "name");

ALTER TABLE "Semester"
    ADD CONSTRAINT "Semester_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- UniCourse
CREATE TABLE "UniCourse" (
    "id"           TEXT NOT NULL,
    "tenantId"     TEXT NOT NULL,
    "departmentId" TEXT,
    "teacherId"    TEXT,
    "title"        TEXT NOT NULL,
    "slug"         TEXT NOT NULL,
    "description"  TEXT,
    "credits"      INTEGER NOT NULL DEFAULT 3,
    "maxCapacity"  INTEGER NOT NULL DEFAULT 30,
    "enrollCount"  INTEGER NOT NULL DEFAULT 0,
    "isPublished"  BOOLEAN NOT NULL DEFAULT false,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UniCourse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UniCourse_tenantId_slug_key" ON "UniCourse"("tenantId", "slug");
CREATE INDEX "UniCourse_tenantId_idx" ON "UniCourse"("tenantId");

ALTER TABLE "UniCourse"
    ADD CONSTRAINT "UniCourse_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UniCourse"
    ADD CONSTRAINT "UniCourse_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "UniCourseDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- UniversityEnrollment
CREATE TABLE "UniversityEnrollment" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "studentId"   TEXT NOT NULL,
    "courseId"    TEXT NOT NULL,
    "semesterId"  TEXT NOT NULL,
    "status"      TEXT NOT NULL DEFAULT 'ACTIVE',
    "grade"       DOUBLE PRECISION,
    "letterGrade" TEXT,
    "enrolledAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UniversityEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UniversityEnrollment_studentId_courseId_semesterId_key"
    ON "UniversityEnrollment"("studentId", "courseId", "semesterId");
CREATE INDEX "UniversityEnrollment_tenantId_idx" ON "UniversityEnrollment"("tenantId");

ALTER TABLE "UniversityEnrollment"
    ADD CONSTRAINT "UniversityEnrollment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UniversityEnrollment"
    ADD CONSTRAINT "UniversityEnrollment_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UniversityEnrollment"
    ADD CONSTRAINT "UniversityEnrollment_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "UniCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UniversityEnrollment"
    ADD CONSTRAINT "UniversityEnrollment_semesterId_fkey"
    FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
