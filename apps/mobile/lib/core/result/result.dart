/// A simple Result type used in place of dartz's Either.
///
/// [Result<T>] is either a [Success<T>] wrapping a value or a [Failure<T>]
/// wrapping an [AppException].  Use pattern-matching (switch / when) or the
/// helper getters to inspect the outcome.
sealed class Result<T> {
  const Result();

  bool get isSuccess => this is Success<T>;
  bool get isFailure => this is Failure<T>;

  T? get valueOrNull => switch (this) {
        Success<T>(value: final v) => v,
        Failure<T>() => null,
      };

  String? get errorMessageOrNull => switch (this) {
        Failure<T>(message: final m) => m,
        Success<T>() => null,
      };
}

final class Success<T> extends Result<T> {
  final T value;
  const Success(this.value);
}

final class Failure<T> extends Result<T> {
  final String message;
  final int? statusCode;

  const Failure({required this.message, this.statusCode});
}
