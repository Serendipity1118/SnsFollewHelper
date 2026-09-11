# ストア配信セットアップの記録

`docs/STORE_SETUP_INSTRUCTIONS.md` に沿って作業した結果と、決めたこと、踏んだもの。
手順そのものは WSIBrowser の `doc/codemagic-android.md` / `doc/codemagic-ios.md` を参照。

## 決定事項 (一問一答の結果)

| 項目 | 決定 |
| --- | --- |
| upload keystore | 既存の `C:\Users\takayanagi\keys\snsfollowhelper_upload.jks` を使う (PKCS12、alias `snsfollowhelper`) |
| プライバシーポリシーの提供者 | Serendipity / develop@serendipy.jp |
| コミットと push | 作業ブランチ `Serendipity1118/release` でコミットし、main へ早送りで push |
| スクリーンショット | 撮影用 AVD `SnsFollowHelper_Screenshot` (1080x1920) を一時的に作り、撮影後に削除 |
| 変数グループ `google_play` の公開範囲 | chikenPortal / pokePlus / SnsFollewHelper / WSIBrowser を個別に on。All applications は off |
| Play の「自動保護」 | 既定のまま (インストーラ チェックを追加する) |
| ターゲット ユーザー | 18 歳以上のみ |
| カテゴリ | Play は「仕事効率化」、App Store は「仕事効率化 (Productivity)」 |
| コンテンツのレーティング | 「ユーティリティ、生産性向上、通信、その他」。暴力・性的表現・不適切な言葉・規制薬物・ギャンブル・ユーザー間のやり取り・現在地の共有・デジタル商品の購入はすべて「いいえ」。**「ウェブブラウザまたは検索エンジンですか」は「いいえ」** (WSI Browser とは違う。外部 SNS は OS 経由で別アプリが開く) |
| テスター | Play 内部テストは serendip.takayanagi@gmail.com、TestFlight 内部テストも serendip.takayanagi@gmail.com |
| アプリ名 | **SnsFollowHelper** に統一。両ストアの掲載名、端末の表示名 (AndroidManifest / Info.plist)、アプリ内のタイトル、文書のすべて。Play Console は旧名「フォロー作業ノート」で作成したので、掲載情報で名前を変える |

## 登録したもの

| サービス | 内容 |
| --- | --- |
| GitHub Pages | main の `/docs`。<https://serendipity1118.github.io/SnsFollewHelper/privacy.html> |
| Codemagic | アプリ SnsFollewHelper (project type は Other)。keystore 参照名 `snsfollowhelper_upload` |
| Google Play Console | `jp.serendipy.snsfollowhelper` (アプリ ID 4975189214274327445)。作成時の名前は旧名のため、掲載情報で SnsFollowHelper に変える |
| Apple Developer | App ID `jp.serendipy.snsfollowhelper` (名前 SnsFollowHelper、Capabilities なし)。配布プロファイル `SnsFollowHelper AppStore` (証明書 kazumi takayanagi、期限 2027-03-31) |
| Codemagic (iOS) | プロファイル参照名 `snsfollowhelper_appstore` |
| App Store Connect | SnsFollowHelper (アプリ ID 6810976442、SKU `snsfollowhelper`、主言語 日本語、アクセス制限なし) |
| TestFlight テスト情報 | フィードバック用メール serendip.takayanagi@gmail.com、ベータ版 App Review の連絡先 (利用者が入力)、プライバシーポリシー URL、審査メモ (英語、`APP_STORE_REVIEW_NOTES.md` の要約) |
| TestFlight 内部グループ | `SnsFollowHelper Internal`。**自動配信を有効** (作成後は変更できない)。テスター serendip.takayanagi@gmail.com (Account Holder)。develop@serendipy.jp は App Store Connect のユーザーに無いので選べなかった |
| Play サービスアカウント | `codemagic-publish@pokeplus.iam.gserviceaccount.com` (pokePlus と共用) のアプリの権限にフォロー作業ノートを追加。「アプリ情報の閲覧」「アプリの品質情報の閲覧」(自動)「テスト版トラックとしてのアプリのリリース」の 3 件。製品版のリリースとテスターリストの編集は付けていない |
| Play 内部テスト | メーリングリスト `SnsFollowHelper-internal-testers` (serendip.takayanagi@gmail.com)。オプトイン URL <https://play.google.com/apps/internaltest/4701519831831799386> |

## 進み具合 (2026-09-11)

| 項目 | 状態 |
| --- | --- |
| プライバシーポリシー公開 | 完了 (200 を確認) |
| Codemagic `android-release` | 成功 (ビルド #2、versionCode 1)。`publishing:` を戻したビルド #3 で versionCode 2 が内部テストへ自動公開された (`Status: completed`) |
| 実機インストール | Android (内部テスト) と iOS (TestFlight) の両方で確認 |
| Play 内部テスト | 初回リリースを手動で公開済み (9月11日 18:05) |
| Play 掲載情報 | 日本語 (デフォルト) と en-US。アイコン、フィーチャーグラフィック、スクリーンショット 6 枚 |
| Play ストアの設定 | カテゴリ「仕事効率化」、連絡先 develop@serendipy.jp |
| Play アプリのコンテンツ | 10 件すべて申告済み。審査へ送信済み (ダッシュボードで「審査中」) |
| Codemagic `ios-appstore` | #2 と #3 は beta review 提出で失敗 (連絡先、次に説明文が不足)。テスト情報をそろえた #4 は `finished` (Post-processing まで成功) |
| TestFlight | 内部グループ `SnsFollowHelper Internal` に 1.0.0 (1)〜(3) を配信。ビルド番号は TestFlight の最新 + 1 で採番されている |
| 撮影用 AVD | `SnsFollowHelper_Screenshot` を削除済み |

## ストア素材

| ファイル | 用途 |
| --- | --- |
| `follow_support_app/store/play-icon-512.png` | Play のアイコン |
| `follow_support_app/store/app-store-icon-1024.png` | App Store のアイコン |
| `follow_support_app/store/play-feature-1024x500.png` | Play のフィーチャーグラフィック |
| `follow_support_app/store/screenshots/android-ja/*.png` | Play のスマートフォン用 6 枚 (1080x1920) |

画像は `follow_support_app/tool/render_store_assets.ps1` で作り直せる。元アイコンは角丸で四隅が透過
(中央も alpha 252) なので、角丸の内側の正方形を切り出して不透明な背景に重ねている。

## 申告の根拠

リリース APK (`flutter build apk --release`) の権限を `aapt2 dump permissions` で確かめた。
宣言されているのは Flutter が付ける `jp.serendipy.snsfollowhelper.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`
だけで、`com.google.android.gms.permission.AD_ID` も `android.permission.INTERNET` も無い。

| 申告 | 回答 | 根拠 |
| --- | --- | --- |
| 広告 | 含まない | 広告 SDK なし |
| 広告 ID | 使用しない | `AD_ID` 権限なし |
| ログインの詳細 | ログイン不要 | アカウント機能なし |
| データ セーフティ | 収集も共有もしない | 端末内の SQLite のみ。`INTERNET` 権限なし。プロフィールを開く操作は OS に URL を渡すだけ |
| 行政アプリ / 金融取引機能 / 健康 | いずれも該当なし | |

## 踏んだもの

- **初回の `ios-appstore` が `Install CocoaPods` で落ちた。** `file_picker_darwin` が iOS 14.0 を要求するが、
  リポジトリに `ios/Podfile` が無く、CocoaPods が iOS 13.0 と見なして解決できなかった
  (`required a higher minimum deployment target`)。`platform :ios, '14.0'` の Podfile をコミットし、
  `project.pbxproj` の `IPHONEOS_DEPLOYMENT_TARGET` も 14.0 に揃えた。Windows では iOS を
  ビルドできないので、この種の失敗は Codemagic で初めて分かる
- **Podfile の修正後、`ios-appstore` は IPA のビルドと TestFlight へのアップロードまで通ったが、
  最後の「TestFlight beta review への提出」で失敗した。** `submit_to_testflight: true` は外部テスト用の
  ベータ版審査に出す設定で、App Store Connect の TestFlight →「テスト情報」にフィードバック用メールと
  ベータ版 App Review の連絡先 (姓・名・電話番号・メール) が無いと
  `Complete test information is required to submit application ... for external testing` になる。
  アップロード自体は済んでいるので、内部テストグループへの追加はできる
- **テスト情報に連絡先を入れた後の `ios-appstore` #3 も beta review 提出で失敗した。** 今度は
  `Beta App Description is missing`。TestFlight →「テスト情報」の「ベータ版 App の説明」も外部テストの提出に必須
- `ios-appstore` のアップロード時に警告 90068: 2027 年春から MinimumOSVersion 15.0 以上が必須になる。
  現在は file_picker に合わせて 14.0。WSIBrowser は 15.0
- `android-release` の Publishing で `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` が非推奨と警告される。
  変数グループ `google_play` は pokePlus などと共用なので、名前を変えるときは全アプリのワークフローを直す
- **Play の「新しいリリースを作成」の「ライブラリから追加」には、すでにトラックに入っている App Bundle は出ない。**
  Codemagic のログで `Successfully published App Bundle to Google Play track internal` を確認する方が確実
- **Play の内部テストのテスタータブで、新しく作ったメーリングリストは作成時にチェックが入った状態になり、
  「保存」ボタンは押せないまま。** 読み込み直してもチェックが残っていれば保存されている
- **Play の掲載情報の画像は、右側のアセット ライブラリ パネルからアップロードして欄に適用する。**
  アイコンを入れた後はアイコン欄にも「アセットを追加」が残るので、フィーチャーグラフィック欄のものと
  取り違えやすい。取り違えるとパネルが 512x512 の切り抜き前提になり、1024x500 の画像が
  「この画像は小さすぎるため、選択または切り抜きできません」と出る。画像の問題ではない
- **スクリーンショットを複数まとめて適用すると、欄に入る順番がファイル名の順にならない。**
  6 枚を一度に上げて適用したら 02、05、04、03、06、01 の順になった。欄の中のサムネイルはドラッグで
  並べ替えられる。並べ替えた後は DOM から順番を読めなくなったので、欄を拡大して画面タイトルで確かめた
- アイコンはアップロード直後に選択状態になったが、フィーチャーグラフィックはならなかった。
  項目の左にある「選択ボタン」(ラジオ) を押すと、パネル下部に「適用」が出る
- **keystore の alias に先頭の空白が入ると `Alias " snsfollowhelper" does not exist in keystore` になる。**
  エラー文の引用符の内側に空白が見えたら入力値を疑う
- **Codemagic の変数グループの Application access は、表示が実際の設定と合っていなかった。**
  WSIBrowser と pokePlus は `google_play` を使ってビルドに成功しているのに、Edit group では
  全アプリが off に見えた (DOM でも未チェック)。新しいアプリだけ on にして保存すると
  既存アプリの許可を外す恐れがあるので、使っているアプリをすべて on にして保存した
- **ビルド画面に手順名が並んでも、ビルドが始まったとは限らない。** 変数グループの許可エラーは
  手順一覧の下に 1 行出るだけなので、ページの文字列で `Application does not have access` を確認する
- **Play Console の「アプリを作成」にパッケージ名の欄が増えている。** 作成時に
  「使用できるか確認する」でパッケージ名を確定できる。無料を選ぶと「自動保護」の欄が現れる
- **Claude in Chrome はリポジトリ外のファイルをアップロードできない。** keystore のように
  セッションの許可ディレクトリ外にあるファイルは、利用者が画面で選ぶ
- **背景のタブではスクリーンショットが取れない** (CDP のタイムアウト)。1 タブで順に操作する
- **App Store Connect の新規アプリで「ユーザアクセス設定を保存できませんでした」が出ても、アプリは作成されている。**
  説明文に「現在すべてのユーザにアプリアクセスがあります」とあり、「アクセス制限なし」を選んだ場合は実害がない。
  「アプリ情報ページを表示」から開くと URL に数値のアプリ ID が出る
- **App Store Connect の新規アプリのプルダウン (プライマリ言語、バンドル ID) は、値を入れても画面に反映されないことがある。**
  選択後に「選択する」のままなら、選択肢を選び直してから作成ボタンが有効になったことを確かめる
- **Claude in Chrome のサイト許可は、許可した直後でも移動を拒否されることがある。** play.google.com は
  一度開けた後に拒否された。拒否されたら拡張の許可一覧を確認してもらう
- 撮影中、操作履歴にはサンプルでも「プロフィール起動」が記録され、対象 ID が UUID で表示される。
  ストア画像には使っていない
