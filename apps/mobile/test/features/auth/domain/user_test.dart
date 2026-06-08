import 'package:flutter_test/flutter_test.dart';
import 'package:eduai_mobile/features/auth/domain/models/user.dart';

void main() {
  final now = DateTime(2026, 1, 1, 12, 0, 0);
  final nowStr = now.toIso8601String();

  final validJson = {
    'id': 'user-1',
    'email': 'alice@example.com',
    'first_name': 'Alice',
    'last_name': 'Smith',
    'role': 'student',
    'avatar_url': null,
    'phone': null,
    'bio': null,
    'tenant_id': 'tenant-1',
    'mfa_enabled': false,
    'email_verified': true,
    'created_at': nowStr,
    'updated_at': nowStr,
  };

  group('User', () {
    test('fromJson parses all fields correctly', () {
      final user = User.fromJson(validJson);

      expect(user.id, 'user-1');
      expect(user.email, 'alice@example.com');
      expect(user.firstName, 'Alice');
      expect(user.lastName, 'Smith');
      expect(user.role, UserRole.student);
      expect(user.tenantId, 'tenant-1');
      expect(user.mfaEnabled, isFalse);
      expect(user.emailVerified, isTrue);
      expect(user.createdAt, now);
    });

    test('fromJson parses teacher role', () {
      final user = User.fromJson({...validJson, 'role': 'teacher'});
      expect(user.role, UserRole.teacher);
    });

    test('fromJson parses admin role', () {
      final user = User.fromJson({...validJson, 'role': 'ADMIN'});
      expect(user.role, UserRole.admin);
    });

    test('fromJson defaults unknown role to student', () {
      final user = User.fromJson({...validJson, 'role': 'unknown_role'});
      expect(user.role, UserRole.student);
    });

    test('fromJson defaults mfaEnabled to false when absent', () {
      final json = Map<String, dynamic>.from(validJson)..remove('mfa_enabled');
      final user = User.fromJson(json);
      expect(user.mfaEnabled, isFalse);
    });

    test('toJson round-trips through fromJson', () {
      final user = User.fromJson(validJson);
      final json = user.toJson();
      final roundTripped = User.fromJson(json);

      expect(roundTripped.id, user.id);
      expect(roundTripped.email, user.email);
      expect(roundTripped.firstName, user.firstName);
      expect(roundTripped.lastName, user.lastName);
      expect(roundTripped.role, user.role);
      expect(roundTripped.tenantId, user.tenantId);
    });

    test('fullName concatenates firstName and lastName', () {
      final user = User.fromJson(validJson);
      expect(user.fullName, 'Alice Smith');
    });

    test('initials returns first letters of each name uppercased', () {
      final user = User.fromJson(validJson);
      expect(user.initials, 'AS');
    });

    test('initials handles empty firstName gracefully', () {
      final user = User.fromJson({...validJson, 'first_name': ''});
      expect(user.initials, 'S');
    });

    test('initials handles empty lastName gracefully', () {
      final user = User.fromJson({...validJson, 'last_name': ''});
      expect(user.initials, 'A');
    });

    test('copyWith returns modified copy with updated fields', () {
      final user = User.fromJson(validJson);
      final updated = user.copyWith(email: 'new@example.com', mfaEnabled: true);

      expect(updated.id, user.id);
      expect(updated.email, 'new@example.com');
      expect(updated.mfaEnabled, isTrue);
      expect(updated.firstName, user.firstName);
    });

    test('copyWith with no arguments returns equal user', () {
      final user = User.fromJson(validJson);
      final copy = user.copyWith();
      expect(copy, equals(user));
    });

    test('equality is based on id', () {
      final user1 = User.fromJson(validJson);
      final user2 = User.fromJson({...validJson, 'email': 'different@example.com'});
      expect(user1, equals(user2));
    });

    test('users with different ids are not equal', () {
      final user1 = User.fromJson(validJson);
      final user2 = User.fromJson({...validJson, 'id': 'user-2'});
      expect(user1, isNot(equals(user2)));
    });

    test('hashCode is based on id', () {
      final user1 = User.fromJson(validJson);
      final user2 = User.fromJson({...validJson, 'email': 'different@example.com'});
      expect(user1.hashCode, equals(user2.hashCode));
    });
  });

  group('AuthTokens', () {
    test('fromJson parses fields correctly', () {
      final future = DateTime.now().add(const Duration(hours: 1));
      final tokens = AuthTokens.fromJson({
        'access_token': 'access-abc',
        'refresh_token': 'refresh-xyz',
        'expires_at': future.toIso8601String(),
      });

      expect(tokens.accessToken, 'access-abc');
      expect(tokens.refreshToken, 'refresh-xyz');
      expect(tokens.isExpired, isFalse);
    });

    test('isExpired returns true for past expiry', () {
      final past = DateTime.now().subtract(const Duration(seconds: 1));
      final tokens = AuthTokens.fromJson({
        'access_token': 'a',
        'refresh_token': 'r',
        'expires_at': past.toIso8601String(),
      });

      expect(tokens.isExpired, isTrue);
    });

    test('fromJson defaults expiresAt to 1h from now when absent', () {
      final tokens = AuthTokens.fromJson({
        'access_token': 'a',
        'refresh_token': 'r',
      });

      expect(tokens.isExpired, isFalse);
    });
  });

  group('LoginRequest.toJson', () {
    test('includes tenantSlug when provided', () {
      final req = LoginRequest(
        email: 'a@b.com',
        password: 'pw',
        tenantSlug: 'my-school',
      );
      final json = req.toJson();
      expect(json['tenant_slug'], 'my-school');
    });

    test('omits tenantSlug when null', () {
      final req = LoginRequest(email: 'a@b.com', password: 'pw');
      expect(req.toJson().containsKey('tenant_slug'), isFalse);
    });
  });
}
