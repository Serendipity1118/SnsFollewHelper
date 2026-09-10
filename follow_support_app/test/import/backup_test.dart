import 'dart:typed_data';
import 'package:drift/drift.dart' show driftRuntimeOptions;
import 'package:flutter_test/flutter_test.dart';
import 'package:follow_support_app/core/domain.dart';
import 'package:follow_support_app/features/import_export/backup_service.dart';
import '../support.dart';

void main() {
  // Each TestStore has a separate in-memory executor: source and destination must coexist.
  setUpAll(() => driftRuntimeOptions.dontWarnAboutMultipleDatabases = true);
  test(
    'complete backup roundtrip restores archived owners, all statuses, logs, pending and counters',
    () async {
      final source = TestStore();
      final dest = TestStore();
      addTearDown(source.db.close);
      addTearDown(dest.db.close);
      final a = await source.repo.addAccount(PlatformType.x, '日本語');
      final archived = await source.repo.addAccount(
        PlatformType.instagram,
        'archive',
      );
      await source.repo.archive(archived.id, true);
      final t = await source.add('user');
      await source.repo.recordOpen(t.id, a);
      await source.repo.setStatus(t.id, a, TargetStatus.followed);
      final pending = await source.add('pending');
      await source.repo.recordOpen(pending.id, a);
      await source.add('free', platform: PlatformType.instagram);
      await source.repo.installSamples();
      final bytes = await BackupService(source.repo).export();
      final service = BackupService(dest.repo);
      final plan = await service.preview(bytes);
      expect(plan.targetConflicts, 0);
      expect(await service.restore(plan, {}), 9);
      expect((await dest.repo.target(t.id))!.status, TargetStatus.followed);
      expect((await dest.repo.pendingTarget())!.id, pending.id);
      expect(
        (await dest.repo.accounts(
          includeArchived: true,
        )).firstWhere((r) => r.id == archived.id).archived,
        true,
      );
      expect((await dest.repo.logs(a)).length, 3);
      expect(
        (await dest.repo.accounts())
            .firstWhere((r) => r.id == a.id)
            .cumulativeFollows,
        1,
      );
      expect(await service.restore(await service.preview(bytes), {}), 0);
      expect((await dest.repo.logs(a)).length, 3);
    },
  );
  test(
    'duplicate name requires mapping; existing target state wins and current data is retained',
    () async {
      final source = TestStore();
      final dest = TestStore();
      addTearDown(source.db.close);
      addTearDown(dest.db.close);
      final a = await source.repo.addAccount(PlatformType.x, 'same');
      final sourceTarget = await source.add('user');
      await source.repo.recordOpen(sourceTarget.id, a);
      await source.repo.setStatus(sourceTarget.id, a, TargetStatus.followed);
      final b = await dest.repo.addAccount(PlatformType.x, 'same');
      await dest.repo.addAccount(PlatformType.x, 'same');
      final existing = await dest.add('user');
      await dest.repo.recordOpen(existing.id, b);
      await dest.repo.setStatus(existing.id, b, TargetStatus.notFollowed);
      final untouched = await dest.add('only_current');
      final service = BackupService(dest.repo);
      final plan = await service.preview(
        await BackupService(source.repo).export(),
      );
      expect(plan.targetConflicts, 1);
      expect(plan.matches[a.id]!.length, 2);
      await expectLater(service.restore(plan, {}), throwsStateError);
      expect(await service.restore(plan, {a.id: b.id}), 0);
      expect(
        (await dest.repo.target(existing.id))!.status,
        TargetStatus.notFollowed,
      );
      expect(await dest.repo.target(untouched.id), isNotNull);
      expect((await dest.repo.accounts()).length, 2);
      expect(await dest.repo.followedDates(b), isEmpty);
    },
  );
  test(
    'empty backup is valid; malformed archive is rejected without mutations',
    () async {
      final s = TestStore();
      addTearDown(s.db.close);
      final service = BackupService(s.repo);
      expect(
        await service.restore(
          await service.preview(await service.export()),
          {},
        ),
        0,
      );
      await expectLater(
        service.preview(Uint8List.fromList([1, 2, 3])),
        throwsA(anything),
      );
      expect(await s.repo.accounts(), isEmpty);
    },
  );
}
