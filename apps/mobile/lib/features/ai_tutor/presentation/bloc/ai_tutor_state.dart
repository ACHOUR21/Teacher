import 'package:equatable/equatable.dart';
import '../../domain/entities/chat_message_entity.dart';

sealed class AiTutorState extends Equatable {
  const AiTutorState();

  @override
  List<Object?> get props => [];
}

final class AiTutorInitial extends AiTutorState {
  const AiTutorInitial();
}

final class AiTutorLoading extends AiTutorState {
  const AiTutorLoading();
}

final class AiTutorResponseReceived extends AiTutorState {
  final ChatMessageEntity message;
  final String sessionId;

  const AiTutorResponseReceived({
    required this.message,
    required this.sessionId,
  });

  @override
  List<Object?> get props => [message, sessionId];
}

final class AiTutorFlashcardsGenerated extends AiTutorState {
  final List<FlashcardEntity> flashcards;

  const AiTutorFlashcardsGenerated(this.flashcards);

  @override
  List<Object?> get props => [flashcards];
}

final class AiTutorError extends AiTutorState {
  final String message;

  const AiTutorError(this.message);

  @override
  List<Object?> get props => [message];
}
