import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';
import '../core/db/app_database.dart';
import '../core/domain.dart';

abstract interface class TargetRepository {
  Future<TargetAccount?> target(String id);
  Future<List<TargetAccount>> page(
    OperatingAccount owner, {
    TargetStatus? status,
    String search,
    String group,
    int offset,
    int limit,
  });
  Future<List<DateTime>> followedDates(OperatingAccount owner);
  Future<void> recordOpen(String id, OperatingAccount owner);
  Future<void> prepareOpen(String id, OperatingAccount owner);
  Future<void> abandonOpen();
  Future<bool> setStatus(
    String id,
    OperatingAccount owner,
    TargetStatus status, {
    bool cancelled,
  });
  Future<String?> setting(String key);
}

class DriftTargetRepository implements TargetRepository {
  DriftTargetRepository(this.db, this.clock);
  final AppDatabase db;
  final AppClock clock;
  final _uuid = const Uuid();

  Future<List<OperatingAccount>> accounts({bool includeArchived = false}) =>
      (db.select(db.operatingAccounts)
            ..where(
              (a) => includeArchived
                  ? const Constant(true)
                  : a.archived.equals(false),
            )
            ..orderBy([
              (a) => OrderingTerm.asc(a.createdAt),
              (a) => OrderingTerm.asc(a.id),
            ]))
          .get();

  Future<OperatingAccount> addAccount(
    PlatformType platform,
    String name, {
    bool sample = false,
  }) async {
    if (name.trim().isEmpty) throw const FormatException('表示名を入力してください');
    return db
        .into(db.operatingAccounts)
        .insertReturning(
          OperatingAccountsCompanion.insert(
            id: _uuid.v4(),
            platform: platform,
            displayName: name.trim(),
            isSample: Value(sample),
            createdAt: clock.now(),
          ),
        );
  }

  Future<void> archive(String id, bool value) async {
    final pending = await pendingTarget();
    if (pending?.ownerId == id || await setting('openingOwner') == id) {
      throw StateError('先に作業結果を登録してください');
    }
    await (db.update(db.operatingAccounts)..where((a) => a.id.equals(id)))
        .write(OperatingAccountsCompanion(archived: Value(value)));
  }

  @override
  Future<String?> setting(String key) async => (await (db.select(
    db.appSettings,
  )..where((s) => s.key.equals(key))).getSingleOrNull())?.value;
  Future<void> putSetting(String key, String value) => db
      .into(db.appSettings)
      .insertOnConflictUpdate(
        AppSettingsCompanion.insert(key: key, value: value),
      );
  Future<void> removeSetting(String key) =>
      (db.delete(db.appSettings)..where((s) => s.key.equals(key))).go();
  Future<TargetAccount?> pendingTarget() async {
    final id = await setting('pendingTarget') ?? await setting('openingTarget');
    return id == null ? null : target(id);
  }

  @override
  Future<void> prepareOpen(String id, OperatingAccount owner) =>
      db.transaction(() async {
        if (await pendingTarget() != null) throw StateError('未登録の結果があります');
        _check((await target(id))!, owner);
        await putSetting('openingTarget', id);
        await putSetting('openingOwner', owner.id);
      });

  @override
  Future<void> abandonOpen() => db.transaction(() async {
    await removeSetting('openingTarget');
    await removeSetting('openingOwner');
  });

  @override
  Future<TargetAccount?> target(String id) =>
      (db.select(db.targets)..where((t) => t.id.equals(id))).getSingleOrNull();

  Expression<bool> _visible(Targets t, OperatingAccount owner) =>
      t.platform.equals(owner.platform.name) &
      (t.ownerId.isNull() | t.ownerId.equals(owner.id)) &
      t.isSample.equals(owner.isSample);

  @override
  Future<List<TargetAccount>> page(
    OperatingAccount owner, {
    TargetStatus? status,
    String search = '',
    String group = '',
    int offset = 0,
    int limit = 50,
  }) =>
      (db.select(db.targets)
            ..where(
              (t) =>
                  _visible(t, owner) &
                  (status == null
                      ? const Constant(true)
                      : t.status.equalsValue(status)) &
                  (search.isEmpty
                      ? const Constant(true)
                      : (t.username.contains(search) |
                            t.memo.contains(search))) &
                  (group.isEmpty
                      ? const Constant(true)
                      : t.groupName.equals(group)),
            )
            ..orderBy([
              (t) => OrderingTerm.asc(t.importedAt),
              (t) => OrderingTerm.asc(t.id),
            ])
            ..limit(limit, offset: offset))
          .get();

  Future<int> pendingCount(OperatingAccount owner) async {
    final count = db.targets.id.count();
    final row =
        await (db.selectOnly(db.targets)
              ..addColumns([count])
              ..where(
                _visible(db.targets, owner) &
                    db.targets.status.equalsValue(TargetStatus.pending),
              ))
            .getSingle();
    return row.read(count) ?? 0;
  }

  @override
  Future<List<DateTime>> followedDates(OperatingAccount owner) async =>
      (await (db.selectOnly(db.targets)
                ..addColumns([db.targets.followedAt])
                ..where(
                  db.targets.ownerId.equals(owner.id) &
                      db.targets.platform.equalsValue(owner.platform) &
                      db.targets.status.equalsValue(TargetStatus.followed) &
                      db.targets.followedAt.isNotNull() &
                      db.targets.followedAt.isBiggerOrEqualValue(
                        clock.now().subtract(const Duration(hours: 24)),
                      ),
                ))
              .get())
          .map((r) => r.read(db.targets.followedAt)!)
          .toList();

  void _check(TargetAccount t, OperatingAccount owner) {
    if (owner.archived ||
        t.platform != owner.platform ||
        t.isSample != owner.isSample ||
        (t.ownerId != null && t.ownerId != owner.id)) {
      throw StateError('対象の運用元が一致しません');
    }
  }

  Future<void> _log(
    TargetAccount t,
    OperatingAccount owner,
    ActionType type, {
    TargetStatus? after,
    String note = '',
  }) => db
      .into(db.actionLogs)
      .insert(
        ActionLogsCompanion.insert(
          id: _uuid.v4(),
          targetId: t.id,
          ownerId: owner.id,
          platform: t.platform,
          actionType: type,
          statusBefore: Value(t.status),
          statusAfter: Value(after),
          note: Value(note),
          occurredAt: clock.now(),
        ),
      );

  @override
  Future<void> recordOpen(String id, OperatingAccount owner) =>
      db.transaction(() async {
        final pending = await setting('pendingTarget');
        if (pending == id) return;
        if (pending != null ||
            ((await setting('openingTarget')) != null &&
                await setting('openingTarget') != id)) {
          throw StateError('未登録の結果があります');
        }
        final t = (await target(id))!;
        _check(t, owner);
        await (db.update(db.targets)..where((t) => t.id.equals(id))).write(
          TargetsCompanion(
            ownerId: Value(owner.id),
            openCount: Value(t.openCount + 1),
            lastOpenedAt: Value(clock.now()),
            updatedAt: Value(clock.now()),
          ),
        );
        await _log(t, owner, ActionType.profileOpened);
        await putSetting('pendingTarget', id);
        await abandonOpen();
      });

  @override
  Future<bool> setStatus(
    String id,
    OperatingAccount owner,
    TargetStatus status, {
    bool cancelled = false,
  }) => db.transaction(() async {
    final t = (await target(id))!;
    _check(t, owner);
    final pending =
        await setting('pendingTarget') ?? await setting('openingTarget');
    if (pending != null && pending != id) throw StateError('先に作業中の結果を登録してください');
    // An unopened target may only be skipped. Assignment is otherwise made on successful launch.
    if (t.ownerId == null &&
        status != TargetStatus.skipped &&
        status != TargetStatus.pending) {
      throw StateError('先にプロフィールを開いてください');
    }
    final newFollow =
        status == TargetStatus.followed && t.status != TargetStatus.followed;
    await (db.update(db.targets)..where((t) => t.id.equals(id))).write(
      TargetsCompanion(
        ownerId: status == TargetStatus.skipped
            ? Value(owner.id)
            : const Value.absent(),
        status: Value(status),
        processedAt: Value(status == TargetStatus.pending ? null : clock.now()),
        followedAt: Value(
          status == TargetStatus.followed
              ? (t.followedAt ?? clock.now())
              : null,
        ),
        updatedAt: Value(clock.now()),
      ),
    );
    await _log(
      t,
      owner,
      cancelled ? ActionType.cancelled : ActionType.statusChanged,
      after: status,
    );
    if (pending == id) {
      await removeSetting('pendingTarget');
      await abandonOpen();
    }
    if (!newFollow) return false;
    final a = await (db.select(
      db.operatingAccounts,
    )..where((a) => a.id.equals(owner.id))).getSingle();
    final count = a.cumulativeFollows + 1;
    final showNotice = count >= 5 && !a.breakNoticeShown;
    await (db.update(
      db.operatingAccounts,
    )..where((a) => a.id.equals(owner.id))).write(
      OperatingAccountsCompanion(
        cumulativeFollows: Value(count),
        breakNoticeShown: Value(a.breakNoticeShown || showNotice),
      ),
    );
    return showNotice;
  });

  Future<void> editMemo(
    String id,
    OperatingAccount owner,
    String memo,
    String group,
  ) => db.transaction(() async {
    final t = (await target(id))!;
    _check(t, owner);
    await (db.update(db.targets)..where((t) => t.id.equals(id))).write(
      TargetsCompanion(
        memo: Value(memo),
        groupName: Value(group),
        updatedAt: Value(clock.now()),
      ),
    );
    await _log(t, owner, ActionType.memoChanged);
  });

  Future<void> reassign(
    String id,
    OperatingAccount from,
    OperatingAccount to,
  ) => db.transaction(() async {
    final t = (await target(id))!;
    _check(t, from);
    if ((await pendingTarget())?.id == id ||
        to.archived ||
        to.platform != t.platform ||
        to.isSample != t.isSample) {
      throw StateError('この対象は再割り当てできません');
    }
    await (db.update(db.targets)..where((t) => t.id.equals(id))).write(
      TargetsCompanion(
        ownerId: Value(to.id),
        status: const Value(TargetStatus.pending),
        processedAt: const Value(null),
        followedAt: const Value(null),
        updatedAt: Value(clock.now()),
      ),
    );
    await _log(
      t,
      from,
      ActionType.reassigned,
      after: TargetStatus.pending,
      note: to.id,
    );
  });

  Future<List<ActionLog>> logs(
    OperatingAccount owner, {
    String? targetId,
    int offset = 0,
  }) =>
      (db.select(db.actionLogs)
            ..where(
              (l) =>
                  l.ownerId.equals(owner.id) &
                  (targetId == null
                      ? const Constant(true)
                      : l.targetId.equals(targetId)),
            )
            ..orderBy([
              (l) => OrderingTerm.desc(l.occurredAt),
              (l) => OrderingTerm.desc(l.id),
            ])
            ..limit(50, offset: offset))
          .get();

  Future<void> deleteHistory(OperatingAccount owner) =>
      (db.delete(db.actionLogs)..where((l) => l.ownerId.equals(owner.id))).go();
  Future<void> deleteTargets(OperatingAccount owner) =>
      db.transaction(() async {
        if ((await pendingTarget())?.ownerId == owner.id) {
          throw StateError('先に作業結果を登録してください');
        }
        await (db.delete(
          db.targets,
        )..where((t) => t.ownerId.equals(owner.id))).go();
      });

  Future<void> installSamples() => db.transaction(() async {
    for (final platform in PlatformType.values) {
      var a =
          await (db.select(db.operatingAccounts)..where(
                (a) =>
                    a.isSample.equals(true) & a.platform.equalsValue(platform),
              ))
              .getSingleOrNull();
      a ??= await addAccount(platform, 'サンプル運用元', sample: true);
      for (var i = 1; i <= 3; i++) {
        final name = 'demo_account_00$i';
        final now = clock.now();
        await db
            .into(db.targets)
            .insert(
              TargetsCompanion.insert(
                id: _uuid.v4(),
                platform: platform,
                username: name,
                normalizedUsername: name,
                profileUrl: 'https://example.invalid/$name',
                ownerId: Value(a.id),
                isSample: const Value(true),
                memo: const Value('架空の対象です。外部サイトを開かず操作を体験できます。'),
                importedAt: now,
                createdAt: now,
                updatedAt: now,
              ),
              mode: InsertMode.insertOrIgnore,
            );
      }
    }
  });

  Future<void> removeSamples() => db.transaction(() async {
    if ((await pendingTarget())?.isSample ?? false) {
      throw StateError('先にサンプルの結果を登録してください');
    }
    final sampleIds = (await accounts(
      includeArchived: true,
    )).where((a) => a.isSample).map((a) => a.id).toList();
    await (db.delete(
      db.actionLogs,
    )..where((l) => l.ownerId.isIn(sampleIds))).go();
    await (db.delete(db.targets)..where((t) => t.isSample.equals(true))).go();
    await (db.delete(
      db.operatingAccounts,
    )..where((a) => a.isSample.equals(true))).go();
  });
}
