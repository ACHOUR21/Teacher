/// Application-level notification model used in the notifications feature.
class AppNotification {
  final String id;
  final String title;
  final String body;
  final String type;
  final bool isRead;
  final DateTime createdAt;
  final Map<String, dynamic>? data;

  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.isRead,
    required this.createdAt,
    this.data,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final readAt = json['readAt'] as String? ?? json['read_at'] as String?;
    final isRead = readAt != null || json['isRead'] == true || json['read'] == true;

    final createdAtStr = json['createdAt'] as String? ??
        json['created_at'] as String? ??
        json['timestamp'] as String?;

    return AppNotification(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Notification',
      body: json['body']?.toString() ??
          json['message']?.toString() ??
          json['content']?.toString() ??
          '',
      type: json['type']?.toString() ?? 'GENERAL',
      isRead: isRead,
      createdAt: createdAtStr != null
          ? DateTime.tryParse(createdAtStr) ?? DateTime.now()
          : DateTime.now(),
      data: json['data'] as Map<String, dynamic>?,
    );
  }

  AppNotification copyWith({bool? isRead}) {
    return AppNotification(
      id: id,
      title: title,
      body: body,
      type: type,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt,
      data: data,
    );
  }
}
