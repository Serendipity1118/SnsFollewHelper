import 'dart:convert';
import 'package:charset_converter/charset_converter.dart';
import 'package:csv/csv.dart';
import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../../core/db/app_database.dart';
import '../../core/domain.dart';
import '../../repositories/target_repository.dart';

class ImportCandidate {
  ImportCandidate(
    this.line,
    this.raw, {
    this.platform,
    this.username,
    this.url,
    this.memo = '',
    this.group = '',
    this.error,
    this.duplicate = false,
  });
  final int line;
  final String raw;
  final PlatformType? platform;
  final String? username;
  final String? url;
  final String memo;
  final String group;
  final String? error;
  bool duplicate;
  bool get valid => error == null && !duplicate;
}

List<ImportCandidate> parseTargetsCsv(String input) {
  final rows = decodeCsvStrict(input);
  if (rows.isEmpty) throw const FormatException('CSVが空です');
  final headers = rows.first
      .map((v) => v.toString().trim().toLowerCase())
      .toList();
  if (!headers.contains('platform') ||
      !headers.contains('username') ||
      headers.toSet().length != headers.length) {
    throw const FormatException('platformとusernameの重複しないヘッダーが必要です');
  }
  final seen = <String>{};
  final result = <ImportCandidate>[];
  for (var i = 1; i < rows.length; i++) {
    final row = rows[i];
    String cell(String key) {
      final index = headers.indexOf(key);
      return index < 0 || index >= row.length ? '' : row[index].toString();
    }

    try {
      if (row.length != headers.length) {
        throw const FormatException('列数がヘッダーと一致しません');
      }
      final platform = PlatformType.parse(cell('platform'));
      final username = normalizeUsername(cell('username'), platform);
      final url = profileUrl(
        platform,
        username,
        cell('profile_url'),
      ).toString();
      final key = '${platform.name}:${username.toLowerCase()}';
      result.add(
        ImportCandidate(
          i + 1,
          cell('username'),
          platform: platform,
          username: username,
          url: url,
          memo: cell('memo'),
          group: cell('group'),
          duplicate: !seen.add(key),
        ),
      );
    } on FormatException catch (e) {
      result.add(ImportCandidate(i + 1, cell('username'), error: e.message));
    }
  }
  return result;
}

class CsvService {
  CsvService(this.repository);
  final DriftTargetRepository repository;
  Future<String> decode(Uint8List bytes, {String encoding = 'auto'}) async {
    if (bytes.length > 100 * 1024 * 1024) {
      throw const FormatException('100MB以下のファイルを指定してください');
    }
    if (encoding == 'utf8') return utf8.decode(bytes);
    if (encoding == 'shift_jis') {
      return CharsetConverter.decode('Shift_JIS', bytes);
    }
    try {
      return utf8.decode(bytes);
    } on FormatException {
      return CharsetConverter.decode('Shift_JIS', bytes);
    }
  }

  Future<List<ImportCandidate>> preview(String input) async {
    final candidates = await compute(parseTargetsCsv, input);
    final db = repository.db;
    final existing = await (db.selectOnly(
      db.targets,
    )..addColumns([db.targets.platform, db.targets.normalizedUsername])).get();
    final keys = existing
        .map(
          (r) =>
              '${r.read(db.targets.platform)}:${r.read(db.targets.normalizedUsername)}',
        )
        .toSet();
    for (final c in candidates) {
      if (c.error == null &&
          keys.contains('${c.platform!.name}:${c.username!.toLowerCase()}')) {
        c.duplicate = true;
      }
    }
    return candidates;
  }

  Future<int> import(List<ImportCandidate> candidates) =>
      repository.db.transaction(() async {
        final db = repository.db;
        final before = await _count();
        final now = repository.clock.now();
        final rows = candidates
            .where((c) => c.valid)
            .map(
              (c) => TargetsCompanion.insert(
                id: const Uuid().v4(),
                platform: c.platform!,
                username: c.username!,
                normalizedUsername: c.username!.toLowerCase(),
                profileUrl: c.url!,
                memo: Value(c.memo),
                groupName: Value(c.group),
                importedAt: now,
                createdAt: now,
                updatedAt: now,
              ),
            )
            .toList();
        // Keep batches bounded for large input files.
        for (var start = 0; start < rows.length; start += 500) {
          await db.batch(
            (b) => b.insertAll(
              db.targets,
              rows.sublist(start, (start + 500).clamp(0, rows.length)),
              mode: InsertMode.insertOrIgnore,
            ),
          );
        }
        return await _count() - before;
      });

  Future<int> _count() async {
    final db = repository.db;
    final count = db.targets.id.count();
    return (await (db.selectOnly(
      db.targets,
    )..addColumns([count])).getSingle()).read(count)!;
  }

  Future<Uint8List> exportTargets() async {
    final db = repository.db;
    final owners = {
      for (final a in await repository.accounts(includeArchived: true)) a.id: a,
    };
    final rows = <List<dynamic>>[
      [
        'platform',
        'username',
        'profile_url',
        'status',
        'memo',
        'group',
        'imported_at',
        'processed_at',
        'followed_at',
        'last_opened_at',
        'open_count',
        'owner_id',
        'owner_name',
        'assignment',
        'is_sample',
      ],
    ];
    for (var offset = 0; ; offset += 500) {
      final targets =
          await (db.select(db.targets)
                ..orderBy([(t) => OrderingTerm.asc(t.id)])
                ..limit(500, offset: offset))
              .get();
      for (final t in targets) {
        rows.add([
          t.platform.name,
          t.username,
          t.profileUrl,
          t.status.name,
          t.memo,
          t.groupName,
          t.importedAt.toUtc().toIso8601String(),
          t.processedAt?.toUtc().toIso8601String() ?? '',
          t.followedAt?.toUtc().toIso8601String() ?? '',
          t.lastOpenedAt?.toUtc().toIso8601String() ?? '',
          t.openCount,
          t.ownerId ?? '',
          owners[t.ownerId]?.displayName ?? '',
          t.ownerId == null ? 'unassigned' : 'assigned',
          t.isSample,
        ]);
      }
      if (targets.length < 500) break;
    }
    return compute(encodeCsv, rows);
  }
}

Uint8List encodeCsv(List<List<dynamic>> rows) =>
    Uint8List.fromList(utf8.encode(Csv(addBom: true).encode(rows)));

List<List<dynamic>> decodeCsvStrict(String input) {
  final text = input.replaceFirst('\uFEFF', '');
  var quoted = false;
  var fieldStart = true;
  var afterQuote = false;
  for (var i = 0; i < text.length; i++) {
    final char = text.codeUnitAt(i);
    if (quoted) {
      if (char == 34) {
        if (i + 1 < text.length && text.codeUnitAt(i + 1) == 34) {
          i++;
        } else {
          quoted = false;
          afterQuote = true;
        }
      }
      continue;
    }
    if (char == 44 || char == 10 || char == 13) {
      fieldStart = true;
      afterQuote = false;
    } else if (char == 34 && fieldStart && !afterQuote) {
      quoted = true;
      fieldStart = false;
    } else {
      if (afterQuote || char == 34) throw const FormatException('CSVの引用符が不正です');
      fieldStart = false;
    }
  }
  if (quoted) throw const FormatException('CSVの引用符が閉じられていません');
  return Csv(autoDetect: false).decode(text);
}
