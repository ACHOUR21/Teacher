import '../../../../core/result/result.dart';
import '../entities/user_entity.dart';

/// Port (interface) for the auth repository.
///
/// Concrete implementations live in the data layer; the domain layer only
/// depends on this contract.
abstract interface class IAuthRepository {
  /// Authenticate with email/password for the given [tenantId].
  Future<Result<UserEntity>> login({
    required String email,
    required String password,
    required String tenantId,
  });

  /// Register a new tenant + owner account.
  Future<Result<UserEntity>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String tenantSlug,
  });

  /// Sign out the current user and clear stored tokens.
  Future<Result<void>> logout();

  /// Fetch the authenticated user's profile from the remote API.
  Future<Result<UserEntity>> getCurrentUser();

  /// Return the last successfully authenticated user from local cache,
  /// or [null] if no cached session exists.
  Future<UserEntity?> getCachedUser();

  /// Returns [true] when a non-expired access token is present in local storage.
  Future<bool> hasValidSession();
}
