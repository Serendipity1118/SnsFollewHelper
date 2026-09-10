import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/db/app_database.dart';
import '../core/domain.dart';
import '../features/work/work_controller.dart';
import '../providers.dart';
import 'common.dart';

class WorkScreen extends ConsumerStatefulWidget {
  const WorkScreen({super.key, required this.owner, this.targetId});
  final OperatingAccount owner;
  final String? targetId;
  @override
  ConsumerState<WorkScreen> createState() => _WorkScreenState();
}

class _WorkScreenState extends ConsumerState<WorkScreen>
    with WidgetsBindingObserver {
  late final WorkController controller;
  bool allowPop = false;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    controller = WorkController(
      ref.read(repositoryProvider),
      ref.read(launcherProvider),
      ref.read(safetyProvider),
      widget.owner,
    );
    controller.load(targetId: widget.targetId);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    controller.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) controller.resumed();
  }

  Future<void> leave() async {
    if (controller.busy) return;
    if (controller.unresolved) {
      final cancel = await confirm(
        context,
        '結果が未登録です',
        '作業をキャンセルすると、対象をスキップとして記録します。結果入力を続ける場合はキャンセルを押してください。',
        action: '作業をキャンセルして戻る',
      );
      if (!cancel) return;
      await controller.save(TargetStatus.skipped, cancelled: true);
      if (controller.unresolved) return;
    }
    if (!mounted) return;
    setState(() => allowPop = true);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) Navigator.pop(context);
    });
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: controller,
    builder: (context, _) {
      final t = controller.current;
      final manual =
          controller.phase == WorkPhase.awaitingManualResult ||
          controller.phase == WorkPhase.waitingForReturn;
      return PopScope(
        canPop: allowPop || (!controller.unresolved && !controller.busy),
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) leave();
        },
        child: Scaffold(
          appBar: AppBar(
            title: const Text('作業'),
            leading: IconButton(
              onPressed: leave,
              icon: const Icon(Icons.arrow_back),
            ),
          ),
          body: PageBody(
            children: [
              Text(
                '${widget.owner.platform.label} · ${widget.owner.displayName}',
              ),
              if (controller.error != null)
                Text(
                  controller.error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              if (controller.busy) const LinearProgressIndicator(),
              if (t == null && !controller.busy) ...[
                const InfoCard(
                  title: '未処理の対象はありません',
                  text: 'CSVを取り込むか、一覧から対象を未処理に戻せます。',
                ),
                OutlinedButton(
                  onPressed: () => controller.load(targetId: widget.targetId),
                  child: const Text('再読み込み'),
                ),
              ],
              if (t != null) ...[
                Text(
                  '@${t.username}',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                SelectableText(t.profileUrl),
                if (t.isSample) const Text('サンプル体験：外部サイトは開きません。'),
                Text('あなたが登録した状態：${t.status.label}'),
                if (t.memo.isNotEmpty) Text('メモ：${t.memo}'),
                if (t.groupName.isNotEmpty) Text('グループ：${t.groupName}'),
                if (controller.phase == WorkPhase.blocked)
                  InfoCard(
                    title: '安全マージンにより起動を停止中',
                    text:
                        '直近1時間15件／24時間60件の上限です。\n再開可能：${dateLabel(controller.decision?.retryAt)}\n結果入力や履歴・出力は引き続き利用できます。',
                  ),
                if (!manual &&
                    !controller.unresolved &&
                    controller.phase != WorkPhase.resultSaved) ...[
                  FilledButton(
                    onPressed: controller.busy ? null : controller.open,
                    child: Text(t.isSample ? 'サンプルで結果入力を体験' : 'プロフィールを開く'),
                  ),
                  TextButton(
                    onPressed: controller.busy
                        ? null
                        : () => controller.save(TargetStatus.skipped),
                    child: const Text('スキップ'),
                  ),
                ],
                if (manual) ...[
                  if (controller.interruptedLaunch)
                    const InfoCard(
                      title: '前回の起動記録が中断されました',
                      text:
                          'SNSでプロフィールを確認できた場合だけ結果を登録してください。開いていない場合は「作業をキャンセル」を選択してください。起動成功や結果を自動判定していません。',
                    ),
                  const Text('結果を選択してください。SNSの状態は自動判定していません。'),
                  for (final status in TargetStatus.values.where(
                    (s) => s != TargetStatus.pending,
                  ))
                    FilledButton.tonal(
                      key: ValueKey('result:${status.name}'),
                      onPressed: controller.busy
                          ? null
                          : () => controller.save(status),
                      child: Text(status.label),
                    ),
                  TextButton(
                    onPressed: controller.busy
                        ? null
                        : () => controller.save(
                            TargetStatus.skipped,
                            cancelled: true,
                          ),
                    child: const Text('作業をキャンセル（スキップとして記録）'),
                  ),
                ],
                if (controller.phase == WorkPhase.resultSaved) ...[
                  const InfoCard(
                    title: '結果を保存しました',
                    text: 'あなたが選んだ結果を記録しました。次の対象へ進むには下のボタンを押してください。',
                    icon: Icons.check_circle_outline,
                  ),
                  if (controller.breakNotice)
                    const InfoCard(
                      title: '少し休憩しませんか',
                      text: '新規フォローの登録が累積5件に達しました。必要に応じて休憩してください。これは今回だけの案内です。',
                    ),
                  FilledButton(
                    onPressed: controller.busy ? null : () => controller.load(),
                    child: const Text('次のアカウントを確認'),
                  ),
                  TextButton(onPressed: leave, child: const Text('戻る')),
                ],
              ],
            ],
          ),
        ),
      );
    },
  );
}
