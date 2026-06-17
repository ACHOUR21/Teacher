import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/get_current_user_usecase.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/register_usecase.dart';
import '../../../../core/result/result.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUseCase _loginUseCase;
  final RegisterUseCase _registerUseCase;
  final LogoutUseCase _logoutUseCase;
  final GetCurrentUserUseCase _getCurrentUserUseCase;

  AuthBloc({
    required LoginUseCase loginUseCase,
    required RegisterUseCase registerUseCase,
    required LogoutUseCase logoutUseCase,
    required GetCurrentUserUseCase getCurrentUserUseCase,
  })  : _loginUseCase = loginUseCase,
        _registerUseCase = registerUseCase,
        _logoutUseCase = logoutUseCase,
        _getCurrentUserUseCase = getCurrentUserUseCase,
        super(const AuthInitial()) {
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthRegisterRequested>(_onRegisterRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthCheckStatusRequested>(_onCheckStatusRequested);
  }

  Future<void> _onLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _loginUseCase(
      email: event.email,
      password: event.password,
      tenantId: event.tenantId,
    );

    switch (result) {
      case Success(:final value):
        emit(AuthAuthenticated(value));
      case Failure(:final message):
        emit(AuthError(message));
    }
  }

  Future<void> _onRegisterRequested(
    AuthRegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _registerUseCase(
      email: event.email,
      password: event.password,
      firstName: event.firstName,
      lastName: event.lastName,
      tenantSlug: event.tenantSlug,
    );

    switch (result) {
      case Success(:final value):
        emit(AuthAuthenticated(value));
      case Failure(:final message):
        emit(AuthError(message));
    }
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _logoutUseCase();

    switch (result) {
      case Success():
        emit(const AuthUnauthenticated());
      case Failure(:final message):
        // Even on error we treat the user as logged out locally.
        emit(AuthError(message));
    }
  }

  Future<void> _onCheckStatusRequested(
    AuthCheckStatusRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _getCurrentUserUseCase();

    switch (result) {
      case Success(:final value):
        emit(AuthAuthenticated(value));
      case Failure(:final message):
        emit(AuthError(message));
    }
  }
}
