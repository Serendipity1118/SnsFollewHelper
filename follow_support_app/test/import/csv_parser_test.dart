import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:follow_support_app/core/domain.dart';
import 'package:follow_support_app/features/import_export/csv_service.dart';
import '../support.dart';

void main() {
  test(
    'malformed quotes are rejected instead of silently truncating a record',
    () {
      for (final csv in [
        'platform,username,memo\nx,user,"unfinished',
        'platform,username,memo\nx,user,"done"junk',
      ]) {
        expect(() => parseTargetsCsv(csv), throwsFormatException);
      }
      expect(
        parseTargetsCsv('platform,username,memo\nx,user,"a""b"').single.memo,
        'a"b',
      );
    },
  );
  test('BOM, CRLF, quoted commas/newlines and leading zeros', () {
    final rows = parseTargetsCsv(
      '\uFEFFplatform,username,memo,group\r\nig,00123,"a,b\n日本語",001',
    );
    expect(rows.single.valid, true);
    expect(rows.single.username, '00123');
    expect(rows.single.memo, 'a,b\n日本語');
    expect(rows.single.group, '001');
  });
  test(
    'invalid rows do not prevent valid rows and duplicates are case insensitive',
    () {
      final rows = parseTargetsCsv(
        'platform,username\nx,@Example\ntwitter,example\nig,example\nwrong,user\nx,bad name\nx,abc,extra',
      );
      expect(rows.where((r) => r.valid).length, 2);
      expect(rows.where((r) => r.duplicate).length, 1);
      expect(rows.where((r) => r.error != null).length, 3);
    },
  );
  test('required and duplicate headers rejected', () {
    for (final csv in ['', 'name\nuser', 'platform,username,username\nx,a,a']) {
      expect(() => parseTargetsCsv(csv), throwsFormatException);
    }
  });
  test('URL override is preferred and invalid HTTP is row error', () {
    final rows = parseTargetsCsv(
      'platform,username,profile_url\nx,user,https://other.test/path\nig,user,http://bad.test',
    );
    expect(rows.first.url, 'https://other.test/path');
    expect(rows.last.error, isNotNull);
  });
  test(
    'import never overwrites existing ownership/status/memo and CSV exports all owners',
    () async {
      final s = TestStore();
      addTearDown(s.db.close);
      final a = await s.repo.addAccount(PlatformType.x, 'main');
      final b = await s.repo.addAccount(PlatformType.instagram, 'other');
      final t = await s.add('Example');
      await s.repo.recordOpen(t.id, a);
      await s.repo.setStatus(t.id, a, TargetStatus.followed);
      await s.repo.editMemo(t.id, a, 'original', 'keep');
      await s.repo.archive(b.id, true);
      await s.add('Another', platform: PlatformType.instagram);
      final service = CsvService(s.repo);
      final preview = await service.preview(
        'platform,username,memo,group\nx,example,overwrite,no\nx,newuser,new,g',
      );
      expect(preview.first.duplicate, true);
      expect(await service.import(preview), 1);
      final actual = (await s.repo.target(t.id))!;
      expect(actual.username, 'Example');
      expect(actual.memo, 'original');
      expect(actual.groupName, 'keep');
      expect(actual.ownerId, a.id);
      expect(actual.status, TargetStatus.followed);
      final bytes = await service.exportTargets();
      expect(bytes.take(3), [239, 187, 191]);
      final text = utf8.decode(bytes);
      expect(text, contains('main'));
      expect(text, contains('instagram'));
      expect(text, contains('unassigned'));
      expect(await service.import(await service.preview(text)), 0);
      expect((await s.repo.target(t.id))!.status, TargetStatus.followed);
    },
  );
}
