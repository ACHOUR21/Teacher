import '../../../../core/result/result.dart';
import '../repositories/courses_repository_interface.dart';

class EnrollCourseUseCase {
  final ICoursesRepository _repository;

  const EnrollCourseUseCase(this._repository);

  Future<Result<void>> call(String courseId) =>
      _repository.enrollCourse(courseId);
}
