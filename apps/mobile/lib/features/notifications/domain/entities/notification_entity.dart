import 'package:equatable/equatable.dart';

/// Domain entity for a user notification.
class NotificationEntity extends Equatable {
  final String id;
  final String title;
  final String body;
  final String type;
  final bool read;
  final DateTime createdAt;

  const NotificationEntity({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.read,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, title, body, type, read, createdAt];

  factory NotificationEntity.fromJson(Map<String, dynamic> json) {
    return NotificationEntity(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String? ?? json['message'] as String? ?? '',
      type: json['type'] as String? ?? 'general',
      read: json['read'] as bool? ?? json['is_read'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  NotificationEntity copyWith({bool? read}) {
    return NotificationEntity(
      id: id,
      title: title,
      body: body,
      type: type,
      read: read ?? this.read,
      createdAt: createdAt,
    );
  }
}
