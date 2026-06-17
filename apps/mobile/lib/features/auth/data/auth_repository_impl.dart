import '../../../core/api/api_client.dart';
import '../../../core/result/result.dart';
import '../domain/entities/user_entity.dart';
import '../domain/repositories/auth_repository_interface.dart';
import 'auth_local_datasource.dart';
import 'auth_remote_datasource.dart';

/// Concrete implementation of [IAuthRepository].
///
/// Bridges the remote datasource + local datasource to the domain layer.
/// All exceptions from the datasources are [AppException] instances (set up
/// by [_ErrorInterceptor] in api_client.dart); we catch them here and wrap
/// them in [Failure] so the BLoC never sees raw exceptions.
class AuthRepositoryImpl implements IAuthRepository {
  final AuthRemoteDataSource _remote;
  final AuthLocalDatasource _local;
  final ApiClient _apiClient;

  const AuthRepositoryImpl({
    required AuthRemoteDataSource remote,
    required AuthLocalDatasource local,
    required ApiClient apiClient,
  })  : _remote = remote,
        _local = local,
        _apiClient = apiClient;

  @override
  Future<Result<UserEntity>> login({
    required String email,
    required String password,
    required String tenantId,
  }) async {
    try {
      final json = await _remote.login(
        email: email,
        password: password,
        tenantId: tenantId,
      );

      final tokensMap = json['tokens'] as Map<String, dynamic>?;
      final accessToken = tokensMap?['access_token'] as String? ?? '';
      final refreshToken = tokensMap?['refresh_token'] as String? ?? '';

      final userMap = json['user'] as Map<String, dynamic>?;
      if (userMap == null) {
        return const Failure(message: 'Invalid login response from server.');
      }

      final entity = UserEntity.fromJson(
        userMap,
        accessToken: accessToken,
        refreshToken: refreshToken,
      );

      await _apiClient.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );

      return Success(entity);
    } on AppException catch (e) {
      return Failure(message: e.message, statusCode: e.statusCode);
    } catch (e) {
      return Failure(message: e.toString());
    }
  }

  @override
  Future<Result<UserEntity>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String tenantSlug,
  }) async {
    try {
      final json = await _remote.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        tenantSlug: tenantSlug,
      );

      final tokensMap = json['tokens'] as Map<String, dynamic>?;
      final accessToken = tokensMap?['access_token'] as String? ?? '';
      final refreshToken = tokensMap?['refresh_token'] as String? ?? '';

      final userMap = json['user'] as Map<String, dynamic>?;
      if (userMap == null) {
        return const Failure(message: 'Invalid registration response from server.');
      }

      final entity = UserEntity.fromJson(
        userMap,
        accessToken: accessToken,
        refreshToken: refreshToken,
      );

      await _apiClient.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );

      return Success(entity);
    } on AppException catch (e) {
      return Failure(message: e.message, statusCode: e.statusCode);
    } catch (e) {
      return Failure(message: e.toString());
    }
  }

  @override
  Future<Result<void>> logout() async {
    try {
      // Best-effort remote logout.  The remote datasource does not expose a
      // logout method, so we call the endpoint directly through the Dio client
      // and swallow any error so that a failed network call never blocks the
      // user from being signed out locally.
      try {
        await _apiClient.dio.post('/auth/logout');
      } catch (_) {
        // Ignore remote errors during logout.
      }
      await Future.wait([
        _local.clearAll(),
        _apiClient.clearTokens(),
      ]);
      return const Success(null);
    } on AppException catch (e) {
      return Failure(message: e.message, statusCode: e.statusCode);
    } catch (e) {
      return Failure(message: e.toString());
    }
  }

  @override
  Future<Result<UserEntity>> getCurrentUser() async {
    try {
      final json = await _remote.getMe();
      final accessToken = await _apiClient.getAccessToken() ?? '';
      final refreshToken = await _apiClient.getRefreshToken() ?? '';
      final entity = UserEntity.fromJson(
        json,
        accessToken: accessToken,
        refreshToken: refreshToken,
      );
      return Success(entity);
    } on AppException catch (e) {
      return Failure(message: e.message, statusCode: e.statusCode);
    } catch (e) {
      return Failure(message: e.toString());
    }
  }

  @override
  Future<UserEntity?> getCachedUser() async {
    final user = await _local.getUser();
    if (user == null) return null;
    final accessToken = await _apiClient.getAccessToken() ?? '';
    final refreshToken = await _apiClient.getRefreshToken() ?? '';
    return UserEntity(
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: UserEntityRole.values.firstWhere(
        (r) => r.name == user.role.name,
        orElse: () => UserEntityRole.student,
      ),
      tenantId: user.tenantId,
      avatarUrl: user.avatarUrl,
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }

  @override
  Future<bool> hasValidSession() => _local.hasValidSession();
}
