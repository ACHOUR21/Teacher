import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../domain/models/user.dart';
import 'auth_local_datasource.dart';

class AuthRepository {
  final ApiClient _apiClient;
  final AuthLocalDatasource _localDatasource;

  AuthRepository({
    required ApiClient apiClient,
    required AuthLocalDatasource localDatasource,
  })  : _apiClient = apiClient,
        _localDatasource = localDatasource;

  Future<LoginResponse> login({
    required String email,
    required String password,
    String? tenantSlug,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.login,
        data: LoginRequest(
          email: email,
          password: password,
          tenantSlug: tenantSlug,
        ).toJson(),
      );

      final loginResponse = LoginResponse.fromJson(
        response.data as Map<String, dynamic>,
      );

      if (!loginResponse.requiresMfa) {
        await _localDatasource.saveTokens(loginResponse.tokens);
        await _localDatasource.saveUser(loginResponse.user);
      }

      return loginResponse;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<LoginResponse> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    UserRole role = UserRole.student,
    String? tenantSlug,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.register,
        data: RegisterRequest(
          email: email,
          password: password,
          firstName: firstName,
          lastName: lastName,
          role: role,
          tenantSlug: tenantSlug,
        ).toJson(),
      );

      final loginResponse = LoginResponse.fromJson(
        response.data as Map<String, dynamic>,
      );

      await _localDatasource.saveTokens(loginResponse.tokens);
      await _localDatasource.saveUser(loginResponse.user);

      return loginResponse;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<LoginResponse> verifyMfa({
    required String code,
    required String email,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.verifyMfa,
        data: {'code': code, 'email': email},
      );

      final loginResponse = LoginResponse.fromJson(
        response.data as Map<String, dynamic>,
      );

      await _localDatasource.saveTokens(loginResponse.tokens);
      await _localDatasource.saveUser(loginResponse.user);

      return loginResponse;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<void> logout() async {
    try {
      await _apiClient.dio.post(Endpoints.logout);
    } finally {
      await _localDatasource.clearAll();
    }
  }

  Future<void> forgotPassword(String email) async {
    try {
      await _apiClient.dio.post(
        Endpoints.forgotPassword,
        data: {'email': email},
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      await _apiClient.dio.post(
        Endpoints.resetPassword,
        data: {'token': token, 'password': newPassword},
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<User> getCurrentUser() async {
    try {
      final response = await _apiClient.dio.get(Endpoints.me);
      final user = User.fromJson(response.data as Map<String, dynamic>);
      await _localDatasource.saveUser(user);
      return user;
    } on DioException catch (e) {
      // Try local cache on network error
      if (e.type == DioExceptionType.connectionError) {
        final cached = await _localDatasource.getUser();
        if (cached != null) return cached;
      }
      throw _handleDioError(e);
    }
  }

  Future<User?> getCachedUser() => _localDatasource.getUser();

  Future<bool> hasValidSession() => _localDatasource.hasValidSession();

  AppException _handleDioError(DioException e) {
    if (e.error is AppException) return e.error as AppException;
    return AppException(
      message: e.message ?? 'An unexpected error occurred',
      statusCode: e.response?.statusCode,
    );
  }
}
