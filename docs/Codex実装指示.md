# Codex実装指示

この文書はCodexへそのまま渡して実装を進めるための指示書である。

参照順:

1. `要件定義.md`
2. `詳細仕様.md`
3. 本ファイル

要件定義と本書が矛盾した場合は`要件定義.md`を優先する。

---

## 1. 実装ゴール

FlutterでAndroid / iOS向けの「X / Instagram手動フォロー作業支援アプリ」のMVPを完成させる。

アプリは端末ローカルだけで完結させる。

外部Backend、Firebase、Firestoreは使用しない。

SNSのフォロー操作は自動化しない。

---

## 2. 絶対禁止

以下は実装しないこと。

```text
- X / Instagramのフォローボタン自動押下
- AccessibilityService
- 他アプリUI解析
- OCRによるSNS状態判定
- WebView DOM解析
- JavaScript Injection
- スクレイピング
- SNSログイン情報取得
- Cookie取得
- SNSアクセストークン取得
- フォロー状態の自動取得
- フォロワー一覧の自動取得
- 自動いいね
- 自動DM
- 自動コメント
- 自動フォロー解除
- Flutter復帰時の次プロフィール自動起動
- ランダム待機による検知回避
- 人間操作を模倣する自動化
```

この制約は実装途中でも変更しない。

---

## 3. 初期セットアップ

Flutter stableを使用。

プロジェクト名:

```text
follow_support_app
```

推奨実行:

```bash
flutter create follow_support_app
cd follow_support_app
```

`pubspec.yaml`へ必要依存を追加する。

```text
flutter_riverpod
drift
drift_flutter
sqlite3_flutter_libs
file_picker
csv
url_launcher
uuid
intl
path_provider
```

dev:

```text
build_runner
drift_dev
mocktail
```

依存バージョンは実装時点で互換性のある最新版を解決する。

---

## 4. 実装順序

以下の順で実装する。

### Phase 1: Domain / Core

1. enum定義
2. TargetAccount
3. SafetyPolicy
4. AppClock
5. username normalizer
6. profile URL builder

この時点でunit testを書く。

### Phase 2: Local DB

1. Drift database
2. Targets table
3. ActionLogs table
4. Repository interface
5. Drift repository implementation
6. DB test

### Phase 3: Import / Export

1. CSV parser
2. validation
3. preview model
4. duplicate detection
5. import transaction
6. UTF-8 BOM CSV export

### Phase 4: Safety

1. SafetyGuard
2. rolling 1h
3. rolling 24h
4. session limit
5. minimum profile open interval
6. forced break
7. retryAt計算

SafetyGuardにはClockを注入してテスト可能にする。

### Phase 5: External Launch

1. ExternalProfileLauncher interface
2. url_launcher implementation
3. profileOpened log
4. failure handling

HTTPS URLのみで実装する。

### Phase 6: UI

以下の順:

1. Dashboard
2. Import
3. Target List
4. Work
5. Target Detail
6. Export
7. Settings

### Phase 7: Lifecycle

SNS起動後にFlutterがresumeしたことだけを検知する。

resume時に結果入力UIへ切り替える。

フォロー判定は行わない。

### Phase 8: Tests / Polish

1. unit
2. widget
3. integration
4. flutter analyze
5. platform permissions確認

---

## 5. 実装時の状態遷移

作業State Machineを明示的に実装する。

```text
idle
  |
  v
targetReady
  |
  | user taps "プロフィールを開く"
  v
safetyChecking
  |
  +-- blocked --> blocked
  |
  v
launchingExternalApp
  |
  v
waitingForReturn
  |
  | app resumed
  v
awaitingManualResult
  |
  | user selects status
  v
resultSaved
  |
  | user taps "次のアカウントを開く"
  v
targetReady
```

`app resumed -> resultSaved`へ直接遷移してはならない。

---

## 6. SafetyGuard実装

デフォルト:

```dart
rolling24hFollowLimit = 20
rolling1hFollowLimit = 5
sessionFollowLimit = 10
minProfileOpenInterval = 60 seconds
consecutiveFollowLimit = 5
forcedBreakDuration = 10 minutes
```

これらを`core/safety/safety_policy.dart`へ集約する。

UIには以下を明記する。

```text
本制限値はSNS運営会社が保証する安全値ではありません。
短時間・大量の連続操作を抑止するためのアプリ独自の安全マージンです。
```

---

## 7. Follow件数集計ルール

集計対象:

```text
targets.status == followed
AND followedAt != null
```

1時間:

```text
followedAt >= now - 1h
```

24時間:

```text
followedAt >= now - 24h
```

日付0:00でリセットしない。

---

## 8. プロフィール起動ルール

`プロフィールを開く`押下時:

```text
1. SafetyGuard.canOpenNextProfile()
2. blockedならダイアログ
3. allowedならURL起動
4. 起動成功時のみopenCount / lastOpenedAt / logを更新
```

URL:

```dart
switch (platform) {
  PlatformType.x =>
    Uri.https('x.com', '/$username'),

  PlatformType.instagram =>
    Uri.https('www.instagram.com', '/$username/'),
}
```

---

## 9. Flutter復帰処理

WidgetsBindingObserverまたはAppLifecycleListenerを使用。

要件:

```text
externalLaunchPending == true
AND state == resumed
```

なら:

```text
awaitingManualResult = true
```

だけ実行する。

以下は禁止:

```text
status = followed
nextTarget()
launchNext()
```

---

## 10. 手動結果UI

必ず以下6つを実装。

```text
フォロー済み
未フォロー
非公開
凍結・停止
存在しない
スキップ
```

ボタンタップ後:

```text
DB更新
action log保存
resultSaved表示
```

次プロフィールは自動起動しない。

---

## 11. CSV

最小フォーマット:

```csv
platform,username
instagram,example_user_1
x,example_user_2
```

任意:

```csv
platform,username,profile_url,memo,group
```

入力例を`assets/sample_targets.csv`またはルートに同梱する。

不正行があってもアプリ全体をクラッシュさせない。

インポート前にPreview画面を出す。

---

## 12. データ件数

最低10万件でも一覧画面が一括Widget生成されないようにする。

以下を使用する。

```text
ListView.builder
DB pagination / limit-offset
```

---

## 13. UX

重要:

- 「フォロー済み」と表示してもアプリがSNS状態を検知したような表現にしない
- 「あなたがフォロー済みとして登録しました」相当の意味にする
- 「凍結」は利用者による分類である
- SNS公式との提携を示す文言を使用しない

---

## 14. Settings

MVP設定:

表示:

```text
安全マージン設定
24h: 20
1h: 5
Session: 10
最小間隔: 60秒
連続5件後: 10分休憩
```

MVPでは閲覧のみでよい。

開発時に変更したい場合はコード定数で変更する。

---

## 15. 画面ナビゲーション

単純なNavigator 2.0 / go_routerのどちらでもよい。

依存を増やしたくない場合はNavigatorを使用。

必要画面:

```text
DashboardScreen
ImportScreen
ImportPreviewScreen
TargetListScreen
WorkScreen
TargetDetailScreen
ExportScreen
SettingsScreen
```

---

## 16. エラー

ユーザー向けメッセージは日本語。

例:

```text
プロフィールを開けませんでした。
SNSアプリまたはブラウザの設定を確認してください。
```

CSV:

```text
CSVを読み込めませんでした。
ヘッダーと文字コードを確認してください。
```

DB例外スタックを直接画面に出さない。

---

## 17. テスト必須項目

Codexは実装と同時にテストを書くこと。

最低限:

```text
test/
  core/
    username_normalizer_test.dart
    profile_url_builder_test.dart
    safety_guard_test.dart
  import/
    csv_parser_test.dart
  repositories/
    target_repository_test.dart
  features/
    work_controller_test.dart
  widgets/
    work_screen_test.dart
```

Safety testはFakeClockを使う。

---

## 18. Definition of Done

Codexは最終的に以下を実行し、問題を修正すること。

```bash
dart format .
flutter analyze
flutter test
```

可能であれば:

```bash
flutter build apk --debug
```

iOS環境では:

```bash
flutter build ios --no-codesign
```

---

## 19. 最終報告に含める内容

実装完了時は以下を報告する。

```text
1. 実装した機能一覧
2. 使用パッケージ
3. DB schema
4. SafetyGuardの仕様
5. Android/iOSの差異
6. 実行したテスト
7. 未実装 / 制約
8. 起動方法
```

---

## 20. 実装判断ルール

不明点があっても、以下を優先する。

```text
1. SNS操作を自動化しない
2. 外部DBを使わない
3. 人間が結果を登録する
4. 次プロフィールは人間が開く
5. SafetyGuardを必ず通す
6. シンプルなFlutter標準構成を優先
7. テスト可能な依存注入を行う
```

UIの細部はMVPとして合理的に補完してよい。

禁止事項に触れる実装は行わない。

---
## 21. ストア申請対応を実装へ含める

### 21.1 追加画面
以下を実装する。

```text
AboutScreen
PrivacyPolicyScreen
```

AboutScreenには以下を表示する。

- 自動操作を行わない
- 第三者SNSの画面を解析しない
- SNS認証情報を取得しない
- X / Instagram / Meta等との非提携

### 21.2 サンプルデータ
`サンプルデータを読み込む`を実装する。

```text
demo_account_001
demo_account_002
demo_account_003
```

サンプルアカウントは架空とし、実在プロフィールを開かない。

### 21.3 docs生成
```text
docs/PRIVACY_POLICY.md
docs/APP_STORE_REVIEW_NOTES.md
docs/STORE_LISTING_JA.md
docs/STORE_LISTING_EN.md
```

### 21.4 App Store Review Notes
以下をベースにする。

```text
This app does not automate any action on third-party social networking services.
It only manages a user-provided list of profile URLs locally on the device.
The user manually opens each profile, performs any action directly in the third-party app or browser, returns to this app, and manually records the result.
The app does not access, scrape, inspect, or control third-party applications.
No social-network credentials, cookies, or access tokens are collected or stored.
```

### 21.5 ストア掲載文禁止表現
```text
自動フォロー
フォロワー爆増
フォロワー増加保証
大量フォロー
凍結回避
BAN回避
検知回避
```

### 21.6 リリース前検査
```bash
grep -R "AccessibilityService" .
grep -R "WebView" lib android ios
grep -R "autoFollow" lib
grep -R "cookie" lib
grep -R "accessToken" lib
```

### 21.7 Definition of Done追加
- About画面あり
- プライバシーポリシー表示あり
- サンプルデータ機能あり
- 外部アプリ/ブラウザ起動フォールバックあり
- ストア申請用docs 4点あり
- 第三者SNS公式との提携を示す表現なし
- Accessibility APIなし
- SNS自動操作なし
