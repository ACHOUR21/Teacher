import 'package:dio/dio.dart';
import 'home_models.dart';

class HomeRepository {
  final Dio _dio;

  HomeRepository(this._dio);

  /// Fetches all home screen data in parallel.
  Future<HomeData> getHomeData(String userId) async {
    final results = await Future.wait([
      _dio.get('/users/$userId/profile').catchError((_) => Response<dynamic>(
            requestOptions: RequestOptions(path: '/users/$userId/profile'),
            data: {},
          )),
      _dio.get('/courses?enrolled=true&inProgress=true&limit=5').catchError(
          (_) => Response<dynamic>(
                requestOptions: RequestOptions(
                    path: '/courses?enrolled=true&inProgress=true&limit=5'),
                data: [],
              )),
      _dio.get('/gamification/streak').catchError((_) => Response<dynamic>(
            requestOptions: RequestOptions(path: '/gamification/streak'),
            data: {},
          )),
      _dio.get('/gamification/achievements?limit=3').catchError(
          (_) => Response<dynamic>(
                requestOptions: RequestOptions(
                    path: '/gamification/achievements?limit=3'),
                data: [],
              )),
    ]);

    return HomeData.fromResponses(results);
  }
}
