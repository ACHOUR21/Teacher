import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../data/courses_repository.dart';
import '../../domain/models/course.dart';

final coursesRepositoryProvider = Provider<CoursesRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return CoursesRepository(apiClient: apiClient);
});

// Filter state
final coursesFilterProvider = StateProvider<CoursesFilter>((ref) {
  return const CoursesFilter();
});

// Courses list
final coursesProvider = FutureProvider.autoDispose<List<Course>>((ref) async {
  final repo = ref.watch(coursesRepositoryProvider);
  final filter = ref.watch(coursesFilterProvider);
  return repo.getCourses(filter);
});

// Categories
final categoriesProvider = FutureProvider.autoDispose<List<String>>((ref) async {
  final repo = ref.watch(coursesRepositoryProvider);
  return repo.getCategories();
});

// Single course
final courseDetailProvider =
    FutureProvider.autoDispose.family<Course, String>((ref, courseId) async {
  final repo = ref.watch(coursesRepositoryProvider);
  return repo.getCourseById(courseId);
});

// Course reviews
final courseReviewsProvider =
    FutureProvider.autoDispose.family<List<CourseReview>, String>(
        (ref, courseId) async {
  final repo = ref.watch(coursesRepositoryProvider);
  return repo.getCourseReviews(courseId);
});

// Enrolled courses
final enrolledCoursesProvider =
    FutureProvider.autoDispose<List<Course>>((ref) async {
  final repo = ref.watch(coursesRepositoryProvider);
  return repo.getEnrolledCourses();
});

// Lesson detail
final lessonDetailProvider =
    FutureProvider.autoDispose.family<Lesson, ({String courseId, String lessonId})>(
        (ref, params) async {
  final repo = ref.watch(coursesRepositoryProvider);
  return repo.getLessonById(params.courseId, params.lessonId);
});

// Enrollment state
class EnrollmentNotifier extends StateNotifier<AsyncValue<bool>> {
  final CoursesRepository _repo;
  final String courseId;

  EnrollmentNotifier(this._repo, this.courseId)
      : super(const AsyncValue.data(false));

  Future<void> enroll() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await _repo.enrollInCourse(courseId);
      return true;
    });
  }
}

final enrollmentProvider = StateNotifierProvider.autoDispose
    .family<EnrollmentNotifier, AsyncValue<bool>, String>((ref, courseId) {
  final repo = ref.watch(coursesRepositoryProvider);
  return EnrollmentNotifier(repo, courseId);
});
