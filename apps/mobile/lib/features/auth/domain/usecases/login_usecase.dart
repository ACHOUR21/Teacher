import '../../../../core/result/result.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository_interface.dart';

class LoginUseCase {
  final IAuthRepository _repository;

  const LoginUseCase(this._repository);

  Future<Result<UserEntity>> call({
    required String email,
    required String password,
    required String tenantId,
  }) {
    return _repository.login(
      email: email,
      password: password,
      tenantId: tenantId,
    );
  }
}
