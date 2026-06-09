import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';

class MessagesRemoteDataSource {
  final ApiClient _apiClient;

  MessagesRemoteDataSource(this._apiClient);

  /// GET /messages/conversations — all conversations for the current user,
  /// most recently active first.
  Future<List<dynamic>> getConversations() async {
    try {
      final response =
          await _apiClient.dio.get(Endpoints.messageConversations);
      final data = response.data;
      if (data is List) return data;
      if (data is Map && data.containsKey('items')) {
        return data['items'] as List<dynamic>;
      }
      return [];
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// GET /messages/conversations/:id/messages — paginated message history for
  /// a conversation.
  Future<Map<String, dynamic>> getMessages(
    String conversationId, {
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final response = await _apiClient.dio.get(
        Endpoints.conversationMessages(conversationId),
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /messages/conversations/:id/messages — send a text message to an
  /// existing conversation.
  Future<Map<String, dynamic>> sendMessage({
    required String conversationId,
    required String content,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.conversationMessages(conversationId),
        data: {'content': content},
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /messages/conversations — start a direct-message conversation with
  /// [recipientId].  The server returns the newly created (or already existing)
  /// conversation object.
  Future<Map<String, dynamic>> createConversation(String recipientId) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.messageConversations,
        data: {'recipient_id': recipientId},
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
