import '../../../../core/result/result.dart';
import '../entities/chat_message_entity.dart';

abstract interface class IAiTutorRepository {
  /// Send a chat [message], optionally continuing [sessionId].
  ///
  /// Returns the AI reply message and the (possibly new) session ID.
  Future<Result<({ChatMessageEntity message, String sessionId})>> sendMessage({
    required String message,
    String? sessionId,
  });

  /// Submit a homework [problem] in [subject] for step-by-step AI solution.
  ///
  /// Returns the AI's solution as a chat message and the session ID.
  Future<Result<({ChatMessageEntity message, String sessionId})>> solveHomework({
    required String problem,
    required String subject,
  });

  /// Generate [count] flashcards on [topic].
  Future<Result<List<FlashcardEntity>>> generateFlashcards({
    required String topic,
    required int count,
  });
}
