import '../../../../core/result/result.dart';
import '../entities/course_entity.dart';

/// Port (interface) for the courses repository.
abstract interface class ICoursesRepository {
  /// Fetch a paginated list of courses, optionally filtered by [search].
  Future<Result<({List<CourseEntity> courses, int totalCount})>> getCourses({
    required int page,
    required int limit,
    String? search,
  });

  /// Fetch the detail of a single course by [id].
  Future<Result<CourseEntity>> getCourseById(String id);

  /// Enrol the authenticated user in the course with [courseId].
  Future<Result<void>> enrollCourse(String courseId);

  /// Update lesson progress for [courseId] / [lessonId] to [progressPercent].
  Future<Result<void>> updateProgress({
    required String courseId,
    required String lessonId,
    required double progressPercent,
  });
}
