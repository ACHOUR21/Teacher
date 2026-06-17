import '../../../../core/result/result.dart';
import '../entities/chat_message_entity.dart';
import '../repositories/ai_tutor_repository_interface.dart';

class SolveHomeworkUseCase {
  final IAiTutorRepository _repository;

  const SolveHomeworkUseCase(this._repository);

  Future<Result<({ChatMessageEntity message, String sessionId})>> call({
    required String problem,
    required String subject,
  }) {
    return _repository.solveHomework(problem: problem, subject: subject);
  }
}
