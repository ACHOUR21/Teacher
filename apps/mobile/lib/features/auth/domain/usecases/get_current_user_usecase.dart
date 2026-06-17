import '../../../../core/result/result.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository_interface.dart';

class GetCurrentUserUseCase {
  final IAuthRepository _repository;

  const GetCurrentUserUseCase(this._repository);

  Future<Result<UserEntity>> call() => _repository.getCurrentUser();
}
