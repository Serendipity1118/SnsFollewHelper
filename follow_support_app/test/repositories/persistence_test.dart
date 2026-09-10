import 'dart:io';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:follow_support_app/core/db/app_database.dart';
import 'package:follow_support_app/core/domain.dart';
import 'package:follow_support_app/features/import_export/csv_service.dart';
import 'package:follow_support_app/repositories/target_repository.dart';
import '../support.dart';

void main() {
  test(
    'real database close/reopen retains unresolved target and logs',
    () async {
      final directory = await Directory.systemTemp.createTemp(
        'follow_support_test_',
      );
      final file = File('${directory.path}/test.sqlite');
      final clock = FakeClock();
      final db = AppDatabase(NativeDatabase(file));
      final repo = DriftTargetRepository(db, clock);
      final owner = await repo.addAccount(PlatformType.x, 'persist');
      await CsvService(
        repo,
      ).import(parseTargetsCsv('platform,username\nx,persisted'));
      final target = (await repo.page(owner)).single;
      await repo.recordOpen(target.id, owner);
      await db.close();
      final reopened = AppDatabase(NativeDatabase(file));
      final next = DriftTargetRepository(reopened, clock);
      expect((await next.pendingTarget())!.id, target.id);
      expect((await next.target(target.id))!.openCount, 1);
      expect((await next.target(target.id))!.status, TargetStatus.pending);
      expect(
        (await next.logs(owner)).single.actionType,
        ActionType.profileOpened,
      );
      await reopened.close();
      await directory.delete(recursive: true);
    },
  );
}
