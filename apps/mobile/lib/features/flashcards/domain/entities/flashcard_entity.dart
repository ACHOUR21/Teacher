/// Represents a single flashcard with front/back text content.
class FlashcardEntity {
  final String id;
  final String front;
  final String back;
  final bool isKnown;
  final DateTime createdAt;

  const FlashcardEntity({
    required this.id,
    required this.front,
    required this.back,
    required this.isKnown,
    required this.createdAt,
  });

  factory FlashcardEntity.fromJson(Map<String, dynamic> json) {
    return FlashcardEntity(
      id: json['id'] as String,
      front: json['front'] as String,
      back: json['back'] as String,
      isKnown: json['is_known'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  FlashcardEntity copyWith({bool? isKnown}) {
    return FlashcardEntity(
      id: id,
      front: front,
      back: back,
      isKnown: isKnown ?? this.isKnown,
      createdAt: createdAt,
    );
  }
}

/// A named collection of flashcards.
class FlashcardDeckEntity {
  final String id;
  final String title;
  final String? description;
  final int cardCount;
  final int knownCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  const FlashcardDeckEntity({
    required this.id,
    required this.title,
    this.description,
    required this.cardCount,
    required this.knownCount,
    required this.createdAt,
    required this.updatedAt,
  });

  double get progressPercent =>
      cardCount == 0 ? 0 : knownCount / cardCount;

  factory FlashcardDeckEntity.fromJson(Map<String, dynamic> json) {
    return FlashcardDeckEntity(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      cardCount: json['card_count'] as int? ?? 0,
      knownCount: json['known_count'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}
