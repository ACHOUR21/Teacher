import {
  PrismaClient,
  UserRole,
  TenantType,
  SubscriptionPlan,
  SubscriptionStatus,
  CourseLevel,
  ContentType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── helpers ────────────────────────────────────────────────────────────────
const hash = (pw: string) => bcrypt.hash(pw, 10);

function randomAlpha(len = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ─── main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting comprehensive seed...');

  const pw = await hash('Demo123!');
  const now = new Date();
  const year = now.getFullYear();

  // ==========================================================================
  // 1. TENANTS
  // ==========================================================================
  console.log('  → Tenants...');

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

  const schoolTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-school' },
    update: {},
    create: {
      name: 'Demo School',
      slug: 'demo-school',
      type: TenantType.SCHOOL,
      plan: SubscriptionPlan.PROFESSIONAL,
      isActive: true,
    },
  });

  const uniTenant = await prisma.tenant.upsert({
    where: { slug: 'global-university' },
    update: {},
    create: {
      name: 'Global University',
      slug: 'global-university',
      type: TenantType.UNIVERSITY,
      plan: SubscriptionPlan.BUSINESS,
      isActive: true,
    },
  });

  const hubTenant = await prisma.tenant.upsert({
    where: { slug: 'tutor-hub' },
    update: {},
    create: {
      name: 'TutorHub',
      slug: 'tutor-hub',
      type: TenantType.CORPORATE,
      plan: SubscriptionPlan.STARTER,
      isActive: true,
    },
  });

  // ==========================================================================
  // 2. SUBSCRIPTIONS
  // ==========================================================================
  console.log('  → Subscriptions...');
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  for (const [tenant, plan] of [
    [schoolTenant, SubscriptionPlan.PROFESSIONAL],
    [uniTenant, SubscriptionPlan.BUSINESS],
    [hubTenant, SubscriptionPlan.STARTER],
  ] as const) {
    await prisma.subscription.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        plan: plan as SubscriptionPlan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  // ==========================================================================
  // 3. SUPER ADMIN
  // ==========================================================================
  console.log('  → Super admin...');
  const superAdmin = await prisma.user.upsert({
    where: { id: 'super-admin-id' },
    update: {},
    create: {
      id: 'super-admin-id',
      tenantId: superTenant.id,
      email: 'superadmin@eduai.com',
      emailVerified: true,
      passwordHash: pw,
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

  // ==========================================================================
  // 4. PER-TENANT USERS
  // ==========================================================================
  console.log('  → Users per tenant...');

  type TenantEntry = {
    tenant: typeof schoolTenant;
    slug: string;
    role: UserRole;
  };

  const tenantConfigs = [
    { tenant: schoolTenant, slug: 'demo-school' },
    { tenant: uniTenant, slug: 'global-university' },
    { tenant: hubTenant, slug: 'tutor-hub' },
  ];

  // We'll collect teachers and students for later use
  const teachersByTenant: Record<string, { user: any; teacher: any }[]> = {};
  const studentsByTenant: Record<string, { user: any; student: any }[]> = {};
  const adminByTenant: Record<string, any> = {};

  for (const { tenant, slug } of tenantConfigs) {
    teachersByTenant[tenant.id] = [];
    studentsByTenant[tenant.id] = [];

    // Admin
    const adminUser = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: `admin@${slug}.com` } },
      update: {},
      create: {
        tenantId: tenant.id,
        email: `admin@${slug}.com`,
        emailVerified: true,
        passwordHash: pw,
        firstName: 'Admin',
        lastName: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    await prisma.userProfile.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: { userId: adminUser.id, timezone: 'UTC', language: 'en' },
    });
    adminByTenant[tenant.id] = adminUser;

    // Teachers
    const teacherNames = [
      { first: 'Alice', last: 'Johnson' },
      { first: 'Bob', last: 'Martinez' },
    ];
    for (let i = 0; i < 2; i++) {
      const tEmail = `teacher${i + 1}@${slug}.com`;
      const tUser = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: tEmail } },
        update: {},
        create: {
          tenantId: tenant.id,
          email: tEmail,
          emailVerified: true,
          passwordHash: pw,
          firstName: teacherNames[i].first,
          lastName: teacherNames[i].last,
          role: UserRole.TEACHER,
          isActive: true,
        },
      });
      await prisma.userProfile.upsert({
        where: { userId: tUser.id },
        update: {},
        create: {
          userId: tUser.id,
          bio: `Experienced educator specializing in ${i === 0 ? 'STEM subjects' : 'Liberal Arts and Business'}`,
          timezone: 'America/New_York',
          language: 'en',
        },
      });
      const teacher = await prisma.teacher.upsert({
        where: { userId: tUser.id },
        update: {},
        create: {
          userId: tUser.id,
          subjects: i === 0 ? ['Mathematics', 'Science', 'Technology'] : ['Business', 'Language', 'Arts'],
          bio: `${teacherNames[i].first} has over ${8 + i * 3} years of teaching experience.`,
          yearsExperience: 8 + i * 3,
          rating: 4.5 + i * 0.2,
          isVerified: true,
          qualifications: [
            { degree: 'M.Ed.', institution: 'State University', year: 2010 + i },
          ],
        },
      });
      teachersByTenant[tenant.id].push({ user: tUser, teacher });
    }

    // Students
    const studentNames = [
      { first: 'Emma', last: 'Wilson' },
      { first: 'Liam', last: 'Brown' },
      { first: 'Olivia', last: 'Davis' },
      { first: 'Noah', last: 'Garcia' },
      { first: 'Ava', last: 'Taylor' },
    ];
    for (let i = 0; i < 5; i++) {
      const sEmail = `student${i + 1}@${slug}.com`;
      const sUser = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: sEmail } },
        update: {},
        create: {
          tenantId: tenant.id,
          email: sEmail,
          emailVerified: true,
          passwordHash: pw,
          firstName: studentNames[i].first,
          lastName: studentNames[i].last,
          role: UserRole.STUDENT,
          isActive: true,
        },
      });
      await prisma.userProfile.upsert({
        where: { userId: sUser.id },
        update: {},
        create: { userId: sUser.id, timezone: 'America/Chicago', language: 'en' },
      });
      const student = await prisma.student.upsert({
        where: { userId: sUser.id },
        update: {},
        create: {
          userId: sUser.id,
          grade: `${10 + i}`,
          gpa: 2.8 + i * 0.3,
        },
      });
      studentsByTenant[tenant.id].push({ user: sUser, student });
    }

    // Parent
    const pUser = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: `parent1@${slug}.com` } },
      update: {},
      create: {
        tenantId: tenant.id,
        email: `parent1@${slug}.com`,
        emailVerified: true,
        passwordHash: pw,
        firstName: 'Patricia',
        lastName: 'Parent',
        role: UserRole.PARENT,
        isActive: true,
      },
    });
    await prisma.userProfile.upsert({
      where: { userId: pUser.id },
      update: {},
      create: { userId: pUser.id, timezone: 'UTC', language: 'en' },
    });
    const parent = await prisma.parent.upsert({
      where: { userId: pUser.id },
      update: {},
      create: { userId: pUser.id },
    });
    // Link first student to parent
    const firstStudent = studentsByTenant[tenant.id][0];
    if (firstStudent) {
      await prisma.parentStudent.upsert({
        where: { parentId_studentId: { parentId: parent.id, studentId: firstStudent.student.id } },
        update: {},
        create: { parentId: parent.id, studentId: firstStudent.student.id, relationship: 'parent' },
      });
    }
  }

  // Keep backward compat: upsert original demo users
  const teacherDemoUser = await prisma.user.upsert({
    where: { id: 'teacher-demo-id' },
    update: {},
    create: {
      id: 'teacher-demo-id',
      tenantId: schoolTenant.id,
      email: 'teacher@demo-school.edu',
      emailVerified: true,
      passwordHash: pw,
      firstName: 'John',
      lastName: 'Smith',
      role: UserRole.TEACHER,
      isActive: true,
    },
  });
  await prisma.userProfile.upsert({
    where: { userId: teacherDemoUser.id },
    update: {},
    create: { userId: teacherDemoUser.id, bio: 'Experienced math and science teacher', timezone: 'America/New_York', language: 'en' },
  });
  const teacherDemo = await prisma.teacher.upsert({
    where: { userId: teacherDemoUser.id },
    update: {},
    create: {
      userId: teacherDemoUser.id,
      subjects: ['Mathematics', 'Physics'],
      yearsExperience: 10,
      rating: 4.8,
      isVerified: true,
      qualifications: [{ degree: 'M.Sc. Mathematics', institution: 'MIT', year: 2008 }],
    },
  });

  const studentDemoUser = await prisma.user.upsert({
    where: { id: 'student-demo-id' },
    update: {},
    create: {
      id: 'student-demo-id',
      tenantId: schoolTenant.id,
      email: 'student@demo-school.edu',
      emailVerified: true,
      passwordHash: pw,
      firstName: 'Jane',
      lastName: 'Doe',
      role: UserRole.STUDENT,
      isActive: true,
    },
  });
  await prisma.userProfile.upsert({
    where: { userId: studentDemoUser.id },
    update: {},
    create: { userId: studentDemoUser.id, timezone: 'America/New_York', language: 'en' },
  });
  const studentDemo = await prisma.student.upsert({
    where: { userId: studentDemoUser.id },
    update: {},
    create: { userId: studentDemoUser.id, grade: '10', gpa: 3.7 },
  });

  await prisma.user.upsert({
    where: { id: 'school-admin-id' },
    update: {},
    create: {
      id: 'school-admin-id',
      tenantId: schoolTenant.id,
      email: 'admin@demo-school.edu',
      emailVerified: true,
      passwordHash: pw,
      firstName: 'School',
      lastName: 'Admin',
      role: UserRole.SCHOOL_ADMIN,
      isActive: true,
    },
  });

  // ==========================================================================
  // 5. COURSES  (6 per tenant)
  // ==========================================================================
  console.log('  → Courses...');

  type CourseSpec = {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    level: CourseLevel;
    price: number;
    rating: number;
    enrollCount: number;
    isFeatured: boolean;
    tags: string[];
    lessons: { title: string; contentType: ContentType; duration: number; description?: string }[];
  };

  const schoolCourseSpecs: CourseSpec[] = [
    {
      id: 'course-math-demo',
      title: 'Advanced Mathematics — Grade 10',
      slug: 'advanced-mathematics-grade-10',
      description: 'Comprehensive mathematics curriculum covering algebra, geometry, trigonometry, and calculus fundamentals. Perfect for Grade 10 students preparing for standardized tests.',
      category: 'Technology',
      level: CourseLevel.INTERMEDIATE,
      price: 0,
      rating: 4.8,
      enrollCount: 1250,
      isFeatured: true,
      tags: ['algebra', 'geometry', 'trigonometry', 'grade-10'],
      lessons: [
        { title: 'Introduction to Variables and Expressions', contentType: ContentType.VIDEO, duration: 1800, description: 'Learn the basics of algebraic variables.' },
        { title: 'Solving Linear Equations', contentType: ContentType.VIDEO, duration: 2100 },
        { title: 'Graphing Linear Functions', contentType: ContentType.VIDEO, duration: 1500 },
        { title: 'Quadratic Equations', contentType: ContentType.VIDEO, duration: 2400 },
        { title: 'Practice Problems Set 1', contentType: ContentType.DOCUMENT, duration: 3600 },
      ],
    },
    {
      id: 'course-science-demo',
      title: 'Physics for Beginners — Grade 10',
      slug: 'physics-beginners-grade-10',
      description: 'An accessible introduction to classical mechanics, thermodynamics, and wave physics. Packed with real-world examples and lab exercises to make concepts tangible.',
      category: 'Science',
      level: CourseLevel.BEGINNER,
      price: 49.99,
      rating: 4.6,
      enrollCount: 875,
      isFeatured: false,
      tags: ['physics', 'mechanics', 'thermodynamics', 'grade-10'],
      lessons: [
        { title: "Newton's Laws of Motion", contentType: ContentType.VIDEO, duration: 2100 },
        { title: 'Work, Energy and Power', contentType: ContentType.VIDEO, duration: 1800 },
        { title: 'Temperature and Heat Transfer', contentType: ContentType.DOCUMENT, duration: 900 },
        { title: 'Wave Properties and Sound', contentType: ContentType.VIDEO, duration: 1500 },
        { title: 'Lab: Projectile Motion', contentType: ContentType.ASSIGNMENT, duration: 3600 },
      ],
    },
    {
      id: 'course-coding-demo',
      title: 'Introduction to Python Programming',
      slug: 'introduction-python-programming',
      description: 'Learn Python from scratch — variables, control flow, functions, OOP, and data structures. Build three real projects by the end of this course.',
      category: 'Technology',
      level: CourseLevel.BEGINNER,
      price: 0,
      rating: 4.9,
      enrollCount: 2000,
      isFeatured: true,
      tags: ['python', 'programming', 'coding', 'beginner'],
      lessons: [
        { title: 'Installing Python & VS Code', contentType: ContentType.VIDEO, duration: 900 },
        { title: 'Variables, Data Types and Operators', contentType: ContentType.VIDEO, duration: 1500 },
        { title: 'Control Flow: if, for, while', contentType: ContentType.VIDEO, duration: 1800 },
        { title: 'Functions and Modules', contentType: ContentType.VIDEO, duration: 2100 },
        { title: 'Classes and Objects (OOP)', contentType: ContentType.VIDEO, duration: 2400 },
        { title: 'Mini-Project: Number Guessing Game', contentType: ContentType.ASSIGNMENT, duration: 5400 },
      ],
    },
    {
      id: 'course-english-demo',
      title: 'English Literature & Writing Skills',
      slug: 'english-literature-writing-skills',
      description: 'Develop advanced reading comprehension, essay writing, and literary analysis skills. We study classic and contemporary works from diverse global authors.',
      category: 'Language',
      level: CourseLevel.INTERMEDIATE,
      price: 29.99,
      rating: 4.5,
      enrollCount: 620,
      isFeatured: false,
      tags: ['english', 'writing', 'literature', 'grammar'],
      lessons: [
        { title: 'Essay Structure and Thesis Statements', contentType: ContentType.VIDEO, duration: 1200 },
        { title: 'Analysing Prose Fiction', contentType: ContentType.DOCUMENT, duration: 900 },
        { title: 'Poetry: Form, Meter, and Imagery', contentType: ContentType.VIDEO, duration: 1500 },
        { title: 'Research Paper Writing', contentType: ContentType.VIDEO, duration: 2700 },
        { title: 'Writing Workshop: Peer Review', contentType: ContentType.ASSIGNMENT, duration: 3600 },
      ],
    },
    {
      id: 'course-biology-demo',
      title: 'Biology: Life Sciences',
      slug: 'biology-life-sciences',
      description: 'Explore cell biology, genetics, evolution, ecology, and human anatomy. Includes interactive simulations and case studies drawn from cutting-edge research.',
      category: 'Science',
      level: CourseLevel.INTERMEDIATE,
      price: 59.99,
      rating: 4.7,
      enrollCount: 940,
      isFeatured: false,
      tags: ['biology', 'genetics', 'ecology', 'anatomy'],
      lessons: [
        { title: 'Cell Structure and Function', contentType: ContentType.VIDEO, duration: 1800 },
        { title: 'DNA, RNA and Protein Synthesis', contentType: ContentType.VIDEO, duration: 2400 },
        { title: 'Mendelian Genetics', contentType: ContentType.VIDEO, duration: 2100 },
        { title: 'Evolution and Natural Selection', contentType: ContentType.VIDEO, duration: 1500 },
        { title: 'Ecosystem Dynamics', contentType: ContentType.DOCUMENT, duration: 1200 },
      ],
    },
    {
      id: 'course-health-demo',
      title: 'Health & Wellness for Teens',
      slug: 'health-wellness-teens',
      description: 'A holistic guide to physical health, mental wellness, nutrition, and fitness for teenagers. Covers stress management, sleep hygiene, and healthy relationships.',
      category: 'Health',
      level: CourseLevel.BEGINNER,
      price: 19.99,
      rating: 4.4,
      enrollCount: 455,
      isFeatured: false,
      tags: ['health', 'wellness', 'mental-health', 'fitness'],
      lessons: [
        { title: 'Understanding the Teenage Brain', contentType: ContentType.VIDEO, duration: 900 },
        { title: 'Nutrition: Building a Balanced Diet', contentType: ContentType.VIDEO, duration: 1200 },
        { title: 'Mental Health and Stress Management', contentType: ContentType.VIDEO, duration: 1800 },
        { title: 'Exercise Science Basics', contentType: ContentType.VIDEO, duration: 1500 },
        { title: 'Sleep Hygiene and Recovery', contentType: ContentType.DOCUMENT, duration: 600 },
      ],
    },
  ];

  const uniCourseSpecs: CourseSpec[] = [
    {
      id: 'ucourse-cs101',
      title: 'Computer Science 101',
      slug: 'computer-science-101',
      description: 'Introduction to algorithms, data structures, and computational thinking. Hands-on labs in Python and JavaScript explore sorting, searching, and complexity analysis.',
      category: 'Technology',
      level: CourseLevel.BEGINNER,
      price: 0,
      rating: 4.8,
      enrollCount: 1800,
      isFeatured: true,
      tags: ['algorithms', 'data-structures', 'programming', 'cs'],
      lessons: [
        { title: 'What is Computation?', contentType: ContentType.VIDEO, duration: 1200 },
        { title: 'Arrays and Linked Lists', contentType: ContentType.VIDEO, duration: 2400 },
        { title: 'Recursion and Stacks', contentType: ContentType.VIDEO, duration: 1800 },
        { title: 'Sorting Algorithms', contentType: ContentType.VIDEO, duration: 2100 },
        { title: 'Big-O Complexity', contentType: ContentType.DOCUMENT, duration: 900 },
        { title: 'Lab: Implement a Binary Search Tree', contentType: ContentType.ASSIGNMENT, duration: 5400 },
      ],
    },
    {
      id: 'ucourse-business',
      title: 'Business Strategy & Management',
      slug: 'business-strategy-management',
      description: 'Covers competitive strategy frameworks (Porter, Blue Ocean), organizational behavior, leadership models, and real-world case studies from Fortune 500 companies.',
      category: 'Business',
      level: CourseLevel.INTERMEDIATE,
      price: 99.99,
      rating: 4.6,
      enrollCount: 920,
      isFeatured: false,
      tags: ['business', 'strategy', 'management', 'leadership'],
      lessons: [
        { title: 'Porter\'s Five Forces', contentType: ContentType.VIDEO, duration: 1500 },
        { title: 'SWOT Analysis Workshop', contentType: ContentType.ASSIGNMENT, duration: 3600 },
        { title: 'Organizational Behavior', contentType: ContentType.VIDEO, duration: 1800 },
        { title: 'Financial Literacy for Managers', contentType: ContentType.VIDEO, duration: 2100 },
        { title: 'Case Study: Apple\'s Turnaround', contentType: ContentType.DOCUMENT, duration: 1200 },
      ],
    },
    {
      id: 'ucourse-datascience',
      title: 'Data Science Fundamentals',
      slug: 'data-science-fundamentals',
      description: 'From raw data to actionable insights: covers statistics, probability, pandas, data visualization, and an introduction to machine learning with scikit-learn.',
      category: 'Technology',
      level: CourseLevel.INTERMEDIATE,
      price: 149.99,
      rating: 4.9,
      enrollCount: 1650,
      isFeatured: true,
      tags: ['data-science', 'python', 'machine-learning', 'statistics'],
      lessons: [
        { title: 'Statistics and Probability Review', contentType: ContentType.VIDEO, duration: 2400 },
        { title: 'Data Wrangling with Pandas', contentType: ContentType.VIDEO, duration: 2700 },
        { title: 'Data Visualization with Matplotlib', contentType: ContentType.VIDEO, duration: 1800 },
        { title: 'Intro to Machine Learning', contentType: ContentType.VIDEO, duration: 3000 },
        { title: 'Regression and Classification', contentType: ContentType.VIDEO, duration: 2100 },
        { title: 'Capstone: Predict Student Outcomes', contentType: ContentType.ASSIGNMENT, duration: 7200 },
      ],
    },
    {
      id: 'ucourse-arts',
      title: 'Creative Arts & Design Principles',
      slug: 'creative-arts-design-principles',
      description: 'Discover the foundations of visual design: color theory, composition, typography, and digital illustration. Develop your portfolio through guided creative projects.',
      category: 'Arts',
      level: CourseLevel.BEGINNER,
      price: 79.99,
      rating: 4.5,
      enrollCount: 530,
      isFeatured: false,
      tags: ['design', 'arts', 'color-theory', 'typography'],
      lessons: [
        { title: 'Color Theory: The Basics', contentType: ContentType.VIDEO, duration: 1200 },
        { title: 'Composition and Visual Hierarchy', contentType: ContentType.VIDEO, duration: 1500 },
        { title: 'Typography Fundamentals', contentType: ContentType.VIDEO, duration: 900 },
        { title: 'Digital Illustration with Figma', contentType: ContentType.VIDEO, duration: 3600 },
        { title: 'Portfolio Project: Brand Identity', contentType: ContentType.ASSIGNMENT, duration: 7200 },
      ],
    },
    {
      id: 'ucourse-language',
      title: 'Academic English for University',
      slug: 'academic-english-university',
      description: 'Master the language skills required for university-level study: academic writing, critical reading, seminar participation, and research report presentation.',
      category: 'Language',
      level: CourseLevel.INTERMEDIATE,
      price: 69.99,
      rating: 4.4,
      enrollCount: 780,
      isFeatured: false,
      tags: ['english', 'academic', 'writing', 'university'],
      lessons: [
        { title: 'Reading Academic Texts Critically', contentType: ContentType.DOCUMENT, duration: 1200 },
        { title: 'Structuring a University Essay', contentType: ContentType.VIDEO, duration: 1800 },
        { title: 'Research Skills and Citation', contentType: ContentType.VIDEO, duration: 1500 },
        { title: 'Seminar Presentation Skills', contentType: ContentType.VIDEO, duration: 1200 },
        { title: 'Peer-Review Writing Workshop', contentType: ContentType.ASSIGNMENT, duration: 3600 },
      ],
    },
    {
      id: 'ucourse-health',
      title: 'Public Health & Epidemiology',
      slug: 'public-health-epidemiology',
      description: 'Understand how diseases spread and are controlled at population level. Topics include epidemiological study designs, disease surveillance, and health policy analysis.',
      category: 'Health',
      level: CourseLevel.ADVANCED,
      price: 129.99,
      rating: 4.7,
      enrollCount: 410,
      isFeatured: false,
      tags: ['public-health', 'epidemiology', 'health-policy'],
      lessons: [
        { title: 'Epidemiology: Core Concepts', contentType: ContentType.VIDEO, duration: 1800 },
        { title: 'Study Designs: RCT, Cohort, Case-Control', contentType: ContentType.VIDEO, duration: 2100 },
        { title: 'Disease Surveillance Systems', contentType: ContentType.DOCUMENT, duration: 900 },
        { title: 'Health Policy and Intervention', contentType: ContentType.VIDEO, duration: 1500 },
        { title: 'Case Study: COVID-19 Pandemic Response', contentType: ContentType.DOCUMENT, duration: 1800 },
        { title: 'Research Assignment: Local Health Issue', contentType: ContentType.ASSIGNMENT, duration: 7200 },
      ],
    },
  ];

  const hubCourseSpecs: CourseSpec[] = [
    {
      id: 'hub-course-sat',
      title: 'SAT Prep: Math Mastery',
      slug: 'sat-prep-math-mastery',
      description: 'Comprehensive SAT Math preparation covering algebra, problem solving, data analysis, and advanced math. Includes full practice tests with detailed answer explanations.',
      category: 'Technology',
      level: CourseLevel.INTERMEDIATE,
      price: 99.99,
      rating: 4.8,
      enrollCount: 1100,
      isFeatured: true,
      tags: ['SAT', 'test-prep', 'math', 'standardized-test'],
      lessons: [
        { title: 'SAT Math Overview and Strategy', contentType: ContentType.VIDEO, duration: 1200 },
        { title: 'Heart of Algebra: Linear Equations', contentType: ContentType.VIDEO, duration: 2400 },
        { title: 'Problem Solving & Data Analysis', contentType: ContentType.VIDEO, duration: 2100 },
        { title: 'Advanced Math: Quadratics & Functions', contentType: ContentType.VIDEO, duration: 2700 },
        { title: 'Full Practice Test 1', contentType: ContentType.QUIZ, duration: 10800 },
        { title: 'Full Practice Test 2', contentType: ContentType.QUIZ, duration: 10800 },
      ],
    },
    {
      id: 'hub-course-coding',
      title: 'Web Development Bootcamp',
      slug: 'web-development-bootcamp',
      description: 'Learn to build modern web applications from zero using HTML, CSS, JavaScript, React, and Node.js. Graduate with a portfolio of three deployed full-stack projects.',
      category: 'Technology',
      level: CourseLevel.BEGINNER,
      price: 199.99,
      rating: 4.9,
      enrollCount: 1950,
      isFeatured: true,
      tags: ['web-dev', 'html', 'css', 'javascript', 'react', 'nodejs'],
      lessons: [
        { title: 'HTML5 Structure and Semantics', contentType: ContentType.VIDEO, duration: 1800 },
        { title: 'CSS3 Layouts and Flexbox', contentType: ContentType.VIDEO, duration: 2400 },
        { title: 'JavaScript Fundamentals', contentType: ContentType.VIDEO, duration: 3600 },
        { title: 'React: Components and State', contentType: ContentType.VIDEO, duration: 3000 },
        { title: 'Node.js & Express Backend', contentType: ContentType.VIDEO, duration: 2700 },
        { title: 'Capstone: Full-Stack Blog App', contentType: ContentType.ASSIGNMENT, duration: 14400 },
      ],
    },
    {
      id: 'hub-course-french',
      title: 'French Language: A1 to B1',
      slug: 'french-language-a1-b1',
      description: 'A structured French course taking you from complete beginner to intermediate (B1 CEFR). Focuses on speaking, listening, reading, and writing with native audio content.',
      category: 'Language',
      level: CourseLevel.BEGINNER,
      price: 59.99,
      rating: 4.5,
      enrollCount: 680,
      isFeatured: false,
      tags: ['french', 'language', 'CEFR', 'beginner'],
      lessons: [
        { title: 'Greetings and Introductions', contentType: ContentType.VIDEO, duration: 900 },
        { title: 'Numbers, Dates and Time', contentType: ContentType.VIDEO, duration: 1200 },
        { title: 'Everyday Conversations', contentType: ContentType.VIDEO, duration: 1500 },
        { title: 'Grammar: Verbs and Conjugation', contentType: ContentType.VIDEO, duration: 2100 },
        { title: 'Speaking Practice: Audio Drills', contentType: ContentType.AUDIO, duration: 2400 },
      ],
    },
    {
      id: 'hub-course-entrepreneurship',
      title: 'Entrepreneurship & Startup Thinking',
      slug: 'entrepreneurship-startup-thinking',
      description: 'From idea validation to MVP: learn lean startup methodology, customer discovery, pitch deck creation, and the fundamentals of fundraising for early-stage startups.',
      category: 'Business',
      level: CourseLevel.INTERMEDIATE,
      price: 89.99,
      rating: 4.6,
      enrollCount: 730,
      isFeatured: false,
      tags: ['entrepreneurship', 'startup', 'business', 'innovation'],
      lessons: [
        { title: 'The Lean Startup Methodology', contentType: ContentType.VIDEO, duration: 1800 },
        { title: 'Customer Discovery Interviews', contentType: ContentType.VIDEO, duration: 1500 },
        { title: 'Building an MVP', contentType: ContentType.VIDEO, duration: 2100 },
        { title: 'Pitch Deck Workshop', contentType: ContentType.ASSIGNMENT, duration: 5400 },
        { title: 'Introduction to Startup Finance', contentType: ContentType.VIDEO, duration: 1200 },
      ],
    },
    {
      id: 'hub-course-mindfulness',
      title: 'Mindfulness and Study Skills',
      slug: 'mindfulness-study-skills',
      description: 'Combine evidence-based mindfulness techniques with effective study strategies: active recall, spaced repetition, the Pomodoro method, and exam anxiety management.',
      category: 'Health',
      level: CourseLevel.BEGINNER,
      price: 29.99,
      rating: 4.7,
      enrollCount: 550,
      isFeatured: false,
      tags: ['mindfulness', 'study-skills', 'productivity', 'wellness'],
      lessons: [
        { title: 'Introduction to Mindfulness', contentType: ContentType.VIDEO, duration: 900 },
        { title: 'Active Recall and Spaced Repetition', contentType: ContentType.VIDEO, duration: 1500 },
        { title: 'The Pomodoro Technique', contentType: ContentType.VIDEO, duration: 600 },
        { title: 'Exam Anxiety and Stress Management', contentType: ContentType.VIDEO, duration: 1200 },
        { title: 'Building a Study Plan', contentType: ContentType.DOCUMENT, duration: 900 },
      ],
    },
    {
      id: 'hub-course-music',
      title: 'Music Theory Foundations',
      slug: 'music-theory-foundations',
      description: 'Understand how music works: scales, intervals, chords, rhythm, and notation. Suitable for all instruments and producers looking to understand the theory behind the sound.',
      category: 'Arts',
      level: CourseLevel.BEGINNER,
      price: 39.99,
      rating: 4.3,
      enrollCount: 380,
      isFeatured: false,
      tags: ['music', 'theory', 'chords', 'notation'],
      lessons: [
        { title: 'Reading Music Notation', contentType: ContentType.VIDEO, duration: 1200 },
        { title: 'Major and Minor Scales', contentType: ContentType.VIDEO, duration: 1500 },
        { title: 'Intervals and Chords', contentType: ContentType.VIDEO, duration: 1800 },
        { title: 'Rhythm and Time Signatures', contentType: ContentType.VIDEO, duration: 900 },
        { title: 'Composing a Simple Melody', contentType: ContentType.ASSIGNMENT, duration: 3600 },
      ],
    },
  ];

  const allTenantCourses: { tenant: typeof schoolTenant; specs: CourseSpec[] }[] = [
    { tenant: schoolTenant, specs: schoolCourseSpecs },
    { tenant: uniTenant, specs: uniCourseSpecs },
    { tenant: hubTenant, specs: hubCourseSpecs },
  ];

  // Map courseId -> created course, section, and lesson ids
  const courseMap: Record<string, { course: any; sectionId: string; lessonIds: string[] }> = {};

  for (const { tenant, specs } of allTenantCourses) {
    const teachers = teachersByTenant[tenant.id];
    // Fall back to the demo teacher for school tenant
    const primaryTeacherId =
      teachers.length > 0
        ? teachers[0].teacher.id
        : tenant.id === schoolTenant.id
        ? teacherDemo.id
        : undefined;

    for (let ci = 0; ci < specs.length; ci++) {
      const spec = specs[ci];
      const teacherId = teachers.length > 0 ? teachers[ci % teachers.length].teacher.id : primaryTeacherId;

      const course = await prisma.course.upsert({
        where: { id: spec.id },
        update: {
          rating: spec.rating,
          enrollCount: spec.enrollCount,
          isPublished: true,
        },
        create: {
          id: spec.id,
          tenantId: tenant.id,
          teacherId: teacherId,
          title: spec.title,
          slug: spec.slug,
          description: spec.description,
          category: spec.category,
          tags: spec.tags,
          level: spec.level,
          price: spec.price,
          isPublished: true,
          isFeatured: spec.isFeatured,
          totalLessons: spec.lessons.length,
          totalDuration: spec.lessons.reduce((s, l) => s + l.duration, 0),
          rating: spec.rating,
          enrollCount: spec.enrollCount,
          language: 'en',
        },
      });

      // One section per course
      const sectionId = `${spec.id}-section-1`;
      const section = await prisma.courseSection.upsert({
        where: { id: sectionId },
        update: {},
        create: { id: sectionId, courseId: course.id, title: 'Main Content', position: 1 },
      });

      const lessonIds: string[] = [];
      for (let li = 0; li < spec.lessons.length; li++) {
        const lSpec = spec.lessons[li];
        const lessonId = `${spec.id}-lesson-${li + 1}`;
        await prisma.lesson.upsert({
          where: { id: lessonId },
          update: {},
          create: {
            id: lessonId,
            sectionId: section.id,
            title: lSpec.title,
            description: lSpec.description,
            contentType: lSpec.contentType,
            duration: lSpec.duration,
            position: li + 1,
            isPreview: li === 0,
          },
        });
        lessonIds.push(lessonId);
      }

      courseMap[spec.id] = { course, sectionId: section.id, lessonIds };
    }
  }

  // ==========================================================================
  // 6. ENROLLMENTS & PROGRESS
  // ==========================================================================
  console.log('  → Enrollments and progress...');

  // Map tenant to its course ids
  const coursesForTenant: Record<string, string[]> = {
    [schoolTenant.id]: schoolCourseSpecs.map(s => s.id),
    [uniTenant.id]: uniCourseSpecs.map(s => s.id),
    [hubTenant.id]: hubCourseSpecs.map(s => s.id),
  };

  // Also track all students across tenants for later steps
  const allStudentsByTenant: Record<string, { user: any; student: any }[]> = {};

  for (const { tenant } of allTenantCourses) {
    const students = studentsByTenant[tenant.id];
    allStudentsByTenant[tenant.id] = students;

    const tCourseIds = coursesForTenant[tenant.id];

    for (let si = 0; si < students.length; si++) {
      const { student } = students[si];
      // Each student enrolls in 3-4 courses (vary by student index)
      const numCourses = 3 + (si % 2);
      const enrolledIds = tCourseIds.slice(si % tCourseIds.length, si % tCourseIds.length + numCourses);
      // wrap around if needed
      const finalIds = enrolledIds.length < numCourses
        ? [...enrolledIds, ...tCourseIds.slice(0, numCourses - enrolledIds.length)]
        : enrolledIds;

      for (let ci = 0; ci < finalIds.length; ci++) {
        const cid = finalIds[ci];
        const cm = courseMap[cid];
        if (!cm) continue;

        // Progress varies: first course = 100%, second = ~65%, others = 20-40%
        const progressPercent = ci === 0 ? 100 : ci === 1 ? 65 : 20 + si * 5;
        const completedCount = Math.floor((progressPercent / 100) * cm.lessonIds.length);
        const completedLessons = cm.lessonIds.slice(0, completedCount);
        const isCompleted = progressPercent >= 100;

        await prisma.courseProgress.upsert({
          where: { studentId_courseId: { studentId: student.id, courseId: cm.course.id } },
          update: { progressPercent, completedLessons, completedAt: isCompleted ? new Date() : null },
          create: {
            studentId: student.id,
            courseId: cm.course.id,
            completedLessons,
            progressPercent,
            lastAccessedAt: new Date(),
            completedAt: isCompleted ? new Date() : null,
          },
        });
      }
    }
  }

  // Also add the demo student to school courses
  const demoCourseIds = ['course-math-demo', 'course-coding-demo'];
  for (const cid of demoCourseIds) {
    const cm = courseMap[cid];
    if (!cm) continue;
    const progressPercent = cid === 'course-math-demo' ? 100 : 50;
    const completedCount = Math.floor((progressPercent / 100) * cm.lessonIds.length);
    const completedLessons = cm.lessonIds.slice(0, completedCount);
    await prisma.courseProgress.upsert({
      where: { studentId_courseId: { studentId: studentDemo.id, courseId: cm.course.id } },
      update: { progressPercent, completedLessons, completedAt: progressPercent === 100 ? new Date() : null },
      create: {
        studentId: studentDemo.id,
        courseId: cm.course.id,
        completedLessons,
        progressPercent,
        lastAccessedAt: new Date(),
        completedAt: progressPercent === 100 ? new Date() : null,
      },
    });
  }

  // ==========================================================================
  // 7. CERTIFICATE TEMPLATES & ISSUED CERTIFICATES
  // ==========================================================================
  console.log('  → Certificates...');

  const certDesign = {
    background: '#ffffff',
    border: { color: '#1e40af', width: 8, style: 'solid' },
    logo: { position: 'top-center', size: 80 },
    title: { text: 'Certificate of Completion', font: 'serif', size: 36, color: '#1e40af', align: 'center' },
    recipientName: { font: 'serif', size: 28, color: '#111827', align: 'center', style: 'italic' },
  };
  const certFields = {
    recipientName: { label: 'Student Name', type: 'text', required: true },
    courseName: { label: 'Course Name', type: 'text', required: true },
    completionDate: { label: 'Completion Date', type: 'date', required: true },
  };

  // Create a cert template per course that has completed students
  for (const { tenant, specs } of allTenantCourses) {
    const students = allStudentsByTenant[tenant.id] || [];
    for (const spec of specs) {
      const cm = courseMap[spec.id];
      if (!cm) continue;

      const templateId = `cert-template-${spec.id}`;
      await prisma.certificateTemplate.upsert({
        where: { id: templateId },
        update: {},
        create: {
          id: templateId,
          tenantId: tenant.id,
          courseId: cm.course.id,
          name: `${spec.title} — Completion Certificate`,
          design: certDesign,
          fields: certFields,
        },
      });

      // Issue to any student who has 100% progress
      for (let si = 0; si < students.length; si++) {
        const { student, user } = students[si];
        const tCourseIds = coursesForTenant[tenant.id];
        const numCourses = 3 + (si % 2);
        const enrolledIds = tCourseIds.slice(si % tCourseIds.length, si % tCourseIds.length + numCourses);
        const finalIds = enrolledIds.length < numCourses
          ? [...enrolledIds, ...tCourseIds.slice(0, numCourses - enrolledIds.length)]
          : enrolledIds;

        if (finalIds[0] === spec.id) {
          // This student has 100% on this course
          const certId = `cert-${spec.id}-student-${si}`;
          await prisma.issuedCertificate.upsert({
            where: { id: certId },
            update: {},
            create: {
              id: certId,
              templateId,
              studentId: student.id,
              userId: user.id,
              metadata: {
                certificateNumber: `CERT-${year}-${randomAlpha(8)}`,
                courseName: spec.title,
                completionDate: new Date().toISOString(),
              },
            },
          });
        }
      }
    }
  }

  // Demo student cert
  const demoCertTemplate = 'cert-template-course-math-demo';
  await prisma.issuedCertificate.upsert({
    where: { id: 'cert-demo-math' },
    update: {},
    create: {
      id: 'cert-demo-math',
      templateId: demoCertTemplate,
      studentId: studentDemo.id,
      userId: studentDemoUser.id,
      metadata: {
        certificateNumber: `CERT-${year}-${randomAlpha(8)}`,
        courseName: 'Advanced Mathematics — Grade 10',
        completionDate: new Date().toISOString(),
      },
    },
  });

  // ==========================================================================
  // 8. GAMIFICATION
  // ==========================================================================
  console.log('  → Gamification...');

  // Achievements
  const achievements = [
    { id: 'ach-first-login', name: 'First Steps', description: 'Logged in for the first time', type: 'milestone', points: 10, criteria: { type: 'login', threshold: 1 } },
    { id: 'ach-first-course', name: 'Scholar', description: 'Completed your first course', type: 'course', points: 50, criteria: { type: 'course_completion', threshold: 1 } },
    { id: 'ach-5-courses', name: 'Dedicated Learner', description: 'Completed 5 courses', type: 'course', points: 200, criteria: { type: 'course_completion', threshold: 5 } },
    { id: 'ach-100-points', name: 'Point Collector', description: 'Earned 100 points', type: 'points', points: 25, criteria: { type: 'points', threshold: 100 } },
    { id: 'ach-1000-points', name: 'High Achiever', description: 'Earned 1000 points', type: 'points', points: 100, criteria: { type: 'points', threshold: 1000 } },
    { id: 'badge-perfect-score', name: 'Perfect Score', description: 'Achieved 100% on an exam', type: 'academic', points: 150, criteria: { type: 'exam_score', threshold: 100 } },
    { id: 'badge-speed-learner', name: 'Speed Learner', description: 'Completed a course in under 7 days', type: 'engagement', points: 75, criteria: { type: 'course_completion_days', threshold: 7 } },
    { id: 'badge-helping-hand', name: 'Helping Hand', description: 'Left 10 helpful reviews', type: 'community', points: 50, criteria: { type: 'reviews', threshold: 10 } },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { id: ach.id },
      update: {},
      create: ach,
    });
  }

  // UserPoints and UserAchievements for students
  const pointValues = [500, 1200, 2800, 800, 3500];
  const levelMap = [2, 4, 7, 3, 9];

  for (const { tenant } of allTenantCourses) {
    const students = allStudentsByTenant[tenant.id] || [];
    for (let si = 0; si < students.length; si++) {
      const { user } = students[si];
      const total = pointValues[si % pointValues.length];
      const lvl = levelMap[si % levelMap.length];

      await prisma.userPoints.upsert({
        where: { userId: user.id },
        update: { total, level: lvl },
        create: {
          userId: user.id,
          total,
          level: lvl,
          streak: si + 1,
          longestStreak: si + 3,
          lastActivityDate: new Date(),
        },
      });

      // 2-3 achievements per student
      const studentAchs = achievements.slice(0, 2 + (si % 2));
      for (const ach of studentAchs) {
        await prisma.userAchievement.upsert({
          where: { userId_achievementId: { userId: user.id, achievementId: ach.id } },
          update: {},
          create: { userId: user.id, achievementId: ach.id, earnedAt: new Date() },
        });
      }
    }
  }

  // Demo student points
  await prisma.userPoints.upsert({
    where: { userId: studentDemoUser.id },
    update: {},
    create: { userId: studentDemoUser.id, total: 1750, level: 5, streak: 7, longestStreak: 14, lastActivityDate: new Date() },
  });
  await prisma.userAchievement.upsert({
    where: { userId_achievementId: { userId: studentDemoUser.id, achievementId: 'ach-first-login' } },
    update: {},
    create: { userId: studentDemoUser.id, achievementId: 'ach-first-login' },
  });
  await prisma.userAchievement.upsert({
    where: { userId_achievementId: { userId: studentDemoUser.id, achievementId: 'ach-first-course' } },
    update: {},
    create: { userId: studentDemoUser.id, achievementId: 'ach-first-course' },
  });

  // ==========================================================================
  // 9. NOTIFICATIONS
  // ==========================================================================
  console.log('  → Notifications...');

  // Create 3 notifications per student across all tenants
  for (const { tenant } of allTenantCourses) {
    const students = allStudentsByTenant[tenant.id] || [];
    for (const { user } of students) {
      await prisma.notification.createMany({
        data: [
          {
            userId: user.id,
            type: 'IN_APP',
            title: 'Welcome to EduAI!',
            body: 'Your account is ready. Start exploring courses and learning today.',
            isRead: true,
          },
          {
            userId: user.id,
            type: 'IN_APP',
            title: 'New Course Available',
            body: 'A new course has been published in your subject area. Check it out!',
            isRead: false,
          },
          {
            userId: user.id,
            type: 'IN_APP',
            title: 'You earned an achievement!',
            body: 'Congratulations! You earned the "First Steps" achievement.',
            isRead: false,
          },
        ],
        skipDuplicates: true,
      });
    }
  }

  // ==========================================================================
  // 10. REVIEWS
  // ==========================================================================
  console.log('  → Reviews...');

  const reviewComments = [
    'Excellent course! Very clear explanations and practical examples.',
    'Great content but could use more exercises.',
    'The instructor explains complex topics in a very accessible way.',
    'I learned so much from this course. Highly recommended!',
    'Good course overall. The assignments were challenging but rewarding.',
  ];

  for (const { tenant, specs } of allTenantCourses) {
    const students = allStudentsByTenant[tenant.id] || [];
    for (let ci = 0; ci < specs.length; ci++) {
      const spec = specs[ci];
      const cm = courseMap[spec.id];
      if (!cm) continue;

      // 2-3 students leave reviews
      const reviewers = students.slice(0, 2 + (ci % 2));
      for (let ri = 0; ri < reviewers.length; ri++) {
        const { user } = reviewers[ri];
        await prisma.review.upsert({
          where: { courseId_userId: { courseId: cm.course.id, userId: user.id } },
          update: {},
          create: {
            courseId: cm.course.id,
            userId: user.id,
            rating: 4 + (ri % 2),
            comment: reviewComments[(ri + ci) % reviewComments.length],
          },
        });
      }
    }
  }

  // ==========================================================================
  // 11. EXAMS (2 per tenant)
  // ==========================================================================
  console.log('  → Exams...');

  const examSpecs = [
    {
      tenantId: schoolTenant.id,
      creatorId: teacherDemoUser.id,
      exams: [
        {
          id: 'exam-algebra-midterm',
          title: 'Algebra Mid-Term Assessment',
          subject: 'Mathematics',
          topic: 'Algebra',
          difficulty: 'medium',
          timeLimit: 3600,
          questions: [
            { id: 'eq1-1', order: 1, type: 'multiple_choice', question: 'Solve for x: 2x + 6 = 14', options: ['x = 4', 'x = 5', 'x = 6', 'x = 10'], correctAnswer: 'x = 4', points: 2 },
            { id: 'eq1-2', order: 2, type: 'multiple_choice', question: 'Which expression equals 3(x + 4)?', options: ['3x + 4', '3x + 12', 'x + 12', '3x + 7'], correctAnswer: '3x + 12', points: 2 },
            { id: 'eq1-3', order: 3, type: 'multiple_choice', question: 'What is the slope of y = 3x − 7?', options: ['7', '-7', '3', '-3'], correctAnswer: '3', points: 2 },
            { id: 'eq1-4', order: 4, type: 'multiple_choice', question: 'Factor: x² − 9', options: ['(x−3)(x+3)', '(x−9)(x+1)', '(x−3)²', '(x+9)(x−1)'], correctAnswer: '(x−3)(x+3)', points: 3 },
            { id: 'eq1-5', order: 5, type: 'short_answer', question: 'If f(x) = 2x² − 3x + 1, what is f(2)?', correctAnswer: '3', points: 3 },
          ],
        },
        {
          id: 'exam-python-basics',
          title: 'Python Fundamentals Quiz',
          subject: 'Technology',
          topic: 'Python Programming',
          difficulty: 'easy',
          timeLimit: 1800,
          questions: [
            { id: 'eq2-1', order: 1, type: 'multiple_choice', question: 'Which keyword defines a function in Python?', options: ['function', 'def', 'func', 'define'], correctAnswer: 'def', points: 1 },
            { id: 'eq2-2', order: 2, type: 'multiple_choice', question: 'What does print(type(3.14)) output?', options: ["<class 'int'>", "<class 'str'>", "<class 'float'>", "<class 'double'>"], correctAnswer: "<class 'float'>", points: 1 },
            { id: 'eq2-3', order: 3, type: 'multiple_choice', question: 'Which is a valid Python list?', options: ['(1, 2, 3)', '{1, 2, 3}', '[1, 2, 3]', '<1, 2, 3>'], correctAnswer: '[1, 2, 3]', points: 1 },
            { id: 'eq2-4', order: 4, type: 'short_answer', question: 'What does print(len("EduAI")) output?', correctAnswer: '5', points: 2 },
          ],
        },
      ],
    },
    {
      tenantId: uniTenant.id,
      creatorId: (teachersByTenant[uniTenant.id]?.[0]?.user?.id) || superAdmin.id,
      exams: [
        {
          id: 'exam-cs101-midterm',
          title: 'CS101 Midterm: Algorithms',
          subject: 'Computer Science',
          topic: 'Algorithms and Data Structures',
          difficulty: 'medium',
          timeLimit: 5400,
          questions: [
            { id: 'eq3-1', order: 1, type: 'multiple_choice', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctAnswer: 'O(log n)', points: 2 },
            { id: 'eq3-2', order: 2, type: 'multiple_choice', question: 'Which data structure uses LIFO order?', options: ['Queue', 'Stack', 'Heap', 'Tree'], correctAnswer: 'Stack', points: 2 },
            { id: 'eq3-3', order: 3, type: 'short_answer', question: 'What does "DRY" stand for in programming?', correctAnswer: "Don't Repeat Yourself", points: 2 },
          ],
        },
        {
          id: 'exam-ds-quiz',
          title: 'Data Science Fundamentals Quiz',
          subject: 'Data Science',
          topic: 'Statistics and Python',
          difficulty: 'medium',
          timeLimit: 2700,
          questions: [
            { id: 'eq4-1', order: 1, type: 'multiple_choice', question: 'Which measure of central tendency is most affected by outliers?', options: ['Median', 'Mode', 'Mean', 'Range'], correctAnswer: 'Mean', points: 2 },
            { id: 'eq4-2', order: 2, type: 'multiple_choice', question: 'What does "iloc" do in pandas?', options: ['Label-based indexing', 'Integer-based indexing', 'Boolean filtering', 'Column selection'], correctAnswer: 'Integer-based indexing', points: 2 },
          ],
        },
      ],
    },
    {
      tenantId: hubTenant.id,
      creatorId: (teachersByTenant[hubTenant.id]?.[0]?.user?.id) || superAdmin.id,
      exams: [
        {
          id: 'exam-sat-practice',
          title: 'SAT Math: Practice Test A',
          subject: 'Mathematics',
          topic: 'SAT Preparation',
          difficulty: 'hard',
          timeLimit: 4500,
          questions: [
            { id: 'eq5-1', order: 1, type: 'multiple_choice', question: 'If 3x − 7 = 14, what is x?', options: ['5', '7', '9', '3'], correctAnswer: '7', points: 1 },
            { id: 'eq5-2', order: 2, type: 'multiple_choice', question: 'What is 15% of 200?', options: ['30', '25', '15', '3'], correctAnswer: '30', points: 1 },
          ],
        },
        {
          id: 'exam-web-dev-quiz',
          title: 'Web Dev Fundamentals Quiz',
          subject: 'Technology',
          topic: 'HTML, CSS, JavaScript',
          difficulty: 'easy',
          timeLimit: 1800,
          questions: [
            { id: 'eq6-1', order: 1, type: 'multiple_choice', question: 'Which HTML tag is used for the largest heading?', options: ['<h6>', '<heading>', '<h1>', '<title>'], correctAnswer: '<h1>', points: 1 },
            { id: 'eq6-2', order: 2, type: 'multiple_choice', question: 'What does CSS stand for?', options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Colorful Styled Sites'], correctAnswer: 'Cascading Style Sheets', points: 1 },
          ],
        },
      ],
    },
  ];

  for (const tenantExams of examSpecs) {
    for (const examSpec of tenantExams.exams) {
      const exam = await prisma.exam.upsert({
        where: { id: examSpec.id },
        update: {},
        create: {
          id: examSpec.id,
          tenantId: tenantExams.tenantId,
          createdBy: tenantExams.creatorId,
          title: examSpec.title,
          subject: examSpec.subject,
          topic: examSpec.topic,
          difficulty: examSpec.difficulty,
          timeLimit: examSpec.timeLimit,
          isPublished: true,
        },
      });

      for (const q of examSpec.questions) {
        await prisma.examQuestion.upsert({
          where: { id: q.id },
          update: {},
          create: { ...q, examId: exam.id },
        });
      }
    }
  }

  // ==========================================================================
  // 12. FLASHCARD DECKS
  // ==========================================================================
  console.log('  → Flashcard decks...');

  const flashcardDecksData = [
    {
      id: 'deck-algebra-vocab',
      tenantId: schoolTenant.id,
      createdBy: teacherDemoUser.id,
      title: 'Algebra Key Terms',
      subject: 'Mathematics',
      topic: 'Algebra',
      cards: [
        { front: 'Variable', back: 'A symbol representing an unknown value in an expression or equation.' },
        { front: 'Coefficient', back: 'The number multiplied by the variable. In 5x, the coefficient is 5.' },
        { front: 'Equation', back: 'A statement asserting two expressions are equal, joined by =.' },
        { front: 'Slope', back: 'Steepness of a line: rise/run = (y₂−y₁)/(x₂−x₁).' },
        { front: 'Quadratic', back: 'A polynomial of degree 2: ax² + bx + c = 0.' },
      ],
    },
    {
      id: 'deck-cs-concepts',
      tenantId: uniTenant.id,
      createdBy: (teachersByTenant[uniTenant.id]?.[0]?.user?.id) || superAdmin.id,
      title: 'CS101 Key Concepts',
      subject: 'Computer Science',
      topic: 'Algorithms',
      cards: [
        { front: 'Algorithm', back: 'A step-by-step procedure to solve a problem.' },
        { front: 'Big-O Notation', back: 'A way to describe algorithm time/space complexity as input grows.' },
        { front: 'Recursion', back: 'A function that calls itself to solve smaller instances of the same problem.' },
        { front: 'Stack', back: 'A LIFO data structure: last in, first out.' },
        { front: 'Queue', back: 'A FIFO data structure: first in, first out.' },
      ],
    },
    {
      id: 'deck-web-dev',
      tenantId: hubTenant.id,
      createdBy: (teachersByTenant[hubTenant.id]?.[0]?.user?.id) || superAdmin.id,
      title: 'Web Dev Quick Reference',
      subject: 'Technology',
      topic: 'HTML/CSS/JS',
      cards: [
        { front: 'DOM', back: 'Document Object Model — the in-memory tree representation of an HTML document.' },
        { front: 'CSS Specificity', back: 'The weight applied to CSS rules: inline > id > class > element.' },
        { front: 'Async/Await', back: 'JavaScript syntax for writing asynchronous code in a synchronous style.' },
        { front: 'REST', back: 'Representational State Transfer — an architectural style for web APIs.' },
        { front: 'HTTP Status 404', back: 'Not Found — the server cannot find the requested resource.' },
      ],
    },
  ];

  for (const deck of flashcardDecksData) {
    const createdDeck = await prisma.flashcardDeck.upsert({
      where: { id: deck.id },
      update: {},
      create: {
        id: deck.id,
        tenantId: deck.tenantId,
        createdBy: deck.createdBy,
        title: deck.title,
        subject: deck.subject,
        topic: deck.topic,
        isPublic: true,
      },
    });

    for (let i = 0; i < deck.cards.length; i++) {
      const cardId = `${deck.id}-card-${i + 1}`;
      await prisma.flashcard.upsert({
        where: { id: cardId },
        update: {},
        create: { id: cardId, deckId: createdDeck.id, front: deck.cards[i].front, back: deck.cards[i].back, order: i + 1 },
      });
    }
  }

  // ==========================================================================
  // 13. LIVE SESSIONS
  // ==========================================================================
  console.log('  → Live sessions...');

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  await prisma.liveSession.upsert({
    where: { id: 'live-algebra-review' },
    update: {},
    create: {
      id: 'live-algebra-review',
      teacherId: teacherDemo.id,
      title: 'Algebra Mid-Term Review — Live Q&A',
      description: 'Live review session covering all algebra topics. Bring your questions!',
      scheduledAt: tomorrow,
      status: 'SCHEDULED',
      maxParticipants: 50,
      settings: { enableChat: true, enableRecording: true, enableWhiteboard: true },
    },
  });

  await prisma.liveSession.upsert({
    where: { id: 'live-python-intro' },
    update: {},
    create: {
      id: 'live-python-intro',
      teacherId: teacherDemo.id,
      title: 'Python Introduction — Getting Started Together',
      description: 'Recorded walkthrough of Python installation and first script.',
      scheduledAt: lastWeek,
      startedAt: lastWeek,
      endedAt: new Date(lastWeek.getTime() + 90 * 60 * 1000),
      status: 'ENDED',
      recordingUrl: 'https://storage.eduai.app/recordings/live-python-intro.mp4',
      maxParticipants: 100,
      settings: { enableChat: true, enableRecording: true },
    },
  });

  // ==========================================================================
  // 14. ROLES & PERMISSIONS
  // ==========================================================================
  console.log('  → Roles and permissions...');

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

  // ==========================================================================
  // 15. WHITE LABEL
  // ==========================================================================
  console.log('  → White label settings...');

  await prisma.whiteLabel.upsert({
    where: { tenantId: schoolTenant.id },
    update: {},
    create: {
      tenantId: schoolTenant.id,
      brandName: 'Demo School Academy',
      primaryColor: '#1d4ed8',
      secondaryColor: '#7c3aed',
      emailFrom: 'noreply@demo-school.com',
    },
  });

  await prisma.whiteLabel.upsert({
    where: { tenantId: uniTenant.id },
    update: {},
    create: {
      tenantId: uniTenant.id,
      brandName: 'Global University Online',
      primaryColor: '#065f46',
      secondaryColor: '#0284c7',
      emailFrom: 'noreply@global-university.edu',
    },
  });

  await prisma.whiteLabel.upsert({
    where: { tenantId: hubTenant.id },
    update: {},
    create: {
      tenantId: hubTenant.id,
      brandName: 'TutorHub Platform',
      primaryColor: '#9333ea',
      secondaryColor: '#ec4899',
      emailFrom: 'noreply@tutorhub.io',
    },
  });

  // ==========================================================================
  // 16. AI CONVERSATIONS (sample)
  // ==========================================================================
  console.log('  → AI conversations...');

  for (const { tenant } of allTenantCourses) {
    const students = allStudentsByTenant[tenant.id] || [];
    if (students.length === 0) continue;
    const { user } = students[0];

    const conv = await prisma.aIConversation.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        module: 'TUTOR',
        title: 'Help with algebra homework',
        context: { subject: 'Mathematics', topic: 'Quadratic Equations' },
      },
    });

    await prisma.aIMessage.createMany({
      data: [
        { conversationId: conv.id, role: 'user', content: 'Can you explain how to factor x² - 5x + 6?', tokens: 15 },
        { conversationId: conv.id, role: 'assistant', content: 'Sure! To factor x² - 5x + 6, find two numbers that multiply to 6 and add to -5. Those are -2 and -3. So x² - 5x + 6 = (x - 2)(x - 3).', tokens: 48 },
      ],
    });
  }

  // ==========================================================================
  // 17. PLUGINS (marketplace items)
  // ==========================================================================
  console.log('  → Plugins...');

  const plugins = [
    {
      id: 'plugin-zoom',
      name: 'Zoom Integration',
      slug: 'zoom-integration',
      description: 'Connect Zoom meetings directly to live classroom sessions.',
      version: '1.2.0',
      author: 'EduAI Team',
      category: 'Communication',
      price: 0,
      rating: 4.5,
      isActive: true,
      manifest: { permissions: ['live_sessions:write'], hooks: ['session.start', 'session.end'] },
    },
    {
      id: 'plugin-grammarly',
      name: 'Writing Assistant',
      slug: 'writing-assistant',
      description: 'AI-powered grammar and style suggestions for student submissions.',
      version: '2.0.1',
      author: 'EduAI Team',
      category: 'AI',
      price: 9.99,
      rating: 4.7,
      isActive: true,
      manifest: { permissions: ['submissions:read', 'submissions:write'], hooks: ['submission.create'] },
    },
    {
      id: 'plugin-google-classroom',
      name: 'Google Classroom Sync',
      slug: 'google-classroom-sync',
      description: 'Import classes, assignments, and grades from Google Classroom.',
      version: '1.0.5',
      author: 'EduAI Team',
      category: 'Integration',
      price: 0,
      rating: 4.2,
      isActive: true,
      manifest: { permissions: ['courses:write', 'users:read'], hooks: ['sync.daily'] },
    },
  ];

  for (const plugin of plugins) {
    await prisma.plugin.upsert({
      where: { slug: plugin.slug },
      update: {},
      create: plugin,
    });
  }

  // Install plugins for all tenants
  for (const { tenant } of allTenantCourses) {
    for (const plugin of plugins.slice(0, 2)) {
      const installedPlugin = await prisma.plugin.findUnique({ where: { slug: plugin.slug } });
      if (!installedPlugin) continue;
      await prisma.installedPlugin.upsert({
        where: { tenantId_pluginId: { tenantId: tenant.id, pluginId: installedPlugin.id } },
        update: {},
        create: {
          tenantId: tenant.id,
          pluginId: installedPlugin.id,
          isActive: true,
          isEnabled: true,
          settings: {},
          config: {},
        },
      });
    }
  }

  // ==========================================================================
  // 18. COUPONS
  // ==========================================================================
  console.log('  → Coupons...');

  const coupons = [
    { code: 'WELCOME20', discountType: 'percentage', discountValue: 20, description: '20% off for new users', validFrom: now, validUntil: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) },
    { code: 'SUMMER50', discountType: 'percentage', discountValue: 50, description: '50% off summer courses', validFrom: now, validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
    { code: 'FLAT10', discountType: 'fixed', discountValue: 10, description: '$10 off any course', validFrom: now },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: { ...coupon, isActive: true, usedCount: 0 },
    });
  }

  // ==========================================================================
  // 19. AUDIT LOGS (sample)
  // ==========================================================================
  console.log('  → Audit logs...');

  await prisma.auditLog.createMany({
    data: [
      { tenantId: schoolTenant.id, userId: teacherDemoUser.id, action: 'CREATE', resource: 'Course', resourceId: 'course-math-demo' },
      { tenantId: schoolTenant.id, userId: studentDemoUser.id, action: 'VIEW', resource: 'Course', resourceId: 'course-math-demo' },
      { tenantId: schoolTenant.id, userId: superAdmin.id, action: 'LOGIN', resource: 'User', resourceId: superAdmin.id },
    ],
    skipDuplicates: true,
  });

  // ==========================================================================
  // 20. ORIGINAL SEED BACKWARD COMPAT (course sections/lessons)
  // ==========================================================================
  console.log('  → Legacy section/lesson backward compat...');

  await prisma.courseSection.upsert({
    where: { id: 'section-algebra' },
    update: {},
    create: { id: 'section-algebra', courseId: 'course-math-demo', title: 'Algebra Fundamentals', position: 2 },
  });
  await prisma.lesson.upsert({
    where: { id: 'lesson-1' },
    update: {},
    create: { id: 'lesson-1', sectionId: 'section-algebra', title: 'Introduction to Variables and Expressions', contentType: ContentType.VIDEO, duration: 1800, position: 1, isPreview: true },
  });

  // ==========================================================================
  // DONE
  // ==========================================================================
  console.log('');
  console.log('✅ Comprehensive seed complete!');
  console.log('');
  console.log('Accounts (password: Demo123!):');
  console.log('  SUPER_ADMIN  superadmin@eduai.com');
  console.log('  ADMIN        admin@demo-school.com | admin@global-university.com | admin@tutor-hub.com');
  console.log('  TEACHER      teacher1@demo-school.com | teacher2@demo-school.com (+ same pattern for other tenants)');
  console.log('  STUDENT      student1@demo-school.com ... student5@demo-school.com (+ same for other tenants)');
  console.log('  PARENT       parent1@demo-school.com (+ same for other tenants)');
  console.log('  LEGACY       teacher@demo-school.edu / student@demo-school.edu / admin@demo-school.edu');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
