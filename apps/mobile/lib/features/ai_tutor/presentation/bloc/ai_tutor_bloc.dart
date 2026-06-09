import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/generate_flashcards_usecase.dart';
import '../../domain/usecases/send_message_usecase.dart';
import '../../domain/usecases/solve_homework_usecase.dart';
import '../../../../core/result/result.dart';
import 'ai_tutor_event.dart';
import 'ai_tutor_state.dart';

class AiTutorBloc extends Bloc<AiTutorEvent, AiTutorState> {
  final SendMessageUseCase _sendMessageUseCase;
  final SolveHomeworkUseCase _solveHomeworkUseCase;
  final GenerateFlashcardsUseCase _generateFlashcardsUseCase;

  AiTutorBloc({
    required SendMessageUseCase sendMessageUseCase,
    required SolveHomeworkUseCase solveHomeworkUseCase,
    required GenerateFlashcardsUseCase generateFlashcardsUseCase,
  })  : _sendMessageUseCase = sendMessageUseCase,
        _solveHomeworkUseCase = solveHomeworkUseCase,
        _generateFlashcardsUseCase = generateFlashcardsUseCase,
        super(const AiTutorInitial()) {
    on<AiTutorMessageSent>(_onMessageSent);
    on<AiTutorHomeworkSubmitted>(_onHomeworkSubmitted);
    on<AiTutorFlashcardsRequested>(_onFlashcardsRequested);
  }

  Future<void> _onMessageSent(
    AiTutorMessageSent event,
    Emitter<AiTutorState> emit,
  ) async {
    emit(const AiTutorLoading());

    final result = await _sendMessageUseCase(
      message: event.message,
      sessionId: event.sessionId,
    );

    switch (result) {
      case Success(:final value):
        emit(AiTutorResponseReceived(
          message: value.message,
          sessionId: value.sessionId,
        ));
      case Failure(:final message):
        emit(AiTutorError(message));
    }
  }

  Future<void> _onHomeworkSubmitted(
    AiTutorHomeworkSubmitted event,
    Emitter<AiTutorState> emit,
  ) async {
    emit(const AiTutorLoading());

    final result = await _solveHomeworkUseCase(
      problem: event.problem,
      subject: event.subject,
    );

    switch (result) {
      case Success(:final value):
        emit(AiTutorResponseReceived(
          message: value.message,
          sessionId: value.sessionId,
        ));
      case Failure(:final message):
        emit(AiTutorError(message));
    }
  }

  Future<void> _onFlashcardsRequested(
    AiTutorFlashcardsRequested event,
    Emitter<AiTutorState> emit,
  ) async {
    emit(const AiTutorLoading());

    final result = await _generateFlashcardsUseCase(
      topic: event.topic,
      count: event.count,
    );

    switch (result) {
      case Success(:final value):
        emit(AiTutorFlashcardsGenerated(value));
      case Failure(:final message):
        emit(AiTutorError(message));
    }
  }
}
