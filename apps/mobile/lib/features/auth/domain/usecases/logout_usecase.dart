import '../../../../core/result/result.dart';
import '../repositories/auth_repository_interface.dart';

class LogoutUseCase {
  final IAuthRepository _repository;

  const LogoutUseCase(this._repository);

  Future<Result<void>> call() => _repository.logout();
}
