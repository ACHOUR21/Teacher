import '../../../../core/result/result.dart';
import '../entities/chat_message_entity.dart';
import '../repositories/ai_tutor_repository_interface.dart';

class GenerateFlashcardsUseCase {
  final IAiTutorRepository _repository;

  const GenerateFlashcardsUseCase(this._repository);

  Future<Result<List<FlashcardEntity>>> call({
    required String topic,
    required int count,
  }) {
    return _repository.generateFlashcards(topic: topic, count: count);
  }
}
