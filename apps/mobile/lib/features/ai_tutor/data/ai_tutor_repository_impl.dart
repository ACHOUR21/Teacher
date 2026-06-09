import 'dart:math' as math;
import '../../../core/api/api_client.dart';
import '../../../core/result/result.dart';
import '../domain/entities/chat_message_entity.dart';
import '../domain/repositories/ai_tutor_repository_interface.dart';
import 'ai_tutor_remote_datasource.dart';

class AiTutorRepositoryImpl implements IAiTutorRepository {
  final AiTutorRemoteDataSource _remote;

  const AiTutorRepositoryImpl({required AiTutorRemoteDataSource remote})
      : _remote = remote;

  @override
  Future<Result<({ChatMessageEntity message, String sessionId})>> sendMessage({
    required String message,
    String? sessionId,
  }) async {
    try {
      // The datasource chat() requires a subject; default to 'general' when
      // none is passed at the BLoC level.
      final json = await _remote.chat(
        message: message,
        subject: 'general',
        conversationId: sessionId,
      );

      final responseContent =
          json['response'] as String? ?? json['message'] as String? ?? '';
      final newSessionId =
          json['conversation_id'] as String? ?? _generateId();

      final aiMessage = ChatMessageEntity(
        id: _generateId(),
        role: MessageRole.assistant,
        content: responseContent,
        timestamp: DateTime.now(),
      );

      return Success((message: aiMessage, sessionId: newSessionId));
    } on AppException catch (e) {
      return Failure(message: e.message, statusCode: e.statusCode);
    } catch (e) {
      return Failure(message: e.toString());
    }
  }

  @override
  Future<Result<({ChatMessageEntity message, String sessionId})>> solveHomework({
    required String problem,
    required String subject,
  }) async {
    try {
      final json = await _remote.solveHomework(
        problem: problem,
        subject: subject,
      );

      final solution =
          json['solution'] as String? ?? json['response'] as String? ?? '';
      final sessionId = json['conversation_id'] as String? ?? _generateId();

      final aiMessage = ChatMessageEntity(
        id: _generateId(),
        role: MessageRole.assistant,
        content: solution,
        timestamp: DateTime.now(),
      );

      return Success((message: aiMessage, sessionId: sessionId));
    } on AppException catch (e) {
      return Failure(message: e.message, statusCode: e.statusCode);
    } catch (e) {
      return Failure(message: e.toString());
    }
  }

  @override
  Future<Result<List<FlashcardEntity>>> generateFlashcards({
    required String topic,
    required int count,
  }) async {
    try {
      final json = await _remote.generateFlashcards(
        topic: topic,
        numCards: count,
      );

      final rawCards = json['flashcards'] as List<dynamic>? ?? [];
      final cards = rawCards
          .map((c) => FlashcardEntity.fromJson(c as Map<String, dynamic>))
          .toList();

      return Success(cards);
    } on AppException catch (e) {
      return Failure(message: e.message, statusCode: e.statusCode);
    } catch (e) {
      return Failure(message: e.toString());
    }
  }

  /// Generates a simple pseudo-random ID when the server doesn't return one.
  static String _generateId() {
    final rng = math.Random();
    return DateTime.now().millisecondsSinceEpoch.toString() +
        rng.nextInt(9999).toString().padLeft(4, '0');
  }
}
