import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';

class AiTutorRemoteDataSource {
  final ApiClient _apiClient;

  AiTutorRemoteDataSource(this._apiClient);

  /// POST /ai/tutor/chat — send a message to the AI tutor.
  ///
  /// Pass [conversationId] to continue an existing conversation; omit it to
  /// start a new one.  The response always includes a `conversation_id` field
  /// so the caller can thread subsequent messages.
  Future<Map<String, dynamic>> chat({
    required String message,
    required String subject,
    String? conversationId,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.aiTutorChat,
        data: {
          'message': message,
          'subject': subject,
          if (conversationId != null) 'conversation_id': conversationId,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /ai/homework/solve — submit a homework problem for step-by-step
  /// solution by the AI.
  Future<Map<String, dynamic>> solveHomework({
    required String problem,
    required String subject,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.aiHomeworkSolve,
        data: {
          'problem': problem,
          'subject': subject,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /ai/flashcards/generate — generate a set of flashcards for a topic.
  Future<Map<String, dynamic>> generateFlashcards({
    required String topic,
    required int numCards,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.aiFlashcardsGenerate,
        data: {
          'topic': topic,
          'num_cards': numCards,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /ai/translate — translate arbitrary text into [targetLanguage].
  ///
  /// [targetLanguage] should be a BCP-47 language tag (e.g. `"fr"`, `"ar"`,
  /// `"zh-CN"`).
  Future<Map<String, dynamic>> translate({
    required String text,
    required String targetLanguage,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.aiTranslate,
        data: {
          'text': text,
          'target_language': targetLanguage,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  AppException _mapError(DioException e) {
    if (e.error is AppException) return e.error as AppException;
    return AppException(
      message: e.message ?? 'An unexpected error occurred',
      statusCode: e.response?.statusCode,
      originalError: e,
    );
  }
}
