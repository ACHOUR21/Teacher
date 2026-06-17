import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'endpoints.dart';

class ApiClient {
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';

  final FlutterSecureStorage _secureStorage;
  late final Dio _dio;

  ApiClient({FlutterSecureStorage? secureStorage})
      : _secureStorage = secureStorage ?? const FlutterSecureStorage() {
    _dio = _buildDio();
  }

  Dio get dio => _dio;

  Dio _buildDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: Endpoints.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.addAll([
      _AuthInterceptor(_secureStorage),
      _RefreshTokenInterceptor(_secureStorage, dio),
      _ErrorInterceptor(),
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        error: true,
        logPrint: (o) => _log(o.toString()),
      ),
    ]);

    return dio;
  }

  static void _log(String message) {
    // In production, replace with proper logging framework
    assert(() {
      // ignore: avoid_print
      print('[ApiClient] $message');
      return true;
    }());
  }

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _secureStorage.write(key: _accessTokenKey, value: accessToken),
      _secureStorage.write(key: _refreshTokenKey, value: refreshToken),
    ]);
  }

  Future<void> clearTokens() async {
    await Future.wait([
      _secureStorage.delete(key: _accessTokenKey),
      _secureStorage.delete(key: _refreshTokenKey),
    ]);
  }

  Future<String?> getAccessToken() =>
      _secureStorage.read(key: _accessTokenKey);

  Future<String?> getRefreshToken() =>
      _secureStorage.read(key: _refreshTokenKey);
}

class _AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _secureStorage;
  static const String _accessTokenKey = 'access_token';

  _AuthInterceptor(this._secureStorage);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _secureStorage.read(key: _accessTokenKey);
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}

class _RefreshTokenInterceptor extends Interceptor {
  final FlutterSecureStorage _secureStorage;
  final Dio _dio;
  bool _isRefreshing = false;
  final List<(RequestOptions, ResponseInterceptorHandler)> _pendingRequests =
      [];

  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';

  _RefreshTokenInterceptor(this._secureStorage, this._dio);

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode != 401) {
      handler.next(err);
      return;
    }

    final refreshToken = await _secureStorage.read(key: _refreshTokenKey);
    if (refreshToken == null) {
      handler.next(err);
      return;
    }

    if (_isRefreshing) {
      _pendingRequests.add((err.requestOptions, handler as ResponseInterceptorHandler));
      return;
    }

    _isRefreshing = true;

    try {
      final response = await _dio.post(
        Endpoints.refreshToken,
        data: {'refresh_token': refreshToken},
        options: Options(
          headers: {'Authorization': null},
        ),
      );

      final newAccessToken = response.data['access_token'] as String;
      final newRefreshToken =
          response.data['refresh_token'] as String? ?? refreshToken;

      await Future.wait([
        _secureStorage.write(key: _accessTokenKey, value: newAccessToken),
        _secureStorage.write(key: _refreshTokenKey, value: newRefreshToken),
      ]);

      // Retry original request
      err.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
      final retryResponse = await _dio.fetch(err.requestOptions);
      handler.resolve(retryResponse);

      // Retry pending requests
      for (final (options, pendingHandler) in _pendingRequests) {
        options.headers['Authorization'] = 'Bearer $newAccessToken';
        try {
          final r = await _dio.fetch(options);
          pendingHandler.resolve(r);
        } catch (e) {
          pendingHandler.next(
            DioException(requestOptions: options, error: e),
          );
        }
      }
    } catch (e) {
      await Future.wait([
        _secureStorage.delete(key: _accessTokenKey),
        _secureStorage.delete(key: _refreshTokenKey),
      ]);
      handler.next(err);

      for (final (options, pendingHandler) in _pendingRequests) {
        pendingHandler.next(
          DioException(requestOptions: options, error: 'Session expired'),
        );
      }
    } finally {
      _isRefreshing = false;
      _pendingRequests.clear();
    }
  }
}

class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final message = _extractErrorMessage(err);
    final appException = AppException(
      message: message,
      statusCode: err.response?.statusCode,
      originalError: err,
    );
    handler.next(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: appException,
      ),
    );
  }

  String _extractErrorMessage(DioException err) {
    if (err.response?.data is Map) {
      final data = err.response!.data as Map;
      return data['message']?.toString() ??
          data['error']?.toString() ??
          _defaultMessage(err);
    }
    return _defaultMessage(err);
  }

  String _defaultMessage(DioException err) {
    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timed out. Please try again.';
      case DioExceptionType.connectionError:
        return 'No internet connection. Please check your network.';
      case DioExceptionType.badResponse:
        final code = err.response?.statusCode;
        if (code == 401) return 'Your session has expired. Please log in again.';
        if (code == 403) return 'You do not have permission to perform this action.';
        if (code == 404) return 'The requested resource was not found.';
        if (code != null && code >= 500) return 'Server error. Please try again later.';
        return 'Something went wrong. Please try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}

class AppException implements Exception {
  final String message;
  final int? statusCode;
  final Object? originalError;

  const AppException({
    required this.message,
    this.statusCode,
    this.originalError,
  });

  @override
  String toString() => 'AppException(message: $message, statusCode: $statusCode)';
}
