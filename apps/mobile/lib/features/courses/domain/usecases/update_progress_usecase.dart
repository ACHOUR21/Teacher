import '../../../../core/result/result.dart';
import '../repositories/courses_repository_interface.dart';

class UpdateProgressUseCase {
  final ICoursesRepository _repository;

  const UpdateProgressUseCase(this._repository);

  Future<Result<void>> call({
    required String courseId,
    required String lessonId,
    required double progressPercent,
  }) {
    return _repository.updateProgress(
      courseId: courseId,
      lessonId: lessonId,
      progressPercent: progressPercent,
    );
  }
}
