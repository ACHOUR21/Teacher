import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/api/api_client.dart';
import '../../data/auth_local_datasource.dart';
import '../../data/auth_repository.dart';
import '../../domain/models/user.dart';

// Infrastructure providers
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock,
    ),
  );
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(secureStorage: storage);
});

final authLocalDatasourceProvider = Provider<AuthLocalDatasource>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return AuthLocalDatasource(storage: storage);
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final localDatasource = ref.watch(authLocalDatasourceProvider);
  return AuthRepository(
    apiClient: apiClient,
    localDatasource: localDatasource,
  );
});

// Auth state
enum AuthStatus { initial, authenticated, unauthenticated, mfaRequired }

class AuthState {
  final AuthStatus status;
  final User? user;
  final String? error;
  final bool isLoading;
  final String? pendingMfaEmail;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.error,
    this.isLoading = false,
    this.pendingMfaEmail,
  });

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get requiresMfa => status == AuthStatus.mfaRequired;

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? error,
    bool? isLoading,
    String? pendingMfaEmail,
    bool clearError = false,
    bool clearUser = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : (user ?? this.user),
      error: clearError ? null : (error ?? this.error),
      isLoading: isLoading ?? this.isLoading,
      pendingMfaEmail: pendingMfaEmail ?? this.pendingMfaEmail,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(const AuthState()) {
    _checkSession();
  }

  Future<void> _checkSession() async {
    state = state.copyWith(isLoading: true);
    try {
      final hasSession = await _repository.hasValidSession();
      if (hasSession) {
        final user = await _repository.getCachedUser();
        if (user != null) {
          state = state.copyWith(
            status: AuthStatus.authenticated,
            user: user,
            isLoading: false,
          );
          // Refresh user data in background
          _refreshUser();
          return;
        }
      }
    } catch (_) {}
    state = state.copyWith(
      status: AuthStatus.unauthenticated,
      isLoading: false,
    );
  }

  Future<void> _refreshUser() async {
    try {
      final user = await _repository.getCurrentUser();
      state = state.copyWith(user: user);
    } catch (_) {}
  }

  Future<void> login({
    required String email,
    required String password,
    String? tenantSlug,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _repository.login(
        email: email,
        password: password,
        tenantSlug: tenantSlug,
      );

      if (response.requiresMfa) {
        state = state.copyWith(
          status: AuthStatus.mfaRequired,
          isLoading: false,
          pendingMfaEmail: email,
        );
      } else {
        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: response.user,
          isLoading: false,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceAll('AppException(message: ', '').replaceAll(', statusCode:.*', ''),
        status: AuthStatus.unauthenticated,
      );
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    UserRole role = UserRole.student,
    String? tenantSlug,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _repository.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        role: role,
        tenantSlug: tenantSlug,
      );

      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: response.user,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
        status: AuthStatus.unauthenticated,
      );
    }
  }

  Future<void> verifyMfa({required String code}) async {
    final email = state.pendingMfaEmail;
    if (email == null) return;

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _repository.verifyMfa(
        code: code,
        email: email,
      );

      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: response.user,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    try {
      await _repository.logout();
    } finally {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> forgotPassword(String email) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.forgotPassword(email);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  void updateUser(User user) {
    state = state.copyWith(user: user);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return AuthNotifier(repository);
});

final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authProvider).user;
});
