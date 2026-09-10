import 'package:flutter/foundation.dart';
import '../../core/db/app_database.dart';
import '../../core/domain.dart';
import '../../core/launcher/external_profile_launcher.dart';
import '../../core/safety/safety_guard.dart';
import '../../repositories/target_repository.dart';

enum WorkPhase {
  idle,
  targetReady,
  safetyChecking,
  blocked,
  launchingExternalApp,
  waitingForReturn,
  awaitingManualResult,
  resultSaved,
}

class WorkController extends ChangeNotifier {
  WorkController(this.repository, this.launcher, this.guard, this.owner);
  final TargetRepository repository;
  final ExternalProfileLauncher launcher;
  final SafetyGuard guard;
  final OperatingAccount owner;
  WorkPhase phase = WorkPhase.idle;
  TargetAccount? current;
  SafetyDecision? decision;
  String? error;
  bool busy = false;
  bool breakNotice = false;
  bool _resumedWhileLaunching = false;
  bool _needsOpenRecord = false;
  bool interruptedLaunch = false;
  bool get unresolved =>
      phase == WorkPhase.waitingForReturn ||
      phase == WorkPhase.awaitingManualResult ||
      phase == WorkPhase.launchingExternalApp;

  Future<void> load({String? targetId}) async {
    if (busy || unresolved) return;
    busy = true;
    try {
      final confirmedPending = await repository.setting('pendingTarget');
      final opening = await repository.setting('openingTarget');
      final pending = confirmedPending ?? opening;
      _needsOpenRecord = confirmedPending == null && opening != null;
      interruptedLaunch = _needsOpenRecord;
      final openingOwner = await repository.setting('openingOwner');
      current = pending != null
          ? await repository.target(pending)
          : targetId != null
          ? await repository.target(targetId)
          : (await repository.page(
              owner,
              status: TargetStatus.pending,
              limit: 1,
            )).firstOrNull;
      if (current != null &&
          (current!.platform != owner.platform ||
              current!.isSample != owner.isSample ||
              (openingOwner != null && openingOwner != owner.id) ||
              (current!.ownerId != null && current!.ownerId != owner.id))) {
        throw StateError('運用元が一致しません');
      }
      phase = current == null
          ? WorkPhase.idle
          : pending != null
          ? WorkPhase.awaitingManualResult
          : WorkPhase.targetReady;
      error = null;
    } catch (_) {
      current = null;
      phase = WorkPhase.idle;
      error = '対象を読み込めませんでした。中断作業が別の運用元にある場合はアプリを再起動してください。';
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> open() async {
    if (busy ||
        current == null ||
        unresolved ||
        phase == WorkPhase.resultSaved) {
      return;
    }
    busy = true;
    error = null;
    phase = WorkPhase.safetyChecking;
    notifyListeners();
    try {
      decision = guard.evaluate(await repository.followedDates(owner));
      if (!decision!.allowed) {
        phase = WorkPhase.blocked;
        return;
      }
      await repository.prepareOpen(current!.id, owner);
      phase = WorkPhase.launchingExternalApp;
      _resumedWhileLaunching = false;
      notifyListeners();
      final success = current!.isSample || await launcher.open(current!);
      if (!success) {
        await repository.abandonOpen();
        error = 'プロフィールを開けませんでした。SNSアプリまたはブラウザの設定を確認してください。';
        phase = WorkPhase.targetReady;
        return;
      }
      _needsOpenRecord = true;
      await repository.recordOpen(current!.id, owner);
      _needsOpenRecord = false;
      current = await repository.target(current!.id);
      phase = current!.isSample || _resumedWhileLaunching
          ? WorkPhase.awaitingManualResult
          : WorkPhase.waitingForReturn;
    } catch (_) {
      error = '起動または記録に失敗しました。画面を開いた場合は結果を確認してください。';
      if (_needsOpenRecord || phase == WorkPhase.launchingExternalApp) {
        _needsOpenRecord = true;
        interruptedLaunch = true;
        phase = WorkPhase.awaitingManualResult;
      } else {
        phase = WorkPhase.targetReady;
      }
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  void resumed() {
    if (phase == WorkPhase.launchingExternalApp) _resumedWhileLaunching = true;
    if (phase == WorkPhase.waitingForReturn) {
      phase = WorkPhase.awaitingManualResult;
      notifyListeners();
    }
  }

  Future<void> save(TargetStatus status, {bool cancelled = false}) async {
    if (busy || current == null) return;
    busy = true;
    error = null;
    notifyListeners();
    try {
      if (_needsOpenRecord && !cancelled) {
        // After an interrupted launch, only the user's explicit result confirms it was opened.
        await repository.recordOpen(current!.id, owner);
        _needsOpenRecord = false;
      }
      breakNotice = await repository.setStatus(
        current!.id,
        owner,
        status,
        cancelled: cancelled,
      );
      current = await repository.target(current!.id);
      phase = WorkPhase.resultSaved;
    } catch (_) {
      error = '結果を保存できませんでした。もう一度お試しください。';
    } finally {
      busy = false;
      notifyListeners();
    }
  }
}
