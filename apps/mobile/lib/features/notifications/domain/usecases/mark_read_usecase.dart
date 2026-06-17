import '../../../../core/result/result.dart';
import '../repositories/notifications_repository_interface.dart';

class MarkReadUseCase {
  final INotificationsRepository _repository;

  const MarkReadUseCase(this._repository);

  Future<Result<void>> call(String id) => _repository.markRead(id);
}
