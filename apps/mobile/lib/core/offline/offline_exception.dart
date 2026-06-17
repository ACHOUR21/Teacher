class OfflineException implements Exception {
  final String message;
  const OfflineException([this.message = 'No internet connection and no cached data available']);

  @override
  String toString() => 'OfflineException: $message';
}
