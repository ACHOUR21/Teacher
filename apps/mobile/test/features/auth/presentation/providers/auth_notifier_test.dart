import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:eduai_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:eduai_mobile/features/auth/data/auth_repository.dart';
import 'package:eduai_mobile/features/auth/domain/models/user.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

User _makeUser({String id = 'user-1', UserRole role = UserRole.student}) {
  final now = DateTime(2026, 1, 1);
  return User(
    id: id,
    email: 'user@example.com',
    firstName: 'Alice',
    lastName: 'Smith',
    role: role,
    tenantId: 'tenant-1',
    mfaEnabled: false,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  );
}

AuthTokens _makeTokens() => AuthTokens(
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: DateTime.now().add(const Duration(hours: 1)),
    );

void main() {
  late MockAuthRepository mockRepo;
  late ProviderContainer container;

  setUp(() {
    mockRepo = MockAuthRepository();
    // _checkSession() runs in constructor — stub it to return unauthenticated
    when(() => mockRepo.hasValidSession()).thenAnswer((_) async => false);

    container = ProviderContainer(
      overrides: [
        authRepositoryProvider.overrideWithValue(mockRepo),
      ],
    );
  });

  tearDown(() => container.dispose());

  Future<void> pumpEventQueue() async {
    await Future.delayed(Duration.zero);
    await Future.delayed(Duration.zero);
  }

  group('initial _checkSession', () {
    test('sets unauthenticated when no valid session', () async {
      container.read(authProvider); // trigger construction
      await pumpEventQueue();

      final state = container.read(authProvider);
      expect(state.status, AuthStatus.unauthenticated);
      expect(state.isLoading, isFalse);
    });

    test('sets authenticated and loads cached user when valid session', () async {
      final user = _makeUser();
      when(() => mockRepo.hasValidSession()).thenAnswer((_) async => true);
      when(() => mockRepo.getCachedUser()).thenAnswer((_) async => user);
      when(() => mockRepo.getCurrentUser()).thenAnswer((_) async => user);

      container.read(authProvider);
      await pumpEventQueue();

      final state = container.read(authProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.user, user);
    });
  });

  group('login', () {
    setUp(() async {
      container.read(authProvider);
      await pumpEventQueue();
    });

    test('sets authenticated and stores user on success', () async {
      final user = _makeUser();
      when(() => mockRepo.login(
            email: any(named: 'email'),
            password: any(named: 'password'),
            tenantSlug: any(named: 'tenantSlug'),
          )).thenAnswer(
        (_) async => LoginResponse(
          user: user,
          tokens: _makeTokens(),
          requiresMfa: false,
        ),
      );

      await container.read(authProvider.notifier).login(
            email: 'user@example.com',
            password: 'pass123',
          );

      final state = container.read(authProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.user, user);
      expect(state.isLoading, isFalse);
      expect(state.error, isNull);
    });

    test('sets mfaRequired and stores pendingMfaEmail when requiresMfa is true', () async {
      final user = _makeUser();
      when(() => mockRepo.login(
            email: any(named: 'email'),
            password: any(named: 'password'),
            tenantSlug: any(named: 'tenantSlug'),
          )).thenAnswer(
        (_) async => LoginResponse(
          user: user,
          tokens: _makeTokens(),
          requiresMfa: true,
        ),
      );

      await container.read(authProvider.notifier).login(
            email: 'user@example.com',
            password: 'pass123',
          );

      final state = container.read(authProvider);
      expect(state.status, AuthStatus.mfaRequired);
      expect(state.requiresMfa, isTrue);
      expect(state.pendingMfaEmail, 'user@example.com');
      expect(state.isLoading, isFalse);
    });

    test('sets error and unauthenticated status on exception', () async {
      when(() => mockRepo.login(
            email: any(named: 'email'),
            password: any(named: 'password'),
            tenantSlug: any(named: 'tenantSlug'),
          )).thenThrow(
        AppException(message: 'Invalid credentials', statusCode: 401),
      );

      await container.read(authProvider.notifier).login(
            email: 'bad@example.com',
            password: 'wrong',
          );

      final state = container.read(authProvider);
      expect(state.status, AuthStatus.unauthenticated);
      expect(state.error, isNotNull);
      expect(state.isLoading, isFalse);
    });

    test('clears previous error before attempting login', () async {
      // First set an error state
      when(() => mockRepo.login(
            email: any(named: 'email'),
            password: any(named: 'password'),
            tenantSlug: any(named: 'tenantSlug'),
          )).thenThrow(AppException(message: 'error', statusCode: 401));

      await container.read(authProvider.notifier).login(
            email: 'a@b.com',
            password: 'x',
          );
      expect(container.read(authProvider).error, isNotNull);

      // Second attempt: stub success, verify error is cleared
      final user = _makeUser();
      when(() => mockRepo.login(
            email: any(named: 'email'),
            password: any(named: 'password'),
            tenantSlug: any(named: 'tenantSlug'),
          )).thenAnswer((_) async => LoginResponse(
            user: user,
            tokens: _makeTokens(),
            requiresMfa: false,
          ));

      await container.read(authProvider.notifier).login(
            email: 'user@example.com',
            password: 'pass',
          );

      expect(container.read(authProvider).error, isNull);
    });
  });

  group('register', () {
    setUp(() async {
      container.read(authProvider);
      await pumpEventQueue();
    });

    test('sets authenticated and stores user on success', () async {
      final user = _makeUser();
      when(() => mockRepo.register(
            email: any(named: 'email'),
            password: any(named: 'password'),
            firstName: any(named: 'firstName'),
            lastName: any(named: 'lastName'),
            role: any(named: 'role'),
            tenantSlug: any(named: 'tenantSlug'),
          )).thenAnswer((_) async => LoginResponse(
            user: user,
            tokens: _makeTokens(),
            requiresMfa: false,
          ));

      await container.read(authProvider.notifier).register(
            email: 'new@example.com',
            password: 'pass123',
            firstName: 'Alice',
            lastName: 'Smith',
          );

      final state = container.read(authProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.user, user);
      expect(state.isLoading, isFalse);
    });

    test('sets error on exception', () async {
      when(() => mockRepo.register(
            email: any(named: 'email'),
            password: any(named: 'password'),
            firstName: any(named: 'firstName'),
            lastName: any(named: 'lastName'),
            role: any(named: 'role'),
            tenantSlug: any(named: 'tenantSlug'),
          )).thenThrow(AppException(message: 'Email taken', statusCode: 409));

      await container.read(authProvider.notifier).register(
            email: 'existing@example.com',
            password: 'pass',
            firstName: 'A',
            lastName: 'B',
          );

      final state = container.read(authProvider);
      expect(state.status, AuthStatus.unauthenticated);
      expect(state.error, isNotNull);
    });
  });

  group('logout', () {
    setUp(() async {
      // Seed an authenticated state
      final user = _makeUser();
      when(() => mockRepo.hasValidSession()).thenAnswer((_) async => true);
      when(() => mockRepo.getCachedUser()).thenAnswer((_) async => user);
      when(() => mockRepo.getCurrentUser()).thenAnswer((_) async => user);

      container.read(authProvider);
      await pumpEventQueue();
    });

    test('sets unauthenticated after successful logout', () async {
      when(() => mockRepo.logout()).thenAnswer((_) async {});

      await container.read(authProvider.notifier).logout();

      final state = container.read(authProvider);
      expect(state.status, AuthStatus.unauthenticated);
      expect(state.user, isNull);
      expect(state.isLoading, isFalse);
    });

    test('still sets unauthenticated even if logout API throws', () async {
      when(() => mockRepo.logout()).thenThrow(Exception('network error'));

      await container.read(authProvider.notifier).logout();

      final state = container.read(authProvider);
      expect(state.status, AuthStatus.unauthenticated);
    });
  });

  group('verifyMfa', () {
    setUp(() async {
      container.read(authProvider);
      await pumpEventQueue();

      // Seed mfaRequired state with a pending email
      final user = _makeUser();
      when(() => mockRepo.login(
            email: any(named: 'email'),
            password: any(named: 'password'),
            tenantSlug: any(named: 'tenantSlug'),
          )).thenAnswer((_) async => LoginResponse(
            user: user,
            tokens: _makeTokens(),
            requiresMfa: true,
          ));

      await container.read(authProvider.notifier).login(
            email: 'user@example.com',
            password: 'pass',
          );
    });

    test('sets authenticated after valid MFA code', () async {
      final user = _makeUser();
      when(() => mockRepo.verifyMfa(
            code: any(named: 'code'),
            email: any(named: 'email'),
          )).thenAnswer((_) async => LoginResponse(
            user: user,
            tokens: _makeTokens(),
            requiresMfa: false,
          ));

      await container.read(authProvider.notifier).verifyMfa(code: '123456');

      final state = container.read(authProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.user, user);
    });

    test('sets error on invalid MFA code', () async {
      when(() => mockRepo.verifyMfa(
            code: any(named: 'code'),
            email: any(named: 'email'),
          )).thenThrow(AppException(message: 'Invalid code', statusCode: 401));

      await container.read(authProvider.notifier).verifyMfa(code: '000000');

      final state = container.read(authProvider);
      expect(state.status, AuthStatus.mfaRequired);
      expect(state.error, isNotNull);
    });
  });

  group('verifyMfa with no pending email', () {
    test('does nothing when pendingMfaEmail is null', () async {
      container.read(authProvider);
      await pumpEventQueue();

      await container.read(authProvider.notifier).verifyMfa(code: '123456');

      verifyNever(() => mockRepo.verifyMfa(
            code: any(named: 'code'),
            email: any(named: 'email'),
          ));
    });
  });

  group('forgotPassword', () {
    setUp(() async {
      container.read(authProvider);
      await pumpEventQueue();
    });

    test('completes without setting error on success', () async {
      when(() => mockRepo.forgotPassword(any())).thenAnswer((_) async {});

      await container.read(authProvider.notifier).forgotPassword('user@example.com');

      final state = container.read(authProvider);
      expect(state.error, isNull);
      expect(state.isLoading, isFalse);
    });

    test('sets error when API throws', () async {
      when(() => mockRepo.forgotPassword(any()))
          .thenThrow(AppException(message: 'Network error', statusCode: 500));

      await container.read(authProvider.notifier).forgotPassword('user@example.com');

      expect(container.read(authProvider).error, isNotNull);
    });
  });

  group('clearError', () {
    setUp(() async {
      container.read(authProvider);
      await pumpEventQueue();
    });

    test('clears the error field', () async {
      // Force an error state via failed login
      when(() => mockRepo.login(
            email: any(named: 'email'),
            password: any(named: 'password'),
            tenantSlug: any(named: 'tenantSlug'),
          )).thenThrow(AppException(message: 'Bad creds', statusCode: 401));
      await container.read(authProvider.notifier).login(
            email: 'x@y.com',
            password: 'bad',
          );
      expect(container.read(authProvider).error, isNotNull);

      container.read(authProvider.notifier).clearError();

      expect(container.read(authProvider).error, isNull);
    });
  });

  group('updateUser', () {
    setUp(() async {
      final user = _makeUser();
      when(() => mockRepo.hasValidSession()).thenAnswer((_) async => true);
      when(() => mockRepo.getCachedUser()).thenAnswer((_) async => user);
      when(() => mockRepo.getCurrentUser()).thenAnswer((_) async => user);

      container.read(authProvider);
      await pumpEventQueue();
    });

    test('replaces the user in state', () {
      final updatedUser = _makeUser().copyWith(firstName: 'Bob');
      container.read(authProvider.notifier).updateUser(updatedUser);

      expect(container.read(authProvider).user?.firstName, 'Bob');
    });
  });

  group('AuthState.copyWith', () {
    test('clearError sets error to null regardless of current value', () {
      const state = AuthState(error: 'oops');
      final result = state.copyWith(clearError: true);
      expect(result.error, isNull);
    });

    test('clearUser sets user to null', () {
      final now = DateTime.now();
      final state = AuthState(
        user: User(
          id: 'u',
          email: 'e',
          firstName: 'f',
          lastName: 'l',
          role: UserRole.student,
          tenantId: 't',
          mfaEnabled: false,
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        ),
      );
      final result = state.copyWith(clearUser: true);
      expect(result.user, isNull);
    });

    test('isAuthenticated returns true only for authenticated status', () {
      const auth = AuthState(status: AuthStatus.authenticated);
      const unauth = AuthState(status: AuthStatus.unauthenticated);
      expect(auth.isAuthenticated, isTrue);
      expect(unauth.isAuthenticated, isFalse);
    });

    test('requiresMfa returns true only for mfaRequired status', () {
      const mfa = AuthState(status: AuthStatus.mfaRequired);
      const auth = AuthState(status: AuthStatus.authenticated);
      expect(mfa.requiresMfa, isTrue);
      expect(auth.requiresMfa, isFalse);
    });
  });
}
