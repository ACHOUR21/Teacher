import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/get_notifications_usecase.dart';
import '../../domain/usecases/mark_all_read_usecase.dart';
import '../../domain/usecases/mark_read_usecase.dart';
import '../../../../core/result/result.dart';
import 'notifications_event.dart';
import 'notifications_state.dart';

class NotificationsBloc extends Bloc<NotificationsEvent, NotificationsState> {
  final GetNotificationsUseCase _getNotificationsUseCase;
  final MarkReadUseCase _markReadUseCase;
  final MarkAllReadUseCase _markAllReadUseCase;

  NotificationsBloc({
    required GetNotificationsUseCase getNotificationsUseCase,
    required MarkReadUseCase markReadUseCase,
    required MarkAllReadUseCase markAllReadUseCase,
  })  : _getNotificationsUseCase = getNotificationsUseCase,
        _markReadUseCase = markReadUseCase,
        _markAllReadUseCase = markAllReadUseCase,
        super(const NotificationsInitial()) {
    on<NotificationsLoadRequested>(_onLoadRequested);
    on<NotificationMarkRead>(_onMarkRead);
    on<NotificationsMarkAllRead>(_onMarkAllRead);
  }

  Future<void> _onLoadRequested(
    NotificationsLoadRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    emit(const NotificationsLoading());

    final result = await _getNotificationsUseCase();

    switch (result) {
      case Success(:final value):
        emit(NotificationsLoaded(
          notifications: value.notifications,
          unreadCount: value.unreadCount,
        ));
      case Failure(:final message):
        emit(NotificationsError(message));
    }
  }

  Future<void> _onMarkRead(
    NotificationMarkRead event,
    Emitter<NotificationsState> emit,
  ) async {
    final result = await _markReadUseCase(event.id);

    switch (result) {
      case Success():
        // Optimistically update the local list if we are in the loaded state.
        if (state is NotificationsLoaded) {
          final current = state as NotificationsLoaded;
          final updated = current.notifications.map((n) {
            return n.id == event.id ? n.copyWith(read: true) : n;
          }).toList();
          final newUnread =
              updated.where((n) => !n.read).length;
          emit(NotificationsLoaded(
            notifications: updated,
            unreadCount: newUnread,
          ));
        }
      case Failure(:final message):
        emit(NotificationsError(message));
    }
  }

  Future<void> _onMarkAllRead(
    NotificationsMarkAllRead event,
    Emitter<NotificationsState> emit,
  ) async {
    final result = await _markAllReadUseCase();

    switch (result) {
      case Success():
        if (state is NotificationsLoaded) {
          final current = state as NotificationsLoaded;
          final updated = current.notifications
              .map((n) => n.copyWith(read: true))
              .toList();
          emit(NotificationsLoaded(notifications: updated, unreadCount: 0));
        }
      case Failure(:final message):
        emit(NotificationsError(message));
    }
  }
}
