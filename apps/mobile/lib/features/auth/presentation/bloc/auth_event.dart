import 'package:equatable/equatable.dart';

sealed class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

final class AuthLoginRequested extends AuthEvent {
  final String email;
  final String password;
  final String tenantId;

  const AuthLoginRequested({
    required this.email,
    required this.password,
    required this.tenantId,
  });

  @override
  List<Object?> get props => [email, password, tenantId];
}

final class AuthRegisterRequested extends AuthEvent {
  final String email;
  final String password;
  final String firstName;
  final String lastName;
  final String tenantSlug;

  const AuthRegisterRequested({
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
    required this.tenantSlug,
  });

  @override
  List<Object?> get props => [email, password, firstName, lastName, tenantSlug];
}

final class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}

final class AuthCheckStatusRequested extends AuthEvent {
  const AuthCheckStatusRequested();
}
