import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:follow_support_app/app.dart';
import 'package:follow_support_app/core/domain.dart';
import 'package:follow_support_app/providers.dart';
import 'package:follow_support_app/ui/work_screen.dart';
import 'package:follow_support_app/ui/settings_screen.dart';
import 'package:follow_support_app/ui/import_export_screens.dart';
import 'package:follow_support_app/features/import_export/csv_service.dart';
import 'support.dart';

void main() {
  testWidgets('startup requires operating account and explicit confirmation', (
    tester,
  ) async {
    final s = TestStore();
    addTearDown(s.db.close);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [databaseProvider.overrideWithValue(s.db)],
        child: const FollowSupportApp(),
      ),
    );
    await tester.pumpAndSettle();
    final start = find.widgetWithText(FilledButton, 'この運用元で始める');
    await tester.ensureVisible(start);
    expect(tester.widget<FilledButton>(start).onPressed, isNull);
    await tester.enterText(find.byType(TextField), 'テスト運用元');
    await tester.ensureVisible(find.text('運用元を登録'));
    await tester.tap(find.text('運用元を登録'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(start);
    await tester.tap(start);
    await tester.pumpAndSettle();
    expect(find.text('運用元を確認'), findsOneWidget);
    expect(find.text('ダッシュボード'), findsNothing);
    await tester.tap(find.text('確認しました'));
    await tester.pumpAndSettle();
    expect(find.text('ダッシュボード'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });
  testWidgets(
    'manual result buttons, lifecycle and next keep external launch explicit',
    (tester) async {
      final s = TestStore();
      addTearDown(s.db.close);
      final owner = await s.repo.addAccount(PlatformType.x, 'main');
      final t = await s.add('first');
      await s.add('second');
      final launcher = FakeLauncher();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            databaseProvider.overrideWithValue(s.db),
            clockProvider.overrideWithValue(s.clock),
            launcherProvider.overrideWithValue(launcher),
          ],
          child: MaterialApp(
            home: WorkScreen(owner: owner, targetId: t.id),
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('プロフィールを開く'));
      await tester.pumpAndSettle();
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.hidden);
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.hidden);
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
      await tester.pumpAndSettle();
      expect((await s.repo.target(t.id))!.status, TargetStatus.pending);
      expect(launcher.calls, 1);
      final button = find.byKey(const ValueKey('result:followed'));
      await tester.ensureVisible(button);
      await tester.tap(button);
      await tester.pumpAndSettle();
      expect((await s.repo.target(t.id))!.status, TargetStatus.followed);
      expect(find.text('結果を保存しました'), findsOneWidget);
      final next = find.text('次のアカウントを確認');
      await tester.ensureVisible(next);
      await tester.tap(next);
      await tester.pumpAndSettle();
      expect(find.text('@second'), findsOneWidget);
      expect(launcher.calls, 1);
      await tester.pumpWidget(const SizedBox());
    },
  );
  testWidgets('import preview displays valid/duplicate/invalid independently', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          home: ImportPreviewScreen(
            rows: parseTargetsCsv('platform,username\nx,user\nx,USER\nno,bad'),
          ),
        ),
      ),
    );
    expect(find.textContaining('追加可能：1'), findsOneWidget);
    expect(find.textContaining('重複：既存'), findsOneWidget);
    expect(find.text('SNS種別が不正です'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });
  testWidgets(
    'About and bundled Privacy state manual operation and no affiliation',
    (tester) async {
      await tester.pumpWidget(const MaterialApp(home: AboutScreen()));
      expect(find.textContaining('自動操作は行いません'), findsOneWidget);
      final policy = find.text('プライバシーポリシー');
      await tester.ensureVisible(policy);
      await tester.tap(policy);
      await tester.pumpAndSettle();
      expect(find.textContaining('広告SDK、分析SDK、追跡はありません'), findsOneWidget);
      await tester.pumpWidget(const SizedBox());
    },
  );
}
