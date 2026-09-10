import 'dart:convert';
import 'package:archive/archive.dart';
import 'package:csv/csv.dart';
import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import '../../core/db/app_database.dart';
import '../../core/domain.dart';
import '../../repositories/target_repository.dart';
import 'csv_service.dart' show decodeCsvStrict;

class BackupData {
  BackupData(this.accounts, this.targets, this.logs, this.settings);
  final List<OperatingAccount> accounts;
  final List<TargetAccount> targets;
  final List<ActionLog> logs;
  final List<AppSetting> settings;
}

class RestorePlan {
  RestorePlan(this.data, this.matches, this.targetConflicts, this.logConflicts);
  final BackupData data;
  // A missing match creates an account. Multiple candidates require the user's selection.
  final Map<String, List<OperatingAccount>> matches;
  final int targetConflicts;
  final int logConflicts;
}

class BackupService {
  BackupService(this.repository);
  final DriftTargetRepository repository;

  Future<Uint8List> export() async {
    final db = repository.db;
    final data = await db.transaction(
      () async => <String, List<Map<String, dynamic>>>{
        'accounts.csv': (await repository.accounts(
          includeArchived: true,
        )).map((a) => a.toJson()).toList(),
        'targets.csv': (await db.select(db.targets).get())
            .map((t) => t.toJson())
            .toList(),
        'action_logs.csv': (await db.select(db.actionLogs).get())
            .map((l) => l.toJson())
            .toList(),
        'settings.csv': (await db.select(db.appSettings).get())
            .map((s) => s.toJson())
            .toList(),
      },
    );
    return compute(_encodeBackup, data);
  }

  Future<RestorePlan> preview(Uint8List bytes) async {
    final data = await compute(_decodeBackup, bytes);
    final accounts = await repository.accounts(includeArchived: true);
    final matches = <String, List<OperatingAccount>>{};
    for (final a in data.accounts) {
      final sameId = accounts.where((b) => b.id == a.id).toList();
      if (sameId.isNotEmpty &&
          (sameId.first.platform != a.platform ||
              sameId.first.isSample != a.isSample)) {
        throw const FormatException('運用元IDの不正な衝突があります');
      }
      matches[a.id] = sameId.isNotEmpty
          ? sameId
          : accounts
                .where(
                  (b) =>
                      b.platform == a.platform &&
                      b.displayName == a.displayName &&
                      b.isSample == a.isSample,
                )
                .toList();
    }
    final db = repository.db;
    final currentTargets = await db.select(db.targets).get();
    final keys = currentTargets
        .map((t) => '${t.platform.name}:${t.normalizedUsername}')
        .toSet();
    final ids = currentTargets.map((t) => t.id).toSet();
    final logIds = (await db.select(db.actionLogs).get())
        .map((l) => l.id)
        .toSet();
    return RestorePlan(
      data,
      matches,
      data.targets
          .where(
            (t) =>
                ids.contains(t.id) ||
                keys.contains('${t.platform.name}:${t.normalizedUsername}'),
          )
          .length,
      data.logs.where((l) => logIds.contains(l.id)).length,
    );
  }

  Future<int> restore(RestorePlan plan, Map<String, String?> selections) =>
      repository.db.transaction(() async {
        final db = repository.db;
        final ownerMap = <String, String>{};
        for (final a in plan.data.accounts) {
          final candidates = plan.matches[a.id]!;
          if (candidates.length > 1 && !selections.containsKey(a.id)) {
            throw StateError('運用元の対応先を選択してください');
          }
          final selected = selections.containsKey(a.id)
              ? selections[a.id]
              : candidates.firstOrNull?.id;
          if (selected != null) {
            if (!candidates.any((c) => c.id == selected)) {
              throw StateError('対応先が不正です');
            }
            ownerMap[a.id] = selected;
          } else {
            await db
                .into(db.operatingAccounts)
                .insert(a, mode: InsertMode.insertOrIgnore);
            ownerMap[a.id] = a.id;
          }
        }
        final targetMap = <String, String>{};
        final insertedIds = <String>{};
        final existing = await db.select(db.targets).get();
        final byId = {for (final t in existing) t.id: t};
        final byKey = {
          for (final t in existing)
            '${t.platform.name}:${t.normalizedUsername}': t,
        };
        for (final t in plan.data.targets) {
          final key = '${t.platform.name}:${t.normalizedUsername}';
          final current = byId[t.id] ?? byKey[key];
          if (current != null) {
            if (current.platform != t.platform ||
                current.normalizedUsername != t.normalizedUsername) {
              throw const FormatException('対象IDの不正な衝突があります');
            }
            targetMap[t.id] = current.id;
            continue;
          }
          final restored = t.copyWith(
            ownerId: Value(t.ownerId == null ? null : ownerMap[t.ownerId]!),
          );
          await db.into(db.targets).insert(restored);
          targetMap[t.id] = t.id;
          insertedIds.add(t.id);
          byId[t.id] = restored;
          byKey[key] = restored;
        }
        for (final l in plan.data.logs) {
          await db
              .into(db.actionLogs)
              .insert(
                l.copyWith(
                  ownerId: ownerMap[l.ownerId]!,
                  targetId: targetMap[l.targetId] ?? l.targetId,
                ),
                mode: InsertMode.insertOrIgnore,
              );
        }
        final pending = plan.data.settings
            .where((s) => s.key == 'pendingTarget')
            .firstOrNull;
        if (pending != null &&
            insertedIds.contains(pending.value) &&
            await repository.pendingTarget() == null) {
          await repository.putSetting('pendingTarget', pending.value);
        }
        final opening = plan.data.settings
            .where((s) => s.key == 'openingTarget')
            .firstOrNull;
        final openingOwner = plan.data.settings
            .where((s) => s.key == 'openingOwner')
            .firstOrNull;
        if (opening != null &&
            openingOwner != null &&
            insertedIds.contains(opening.value) &&
            await repository.pendingTarget() == null) {
          await repository.putSetting('openingTarget', opening.value);
          await repository.putSetting(
            'openingOwner',
            ownerMap[openingOwner.value]!,
          );
        }
        return insertedIds.length;
      });
}

const _dateKeys = {
  'createdAt',
  'updatedAt',
  'importedAt',
  'processedAt',
  'followedAt',
  'lastOpenedAt',
  'occurredAt',
};
const _intKeys = {'openCount', 'cumulativeFollows'};
const _boolKeys = {'archived', 'isSample', 'breakNoticeShown'};

Uint8List _encodeBackup(Map<String, List<Map<String, dynamic>>> tables) {
  final archive = Archive();
  final manifest = utf8.encode(
    jsonEncode({'format': 'follow-support-backup', 'version': 1}),
  );
  archive.addFile(ArchiveFile('manifest.json', manifest.length, manifest));
  for (final entry in tables.entries) {
    final headers = entry.value.isEmpty
        ? <String>[]
        : entry.value.first.keys.toList();
    final rows = <List<dynamic>>[headers];
    for (final row in entry.value) {
      rows.add(
        headers.map((key) {
          final value = row[key];
          if (value == null) return '';
          return _dateKeys.contains(key)
              ? DateTime.fromMillisecondsSinceEpoch(
                  value as int,
                  isUtc: true,
                ).toIso8601String()
              : value;
        }).toList(),
      );
    }
    final bytes = utf8.encode(Csv(addBom: true).encode(rows));
    archive.addFile(ArchiveFile(entry.key, bytes.length, bytes));
  }
  return Uint8List.fromList(ZipEncoder().encode(archive));
}

BackupData _decodeBackup(Uint8List bytes) {
  if (bytes.length > 100 * 1024 * 1024) {
    throw const FormatException('バックアップは100MB以下にしてください');
  }
  final archive = ZipDecoder().decodeBytes(bytes, verify: true);
  if (archive.files.length != 5 ||
      archive.files.map((f) => f.name).toSet().length != 5 ||
      archive.files.fold<int>(0, (n, f) => n + f.size) > 200 * 1024 * 1024) {
    throw const FormatException('バックアップ構成またはサイズが不正です');
  }
  String content(String name) {
    final file = archive.findFile(name);
    if (file == null || !file.isFile) {
      throw const FormatException('バックアップファイルが不足しています');
    }
    return utf8.decode(file.content).replaceFirst('\uFEFF', '');
  }

  final manifest = jsonDecode(content('manifest.json'));
  if (manifest['format'] != 'follow-support-backup' ||
      manifest['version'] != 1) {
    throw const FormatException('対応していないバックアップ形式です');
  }
  List<Map<String, dynamic>> read(String name) {
    final rows = decodeCsvStrict(content(name));
    if (rows.isEmpty) return [];
    final headers = rows.first.cast<String>();
    if (headers.toSet().length != headers.length) {
      throw const FormatException('ヘッダーが重複しています');
    }
    return rows.skip(1).map((row) {
      if (row.length != headers.length) {
        throw const FormatException('バックアップの列数が不正です');
      }
      return Map<String, dynamic>.fromEntries(
        List.generate(headers.length, (i) {
          final key = headers[i];
          final value = row[i].toString();
          dynamic parsed = value;
          if (_dateKeys.contains(key)) {
            parsed = value.isEmpty
                ? null
                : DateTime.parse(value).toUtc().millisecondsSinceEpoch;
          } else if (_intKeys.contains(key)) {
            parsed = int.parse(value);
            if (parsed < 0) throw const FormatException('負の件数は復元できません');
          } else if (_boolKeys.contains(key)) {
            if (value != 'true' && value != 'false') {
              throw const FormatException('真偽値が不正です');
            }
            parsed = value == 'true';
          } else if (value.isEmpty &&
              {'ownerId', 'statusBefore', 'statusAfter'}.contains(key)) {
            parsed = null;
          }
          return MapEntry(key, parsed);
        }),
      );
    }).toList();
  }

  final accounts = read('accounts.csv').map(OperatingAccount.fromJson).toList();
  final targets = read('targets.csv').map(TargetAccount.fromJson).toList();
  final logs = read('action_logs.csv').map(ActionLog.fromJson).toList();
  final settings = read('settings.csv').map(AppSetting.fromJson).toList();
  final owners = {for (final a in accounts) a.id: a};
  if (owners.length != accounts.length ||
      targets.map((t) => t.id).toSet().length != targets.length ||
      logs.map((l) => l.id).toSet().length != logs.length ||
      targets
              .map((t) => '${t.platform.name}:${t.normalizedUsername}')
              .toSet()
              .length !=
          targets.length) {
    throw const FormatException('バックアップ内に重複があります');
  }
  for (final a in accounts) {
    if (a.id.isEmpty || a.displayName.trim().isEmpty) {
      throw const FormatException('運用元が不正です');
    }
  }
  for (final t in targets) {
    // Fictional sample names deliberately do not need to match an SNS username limit.
    if (!t.isSample &&
        normalizeUsername(t.username, t.platform) != t.username) {
      throw const FormatException('対象名が不正です');
    }
    profileUrl(t.platform, t.username, t.profileUrl);
    final a = owners[t.ownerId];
    if (t.id.isEmpty ||
        t.normalizedUsername != t.username.toLowerCase() ||
        (t.ownerId != null &&
            (a == null ||
                a.platform != t.platform ||
                a.isSample != t.isSample)) ||
        (t.status == TargetStatus.followed &&
            (t.followedAt == null || t.ownerId == null)) ||
        (t.status != TargetStatus.followed && t.followedAt != null)) {
      throw const FormatException('対象または担当関係が不正です');
    }
  }
  for (final l in logs) {
    if (l.id.isEmpty || owners[l.ownerId]?.platform != l.platform) {
      throw const FormatException('履歴の運用元が不正です');
    }
  }
  final settingMap = {for (final s in settings) s.key: s.value};
  if (settingMap.length != settings.length) {
    throw const FormatException('設定が重複しています');
  }
  final pendingId = settingMap['pendingTarget'] ?? settingMap['openingTarget'];
  if (pendingId != null) {
    final t = targets.where((t) => t.id == pendingId).firstOrNull;
    final ownerId = settingMap['pendingTarget'] != null
        ? t?.ownerId
        : settingMap['openingOwner'];
    final owner = owners[ownerId];
    if (t == null ||
        owner == null ||
        owner.archived ||
        owner.platform != t.platform ||
        owner.isSample != t.isSample ||
        (t.ownerId != null && t.ownerId != ownerId)) {
      throw const FormatException('中断情報が不正です');
    }
  }
  return BackupData(accounts, targets, logs, settings);
}
