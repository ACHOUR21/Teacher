import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../api/endpoints.dart';
import '../offline/connectivity_service.dart';
import '../offline/offline_storage.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';

enum SyncState { idle, syncing, error }

class ProgressSyncNotifier extends StateNotifier<SyncState> {
  final Ref _ref;

  ProgressSyncNotifier(this._ref) : super(SyncState.idle) {
    _ref.listen<AsyncValue<bool>>(connectivityProvider, (previous, next) {
      final wasOnline = previous?.valueOrNull ?? true;
      final isNowOnline = next.valueOrNull ?? true;
      if (!wasOnline && isNowOnline) {
        syncPendingProgress();
      }
    });
  }

  Future<void> syncPendingProgress() async {
    final pending = OfflineStorage.getAllOfflineProgress();
    if (pending.isEmpty) return;

    state = SyncState.syncing;
    final apiClient = _ref.read(apiClientProvider);

    try {
      for (final entry in pending.entries) {
        final courseId = entry.key;
        final progress = entry.value;
        try {
          await apiClient.dio.put(
            '${Endpoints.baseUrl}${Endpoints.courseProgress(courseId)}',
            data: progress,
          );
          await OfflineStorage.clearOfflineProgress(courseId);
        } catch (_) {
          // keep for next sync attempt
        }
      }
      state = SyncState.idle;
    } catch (_) {
      state = SyncState.error;
    }
  }
}

final progressSyncProvider =
    StateNotifierProvider<ProgressSyncNotifier, SyncState>(
  (ref) => ProgressSyncNotifier(ref),
);
