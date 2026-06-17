import 'package:equatable/equatable.dart';

sealed class AiTutorEvent extends Equatable {
  const AiTutorEvent();

  @override
  List<Object?> get props => [];
}

final class AiTutorMessageSent extends AiTutorEvent {
  final String message;
  final String? sessionId;

  const AiTutorMessageSent({required this.message, this.sessionId});

  @override
  List<Object?> get props => [message, sessionId];
}

final class AiTutorHomeworkSubmitted extends AiTutorEvent {
  final String problem;
  final String subject;

  const AiTutorHomeworkSubmitted({
    required this.problem,
    required this.subject,
  });

  @override
  List<Object?> get props => [problem, subject];
}

final class AiTutorFlashcardsRequested extends AiTutorEvent {
  final String topic;
  final int count;

  const AiTutorFlashcardsRequested({required this.topic, required this.count});

  @override
  List<Object?> get props => [topic, count];
}
