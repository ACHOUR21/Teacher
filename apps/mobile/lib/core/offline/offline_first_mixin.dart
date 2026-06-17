import 'offline_exception.dart';

mixin OfflineFirstMixin {
  Future<T> fetchWithFallback<T>({
    required Future<T> Function() networkFetch,
    required T? Function() cacheRead,
    required Future<void> Function(T) cacheWrite,
    required bool isOnline,
  }) async {
    if (!isOnline) {
      final cached = cacheRead();
      if (cached != null) return cached;
      throw const OfflineException();
    }
    try {
      final result = await networkFetch();
      await cacheWrite(result);
      return result;
    } catch (_) {
      final cached = cacheRead();
      if (cached != null) return cached;
      rethrow;
    }
  }
}
