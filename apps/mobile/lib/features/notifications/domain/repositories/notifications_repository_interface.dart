import '../../../../core/result/result.dart';
import '../entities/notification_entity.dart';

abstract interface class INotificationsRepository {
  /// Fetch the notification feed for the current user.
  Future<Result<({List<NotificationEntity> notifications, int unreadCount})>>
      getNotifications({int page = 1, int limit = 20});

  /// Mark a single notification as read by [id].
  Future<Result<void>> markRead(String id);

  /// Mark all notifications as read.
  Future<Result<void>> markAllRead();
}
