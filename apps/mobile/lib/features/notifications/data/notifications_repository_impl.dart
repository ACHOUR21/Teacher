import '../../../core/api/api_client.dart';
import '../../../core/result/result.dart';
import '../domain/entities/notification_entity.dart';
import '../domain/repositories/notifications_repository_interface.dart';
import 'notifications_remote_datasource.dart';

class NotificationsRepositoryImpl implements INotificationsRepository {
  final NotificationsRemoteDataSource _remote;

  const NotificationsRepositoryImpl({required NotificationsRemoteDataSource remote})
      : _remote = remote;

  @override
  Future<Result<({List<NotificationEntity> notifications, int unreadCount})>>
      getNotifications({int page = 1, int limit = 20}) async {
    try {
      final json = await _remote.getNotifications(page: page, limit: limit);

      final rawItems = json['items'] as List<dynamic>? ?? [];
      final notifications = rawItems
          .map((item) =>
              NotificationEntity.fromJson(item as Map<String, dynamic>))
          .toList();

      final unreadCount =
          json['unread_count'] as int? ?? notifications.where((n) => !n.read).length;

      return Success((notifications: notifications, unreadCount: unreadCount));
    } on AppException catch (e) {
      return Failure(message: e.message, statusCode: e.statusCode);
    } catch (e) {
      return Failure(message: e.toString());
    }
  }

  @override
  Future<Result<void>> markRead(String id) async {
    try {
      await _remote.markAsRead(id);
      return const Success(null);
    } on AppException catch (e) {
      return Failure(message: e.message, statusCode: e.statusCode);
    } catch (e) {
      return Failure(message: e.toString());
    }
  }

  @override
  Future<Result<void>> markAllRead() async {
    try {
      await _remote.markAllRead();
      return const Success(null);
    } on AppException catch (e) {
      return Failure(message: e.message, statusCode: e.statusCode);
    } catch (e) {
      return Failure(message: e.toString());
    }
  }
}
