import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';

class AuthRemoteDataSource {
  final ApiClient _apiClient;

  AuthRemoteDataSource(this._apiClient);

  /// POST /auth/login with optional X-Tenant-ID header.
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    required String tenantId,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.login,
        data: {
          'email': email,
          'password': password,
        },
        options: Options(
          headers: {'X-Tenant-ID': tenantId},
        ),
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /auth/tenant/register — creates a new tenant and owner account.
  Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String tenantSlug,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.tenantRegister,
        data: {
          'first_name': firstName,
          'last_name': lastName,
          'email': email,
          'password': password,
          'tenant_slug': tenantSlug,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /auth/refresh — exchange a refresh token for a new token pair.
  Future<Map<String, dynamic>> refreshToken(String token) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.refreshToken,
        data: {'refresh_token': token},
        // Strip the existing Authorization header so we don't send an expired
        // access token while obtaining a new one.
        options: Options(headers: {'Authorization': null}),
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /auth/mfa/challenge — verify a TOTP / SMS code during the MFA step.
  Future<Map<String, dynamic>> verifyMfa({
    required String challengeToken,
    required String code,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.mfaChallenge,
        data: {
          'challenge_token': challengeToken,
          'code': code,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /auth/forgot-password — send a password-reset e-mail.
  Future<void> forgotPassword(String email) async {
    try {
      await _apiClient.dio.post(
        Endpoints.forgotPassword,
        data: {'email': email},
      );
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /auth/reset-password — consume a reset token and set a new password.
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      await _apiClient.dio.post(
        Endpoints.resetPassword,
        data: {
          'token': token,
          'password': newPassword,
        },
      );
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// GET /auth/me — return the currently authenticated user.
  Future<Map<String, dynamic>> getMe() async {
    try {
      final response = await _apiClient.dio.get(Endpoints.me);
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  AppException _mapError(DioException e) {
    if (e.error is AppException) return e.error as AppException;
    return AppException(
      message: e.message ?? 'An unexpected error occurred',
      statusCode: e.response?.statusCode,
      originalError: e,
    );
  }
}
