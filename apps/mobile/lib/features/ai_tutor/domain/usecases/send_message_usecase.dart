import '../../../../core/result/result.dart';
import '../entities/chat_message_entity.dart';
import '../repositories/ai_tutor_repository_interface.dart';

class SendMessageUseCase {
  final IAiTutorRepository _repository;

  const SendMessageUseCase(this._repository);

  Future<Result<({ChatMessageEntity message, String sessionId})>> call({
    required String message,
    String? sessionId,
  }) {
    return _repository.sendMessage(message: message, sessionId: sessionId);
  }
}
