import 'package:flutter_test/flutter_test.dart';
import 'package:follow_support_app/core/domain.dart';
import 'package:follow_support_app/core/db/app_database.dart';
import '../support.dart';

void main() {
  late TestStore s;
  late OperatingAccount a;
  late OperatingAccount b;
  setUp(() async {
    s = TestStore();
    a = await s.repo.addAccount(PlatformType.x, 'same');
    b = await s.repo.addAccount(PlatformType.x, 'same');
  });
  tearDown(() => s.db.close());
  test(
    'shared unassigned list, claim on success, oldest first, owner isolation',
    () async {
      final first = await s.add('first');
      s.clock.time = s.clock.time.add(const Duration(seconds: 1));
      final second = await s.add('second');
      expect((await s.repo.page(a)).map((t) => t.id), [first.id, second.id]);
      expect(await s.repo.pendingCount(b), 2);
      await s.repo.recordOpen(first.id, a);
      expect((await s.repo.page(b)).map((t) => t.id), [second.id]);
      expect((await s.repo.target(first.id))!.openCount, 1);
      expect(
        (await s.repo.logs(a)).single.actionType,
        ActionType.profileOpened,
      );
      await expectLater(
        s.repo.setStatus(first.id, b, TargetStatus.followed),
        throwsStateError,
      );
    },
  );
  test(
    'requested/previously followed not counted; transitions and reset preserve logs and opens',
    () async {
      final t = await s.add('user');
      await s.repo.recordOpen(t.id, a);
      await s.repo.setStatus(t.id, a, TargetStatus.requested);
      expect(await s.repo.followedDates(a), isEmpty);
      await s.repo.setStatus(t.id, a, TargetStatus.followed);
      final followed = (await s.repo.target(t.id))!.followedAt;
      s.clock.time = s.clock.time.add(const Duration(minutes: 1));
      await s.repo.setStatus(t.id, a, TargetStatus.followed);
      expect((await s.repo.target(t.id))!.followedAt, followed);
      expect((await s.repo.followedDates(a)).length, 1);
      await s.repo.setStatus(t.id, a, TargetStatus.previouslyFollowed);
      expect(await s.repo.followedDates(a), isEmpty);
      await s.repo.setStatus(t.id, a, TargetStatus.pending);
      final reset = (await s.repo.target(t.id))!;
      expect(reset.ownerId, a.id);
      expect(reset.openCount, 1);
      expect(reset.processedAt, isNull);
      expect((await s.repo.logs(a)).length, 6);
    },
  );
  test(
    'cancel is durable skip, blocks another target until resolved',
    () async {
      final t = await s.add('first');
      final other = await s.add('second');
      await s.repo.recordOpen(t.id, a);
      await expectLater(s.repo.recordOpen(other.id, a), throwsStateError);
      await expectLater(
        s.repo.setStatus(other.id, a, TargetStatus.skipped),
        throwsStateError,
      );
      await s.repo.setStatus(t.id, a, TargetStatus.skipped, cancelled: true);
      expect(await s.repo.pendingTarget(), isNull);
      expect(
        (await s.repo.page(a, status: TargetStatus.pending)).map((t) => t.id),
        [other.id],
      );
      expect(
        (await s.repo.logs(a)).any((l) => l.actionType == ActionType.cancelled),
        true,
      );
      expect((await s.repo.target(t.id))!.ownerId, a.id);
    },
  );
  test(
    'reassignment clears contribution but keeps original history and opens',
    () async {
      final t = await s.add('user');
      await s.repo.recordOpen(t.id, a);
      await s.repo.setStatus(t.id, a, TargetStatus.followed);
      await s.repo.reassign(t.id, a, b);
      expect(await s.repo.followedDates(a), isEmpty);
      final moved = (await s.repo.target(t.id))!;
      expect(moved.ownerId, b.id);
      expect(moved.status, TargetStatus.pending);
      expect(moved.openCount, 1);
      expect((await s.repo.logs(a)).length, 3);
      expect(await s.repo.page(a), isEmpty);
    },
  );
  test('archive/restore preserves assignment and rate counts', () async {
    final t = await s.add('user');
    await s.repo.recordOpen(t.id, a);
    await expectLater(s.repo.archive(a.id, true), throwsStateError);
    await s.repo.setStatus(t.id, a, TargetStatus.followed);
    await s.repo.archive(a.id, true);
    expect((await s.repo.accounts()).map((a) => a.id), [b.id]);
    expect((await s.repo.followedDates(a)).length, 1);
    await s.repo.archive(a.id, false);
    expect((await s.repo.accounts()).length, 2);
  });
  test(
    'delete operations affect only selected owner; history deletion keeps rate count',
    () async {
      final first = await s.add('first');
      final second = await s.add('second');
      final unassigned = await s.add('free');
      await s.repo.recordOpen(first.id, a);
      await s.repo.setStatus(first.id, a, TargetStatus.followed);
      await s.repo.recordOpen(second.id, b);
      await s.repo.setStatus(second.id, b, TargetStatus.followed);
      await s.repo.deleteHistory(a);
      expect(await s.repo.logs(a), isEmpty);
      expect((await s.repo.logs(b)).length, 2);
      expect((await s.repo.followedDates(a)).length, 1);
      await s.repo.deleteTargets(a);
      expect(await s.repo.target(first.id), isNull);
      expect(await s.repo.target(second.id), isNotNull);
      expect(await s.repo.target(unassigned.id), isNotNull);
    },
  );
  test(
    'break notice fires once at cumulative 5 and survives corrections',
    () async {
      for (var i = 0; i < 6; i++) {
        final t = await s.add('user$i');
        await s.repo.recordOpen(t.id, a);
        expect(await s.repo.setStatus(t.id, a, TargetStatus.followed), i == 4);
        await s.repo.setStatus(t.id, a, TargetStatus.notFollowed);
      }
      final actual = (await s.repo.accounts()).firstWhere((r) => r.id == a.id);
      expect(actual.cumulativeFollows, 6);
      expect(actual.breakNoticeShown, true);
    },
  );
  test(
    'samples install idempotently, stay isolated, delete only samples',
    () async {
      final real = await s.add('real');
      await s.repo.installSamples();
      await s.repo.installSamples();
      expect((await s.db.select(s.db.targets).get()).length, 7);
      expect((await s.repo.page(a)).map((t) => t.id), [real.id]);
      await s.repo.removeSamples();
      expect((await s.db.select(s.db.targets).get()).single.id, real.id);
      expect((await s.repo.accounts()).length, 2);
    },
  );
}
