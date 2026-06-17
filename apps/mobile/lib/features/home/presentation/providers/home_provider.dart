import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../data/home_models.dart';
import '../../data/home_repository.dart';

/// Provides a [HomeRepository] backed by the app-wide Dio instance.
final homeRepositoryProvider = Provider<HomeRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return HomeRepository(apiClient.dio);
});

/// Fetches aggregated home-screen data for the given [userId].
///
/// Uses [FutureProvider.autoDispose.family] so the data is freed when the
/// home screen is not visible, and re-fetched for each unique user ID.
final homeDataProvider =
    FutureProvider.autoDispose.family<HomeData, String>((ref, userId) {
  final repo = ref.watch(homeRepositoryProvider);
  return repo.getHomeData(userId);
});
