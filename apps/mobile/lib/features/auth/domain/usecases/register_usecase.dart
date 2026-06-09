import '../../../../core/result/result.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository_interface.dart';

class RegisterUseCase {
  final IAuthRepository _repository;

  const RegisterUseCase(this._repository);

  Future<Result<UserEntity>> call({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String tenantSlug,
  }) {
    return _repository.register(
      email: email,
      password: password,
      firstName: firstName,
      lastName: lastName,
      tenantSlug: tenantSlug,
    );
  }
}
