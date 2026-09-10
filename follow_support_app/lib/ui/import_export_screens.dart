import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../features/import_export/csv_service.dart';
import '../features/import_export/backup_service.dart';
import '../providers.dart';
import 'common.dart';

class ImportScreen extends ConsumerStatefulWidget {
  const ImportScreen({super.key});
  @override
  ConsumerState<ImportScreen> createState() => _ImportScreenState();
}

class _ImportScreenState extends ConsumerState<ImportScreen> {
  final input = TextEditingController();
  String encoding = 'auto';
  bool busy = false;
  String? error;
  @override
  void dispose() {
    input.dispose();
    super.dispose();
  }

  Future<void> preview({bool file = false}) async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final service = CsvService(ref.read(repositoryProvider));
      var text = input.text;
      if (file) {
        final selected = await FilePicker.pickFile(
          type: FileType.custom,
          allowedExtensions: ['csv'],
        );
        if (selected == null) return;
        text = await service.decode(
          await selected.readAsBytes(),
          encoding: encoding,
        );
      }
      final rows = await service.preview(text);
      if (!mounted) return;
      await Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => ImportPreviewScreen(rows: rows)),
      );
    } on FormatException catch (e) {
      if (mounted) setState(() => error = 'CSVを読み込めませんでした。${e.message}');
    } catch (_) {
      if (mounted) {
        setState(() => error = 'CSVを読み込めませんでした。ヘッダーと文字コードを確認してください。');
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('CSVインポート')),
    body: PageBody(
      children: [
        const Text(
          'platform・usernameは必須です。profile_url・memo・groupは任意です。既存の状態・担当・メモ・履歴は上書きしません。',
        ),
        DropdownButtonFormField<String>(
          initialValue: encoding,
          decoration: const InputDecoration(labelText: 'ファイルの文字コード'),
          items: const [
            DropdownMenuItem(
              value: 'auto',
              child: Text('自動（UTF-8 → Shift_JIS）'),
            ),
            DropdownMenuItem(value: 'utf8', child: Text('UTF-8')),
            DropdownMenuItem(value: 'shift_jis', child: Text('Shift_JIS')),
          ],
          onChanged: busy ? null : (value) => setState(() => encoding = value!),
        ),
        FilledButton.icon(
          onPressed: busy ? null : () => preview(file: true),
          icon: const Icon(Icons.folder_open),
          label: const Text('CSVファイルを選択'),
        ),
        TextField(
          controller: input,
          maxLines: 8,
          decoration: const InputDecoration(
            labelText: 'CSVを貼り付け',
            hintText: 'platform,username,memo\nx,example,確認用',
          ),
        ),
        OutlinedButton(
          onPressed: busy ? null : () => preview(),
          child: const Text('貼り付け内容を確認'),
        ),
        TextButton(
          onPressed: busy
              ? null
              : () async {
                  input.text = await rootBundle.loadString(
                    'assets/sample_targets.csv',
                  );
                },
          child: const Text('入力書式の見本を表示'),
        ),
        const Text('見本CSVは書式確認用です。架空対象での操作体験は、起動画面のサンプルデータを使用してください。'),
        if (busy) const LinearProgressIndicator(),
        if (error != null) Text(error!),
      ],
    ),
  );
}

class ImportPreviewScreen extends ConsumerStatefulWidget {
  const ImportPreviewScreen({super.key, required this.rows});
  final List<ImportCandidate> rows;
  @override
  ConsumerState<ImportPreviewScreen> createState() =>
      _ImportPreviewScreenState();
}

class _ImportPreviewScreenState extends ConsumerState<ImportPreviewScreen> {
  bool busy = false;
  bool done = false;
  String? result;
  Future<void> save() async {
    setState(() => busy = true);
    try {
      final count = await CsvService(
        ref.read(repositoryProvider),
      ).import(widget.rows);
      if (mounted) {
        setState(() {
          done = true;
          result = '$count 件を追加しました。重複・不正行は追加していません。';
        });
      }
    } catch (_) {
      if (mounted) setState(() => result = '保存できませんでした。もう一度お試しください。');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('インポート確認')),
    body: Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            '追加可能：${widget.rows.where((r) => r.valid).length} 件　重複：${widget.rows.where((r) => r.duplicate).length} 件　不正：${widget.rows.where((r) => r.error != null).length} 件',
          ),
        ),
        if (result != null)
          Padding(padding: const EdgeInsets.all(16), child: Text(result!)),
        if (busy) const LinearProgressIndicator(),
        Expanded(
          child: ListView.builder(
            itemCount: widget.rows.length,
            itemBuilder: (context, i) {
              final r = widget.rows[i];
              return ListTile(
                leading: Icon(
                  r.valid
                      ? Icons.check_circle_outline
                      : r.duplicate
                      ? Icons.copy
                      : Icons.error_outline,
                ),
                title: Text(
                  '${r.line}行目：${r.platform?.label ?? ''} @${r.username ?? r.raw}',
                ),
                subtitle: Text(
                  r.error ??
                      (r.duplicate
                          ? '重複：既存のデータを保持します'
                          : '${r.url}\nメモ：${r.memo}　グループ：${r.group}'),
                ),
              );
            },
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: FilledButton(
              onPressed: busy || done || !widget.rows.any((r) => r.valid)
                  ? null
                  : save,
              child: const Text('正常な新規行を取り込む'),
            ),
          ),
        ),
      ],
    ),
  );
}

class ExportScreen extends ConsumerStatefulWidget {
  const ExportScreen({super.key});
  @override
  ConsumerState<ExportScreen> createState() => _ExportScreenState();
}

class _ExportScreenState extends ConsumerState<ExportScreen> {
  bool busy = false;
  String? result;
  Future<void> export(bool backup) async {
    setState(() {
      busy = true;
      result = null;
    });
    try {
      final repo = ref.read(repositoryProvider);
      final bytes = backup
          ? await BackupService(repo).export()
          : await CsvService(repo).exportTargets();
      final path = await FilePicker.saveFile(
        fileName: backup ? 'follow_support_backup.zip' : 'targets.csv',
        bytes: bytes,
      );
      if (mounted) {
        setState(() => result = path == null ? '保存をキャンセルしました' : 'ファイルを保存しました');
      }
    } catch (_) {
      if (mounted) {
        setState(() => result = '出力できませんでした。保存先の空き容量とアクセスを確認してください。');
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> restore() async {
    setState(() {
      busy = true;
      result = null;
    });
    try {
      final file = await FilePicker.pickFile(
        type: FileType.custom,
        allowedExtensions: ['zip'],
      );
      if (file == null) return;
      final service = BackupService(ref.read(repositoryProvider));
      final plan = await service.preview(await file.readAsBytes());
      if (!mounted) return;
      await Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => RestoreScreen(plan: plan)),
      );
    } catch (_) {
      if (mounted) {
        setState(() => result = 'バックアップを読み込めませんでした。形式・バージョン・ファイル内容を確認してください。');
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('エクスポート・バックアップ')),
    body: PageBody(
      children: [
        const InfoCard(
          title: '対象CSV',
          text:
              '全SNS・全運用元・全状態の対象をUTF-8 BOM付きで出力します。未割り当て、スキップ、アーカイブ済み運用元の対象も含みます。再インポートでは新規対象だけを追加します。',
        ),
        FilledButton(
          onPressed: busy ? null : () => export(false),
          child: const Text('対象CSVを保存'),
        ),
        const InfoCard(
          title: '完全バックアップ ZIP',
          text: '運用元・対象・操作履歴・中断情報を保存します。復元時には内容を確認し、既存データを優先して不足分を追加します。',
        ),
        OutlinedButton(
          onPressed: busy ? null : () => export(true),
          child: const Text('完全バックアップを保存'),
        ),
        OutlinedButton(
          onPressed: busy ? null : restore,
          child: const Text('ZIPバックアップを復元'),
        ),
        const Text('保存先はご自身で選択してください。選んだ保存先がクラウドの場合は、そのサービスにファイルが保存されます。'),
        if (busy) const LinearProgressIndicator(),
        if (result != null) Text(result!),
      ],
    ),
  );
}

class RestoreScreen extends ConsumerStatefulWidget {
  const RestoreScreen({super.key, required this.plan});
  final RestorePlan plan;
  @override
  ConsumerState<RestoreScreen> createState() => _RestoreScreenState();
}

class _RestoreScreenState extends ConsumerState<RestoreScreen> {
  final selections = <String, String?>{};
  bool busy = false;
  bool done = false;
  String? result;
  Future<void> restore() async {
    setState(() => busy = true);
    try {
      final count = await BackupService(
        ref.read(repositoryProvider),
      ).restore(widget.plan, selections);
      if (mounted) {
        setState(() {
          done = true;
          result = '対象 $count 件を追加して復元しました。運用元の選択・中断作業の復元にはアプリを再起動してください。';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => result = '復元できませんでした。データは変更していません。対応先とファイル内容を確認してください。');
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final plan = widget.plan;
    final ambiguous = plan.data.accounts
        .where((a) => plan.matches[a.id]!.length > 1)
        .toList();
    return Scaffold(
      appBar: AppBar(title: const Text('バックアップ復元の確認')),
      body: PageBody(
        children: [
          Text(
            '運用元 ${plan.data.accounts.length} 件\n対象 ${plan.data.targets.length} 件（既存と重複 ${plan.targetConflicts} 件）\n履歴 ${plan.data.logs.length} 件（既存と重複 ${plan.logConflicts} 件）',
          ),
          const Text('既存データを優先し、現在のデータは削除しません。以下の対応先を確認して、一度だけ復元を実行してください。'),
          for (final a in plan.data.accounts) ...[
            if (plan.matches[a.id]!.length <= 1)
              Text(
                '${a.platform.label} · ${a.displayName} → ${plan.matches[a.id]!.isEmpty ? '運用元を新規作成' : '既存：${plan.matches[a.id]!.first.id.substring(0, 6)}'}',
              ),
            if (plan.matches[a.id]!.length > 1)
              DropdownButtonFormField<String>(
                isExpanded: true,
                decoration: InputDecoration(
                  labelText: '${a.platform.label} · ${a.displayName} の対応先',
                ),
                items: [
                  const DropdownMenuItem(
                    value: '__new__',
                    child: Text('別の運用元として新規作成'),
                  ),
                  ...plan.matches[a.id]!.map(
                    (c) => DropdownMenuItem(
                      value: c.id,
                      child: Text('${c.displayName}（${c.id.substring(0, 6)}）'),
                    ),
                  ),
                ],
                onChanged: busy || done
                    ? null
                    : (id) => setState(
                        () => selections[a.id] = id == '__new__' ? null : id,
                      ),
              ),
          ],
          FilledButton(
            onPressed:
                busy ||
                    done ||
                    ambiguous.any((a) => !selections.containsKey(a.id))
                ? null
                : restore,
            child: const Text('確認して復元する'),
          ),
          if (busy) const LinearProgressIndicator(),
          if (result != null) Text(result!),
        ],
      ),
    );
  }
}
