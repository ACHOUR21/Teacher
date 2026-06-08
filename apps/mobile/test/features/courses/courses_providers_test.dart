import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:eduai_mobile/features/courses/presentation/providers/courses_provider.dart';
import 'package:eduai_mobile/features/courses/data/courses_repository.dart';
import 'package:eduai_mobile/features/courses/domain/models/course.dart';
import 'package:eduai_mobile/core/api/api_client.dart';

class MockCoursesRepository extends Mock implements CoursesRepository {}

Course _makeCourse({String id = 'course-1', String title = 'Flutter Basics'}) {
  final now = DateTime(2026, 1, 1);
  return Course(
    id: id,
    title: title,
    description: 'Learn Flutter from scratch',
    instructorId: 'teacher-1',
    instructorName: 'John Doe',
    category: 'Programming',
    level: CourseLevel.beginner,
    status: CourseStatus.published,
    price: 0,
    rating: 4.5,
    reviewCount: 100,
    enrollmentCount: 500,
    lessonCount: 20,
    totalDuration: const Duration(hours: 10),
    sections: const [],
    isEnrolled: false,
    tenantId: 'tenant-1',
    createdAt: now,
    updatedAt: now,
    tags: const ['flutter', 'dart'],
    learningObjectives: const ['Build apps', 'Understand widgets'],
  );
}

void main() {
  late MockCoursesRepository mockRepo;
  late ProviderContainer container;

  setUp(() {
    mockRepo = MockCoursesRepository();
    container = ProviderContainer(
      overrides: [
        coursesRepositoryProvider.overrideWithValue(mockRepo),
      ],
    );
  });

  tearDown(() => container.dispose());

  group('coursesProvider', () {
    test('returns list of courses from repository', () async {
      final courses = [_makeCourse(), _makeCourse(id: 'course-2', title: 'Advanced Dart')];
      when(() => mockRepo.getCourses(any())).thenAnswer((_) async => courses);

      final result = await container.read(coursesProvider.future);

      expect(result, hasLength(2));
      expect(result.first.id, 'course-1');
      expect(result.last.id, 'course-2');
    });

    test('propagates exception as AsyncError', () async {
      when(() => mockRepo.getCourses(any()))
          .thenThrow(AppException(message: 'Network error', statusCode: 500));

      final provider = container.read(coursesProvider);
      await container.read(coursesProvider.future).catchError((_) => <Course>[]);

      final state = container.read(coursesProvider);
      expect(state.hasError, isTrue);
    });

    test('passes filter from coursesFilterProvider to repository', () async {
      when(() => mockRepo.getCourses(any())).thenAnswer((_) async => []);

      await container.read(coursesProvider.future);

      final captured = verify(() => mockRepo.getCourses(captureAny())).captured;
      expect(captured, hasLength(1));
      final filter = captured.first as CoursesFilter;
      expect(filter, isA<CoursesFilter>());
    });

    test('re-fetches when filter changes', () async {
      when(() => mockRepo.getCourses(any())).thenAnswer((_) async => []);

      await container.read(coursesProvider.future);
      container.read(coursesFilterProvider.notifier).state =
          const CoursesFilter(search: 'dart');
      await container.read(coursesProvider.future);

      verify(() => mockRepo.getCourses(any())).called(2);
    });
  });

  group('courseDetailProvider', () {
    test('returns course for given id', () async {
      final course = _makeCourse();
      when(() => mockRepo.getCourseById('course-1')).thenAnswer((_) async => course);

      final result = await container.read(courseDetailProvider('course-1').future);

      expect(result.id, 'course-1');
      expect(result.title, 'Flutter Basics');
    });

    test('throws when course not found', () async {
      when(() => mockRepo.getCourseById(any()))
          .thenThrow(AppException(message: 'Not found', statusCode: 404));

      expect(
        () => container.read(courseDetailProvider('bad-id').future),
        throwsA(isA<AppException>()),
      );
    });
  });

  group('enrolledCoursesProvider', () {
    test('returns enrolled courses', () async {
      final courses = [_makeCourse(id: 'enrolled-1')];
      when(() => mockRepo.getEnrolledCourses()).thenAnswer((_) async => courses);

      final result = await container.read(enrolledCoursesProvider.future);

      expect(result, hasLength(1));
      expect(result.first.id, 'enrolled-1');
    });

    test('returns empty list when no enrollments', () async {
      when(() => mockRepo.getEnrolledCourses()).thenAnswer((_) async => []);

      final result = await container.read(enrolledCoursesProvider.future);

      expect(result, isEmpty);
    });
  });

  group('categoriesProvider', () {
    test('returns list of category strings', () async {
      when(() => mockRepo.getCategories())
          .thenAnswer((_) async => ['Programming', 'Design', 'Business']);

      final result = await container.read(categoriesProvider.future);

      expect(result, containsAll(['Programming', 'Design', 'Business']));
    });
  });

  group('EnrollmentNotifier', () {
    test('initial state is AsyncData(false)', () {
      final state = container.read(enrollmentProvider('course-1'));
      expect(state, const AsyncValue<bool>.data(false));
    });

    test('sets AsyncData(true) after successful enrollment', () async {
      when(() => mockRepo.enrollInCourse('course-1')).thenAnswer((_) async {});

      await container.read(enrollmentProvider('course-1').notifier).enroll();

      final state = container.read(enrollmentProvider('course-1'));
      expect(state.value, isTrue);
      expect(state.hasError, isFalse);
    });

    test('sets AsyncError when enrollment fails', () async {
      when(() => mockRepo.enrollInCourse('course-1'))
          .thenThrow(AppException(message: 'Already enrolled', statusCode: 409));

      await container.read(enrollmentProvider('course-1').notifier).enroll();

      final state = container.read(enrollmentProvider('course-1'));
      expect(state.hasError, isTrue);
    });

    test('calls enrollInCourse with correct courseId', () async {
      when(() => mockRepo.enrollInCourse(any())).thenAnswer((_) async {});

      await container.read(enrollmentProvider('my-course-id').notifier).enroll();

      verify(() => mockRepo.enrollInCourse('my-course-id')).called(1);
    });

    test('separate family instances are independent', () async {
      when(() => mockRepo.enrollInCourse(any())).thenAnswer((_) async {});

      await container.read(enrollmentProvider('course-a').notifier).enroll();

      final stateA = container.read(enrollmentProvider('course-a'));
      final stateB = container.read(enrollmentProvider('course-b'));

      expect(stateA.value, isTrue);
      expect(stateB.value, isFalse);
    });
  });

  group('CoursesFilter', () {
    test('default filter produces empty query params', () {
      const filter = CoursesFilter();
      final params = filter.toQueryParams();
      expect(params['search'], isNull);
      expect(params['category'], isNull);
      expect(params['level'], isNull);
    });

    test('filter with search includes search param', () {
      const filter = CoursesFilter(search: 'flutter');
      final params = filter.toQueryParams();
      expect(params['search'], 'flutter');
    });

    test('filter with category includes category param', () {
      const filter = CoursesFilter(category: 'Programming');
      final params = filter.toQueryParams();
      expect(params['category'], 'Programming');
    });

    test('copyWith creates modified filter', () {
      const filter = CoursesFilter(search: 'dart');
      final updated = filter.copyWith(category: 'Mobile');
      expect(updated.search, 'dart');
      expect(updated.category, 'Mobile');
    });
  });
}
