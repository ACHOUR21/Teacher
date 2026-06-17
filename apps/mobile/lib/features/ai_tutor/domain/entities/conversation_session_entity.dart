import 'package:equatable/equatable.dart';
import 'chat_message_entity.dart';

/// A conversation session groups messages exchanged with the AI tutor.
class ConversationSessionEntity extends Equatable {
  final String id;
  final List<ChatMessageEntity> messages;

  const ConversationSessionEntity({
    required this.id,
    required this.messages,
  });

  @override
  List<Object?> get props => [id, messages];

  ConversationSessionEntity copyWith({
    String? id,
    List<ChatMessageEntity>? messages,
  }) {
    return ConversationSessionEntity(
      id: id ?? this.id,
      messages: messages ?? this.messages,
    );
  }
}
