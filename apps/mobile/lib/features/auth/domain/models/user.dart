enum UserRole { student, teacher, admin }

class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final UserRole role;
  final String? avatarUrl;
  final String? phone;
  final String? bio;
  final String tenantId;
  final bool mfaEnabled;
  final bool emailVerified;
  final DateTime createdAt;
  final DateTime updatedAt;

  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.avatarUrl,
    this.phone,
    this.bio,
    required this.tenantId,
    required this.mfaEnabled,
    required this.emailVerified,
    required this.createdAt,
    required this.updatedAt,
  });

  String get fullName => '$firstName $lastName';

  String get initials {
    final f = firstName.isNotEmpty ? firstName[0].toUpperCase() : '';
    final l = lastName.isNotEmpty ? lastName[0].toUpperCase() : '';
    return '$f$l';
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
      role: _parseRole(json['role'] as String? ?? 'student'),
      avatarUrl: json['avatar_url'] as String?,
      phone: json['phone'] as String?,
      bio: json['bio'] as String?,
      tenantId: json['tenant_id'] as String,
      mfaEnabled: json['mfa_enabled'] as bool? ?? false,
      emailVerified: json['email_verified'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'role': role.name,
      'avatar_url': avatarUrl,
      'phone': phone,
      'bio': bio,
      'tenant_id': tenantId,
      'mfa_enabled': mfaEnabled,
      'email_verified': emailVerified,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  User copyWith({
    String? id,
    String? email,
    String? firstName,
    String? lastName,
    UserRole? role,
    String? avatarUrl,
    String? phone,
    String? bio,
    String? tenantId,
    bool? mfaEnabled,
    bool? emailVerified,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      role: role ?? this.role,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      phone: phone ?? this.phone,
      bio: bio ?? this.bio,
      tenantId: tenantId ?? this.tenantId,
      mfaEnabled: mfaEnabled ?? this.mfaEnabled,
      emailVerified: emailVerified ?? this.emailVerified,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  static UserRole _parseRole(String role) {
    switch (role.toLowerCase()) {
      case 'teacher':
        return UserRole.teacher;
      case 'admin':
        return UserRole.admin;
      default:
        return UserRole.student;
    }
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is User && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}

class AuthTokens {
  final String accessToken;
  final String refreshToken;
  final DateTime expiresAt;

  const AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresAt,
  });

  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    return AuthTokens(
      accessToken: json['access_token'] as String,
      refreshToken: json['refresh_token'] as String,
      expiresAt: json['expires_at'] != null
          ? DateTime.parse(json['expires_at'] as String)
          : DateTime.now().add(const Duration(hours: 1)),
    );
  }

  bool get isExpired => DateTime.now().isAfter(expiresAt);
}

class LoginRequest {
  final String email;
  final String password;
  final String? tenantSlug;

  const LoginRequest({
    required this.email,
    required this.password,
    this.tenantSlug,
  });

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
        if (tenantSlug != null) 'tenant_slug': tenantSlug,
      };
}

class RegisterRequest {
  final String email;
  final String password;
  final String firstName;
  final String lastName;
  final UserRole role;
  final String? tenantSlug;

  const RegisterRequest({
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.tenantSlug,
  });

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
        'first_name': firstName,
        'last_name': lastName,
        'role': role.name,
        if (tenantSlug != null) 'tenant_slug': tenantSlug,
      };
}

class LoginResponse {
  final User user;
  final AuthTokens tokens;
  final bool requiresMfa;

  const LoginResponse({
    required this.user,
    required this.tokens,
    required this.requiresMfa,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      tokens: AuthTokens.fromJson(json['tokens'] as Map<String, dynamic>),
      requiresMfa: json['requires_mfa'] as bool? ?? false,
    );
  }
}
