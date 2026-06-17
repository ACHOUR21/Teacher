import '../../../../core/result/result.dart';
import '../entities/course_entity.dart';
import '../repositories/courses_repository_interface.dart';

class GetCourseByIdUseCase {
  final ICoursesRepository _repository;

  const GetCourseByIdUseCase(this._repository);

  Future<Result<CourseEntity>> call(String id) =>
      _repository.getCourseById(id);
}
