import 'package:equatable/equatable.dart';

enum UserEntityRole { student, teacher, admin }

/// Domain entity for an authenticated user.
///
/// Intentionally flat — no infrastructure dependencies.  Carries the tokens
/// so the BLoC can surface them without reaching into secure storage.
class UserEntity extends Equatable {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final UserEntityRole role;
  final String tenantId;
  final String? avatarUrl;
  final String accessToken;
  final String refreshToken;

  const UserEntity({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.tenantId,
    this.avatarUrl,
    required this.accessToken,
    required this.refreshToken,
  });

  String get fullName => '$firstName $lastName';

  String get initials {
    final f = firstName.isNotEmpty ? firstName[0].toUpperCase() : '';
    final l = lastName.isNotEmpty ? lastName[0].toUpperCase() : '';
    return '$f$l';
  }

  @override
  List<Object?> get props => [
        id,
        email,
        firstName,
        lastName,
        role,
        tenantId,
        avatarUrl,
        accessToken,
        refreshToken,
      ];

  static UserEntityRole _parseRole(String raw) {
    switch (raw.toLowerCase()) {
      case 'teacher':
        return UserEntityRole.teacher;
      case 'admin':
        return UserEntityRole.admin;
      default:
        return UserEntityRole.student;
    }
  }

  factory UserEntity.fromJson(
    Map<String, dynamic> json, {
    String accessToken = '',
    String refreshToken = '',
  }) {
    return UserEntity(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
      role: _parseRole(json['role'] as String? ?? 'student'),
      tenantId: json['tenant_id'] as String,
      avatarUrl: json['avatar_url'] as String?,
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }
}
