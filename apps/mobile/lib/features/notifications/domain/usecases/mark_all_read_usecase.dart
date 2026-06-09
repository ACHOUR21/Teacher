import '../../../../core/result/result.dart';
import '../repositories/notifications_repository_interface.dart';

class MarkAllReadUseCase {
  final INotificationsRepository _repository;

  const MarkAllReadUseCase(this._repository);

  Future<Result<void>> call() => _repository.markAllRead();
}
