import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/db/app_database.dart';
import 'core/domain.dart';
import 'core/launcher/external_profile_launcher.dart';
import 'core/safety/safety_guard.dart';
import 'repositories/target_repository.dart';

final databaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});
final clockProvider = Provider<AppClock>((ref) => const SystemClock());
final repositoryProvider = Provider(
  (ref) => DriftTargetRepository(
    ref.watch(databaseProvider),
    ref.watch(clockProvider),
  ),
);
final launcherProvider = Provider<ExternalProfileLauncher>(
  (ref) => UrlLauncherProfileLauncher(),
);
final safetyProvider = Provider((ref) => SafetyGuard(ref.watch(clockProvider)));
