import 'dart:io';
import 'package:charset_converter/charset_converter.dart';
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:path_provider/path_provider.dart';
import 'package:follow_support_app/core/db/app_database.dart';
import 'package:follow_support_app/core/domain.dart';
import 'package:follow_support_app/features/import_export/csv_service.dart';
import 'package:follow_support_app/features/import_export/backup_service.dart';
import 'package:follow_support_app/providers.dart';
import 'package:follow_support_app/repositories/target_repository.dart';
import 'package:follow_support_app/ui/work_screen.dart';
import '../test/support.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('Android DB, Shift_JIS, manual lifecycle workflow and backup', (
    tester,
  ) async {
    final dir = await getTemporaryDirectory();
    final file = File(
      '${dir.path}/integration_${DateTime.now().microsecondsSinceEpoch}.sqlite',
    );
    final db = AppDatabase(NativeDatabase(file));
    final clock = FakeClock();
    final repo = DriftTargetRepository(db, clock);
    final owner = await repo.addAccount(PlatformType.x, '自動テスト用');
    final csv = CsvService(repo);
    final bytes = await CharsetConverter.encode(
      'Shift_JIS',
      'platform,username,memo\nx,first,日本語のメモ\nx,second,次の対象',
    );
    final decoded = await csv.decode(bytes);
    expect(decoded, contains('日本語のメモ'));
    expect(await csv.import(await csv.preview(decoded)), 2);
    final first = (await repo.page(owner, search: 'first')).single;
    final launcher = FakeLauncher();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          databaseProvider.overrideWithValue(db),
          clockProvider.overrideWithValue(clock),
          launcherProvider.overrideWithValue(launcher),
        ],
        child: MaterialApp(
          home: WorkScreen(owner: owner, targetId: first.id),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('プロフィールを開く'));
    await tester.tap(find.text('プロフィールを開く'));
    await tester.pumpAndSettle();
    for (final state in [
      AppLifecycleState.inactive,
      AppLifecycleState.hidden,
      AppLifecycleState.paused,
      AppLifecycleState.hidden,
      AppLifecycleState.inactive,
      AppLifecycleState.resumed,
    ]) {
      tester.binding.handleAppLifecycleStateChanged(state);
    }
    await tester.pumpAndSettle();
    expect((await repo.target(first.id))!.status, TargetStatus.pending);
    final followed = find.byKey(const ValueKey('result:followed'));
    await tester.ensureVisible(followed);
    await tester.tap(followed);
    await tester.pumpAndSettle();
    expect((await repo.target(first.id))!.status, TargetStatus.followed);
    await tester.ensureVisible(find.text('次のアカウントを確認'));
    await tester.tap(find.text('次のアカウントを確認'));
    await tester.pumpAndSettle();
    expect(find.text('@second'), findsOneWidget);
    expect(launcher.calls, 1);
    final backup = BackupService(repo);
    expect((await backup.preview(await backup.export())).targetConflicts, 2);
    await tester.pumpWidget(const SizedBox());
    await db.close();
    final reopened = AppDatabase(NativeDatabase(file));
    expect(
      (await DriftTargetRepository(reopened, clock).target(first.id))!.status,
      TargetStatus.followed,
    );
    await reopened.close();
    await file.delete();
  });
}
