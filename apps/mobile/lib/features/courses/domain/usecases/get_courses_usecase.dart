import '../../../../core/result/result.dart';
import '../entities/course_entity.dart';
import '../repositories/courses_repository_interface.dart';

class GetCoursesUseCase {
  final ICoursesRepository _repository;

  const GetCoursesUseCase(this._repository);

  Future<Result<({List<CourseEntity> courses, int totalCount})>> call({
    int page = 1,
    int limit = 20,
    String? search,
  }) {
    return _repository.getCourses(page: page, limit: limit, search: search);
  }
}
