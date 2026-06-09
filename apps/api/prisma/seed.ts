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

  // =========================================================================
  // Additional Courses (2 & 3) with sections and lessons
  // =========================================================================

  const course2 = await prisma.course.upsert({
    where: { id: 'course-science-demo' },
    update: {},
    create: {
      id: 'course-science-demo',
      tenantId: schoolTenant.id,
      teacherId: teacher.id,
      title: 'Physics for Beginners — Grade 10',
      slug: 'physics-beginners-grade-10',
      description: 'An accessible introduction to classical mechanics, thermodynamics, and wave physics. Packed with real-world examples and lab exercises.',
      category: 'Science',
      tags: ['physics', 'mechanics', 'thermodynamics', 'grade-10'],
      level: 'BEGINNER',
      language: 'en',
      price: 49.99,
      isPublished: true,
      totalLessons: 18,
    },
  });

  const course2Section1 = await prisma.courseSection.upsert({
    where: { id: 'section-mechanics' },
    update: {},
    create: { id: 'section-mechanics', courseId: course2.id, title: 'Classical Mechanics', position: 1 },
  });

  const course2Section2 = await prisma.courseSection.upsert({
    where: { id: 'section-thermodynamics' },
    update: {},
    create: { id: 'section-thermodynamics', courseId: course2.id, title: 'Thermodynamics', position: 2 },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-phys-1' },
    update: {},
    create: {
      id: 'lesson-phys-1',
      sectionId: course2Section1.id,
      title: 'Newton\'s Laws of Motion',
      contentType: 'VIDEO',
      duration: 2100,
      position: 1,
      isPreview: true,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-phys-2' },
    update: {},
    create: {
      id: 'lesson-phys-2',
      sectionId: course2Section1.id,
      title: 'Work, Energy and Power',
      contentType: 'VIDEO',
      duration: 1800,
      position: 2,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-phys-3' },
    update: {},
    create: {
      id: 'lesson-phys-3',
      sectionId: course2Section2.id,
      title: 'Temperature and Heat Transfer',
      contentType: 'DOCUMENT',
      duration: 900,
      position: 1,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { id: 'course-coding-demo' },
    update: {},
    create: {
      id: 'course-coding-demo',
      tenantId: schoolTenant.id,
      teacherId: teacher.id,
      title: 'Introduction to Python Programming',
      slug: 'introduction-python-programming',
      description: 'Learn Python from scratch — variables, control flow, functions, OOP, and data structures. Build three real projects by the end.',
      category: 'Technology',
      tags: ['python', 'programming', 'coding', 'beginner'],
      level: 'BEGINNER',
      language: 'en',
      price: 0,
      isPublished: true,
      isFeatured: true,
      totalLessons: 20,
    },
  });

  const course3Section1 = await prisma.courseSection.upsert({
    where: { id: 'section-python-basics' },
    update: {},
    create: { id: 'section-python-basics', courseId: course3.id, title: 'Python Fundamentals', position: 1 },
  });

  const course3Section2 = await prisma.courseSection.upsert({
    where: { id: 'section-python-oop' },
    update: {},
    create: { id: 'section-python-oop', courseId: course3.id, title: 'Object-Oriented Python', position: 2 },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-py-1' },
    update: {},
    create: {
      id: 'lesson-py-1',
      sectionId: course3Section1.id,
      title: 'Installing Python & Setting Up VS Code',
      contentType: 'VIDEO',
      duration: 900,
      position: 1,
      isPreview: true,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-py-2' },
    update: {},
    create: {
      id: 'lesson-py-2',
      sectionId: course3Section1.id,
      title: 'Variables, Data Types and Operators',
      contentType: 'VIDEO',
      duration: 1500,
      position: 2,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-py-3' },
    update: {},
    create: {
      id: 'lesson-py-3',
      sectionId: course3Section1.id,
      title: 'Control Flow — if, for, while',
      contentType: 'VIDEO',
      duration: 1800,
      position: 3,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-py-4' },
    update: {},
    create: {
      id: 'lesson-py-4',
      sectionId: course3Section2.id,
      title: 'Classes and Objects',
      contentType: 'VIDEO',
      duration: 2400,
      position: 1,
    },
  });

  // =========================================================================
  // Exams (2 exams — one published with 5 questions each)
  // =========================================================================

  const exam1 = await prisma.exam.upsert({
    where: { id: 'exam-algebra-midterm' },
    update: {},
    create: {
      id: 'exam-algebra-midterm',
      tenantId: schoolTenant.id,
      createdBy: teacherUser.id,
      title: 'Algebra Mid-Term Assessment',
      subject: 'Mathematics',
      topic: 'Algebra',
      difficulty: 'medium',
      timeLimit: 3600,
      isPublished: true,
    },
  });

  const exam1Questions = [
    { id: 'eq1-1', examId: exam1.id, order: 1, type: 'multiple_choice', question: 'Solve for x: 2x + 6 = 14', options: ['x = 4', 'x = 5', 'x = 6', 'x = 10'], correctAnswer: 'x = 4', explanation: 'Subtract 6 from both sides to get 2x = 8, then divide by 2.', points: 2 },
    { id: 'eq1-2', examId: exam1.id, order: 2, type: 'multiple_choice', question: 'Which expression is equivalent to 3(x + 4)?', options: ['3x + 4', '3x + 12', 'x + 12', '3x + 7'], correctAnswer: '3x + 12', explanation: 'Apply the distributive property: 3 × x + 3 × 4 = 3x + 12.', points: 2 },
    { id: 'eq1-3', examId: exam1.id, order: 3, type: 'multiple_choice', question: 'What is the slope of the line y = 3x − 7?', options: ['7', '-7', '3', '-3'], correctAnswer: '3', explanation: 'In slope-intercept form y = mx + b, m is the slope.', points: 2 },
    { id: 'eq1-4', examId: exam1.id, order: 4, type: 'multiple_choice', question: 'Factor completely: x² − 9', options: ['(x−3)(x+3)', '(x−9)(x+1)', '(x−3)²', '(x+9)(x−1)'], correctAnswer: '(x−3)(x+3)', explanation: 'This is a difference of squares: a² − b² = (a−b)(a+b).', points: 3 },
    { id: 'eq1-5', examId: exam1.id, order: 5, type: 'short_answer', question: 'If f(x) = 2x² − 3x + 1, what is f(2)?', correctAnswer: '3', explanation: 'f(2) = 2(4) − 3(2) + 1 = 8 − 6 + 1 = 3.', points: 3 },
  ];

  for (const q of exam1Questions) {
    await prisma.examQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: q,
    });
  }

  const exam2 = await prisma.exam.upsert({
    where: { id: 'exam-python-basics' },
    update: {},
    create: {
      id: 'exam-python-basics',
      tenantId: schoolTenant.id,
      createdBy: teacherUser.id,
      title: 'Python Fundamentals Quiz',
      subject: 'Technology',
      topic: 'Python Programming',
      difficulty: 'easy',
      timeLimit: 1800,
      isPublished: true,
    },
  });

  const exam2Questions = [
    { id: 'eq2-1', examId: exam2.id, order: 1, type: 'multiple_choice', question: 'Which keyword is used to define a function in Python?', options: ['function', 'def', 'func', 'define'], correctAnswer: 'def', explanation: 'In Python, functions are defined using the "def" keyword.', points: 1 },
    { id: 'eq2-2', examId: exam2.id, order: 2, type: 'multiple_choice', question: 'What is the output of print(type(3.14))?', options: ["<class 'int'>", "<class 'str'>", "<class 'float'>", "<class 'double'>"], correctAnswer: "<class 'float'>", explanation: '3.14 is a floating point number in Python.', points: 1 },
    { id: 'eq2-3', examId: exam2.id, order: 3, type: 'multiple_choice', question: 'Which of these is a valid list in Python?', options: ['(1, 2, 3)', '{1, 2, 3}', '[1, 2, 3]', '<1, 2, 3>'], correctAnswer: '[1, 2, 3]', explanation: 'Lists in Python are defined using square brackets.', points: 1 },
    { id: 'eq2-4', examId: exam2.id, order: 4, type: 'multiple_choice', question: 'How do you start a comment in Python?', options: ['// comment', '/* comment */', '# comment', '-- comment'], correctAnswer: '# comment', explanation: 'Python uses the # character to start single-line comments.', points: 1 },
    { id: 'eq2-5', examId: exam2.id, order: 5, type: 'short_answer', question: 'What will print(len("EduAI")) output?', correctAnswer: '5', explanation: 'The string "EduAI" contains 5 characters.', points: 2 },
  ];

  for (const q of exam2Questions) {
    await prisma.examQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: q,
    });
  }

  // =========================================================================
  // Assignments (3 assignments linked to lesson slots)
  // =========================================================================

  const futureDate1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const futureDate2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const futureDate3 = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);

  await prisma.assignment.upsert({
    where: { id: 'assignment-algebra-hw1' },
    update: {},
    create: {
      id: 'assignment-algebra-hw1',
      teacherId: teacher.id,
      title: 'Algebra Homework — Chapter 1: Solving Equations',
      description: 'Solve the 20 linear equations in the attached worksheet. Show all working steps. Submit as a scanned PDF or photographed clearly.',
      dueDate: futureDate1,
      maxScore: 100,
    },
  });

  await prisma.assignment.upsert({
    where: { id: 'assignment-physics-lab' },
    update: {},
    create: {
      id: 'assignment-physics-lab',
      teacherId: teacher.id,
      title: 'Physics Lab Report — Projectile Motion Experiment',
      description: 'Write a full lab report (introduction, method, results, analysis, conclusion) for the projectile motion experiment conducted in class. Include your data table and velocity graphs.',
      dueDate: futureDate2,
      maxScore: 50,
    },
  });

  await prisma.assignment.upsert({
    where: { id: 'assignment-python-project' },
    update: {},
    create: {
      id: 'assignment-python-project',
      teacherId: teacher.id,
      title: 'Python Mini-Project — Number Guessing Game',
      description: 'Build a command-line number guessing game in Python. The program should: generate a random number between 1–100, accept user input, give higher/lower hints, track number of attempts, and display a score. Include a README.txt with run instructions.',
      dueDate: futureDate3,
      maxScore: 100,
    },
  });

  // =========================================================================
  // Flashcard Decks (5 decks × 10 cards each)
  // =========================================================================

  const flashcardDecksData = [
    {
      id: 'deck-algebra-vocab',
      title: 'Algebra Key Terms',
      subject: 'Mathematics',
      topic: 'Algebra',
      cards: [
        { front: 'Variable', back: 'A symbol (usually a letter) that represents an unknown or changeable value in an expression or equation.' },
        { front: 'Coefficient', back: 'The numerical factor multiplied by the variable(s) in a term. E.g., in 5x, the coefficient is 5.' },
        { front: 'Expression', back: 'A mathematical phrase with numbers, variables and operations but no equals sign.' },
        { front: 'Equation', back: 'A mathematical statement asserting that two expressions are equal, joined by an = sign.' },
        { front: 'Inequality', back: 'A statement that compares two expressions using <, >, ≤, or ≥.' },
        { front: 'Linear Equation', back: 'An equation whose graph is a straight line; the highest power of the variable is 1.' },
        { front: 'Quadratic Equation', back: 'A polynomial equation of degree 2, written in the form ax² + bx + c = 0.' },
        { front: 'Factoring', back: 'Rewriting a polynomial as a product of simpler polynomials or expressions.' },
        { front: 'Slope', back: 'The measure of steepness of a line, calculated as rise/run or (y₂−y₁)/(x₂−x₁).' },
        { front: 'Y-intercept', back: 'The point where a line crosses the y-axis; the value of y when x = 0.' },
      ],
    },
    {
      id: 'deck-physics-concepts',
      title: 'Physics Concepts — Grade 10',
      subject: 'Science',
      topic: 'Physics',
      cards: [
        { front: 'Newton\'s First Law', back: 'An object at rest stays at rest and an object in motion stays in motion unless acted upon by an unbalanced force.' },
        { front: 'Newton\'s Second Law', back: 'Force equals mass times acceleration: F = ma.' },
        { front: 'Newton\'s Third Law', back: 'For every action there is an equal and opposite reaction.' },
        { front: 'Kinetic Energy', back: 'Energy of motion: KE = ½mv². Depends on both mass and the square of velocity.' },
        { front: 'Potential Energy', back: 'Stored energy due to position: PE = mgh (gravitational) or PE = ½kx² (spring).' },
        { front: 'Work', back: 'Force applied over a distance: W = Fd cos θ. Measured in Joules (J).' },
        { front: 'Power', back: 'Rate of doing work: P = W/t. Measured in Watts (W).' },
        { front: 'Velocity', back: 'Speed with a direction. A vector quantity: v = displacement / time.' },
        { front: 'Acceleration', back: 'Rate of change of velocity: a = Δv/Δt. Measured in m/s².' },
        { front: 'Momentum', back: 'Product of mass and velocity: p = mv. Conserved in closed systems.' },
      ],
    },
    {
      id: 'deck-python-syntax',
      title: 'Python Syntax Cheat Sheet',
      subject: 'Technology',
      topic: 'Python Programming',
      cards: [
        { front: 'How do you print in Python?', back: 'print("Hello, World!")' },
        { front: 'How do you define a variable?', back: 'name = "Alice"  or  age = 25  (no type declaration needed)' },
        { front: 'How do you write an if-else?', back: 'if condition:\n    # do something\nelse:\n    # do something else' },
        { front: 'How do you create a for loop?', back: 'for i in range(10):\n    print(i)' },
        { front: 'How do you define a function?', back: 'def greet(name):\n    return f"Hello, {name}!"' },
        { front: 'How do you create a list?', back: 'fruits = ["apple", "banana", "cherry"]' },
        { front: 'How do you access a list element?', back: 'fruits[0]  # "apple" (zero-indexed)' },
        { front: 'How do you create a dictionary?', back: 'person = {"name": "Alice", "age": 25}' },
        { front: 'How do you import a module?', back: 'import math\nfrom math import sqrt' },
        { front: 'How do you handle exceptions?', back: 'try:\n    result = 10 / 0\nexcept ZeroDivisionError:\n    print("Cannot divide by zero")' },
      ],
    },
    {
      id: 'deck-english-grammar',
      title: 'English Grammar Essentials',
      subject: 'Language',
      topic: 'Grammar',
      cards: [
        { front: 'Noun', back: 'A word that names a person, place, thing, or idea. E.g., teacher, school, courage.' },
        { front: 'Verb', back: 'A word that expresses action or a state of being. E.g., run, is, seem.' },
        { front: 'Adjective', back: 'A word that describes or modifies a noun. E.g., tall, bright, difficult.' },
        { front: 'Adverb', back: 'A word that modifies a verb, adjective or other adverb. E.g., quickly, very, well.' },
        { front: 'Subject', back: 'The noun or pronoun that performs the action of the verb in a sentence.' },
        { front: 'Predicate', back: 'The part of a sentence that contains the verb and tells what the subject does or is.' },
        { front: 'Clause', back: 'A group of words containing a subject and a predicate. Can be independent or dependent.' },
        { front: 'Active Voice', back: 'Sentence structure where the subject performs the action: "The teacher graded the exam."' },
        { front: 'Passive Voice', back: 'Sentence structure where the subject receives the action: "The exam was graded by the teacher."' },
        { front: 'Subordinating Conjunction', back: 'A conjunction that introduces a dependent clause: although, because, since, unless, when, while.' },
      ],
    },
    {
      id: 'deck-world-history',
      title: 'World History — Key Events',
      subject: 'History',
      topic: 'World History',
      cards: [
        { front: 'What year did World War I begin?', back: '1914 — triggered by the assassination of Archduke Franz Ferdinand of Austria-Hungary in Sarajevo on 28 June 1914.' },
        { front: 'What was the Renaissance?', back: 'A cultural and intellectual movement in Europe (14th–17th centuries) marking the transition from the Middle Ages to modernity; characterized by revival of classical art, literature, and learning.' },
        { front: 'When did the French Revolution begin?', back: '1789 — began with the Estates-General in May and the storming of the Bastille on 14 July 1789.' },
        { front: 'What was the Industrial Revolution?', back: 'A period of rapid industrialization (roughly 1760–1840) that began in Britain; shifted economies from agrarian to manufacturing, introducing steam power, factories, and urbanization.' },
        { front: 'When did the Cold War end?', back: '1991 — marked by the dissolution of the Soviet Union on 25 December 1991.' },
        { front: 'What was the Silk Road?', back: 'A network of ancient trade routes connecting China to the Mediterranean (and beyond); active from 2nd century BCE to 15th century CE, facilitating trade, culture, and religion.' },
        { front: 'When was the Declaration of Independence signed?', back: '4 July 1776 — the thirteen American colonies declared independence from Britain.' },
        { front: 'What was apartheid?', back: 'A system of institutionalised racial segregation enforced by the South African government from 1948 to 1994.' },
        { front: 'When did the Berlin Wall fall?', back: '9 November 1989 — symbolising the end of the Cold War divide between East and West Germany.' },
        { front: 'What was the Magna Carta?', back: 'A royal charter of rights agreed by King John of England in 1215; a foundational document for constitutional law and the rule of law.' },
      ],
    },
  ];

  for (const deck of flashcardDecksData) {
    const createdDeck = await prisma.flashcardDeck.upsert({
      where: { id: deck.id },
      update: {},
      create: {
        id: deck.id,
        tenantId: schoolTenant.id,
        createdBy: teacherUser.id,
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
        create: {
          id: cardId,
          deckId: createdDeck.id,
          front: deck.cards[i].front,
          back: deck.cards[i].back,
          order: i + 1,
        },
      });
    }
  }

  // =========================================================================
  // Certificate Template
  // =========================================================================

  await prisma.certificateTemplate.upsert({
    where: { id: 'cert-template-completion' },
    update: {},
    create: {
      id: 'cert-template-completion',
      tenantId: schoolTenant.id,
      courseId: course1.id,
      name: 'Course Completion Certificate',
      design: {
        background: '#ffffff',
        border: { color: '#1e40af', width: 8, style: 'solid' },
        logo: { position: 'top-center', size: 80 },
        title: { text: 'Certificate of Completion', font: 'serif', size: 36, color: '#1e40af', align: 'center' },
        subtitle: { text: 'This certifies that', font: 'sans-serif', size: 16, color: '#6b7280', align: 'center' },
        recipientName: { font: 'serif', size: 28, color: '#111827', align: 'center', style: 'italic' },
        bodyText: { font: 'sans-serif', size: 14, color: '#374151', align: 'center' },
        footer: { signature: true, date: true, verifyCode: true },
        watermark: { text: 'EduAI', opacity: 0.05 },
      },
      fields: {
        recipientName: { label: 'Student Name', type: 'text', required: true },
        courseName: { label: 'Course Name', type: 'text', required: true },
        completionDate: { label: 'Completion Date', type: 'date', required: true },
        grade: { label: 'Final Grade', type: 'text', required: false },
        instructorName: { label: 'Instructor', type: 'text', required: true },
        institutionName: { label: 'Institution', type: 'text', required: true },
      },
    },
  });

  // =========================================================================
  // Gamification Badges (3 new badges beyond the existing achievements)
  // =========================================================================

  const badges = [
    {
      id: 'badge-perfect-score',
      name: 'Perfect Score',
      description: 'Achieved 100% on an exam or quiz',
      type: 'academic',
      points: 150,
      criteria: { type: 'exam_score', threshold: 100 },
    },
    {
      id: 'badge-speed-learner',
      name: 'Speed Learner',
      description: 'Completed a course in under 7 days',
      type: 'engagement',
      points: 75,
      criteria: { type: 'course_completion_days', threshold: 7 },
    },
    {
      id: 'badge-helping-hand',
      name: 'Helping Hand',
      description: 'Left 10 helpful reviews or forum replies',
      type: 'community',
      points: 50,
      criteria: { type: 'reviews', threshold: 10 },
    },
  ];

  for (const badge of badges) {
    await prisma.achievement.upsert({
      where: { id: badge.id },
      update: {},
      create: badge,
    });
  }

  // =========================================================================
  // Live Sessions (1 scheduled, 1 completed)
  // =========================================================================

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekEnd = new Date(lastWeek.getTime() + 90 * 60 * 1000);

  await prisma.liveSession.upsert({
    where: { id: 'live-algebra-review' },
    update: {},
    create: {
      id: 'live-algebra-review',
      teacherId: teacher.id,
      title: 'Algebra Mid-Term Review — Live Q&A',
      description: 'Join Mr. Smith for a live review session covering all topics on the upcoming Algebra mid-term. Bring your questions! Topics: linear equations, quadratics, factoring, graphs.',
      scheduledAt: tomorrow,
      status: 'SCHEDULED',
      maxParticipants: 50,
      settings: {
        enableChat: true,
        enableRecording: true,
        enableWhiteboard: true,
        enableBreakoutRooms: false,
        waitingRoomEnabled: true,
      },
    },
  });

  await prisma.liveSession.upsert({
    where: { id: 'live-python-intro' },
    update: {},
    create: {
      id: 'live-python-intro',
      teacherId: teacher.id,
      title: 'Python Introduction — Getting Started Together',
      description: 'Recorded session: live walkthrough of Python installation, first script, and basic variables. Watch the recording at any time.',
      scheduledAt: lastWeek,
      startedAt: lastWeek,
      endedAt: lastWeekEnd,
      status: 'ENDED',
      recordingUrl: 'https://storage.eduai.app/recordings/live-python-intro.mp4',
      maxParticipants: 100,
      settings: {
        enableChat: true,
        enableRecording: true,
        enableWhiteboard: false,
        enableBreakoutRooms: false,
        waitingRoomEnabled: false,
      },
    },
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('👤 Super Admin: admin@eduai.io / Admin@123456');
  console.log('🏫 School Admin: admin@demo-school.edu / Admin@123456');
  console.log('👨‍🏫 Teacher: teacher@demo-school.edu / Teacher@123456');
  console.log('👩‍🎓 Student: student@demo-school.edu / Student@123456');
}

main().catch(console.error).finally(() => prisma.$disconnect());
