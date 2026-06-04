import { PrismaClient, UserRole, TenantType, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Super Admin Tenant
  const superTenant = await prisma.tenant.upsert({
    where: { slug: 'platform' },
    update: {},
    create: {
      name: 'EduAI Platform',
      slug: 'platform',
      type: TenantType.CORPORATE,
      plan: SubscriptionPlan.ENTERPRISE,
      isActive: true,
    },
  });

  // Super Admin User
  const superAdmin = await prisma.user.upsert({
    where: { id: 'super-admin-id' },
    update: {},
    create: {
      id: 'super-admin-id',
      tenantId: superTenant.id,
      email: 'admin@eduai.io',
      emailVerified: true,
      passwordHash: await bcrypt.hash('Admin@123456', 12),
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: superAdmin.id },
    update: {},
    create: { userId: superAdmin.id, timezone: 'UTC', language: 'en' },
  });

  // Demo School Tenant
  const schoolTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-school' },
    update: {},
    create: {
      name: 'Demo Academy',
      slug: 'demo-school',
      type: TenantType.SCHOOL,
      plan: SubscriptionPlan.PROFESSIONAL,
      isActive: true,
    },
  });

  // Demo School subscription
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await prisma.subscription.upsert({
    where: { tenantId: schoolTenant.id },
    update: {},
    create: {
      tenantId: schoolTenant.id,
      plan: SubscriptionPlan.FREE_TRIAL,
      status: SubscriptionStatus.TRIALING,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
    },
  });

  // School Admin
  const schoolAdmin = await prisma.user.upsert({
    where: { id: 'school-admin-id' },
    update: {},
    create: {
      id: 'school-admin-id',
      tenantId: schoolTenant.id,
      email: 'admin@demo-school.edu',
      emailVerified: true,
      passwordHash: await bcrypt.hash('Admin@123456', 12),
      firstName: 'School',
      lastName: 'Admin',
      role: UserRole.SCHOOL_ADMIN,
      isActive: true,
    },
  });
  await prisma.userProfile.upsert({
    where: { userId: schoolAdmin.id },
    update: {},
    create: { userId: schoolAdmin.id, timezone: 'UTC', language: 'en' },
  });

  // Demo Teacher
  const teacherUser = await prisma.user.upsert({
    where: { id: 'teacher-demo-id' },
    update: {},
    create: {
      id: 'teacher-demo-id',
      tenantId: schoolTenant.id,
      email: 'teacher@demo-school.edu',
      emailVerified: true,
      passwordHash: await bcrypt.hash('Teacher@123456', 12),
      firstName: 'John',
      lastName: 'Smith',
      role: UserRole.TEACHER,
      isActive: true,
    },
  });
  await prisma.userProfile.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: { userId: teacherUser.id, bio: 'Experienced math and science teacher', timezone: 'America/New_York', language: 'en' },
  });
  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      subjects: ['Mathematics', 'Physics'],
      yearsExperience: 10,
      isVerified: true,
    },
  });

  // Demo Student
  const studentUser = await prisma.user.upsert({
    where: { id: 'student-demo-id' },
    update: {},
    create: {
      id: 'student-demo-id',
      tenantId: schoolTenant.id,
      email: 'student@demo-school.edu',
      emailVerified: true,
      passwordHash: await bcrypt.hash('Student@123456', 12),
      firstName: 'Jane',
      lastName: 'Doe',
      role: UserRole.STUDENT,
      isActive: true,
    },
  });
  await prisma.userProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: { userId: studentUser.id, timezone: 'America/New_York', language: 'en' },
  });
  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: { userId: studentUser.id, grade: '10' },
  });

  // Demo Courses
  const course1 = await prisma.course.upsert({
    where: { id: 'course-math-demo' },
    update: {},
    create: {
      id: 'course-math-demo',
      tenantId: schoolTenant.id,
      teacherId: teacher.id,
      title: 'Advanced Mathematics - Grade 10',
      slug: 'advanced-mathematics-grade-10',
      description: 'Comprehensive mathematics curriculum covering algebra, geometry, trigonometry, and calculus fundamentals.',
      category: 'Mathematics',
      tags: ['algebra', 'geometry', 'trigonometry', 'grade-10'],
      level: 'INTERMEDIATE',
      language: 'en',
      isPublished: true,
      totalLessons: 24,
    },
  });

  // Sections and Lessons
  const section1 = await prisma.courseSection.upsert({
    where: { id: 'section-algebra' },
    update: {},
    create: { id: 'section-algebra', courseId: course1.id, title: 'Algebra Fundamentals', position: 1 },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-1' },
    update: {},
    create: {
      id: 'lesson-1',
      sectionId: section1.id,
      title: 'Introduction to Variables and Expressions',
      contentType: 'VIDEO',
      duration: 1800,
      position: 1,
      isPreview: true,
    },
  });

  // Achievements
  const achievements = [
    { id: 'ach-first-login', name: 'First Steps', description: 'Logged in for the first time', type: 'milestone', points: 10, criteria: { type: 'login', threshold: 1 } },
    { id: 'ach-first-course', name: 'Scholar', description: 'Completed your first course', type: 'course', points: 50, criteria: { type: 'course_completion', threshold: 1 } },
    { id: 'ach-5-courses', name: 'Dedicated Learner', description: 'Completed 5 courses', type: 'course', points: 200, criteria: { type: 'course_completion', threshold: 5 } },
    { id: 'ach-100-points', name: 'Point Collector', description: 'Earned 100 points', type: 'points', points: 25, criteria: { type: 'points', threshold: 100 } },
    { id: 'ach-1000-points', name: 'High Achiever', description: 'Earned 1000 points', type: 'points', points: 100, criteria: { type: 'points', threshold: 1000 } },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { id: ach.id },
      update: {},
      create: ach,
    });
  }

  // Default Roles and Permissions
  const permissions = [
    { resource: 'users', action: 'read' }, { resource: 'users', action: 'write' }, { resource: 'users', action: 'delete' },
    { resource: 'courses', action: 'read' }, { resource: 'courses', action: 'write' }, { resource: 'courses', action: 'delete' },
    { resource: 'students', action: 'read' }, { resource: 'students', action: 'write' },
    { resource: 'analytics', action: 'read' },
    { resource: 'billing', action: 'read' }, { resource: 'billing', action: 'write' },
    { resource: 'ai', action: 'use' },
    { resource: 'live', action: 'host' }, { resource: 'live', action: 'join' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { resource_action: perm },
      update: {},
      create: perm,
    });
  }

  console.log('✅ Seed complete!');
  console.log('');
  console.log('👤 Super Admin: admin@eduai.io / Admin@123456');
  console.log('🏫 School Admin: admin@demo-school.edu / Admin@123456');
  console.log('👨‍🏫 Teacher: teacher@demo-school.edu / Teacher@123456');
  console.log('👩‍🎓 Student: student@demo-school.edu / Student@123456');
}

main().catch(console.error).finally(() => prisma.$disconnect());
