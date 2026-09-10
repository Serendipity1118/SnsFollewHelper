import 'package:flutter_test/flutter_test.dart';
import 'package:follow_support_app/core/domain.dart';
import 'package:follow_support_app/features/import_export/csv_service.dart';
import '../support.dart';

void main() {
  test(
    '100,000 targets import transaction, bounded pagination, search and status filtering',
    () async {
      final s = TestStore();
      addTearDown(s.db.close);
      final owner = await s.repo.addAccount(PlatformType.x, 'large dataset');
      final text = StringBuffer('platform,username,memo,group\n');
      for (var i = 0; i < 100000; i++) {
        text.writeln('x,user${i.toString().padLeft(6, '0')},memo$i,g${i % 10}');
      }
      final service = CsvService(s.repo);
      final rows = await service.preview(text.toString());
      expect(rows.length, 100000);
      expect(await service.import(rows), 100000);
      expect(await s.repo.pendingCount(owner), 100000);
      final first = await s.repo.page(owner);
      final second = await s.repo.page(owner, offset: 50);
      expect(first.length, 50);
      expect(second.length, 50);
      expect(
        first
            .map((t) => t.id)
            .toSet()
            .intersection(second.map((t) => t.id).toSet()),
        isEmpty,
      );
      expect((await s.repo.page(owner, offset: 99950)).length, 50);
      expect(await s.repo.page(owner, offset: 100000), isEmpty);
      expect(
        (await s.repo.page(owner, search: 'user099999')).single.username,
        'user099999',
      );
      expect(
        (await s.repo.page(
          owner,
          group: 'g9',
        )).every((t) => t.groupName == 'g9'),
        true,
      );
      await s.repo.setStatus(first.first.id, owner, TargetStatus.skipped);
      expect(
        (await s.repo.page(owner, status: TargetStatus.skipped)).single.id,
        first.first.id,
      );
      expect(await s.repo.pendingCount(owner), 99999);
    },
    timeout: const Timeout(Duration(minutes: 3)),
  );
}
