import '../../../../core/result/result.dart';
import '../entities/notification_entity.dart';
import '../repositories/notifications_repository_interface.dart';

class GetNotificationsUseCase {
  final INotificationsRepository _repository;

  const GetNotificationsUseCase(this._repository);

  Future<Result<({List<NotificationEntity> notifications, int unreadCount})>>
      call({int page = 1, int limit = 20}) {
    return _repository.getNotifications(page: page, limit: limit);
  }
}
