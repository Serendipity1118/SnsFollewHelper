import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:follow_support_app/core/db/app_database.dart';
import 'package:follow_support_app/core/domain.dart';
import 'package:follow_support_app/core/safety/safety_guard.dart';
import 'package:follow_support_app/features/work/work_controller.dart';
import '../support.dart';

void main() {
  late TestStore s;
  late OperatingAccount owner;
  late FakeLauncher launcher;
  late WorkController c;
  setUp(() async {
    s = TestStore();
    owner = await s.repo.addAccount(PlatformType.x, 'main');
    launcher = FakeLauncher();
    c = WorkController(s.repo, launcher, SafetyGuard(s.clock), owner);
  });
  tearDown(() async {
    c.dispose();
    await s.db.close();
  });
  test(
    'write-ahead launch interruption recovers without inferring success and can cancel',
    () async {
      final t = await s.add('interrupted');
      await s.repo.prepareOpen(t.id, owner);
      await c.load();
      expect(c.interruptedLaunch, true);
      expect(c.phase, WorkPhase.awaitingManualResult);
      expect((await s.repo.target(t.id))!.openCount, 0);
      expect((await s.repo.target(t.id))!.ownerId, isNull);
      await c.save(TargetStatus.skipped, cancelled: true);
      expect((await s.repo.target(t.id))!.openCount, 0);
      expect(await s.repo.pendingTarget(), isNull);
      expect(
        (await s.repo.logs(owner)).single.actionType,
        ActionType.cancelled,
      );
    },
  );
  test(
    'interrupted launch is recorded only after explicit manual result',
    () async {
      final t = await s.add('interrupted');
      await s.repo.prepareOpen(t.id, owner);
      await c.load();
      await c.save(TargetStatus.followed);
      expect((await s.repo.target(t.id))!.openCount, 1);
      expect((await s.repo.target(t.id))!.status, TargetStatus.followed);
      expect(launcher.calls, 0);
    },
  );
  test(
    'wrong owner pending recovery never exposes a launchable target',
    () async {
      final other = await s.repo.addAccount(PlatformType.x, 'other');
      final t = await s.add('otheruser');
      await s.repo.prepareOpen(t.id, other);
      await c.load();
      await c.open();
      expect(c.current, isNull);
      expect(c.error, isNotNull);
      expect(launcher.calls, 0);
    },
  );
  test(
    'open -> resumed -> manual save -> next never auto-launches or auto-saves',
    () async {
      final t = await s.add('first');
      await s.add('second');
      await c.load(targetId: t.id);
      expect(c.phase, WorkPhase.targetReady);
      await c.open();
      expect(c.phase, WorkPhase.waitingForReturn);
      expect(launcher.calls, 1);
      c.resumed();
      c.resumed();
      expect(c.phase, WorkPhase.awaitingManualResult);
      expect((await s.repo.target(t.id))!.status, TargetStatus.pending);
      await c.load();
      expect(c.current!.id, t.id);
      await c.save(TargetStatus.followed);
      expect(c.phase, WorkPhase.resultSaved);
      expect(launcher.calls, 1);
      expect((await s.repo.target(t.id))!.status, TargetStatus.followed);
      await c.load();
      expect(c.current!.username, 'second');
      expect(launcher.calls, 1);
    },
  );
  test(
    'launch failure leaves assignment, counters and logs unchanged and is retryable',
    () async {
      final t = await s.add('user');
      await c.load();
      launcher.success = false;
      await c.open();
      expect(c.phase, WorkPhase.targetReady);
      expect(c.error, isNotNull);
      final actual = (await s.repo.target(t.id))!;
      expect(actual.ownerId, isNull);
      expect(actual.openCount, 0);
      expect(actual.lastOpenedAt, isNull);
      expect(await s.repo.pendingTarget(), isNull);
      expect(await s.repo.logs(owner), isEmpty);
      launcher.success = true;
      await c.open();
      expect(c.phase, WorkPhase.waitingForReturn);
    },
  );
  test(
    'double tap and early resume race create only one launch and preserve return state',
    () async {
      await s.add('user');
      await c.load();
      launcher.pending = Completer<bool>();
      launcher.duringOpen = c.resumed;
      final opening = c.open();
      while (launcher.calls == 0) {
        await Future<void>.delayed(Duration.zero);
      }
      await c.open();
      expect(launcher.calls, 1);
      launcher.pending!.complete(true);
      await opening;
      expect(c.phase, WorkPhase.awaitingManualResult);
      expect((await s.repo.target(c.current!.id))!.openCount, 1);
    },
  );
  test(
    'new controller restores pending input without launching or saving',
    () async {
      final t = await s.add('user');
      await c.load();
      await c.open();
      final restored = WorkController(
        s.repo,
        launcher,
        SafetyGuard(s.clock),
        owner,
      );
      addTearDown(restored.dispose);
      await restored.load();
      expect(restored.current!.id, t.id);
      expect(restored.phase, WorkPhase.awaitingManualResult);
      expect(launcher.calls, 1);
      expect(restored.current!.status, TargetStatus.pending);
      await restored.save(TargetStatus.skipped, cancelled: true);
      expect(await s.repo.pendingTarget(), isNull);
    },
  );
  test(
    'rate cap blocks every external open but allows recording results and retry later',
    () async {
      for (var i = 0; i < 15; i++) {
        final t = await s.add('u$i');
        await s.repo.recordOpen(t.id, owner);
        await s.repo.setStatus(t.id, owner, TargetStatus.followed);
      }
      final next = await s.add('next');
      await c.load();
      await c.open();
      expect(c.phase, WorkPhase.blocked);
      expect(launcher.calls, 0);
      expect((await s.repo.target(next.id))!.openCount, 0);
      s.clock.time = c.decision!.retryAt!;
      await c.open();
      expect(launcher.calls, 1);
      await c.save(TargetStatus.requested);
      expect(c.phase, WorkPhase.resultSaved);
    },
  );
  test('sample result workflow never calls external launcher', () async {
    await s.repo.installSamples();
    final sampleOwner = (await s.repo.accounts()).firstWhere(
      (a) => a.isSample && a.platform == PlatformType.x,
    );
    final sample = WorkController(
      s.repo,
      launcher,
      SafetyGuard(s.clock),
      sampleOwner,
    );
    addTearDown(sample.dispose);
    await sample.load();
    await sample.open();
    expect(launcher.calls, 0);
    expect(sample.phase, WorkPhase.awaitingManualResult);
    await sample.save(TargetStatus.followed);
    expect(sample.phase, WorkPhase.resultSaved);
  });
}
