import 'dart:async';
import 'package:drift/native.dart';
import 'package:follow_support_app/core/db/app_database.dart';
import 'package:follow_support_app/core/domain.dart';
import 'package:follow_support_app/core/launcher/external_profile_launcher.dart';
import 'package:follow_support_app/repositories/target_repository.dart';
import 'package:follow_support_app/features/import_export/csv_service.dart';

class FakeClock implements AppClock {
  FakeClock([DateTime? date]) : time = date ?? DateTime.utc(2026, 9, 9, 12);
  DateTime time;
  @override
  DateTime now() => time;
}

class FakeLauncher implements ExternalProfileLauncher {
  bool success = true;
  int calls = 0;
  Completer<bool>? pending;
  void Function()? duringOpen;
  @override
  Future<bool> open(TargetAccount target) async {
    calls++;
    duringOpen?.call();
    return pending == null ? success : pending!.future;
  }
}

class TestStore {
  final clock = FakeClock();
  final db = AppDatabase(NativeDatabase.memory());
  late final repo = DriftTargetRepository(db, clock);
  Future<TargetAccount> add(
    String username, {
    PlatformType platform = PlatformType.x,
  }) async {
    await CsvService(
      repo,
    ).import(parseTargetsCsv('platform,username\n${platform.name},$username'));
    return (await db.select(db.targets).get()).firstWhere(
      (t) => t.username == username && t.platform == platform,
    );
  }
}
