# ストア配信のセットアップ指示書

「フォロー作業ノート」(`jp.serendipy.snsfollowhelper`) を Codemagic でビルドし、
Google Play の内部テストと TestFlight へ配信できる状態にするまでの作業指示。

作業者は Claude Code のエージェントを想定する。ブラウザ操作ができる前提で書いている。

---

## 1. 何をゴールにするか

次の 5 つが揃った状態をゴールとする。

1. Codemagic の `android-release` が通り、署名済み AAB が Play の内部テストへ自動で上がる
2. Codemagic の `ios-appstore` が通り、ipa が TestFlight へ上がる
3. 実機にインストールできる (Android は内部テスト、iOS は TestFlight)
4. Play Console の「アプリの設定を完了する」が全項目完了し、審査へ送信できる
5. プライバシーポリシーが公開 URL で読める

**製品版の公開はゴールに含めない。** Google は個人デベロッパーアカウントに対し、
クローズドテストを 12 人以上のテスターで 14 日以上実施することを求める。
時間が要るので、クローズドテストの開始までを範囲とする。

---

## 2. 先に読む資料

### このリポジトリ

| パス | 内容 |
| --- | --- |
| `C:\00.git_repo\SnsFollewHelper\codemagic.yaml` | 2 つのワークフロー。**すでに書かれている**。設定が足りないだけ |
| `C:\00.git_repo\SnsFollewHelper\docs\CODEMAGIC.md` | Codemagic に必要なリソースの一覧 |
| `C:\00.git_repo\SnsFollewHelper\docs\STORE_LISTING_JA.md` | 日本語の掲載文 |
| `C:\00.git_repo\SnsFollewHelper\docs\STORE_LISTING_EN.md` | 英語の掲載文 |
| `C:\00.git_repo\SnsFollewHelper\docs\PRIVACY_POLICY.md` | プライバシーポリシーの本文 |
| `C:\00.git_repo\SnsFollewHelper\docs\APP_STORE_REVIEW_NOTES.md` | 審査ノート |
| `C:\00.git_repo\SnsFollewHelper\AGENTS.md` | リポジトリの約束事 |

### 参考にする別プロジェクト (2026-09-11 に同じ作業を完了済み)

**WSIBrowser で同じことを一通りやり、詰まった箇所をすべて記録してある。**
手順はほぼそのまま流用できる。**着手前に次の 2 つを必ず読むこと。**

| パス | 内容 |
| --- | --- |
| `C:\00.git_repo\WSIBrowser\doc\codemagic-android.md` | Android の手順と落とし穴。keystore 作成から Play 内部テストの実機インストールまで |
| `C:\00.git_repo\WSIBrowser\doc\codemagic-ios.md` | iOS の手順と落とし穴。配布プロファイルの作成と Codemagic への取り込み |
| `C:\00.git_repo\WSIBrowser\doc\store\README.md` | Play Console の登録項目、データセーフティの回答、踏んだもの |
| `C:\00.git_repo\WSIBrowser\doc\store\screenshots.md` | スクリーンショットの撮り方。エミュレーターの作り方と IME の罠 |
| `C:\00.git_repo\WSIBrowser\doc\store\review-notes.md` | 審査ノートの書き方の例 |
| `C:\00.git_repo\WSIBrowser\codemagic.yaml` | 完成形のワークフロー。SDK インストール手順やビルド番号採番の実装 |
| `C:\00.git_repo\WSIBrowser\apps\wsi_browser\tool\render_store_icon.mjs` | ストアアイコンの生成スクリプト |
| `C:\00.git_repo\WSIBrowser\apps\wsi_browser\tool\render_feature_graphic.mjs` | フィーチャーグラフィックの生成スクリプト |

---

## 3. いま分かっている状態 (2026-09-11 時点で確認済み)

**このアプリは、どのサービスにもまだ登録されていない。** すべて新規に作る。

| サービス | 状態 |
| --- | --- |
| Codemagic (チーム serendipity) | アプリ未追加。`snsfollowhelper_upload` の keystore も未登録 |
| Google Play Console | アプリ未作成。既存は PokePlus+、WSI Browser、治験ポータルナビの 3 件 |
| App Store Connect | アプリレコード未作成。既存は WSI Browser、pokePlus、治験ポータルナビの 3 件 |
| Apple Developer | App ID `jp.serendipy.snsfollowhelper` 未登録。プロファイルも無し |
| GitHub Pages | 未有効 |

**使い回せるもの**

| 項目 | 内容 |
| --- | --- |
| Apple の連携キー | Codemagic の Team integrations に `Codemagic` (Key ID `XWS9KGRK5S`、管理者権限) がある。`codemagic.yaml` は既にこの名前を参照している |
| 配布証明書 | `kazumi takayanagi` (Distribution) がチーム共通。Codemagic には `PokePlus Distribution` の名前で登録済み。**アプリごとに作らない** |
| Play のサービスアカウント | Codemagic の変数グループ `google_play` に `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` がある。pokePlus 用を流用する |

**アカウント**

| 用途 | アカウント |
| --- | --- |
| Google Play Console | serendip.takayanagi@gmail.com (個人用アカウント、ID 6247062002542776538) |
| App Store Connect / Apple Developer | develop@serendipy.jp (Team `TZ62JCFSJ9`) |
| Codemagic | develop@serendipy.jp (チーム serendipity) |
| GitHub | Serendipity1118 |

---

## 4. アプリの識別子

| 項目 | 値 |
| --- | --- |
| Android application ID | `jp.serendipy.snsfollowhelper` |
| iOS bundle ID | `jp.serendipy.snsfollowhelper` |
| 表示名 | フォロー作業ノート |
| Flutter プロジェクト | `follow_support_app/` |
| バージョン | `1.0.0+1` (`follow_support_app/pubspec.yaml`) |
| Flutter | 3.41.4 (ローカルと同じ値に固定済み) |

---

## 5. 作業手順

WSIBrowser の 2 つの手順書に沿って進める。**以下はこのアプリ固有の差分と、順番だけを書く。**
各手順の細かい操作は参照先を見ること。

### 5-1. Android

1. **upload keystore を作る。** リポジトリ外に置く。PKCS12 で作る。
   `keytool` は PATH に無いので `C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe` を使う。
   PowerShell は UTF-8 の .ps1 を誤読するので、スクリプト化するなら中身は ASCII にする。
2. **Codemagic に登録する。** 参照名は **`snsfollowhelper_upload`**。
   `codemagic.yaml` がこの名前で参照している。
3. **Codemagic にアプリを追加する。** GitHub の `Serendipity1118/SnsFollewHelper` を追加し、
   ブランチ `main` で `codemagic.yaml` を読ませる。
4. **変数グループ `google_play` をこのアプリに共有する。**
   Team settings → Global variables and secrets → `google_play` の鉛筆 → Application access で
   SnsFollewHelper を on にする。**新しいアプリは既定で全部 off なので、ここを忘れると
   `Application does not have access to variable group(s): google_play` でビルドが始まらない。**
5. **Play Console にアプリを作る。** アプリ名は「フォロー作業ノート」、日本語、アプリ、無料。
6. **`android-release` を回す。** 最初は `publishing:` をコメントアウトして AAB だけ作る。
7. **初回 AAB を手で内部テストへ上げる。** ここで Play App Signing が有効になる。
8. **サービスアカウントに権限を付ける。** Play Console → ユーザーと権限 → pokePlus 用の
   サービスアカウント → アプリの権限に SnsFollewHelper を追加。
   「アプリ情報の閲覧」と「テスト版のリリースを管理」。
9. **`publishing:` を戻して再度ビルドし、自動アップロードを確認する。**
10. **内部テストにテスターを登録する。** 端末の Play ストアにログインしている
    Google アカウントと一致させること。オプトイン URL から参加してインストールする。

### 5-2. iOS

1. **App ID を作る。** Apple Developer で `jp.serendipy.snsfollowhelper` を登録する。
2. **App Store Connect にアプリレコードを作る。** 名前は「フォロー作業ノート」。
   作成後、**URL に出る数値のアプリ ID を控える。** 次の手順で使う。
3. **配布プロファイルを作る。**
   <https://developer.apple.com/account/resources/profiles/add> で
   Distribution → App Store Connect → App ID を選び、既存の `kazumi takayanagi` 証明書を選ぶ。
   名前は `SnsFollowHelper AppStore` など。**ダウンロードは不要。**
4. **Codemagic に取り込む。** Code signing identities → **iOS provisioning profiles** タブ →
   Fetch profiles → 対象にチェック → 参照名を入れる → **ダイアログを下までスクロールして
   Fetch selected を押す。** ここを押さないと登録されない。
5. **`ios-appstore` を回して TestFlight へ上げる。**
6. **TestFlight の内部テストグループを作り、ビルドを追加する。**

### 5-3. プライバシーポリシー

1. `docs/PRIVACY_POLICY.md` の内容をもとに `docs/privacy.html` を作る。
   **CSS はページ内に持たせて自己完結させること。** 外部のスタイルシートを参照しない。
   日英併記にすると両ストアで同じ URL を使える。
2. GitHub Pages を有効にする。
   ```
   gh api -X POST repos/Serendipity1118/SnsFollewHelper/pages \
     -f "source[branch]=main" -f "source[path]=/docs"
   ```
3. 公開 URL は `https://serendipity1118.github.io/SnsFollewHelper/privacy.html` になる。
   ビルド完了まで数十秒かかる。200 が返ることを確認してからストアに登録する。

### 5-4. ストア素材

1. **アイコンとフィーチャーグラフィック。**
   `follow_support_app/assets/follow_work_notes_icon.png` と
   `sns_follow_helper_logo.png` がある。Play は 512x512、App Store は 1024x1024、
   フィーチャーグラフィックは 1024x500。**いずれも透過なし、角丸なしの四角で作る。**
   Play は透過を黒く塗り、App Store Connect は透過を弾く。
   WSIBrowser の `render_store_icon.mjs` / `render_feature_graphic.mjs` が参考になる。
2. **スクリーンショット。** Play は 2〜8 枚、各辺 320〜3840 px、**縦横比は 2:1 を超えないこと。**
   Pixel 9a 系のエミュレーターは 1080x2424 で 2.24:1 になり、この上限を超える。
   **リリースビルドで撮ること。** デバッグビルドは右上に赤い DEBUG の帯が出る。

   **AVD の扱いは `AGENTS.md` の方針に従うこと。** このリポジトリでは
   「既存の `Pixel_9a_Large` を使い、別の AVD を新規作成しない」と決まっている。
   WSIBrowser では撮影専用の AVD を作ったが、**ここでは勝手に作らない。**
   縦横比を落とす必要があるので、次のいずれかを利用者に一問一答で確認する。

   - 既存 AVD で一時的に `adb shell wm size 1080x1920` を使い、撮影後に `wm size reset` で戻す
     (解像度変更の直後にシステム UI が固まることがある。待機を選んで数秒待てば復帰する)
   - 撮影用の AVD を一時的に作る許可をもらい、終わったら削除する
   - 実機で撮る
3. 掲載文は `docs/STORE_LISTING_JA.md` と `STORE_LISTING_EN.md` を使う。
   **Play Console の入力欄に貼るときは平文のテキストファイル経由にすること。**
   Markdown 表示やチャットからコピーすると文字が落ちることがある。
   貼った後に文字数を見て、想定と合っているか必ず確認する。

### 5-5. Play Console の申告

WSIBrowser の `doc\store\README.md` の「Play Console の登録状況」と同じ回答で進む。
**このアプリ固有の判断が要るのは次の 3 つ。**

| 項目 | 判断材料 |
| --- | --- |
| コンテンツのレーティング | WSI Browser はブラウザなので「ウェブブラウザまたは検索エンジンですか」を「はい」にした。**このアプリはブラウザではないので「いいえ」。** 外部 SNS は利用者が別アプリで開く |
| データ セーフティ | `docs/PRIVACY_POLICY.md` を読んで実態に合わせる。端末内で完結し外部送信が無いなら「収集しない」 |
| ターゲット ユーザー | SNS 運用の作業支援なので 18 歳以上が妥当。判断に迷ったら利用者に聞く |

**広告 ID の申告を忘れないこと。** これはダッシュボードのチェックリストに現れず、
「モニタリングと改善」→「ポリシーとプログラム」→「アプリのコンテンツ」にある。
ここが残っていると審査に送信できない。同じ画面の「要注意」タブで未完了を確認できる。

---

## 6. コードに入れる変更

### 6-1. iOS のビルド番号を TestFlight の最新 + 1 にする

**現状の `ios-appstore` は `PROJECT_BUILD_NUMBER` を使っている。** これを WSIBrowser と
同じ方式に揃える。Codemagic 以外から上げたビルドがあっても重複しなくなる。

`codemagic.yaml` の `ios-appstore` に、App Store Connect の数値アプリ ID を変数として足し、
ビルド前に採番するステップを入れる。実装は
`C:\00.git_repo\WSIBrowser\codemagic.yaml` の `ios-appstore` をそのまま参考にする。

```yaml
      vars:
        APP_STORE_APP_ID: <App Store Connect の数値 ID>
    scripts:
      ...
      - name: Determine build number
        script: |
          LATEST=$(app-store-connect get-latest-testflight-build-number \
            "$APP_STORE_APP_ID" 2>/dev/null || true)
          case "$LATEST" in
            ''|*[!0-9]*) LATEST=0 ;;
          esac
          echo "BUILD_NUMBER=$((LATEST + 1))" >> "$CM_ENV"
```

`flutter build ipa` の `--build-number` を `$BUILD_NUMBER` に変える。

### 6-2. Android SDK プラットフォームの事前インストール (必要なら)

このアプリの `compileSdk` は `flutter.compileSdkVersion` で、固定値ではない。
WSIBrowser は `compileSdk = 37` を固定していたため、Linux イメージに platform 37 が無く
`Failed to find target with hash string 'android-37'` でビルドが落ちた。

**まずそのまま `android-release` を回す。** 同じエラーが出たときだけ、
WSIBrowser の `codemagic.yaml` にある「Install the Android SDK platform for compileSdk」
ステップを移植する。`sdkmanager` は PATH に無く、cmdline-tools が `latest` ではなく
`latest-2` にあることもあるので、glob で探す実装になっている。

### 6-3. `.gitignore`

`key.properties` と `*.jks` が除外されているか確認する。CODEMAGIC.md には除外済みとあるが、
実際のファイルを見て確かめること。

---

## 7. 進め方

- **不明点や判断が要る点は、一問一答形式で推奨案を先頭に付けて利用者に聞く。**
  勝手に決めない。特に配信国、テスターの範囲、レーティングの回答は利用者の判断。
- **破壊的な操作の前は必ず確認を取る。** アプリの削除、keystore の作り直し、
  既存アプリの設定変更など。
- **`AGENTS.md` を読んでから着手する。** エミュレーターの扱いなど、このリポジトリ固有の
  約束がある。利用者が起動したエミュレーターは検証後もそのまま維持する。
- ブラウザ操作は自分で行ってよい。**ただしパスワードの入力は利用者に依頼すること。**
- コミットは作業のまとまりごとに 1 つ。push はリポジトリの約束に従う。
- 詰まった点は WSIBrowser と同じように文書へ残す。次に同じことをする人が助かる。

---

## 8. 想定される所要時間

| 作業 | 目安 |
| --- | --- |
| Android 一式 (keystore からビルド成功まで) | 1〜2 時間。Codemagic のビルドが 1 回 10 分前後 |
| iOS 一式 (プロファイルから TestFlight まで) | 1〜2 時間。Mac ビルドが 1 回 15〜25 分 |
| ストア素材 (アイコン、スクリーンショット) | 1 時間 |
| Play Console の申告と掲載情報 | 1 時間 |

ビルドの待ち時間が長いので、待つ間に別の作業を進めるとよい。

---

## 9. 完了の確認

- [ ] Codemagic の `android-release` が成功し、artifacts に `.aab` と `.apk` が並ぶ
- [ ] Play の内部テストに自動でビルドが上がる
- [ ] 実機にインストールできる
- [ ] Codemagic の `ios-appstore` が成功し、TestFlight にビルドが上がる
- [ ] TestFlight の内部テストグループから実機にインストールできる
- [ ] プライバシーポリシーの URL が 200 を返す
- [ ] Play Console の「アプリの設定を完了する」が全項目完了
- [ ] 「アプリのコンテンツ」の「要注意」タブが 0 件
- [ ] 審査へ送信できる状態になっている
