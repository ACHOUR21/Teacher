import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../domain/entities/flashcard_entity.dart';

class FlashcardsRepository {
  final ApiClient _apiClient;

  FlashcardsRepository({required ApiClient apiClient})
      : _apiClient = apiClient;

  Future<List<FlashcardDeckEntity>> getDecks() async {
    final response = await _apiClient.dio.get(
      '${Endpoints.baseUrl}${Endpoints.flashcardDecks}',
    );
    final raw = response.data;
    final List<dynamic> list;
    if (raw is Map<String, dynamic>) {
      final inner = raw['data'] ?? raw['decks'] ?? raw;
      list = inner is List ? inner : [];
    } else if (raw is List) {
      list = raw;
    } else {
      list = [];
    }
    return list
        .whereType<Map<String, dynamic>>()
        .map(FlashcardDeckEntity.fromJson)
        .toList();
  }

  Future<FlashcardDeckEntity> createDeck({
    required String title,
    String? description,
  }) async {
    final response = await _apiClient.dio.post(
      '${Endpoints.baseUrl}${Endpoints.flashcardDecks}',
      data: {
        'title': title,
        if (description != null) 'description': description,
      },
    );
    final raw = response.data;
    final data = raw is Map<String, dynamic>
        ? (raw['data'] ?? raw) as Map<String, dynamic>
        : raw as Map<String, dynamic>;
    return FlashcardDeckEntity.fromJson(data);
  }

  Future<void> deleteDeck(String deckId) async {
    await _apiClient.dio.delete(
      '${Endpoints.baseUrl}${Endpoints.flashcardDeckById(deckId)}',
    );
  }

  Future<List<FlashcardEntity>> getCardsInDeck(String deckId) async {
    final response = await _apiClient.dio.get(
      '${Endpoints.baseUrl}${Endpoints.flashcardsInDeck(deckId)}',
    );
    final raw = response.data;
    final List<dynamic> list;
    if (raw is Map<String, dynamic>) {
      final inner = raw['data'] ?? raw['cards'] ?? raw;
      list = inner is List ? inner : [];
    } else if (raw is List) {
      list = raw;
    } else {
      list = [];
    }
    return list
        .whereType<Map<String, dynamic>>()
        .map(FlashcardEntity.fromJson)
        .toList();
  }

  Future<FlashcardEntity> addCard({
    required String deckId,
    required String front,
    required String back,
  }) async {
    final response = await _apiClient.dio.post(
      '${Endpoints.baseUrl}${Endpoints.flashcardsInDeck(deckId)}',
      data: {'front': front, 'back': back},
    );
    final raw = response.data;
    final data = raw is Map<String, dynamic>
        ? (raw['data'] ?? raw) as Map<String, dynamic>
        : raw as Map<String, dynamic>;
    return FlashcardEntity.fromJson(data);
  }

  Future<void> deleteCard(String deckId, String cardId) async {
    await _apiClient.dio.delete(
      '${Endpoints.baseUrl}${Endpoints.flashcardById(deckId, cardId)}',
    );
  }

  Future<FlashcardEntity> markKnown(
      String deckId, String cardId, bool known) async {
    final response = await _apiClient.dio.patch(
      '${Endpoints.baseUrl}${Endpoints.flashcardMarkKnown(deckId, cardId)}',
      data: {'known': known},
    );
    final raw = response.data;
    final data = raw is Map<String, dynamic>
        ? (raw['data'] ?? raw) as Map<String, dynamic>
        : raw as Map<String, dynamic>;
    return FlashcardEntity.fromJson(data);
  }

  Future<List<FlashcardEntity>> generateWithAI({
    required String topic,
    int count = 10,
  }) async {
    final response = await _apiClient.dio.post(
      '${Endpoints.baseUrl}${Endpoints.aiFlashcardsGenerate}',
      data: {'topic': topic, 'count': count},
    );
    final raw = response.data;
    final List<dynamic> list;
    if (raw is Map<String, dynamic>) {
      final inner = raw['data'] ?? raw['flashcards'] ?? raw['cards'] ?? raw;
      list = inner is List ? inner : [];
    } else if (raw is List) {
      list = raw;
    } else {
      list = [];
    }
    return list
        .whereType<Map<String, dynamic>>()
        .map(FlashcardEntity.fromJson)
        .toList();
  }
}
