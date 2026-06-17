import 'package:equatable/equatable.dart';

sealed class NotificationsEvent extends Equatable {
  const NotificationsEvent();

  @override
  List<Object?> get props => [];
}

final class NotificationsLoadRequested extends NotificationsEvent {
  const NotificationsLoadRequested();
}

final class NotificationMarkRead extends NotificationsEvent {
  final String id;

  const NotificationMarkRead(this.id);

  @override
  List<Object?> get props => [id];
}

final class NotificationsMarkAllRead extends NotificationsEvent {
  const NotificationsMarkAllRead();
}
