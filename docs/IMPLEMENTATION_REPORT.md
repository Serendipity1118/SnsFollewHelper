# 実装完了報告

更新日: 2026-09-10

## 実装機能

- X / Instagram、複数運用元（表示名＋内部ID）、アーカイブと復元
- 運用元間で共有する未割り当て対象、初回起動成功時の担当確定、手動再割り当て
- 未処理、新規フォロー、以前からフォロー済み、フォロー申請済み、未フォロー、非公開、凍結・停止、存在しない、スキップ
- 外部HTTPSプロフィール起動、ブラウザフォールバック、失敗時の再試行
- 外部復帰後の手動結果入力、次対象の明示操作、終了・異常中断からの結果入力復元
- 運用元別・SNS別のローリング1時間15件／24時間60件の安全制限
- 累積新規フォロー5件で1回だけ表示する任意休憩案内
- UTF-8 / Shift_JIS CSV取込、行別プレビュー、厳格な引用符・URL検証、大文字小文字を無視する重複判定
- UTF-8 BOM付き全対象CSV出力
- 運用元・対象・履歴・中断情報を含むZIPバックアップ、衝突確認、追加型復元
- 50件単位の一覧・履歴ページング、検索、SNS・状態・グループ絞り込み
- 運用元別の履歴削除と対象削除、サンプルデータ投入・削除
- About、端末内プライバシーポリシー、ストア審査用文書、受け入れテスト手順

## 使用パッケージ

- `flutter_riverpod`: 依存注入
- `drift` / `drift_flutter`: SQLite永続化、トランザクション、型付きクエリ
- `file_picker`: OSのファイル選択・保存画面
- `csv`: CSVエンコード・デコード
- `charset_converter`: Android / iOSを含むShift_JIS変換
- `url_launcher`: HTTPS URLの外部起動
- `uuid`: DB内部ID
- `intl`: 日時表示
- `path_provider`: 統合テストを含む端末パス取得
- `archive`: ZIPバックアップ
- `flutter_launcher_icons`: 提供済みロゴからAndroid / iOSアイコン生成（開発時のみ）
- `build_runner` / `drift_dev`: Driftコード生成（開発時のみ）
- `integration_test`: 端末統合テスト（開発時のみ）

## DB schemaVersion 1

- `operating_accounts`: SNS、表示名、アーカイブ、サンプル、累積新規フォロー、休憩案内済み、作成日時
- `targets`: SNS、表示用・正規化username、HTTPS URL、担当、状態、メモ、グループ、各日時、起動回数、サンプル
- `action_logs`: 対象、当時の運用元・SNS、起動／状態変更／キャンセル／再割り当て／メモ変更、変更前後、日時
- `app_settings`: SNS別の前回運用元、結果未登録対象、外部起動中断情報

対象の一意キーは `(platform, normalized_username)`。主要な一覧・安全集計・履歴には複合インデックスを設定した。

## SafetyGuard

- `status == followed` かつ `followedAt != null` の現在対象だけを集計する。
- 運用元IDとSNSで分離する。
- `now - 1 hour` と `now - 24 hours` の境界を含むローリング集計。日付変更ではリセットしない。
- 上限到達中は新規プロフィール起動だけを停止する。再開時刻は、必要な件数が窓外へ出る最も遅い時刻を表示する。
- 状態修正、未処理化、再割り当てによって現在対象から外れればカウントから外れる。
- セッション上限、最小起動間隔、強制休憩、ランダム待機はない。

## プラットフォーム差異

- Android / iOSともHTTPS URLをOSへ委譲する。端末のApp Links / Universal Links設定によりSNSアプリまたはブラウザが開く。
- Androidの検証用Debug ManifestだけはFlutterデバッグ接続のため`INTERNET`を持つ。Main Manifestに不要権限はない。
- WindowsではsubstドライブとPub cacheのルートが異なるため、Kotlin差分コンパイルを無効化してAndroidビルドを安定化した。
- Windows環境ではiOSの署名ビルド・実機試験は実施できない。iOSプロジェクト、表示名、アイコンは生成済み。

## 自動検証結果

2026-09-10時点:

- `dart format lib test integration_test`: 成功
- `flutter analyze`: 指摘0
- `flutter test`: 54件成功
- 10万件CSV取込、DBページング、検索、状態・グループ絞り込み: 成功
- 実ファイルDBのclose / reopenと中断対象復元: 成功
- `Pixel_9a_Large` / `emulator-5554` / Android 17 API 37統合テスト: 1件成功
- 端末上でShift_JIS、日本語SQLite、ライフサイクル、手動結果、次対象、ZIPバックアップ、DB再オープン: 成功
- Debug APK生成・インストール・起動: 成功
- Release APK生成: 成功（開発用debug署名。公開署名への切替は未実施）
- Main Manifest / iOS plistとコードの禁止機能・不要権限検索: 該当なし

APK: `follow_support_app/build/app/outputs/flutter-apk/app-debug.apk`

開発署名Release APK: `follow_support_app/build/app/outputs/flutter-apk/app-release.apk`

## 未確定・制約

- application ID / bundle IDは`jp.serendipy.snsfollowhelper`に決定済み。署名・Provisioning、提供者名、問い合わせ先、プライバシーポリシー公開URLは別途設定が必要。
- iOSビルド・実機確認はMac / Xcode環境で行う。
- 実在SNSでのリンク先、ログイン運用元、操作結果は人が確認する。アプリは取得・判定しない。
- ストア公開前に掲載文、スクリーンショット、App Privacy / Data Safetyを最終確認する。

人による確認項目は `docs/MANUAL_TEST.md` にまとめた。
