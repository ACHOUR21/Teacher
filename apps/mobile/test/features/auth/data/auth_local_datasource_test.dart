import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mocktail/mocktail.dart';
import 'package:eduai_mobile/features/auth/data/auth_local_datasource.dart';
import 'package:eduai_mobile/features/auth/domain/models/user.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  late MockFlutterSecureStorage mockStorage;
  late AuthLocalDatasource datasource;

  final now = DateTime(2030, 1, 1);
  final futureExpiry = now.add(const Duration(hours: 1));
  final pastExpiry = now.subtract(const Duration(hours: 1));

  final validTokens = AuthTokens(
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: futureExpiry,
  );

  final testUser = User(
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.student,
    tenantId: 'tenant-1',
    mfaEnabled: false,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  );

  setUp(() {
    mockStorage = MockFlutterSecureStorage();
    datasource = AuthLocalDatasource(storage: mockStorage);
  });

  group('saveTokens', () {
    test('writes access token, refresh token, and expiry to storage', () async {
      when(() => mockStorage.write(key: any(named: 'key'), value: any(named: 'value')))
          .thenAnswer((_) async {});

      await datasource.saveTokens(validTokens);

      verify(() => mockStorage.write(key: 'access_token', value: 'access-token')).called(1);
      verify(() => mockStorage.write(key: 'refresh_token', value: 'refresh-token')).called(1);
      verify(() => mockStorage.write(key: 'token_expires_at', value: futureExpiry.toIso8601String())).called(1);
    });
  });

  group('getTokens', () {
    test('returns null when access token is absent', () async {
      when(() => mockStorage.read(key: 'access_token')).thenAnswer((_) async => null);
      when(() => mockStorage.read(key: 'refresh_token')).thenAnswer((_) async => 'r');
      when(() => mockStorage.read(key: 'token_expires_at')).thenAnswer((_) async => null);

      final result = await datasource.getTokens();
      expect(result, isNull);
    });

    test('returns null when refresh token is absent', () async {
      when(() => mockStorage.read(key: 'access_token')).thenAnswer((_) async => 'a');
      when(() => mockStorage.read(key: 'refresh_token')).thenAnswer((_) async => null);
      when(() => mockStorage.read(key: 'token_expires_at')).thenAnswer((_) async => null);

      final result = await datasource.getTokens();
      expect(result, isNull);
    });

    test('returns AuthTokens when all keys present', () async {
      when(() => mockStorage.read(key: 'access_token')).thenAnswer((_) async => 'access-token');
      when(() => mockStorage.read(key: 'refresh_token')).thenAnswer((_) async => 'refresh-token');
      when(() => mockStorage.read(key: 'token_expires_at'))
          .thenAnswer((_) async => futureExpiry.toIso8601String());

      final result = await datasource.getTokens();

      expect(result, isNotNull);
      expect(result!.accessToken, 'access-token');
      expect(result.refreshToken, 'refresh-token');
      expect(result.isExpired, isFalse);
    });

    test('defaults expiresAt to 1h from now when key absent', () async {
      when(() => mockStorage.read(key: 'access_token')).thenAnswer((_) async => 'a');
      when(() => mockStorage.read(key: 'refresh_token')).thenAnswer((_) async => 'r');
      when(() => mockStorage.read(key: 'token_expires_at')).thenAnswer((_) async => null);

      final result = await datasource.getTokens();
      expect(result, isNotNull);
      expect(result!.isExpired, isFalse);
    });
  });

  group('saveUser / getUser', () {
    test('getUser returns null when storage key absent', () async {
      when(() => mockStorage.read(key: 'current_user')).thenAnswer((_) async => null);

      final result = await datasource.getUser();
      expect(result, isNull);
    });

    test('getUser returns null when stored JSON is malformed', () async {
      when(() => mockStorage.read(key: 'current_user')).thenAnswer((_) async => 'not json');

      final result = await datasource.getUser();
      expect(result, isNull);
    });

    test('getUser returns User after saveUser round-trip', () async {
      String? stored;
      when(() => mockStorage.write(key: 'current_user', value: any(named: 'value')))
          .thenAnswer((inv) async {
        stored = inv.namedArguments[#value] as String?;
      });
      when(() => mockStorage.read(key: 'current_user')).thenAnswer((_) async => stored);

      await datasource.saveUser(testUser);
      final result = await datasource.getUser();

      expect(result, isNotNull);
      expect(result!.id, testUser.id);
      expect(result.email, testUser.email);
      expect(result.firstName, testUser.firstName);
    });
  });

  group('clearAll', () {
    test('deletes all four storage keys', () async {
      when(() => mockStorage.delete(key: any(named: 'key'))).thenAnswer((_) async {});

      await datasource.clearAll();

      verify(() => mockStorage.delete(key: 'access_token')).called(1);
      verify(() => mockStorage.delete(key: 'refresh_token')).called(1);
      verify(() => mockStorage.delete(key: 'token_expires_at')).called(1);
      verify(() => mockStorage.delete(key: 'current_user')).called(1);
    });
  });

  group('hasValidSession', () {
    test('returns false when no tokens stored', () async {
      when(() => mockStorage.read(key: any(named: 'key'))).thenAnswer((_) async => null);

      final result = await datasource.hasValidSession();
      expect(result, isFalse);
    });

    test('returns false when token is expired', () async {
      when(() => mockStorage.read(key: 'access_token')).thenAnswer((_) async => 'a');
      when(() => mockStorage.read(key: 'refresh_token')).thenAnswer((_) async => 'r');
      when(() => mockStorage.read(key: 'token_expires_at'))
          .thenAnswer((_) async => pastExpiry.toIso8601String());

      final result = await datasource.hasValidSession();
      expect(result, isFalse);
    });

    test('returns true when token is not expired', () async {
      when(() => mockStorage.read(key: 'access_token')).thenAnswer((_) async => 'a');
      when(() => mockStorage.read(key: 'refresh_token')).thenAnswer((_) async => 'r');
      when(() => mockStorage.read(key: 'token_expires_at'))
          .thenAnswer((_) async => futureExpiry.toIso8601String());

      final result = await datasource.hasValidSession();
      expect(result, isTrue);
    });
  });
}
