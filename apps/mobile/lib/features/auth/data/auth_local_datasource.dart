import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../domain/models/user.dart';

class AuthLocalDatasource {
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _tokenExpiresAtKey = 'token_expires_at';
  static const String _userKey = 'current_user';

  final FlutterSecureStorage _storage;

  AuthLocalDatasource({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock,
              ),
            );

  Future<void> saveTokens(AuthTokens tokens) async {
    await Future.wait([
      _storage.write(key: _accessTokenKey, value: tokens.accessToken),
      _storage.write(key: _refreshTokenKey, value: tokens.refreshToken),
      _storage.write(
        key: _tokenExpiresAtKey,
        value: tokens.expiresAt.toIso8601String(),
      ),
    ]);
  }

  Future<AuthTokens?> getTokens() async {
    final results = await Future.wait([
      _storage.read(key: _accessTokenKey),
      _storage.read(key: _refreshTokenKey),
      _storage.read(key: _tokenExpiresAtKey),
    ]);

    final accessToken = results[0];
    final refreshToken = results[1];
    final expiresAtStr = results[2];

    if (accessToken == null || refreshToken == null) return null;

    return AuthTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: expiresAtStr != null
          ? DateTime.parse(expiresAtStr)
          : DateTime.now().add(const Duration(hours: 1)),
    );
  }

  Future<String?> getAccessToken() => _storage.read(key: _accessTokenKey);

  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);

  Future<void> saveUser(User user) async {
    final json = jsonEncode(user.toJson());
    await _storage.write(key: _userKey, value: json);
  }

  Future<User?> getUser() async {
    final json = await _storage.read(key: _userKey);
    if (json == null) return null;
    try {
      final map = jsonDecode(json) as Map<String, dynamic>;
      return User.fromJson(map);
    } catch (_) {
      return null;
    }
  }

  Future<void> clearAll() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
      _storage.delete(key: _tokenExpiresAtKey),
      _storage.delete(key: _userKey),
    ]);
  }

  Future<bool> hasValidSession() async {
    final tokens = await getTokens();
    if (tokens == null) return false;
    return !tokens.isExpired;
  }
}
