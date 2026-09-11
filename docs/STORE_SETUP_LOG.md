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
| Play 内部テスト | メーリングリスト `SnsFollowHelper-internal-testers` (serendip.takayanagi@gmail.com)。オプトイン URL <https://play.google.com/apps/internaltest/4701519831831799386> |

## ストア素材

| ファイル | 用途 |
| --- | --- |
| `follow_support_app/store/play-icon-512.png` | Play のアイコン |
| `follow_support_app/store/app-store-icon-1024.png` | App Store のアイコン |
| `follow_support_app/store/play-feature-1024x500.png` | Play のフィーチャーグラフィック |
| `follow_support_app/store/screenshots/android-ja/*.png` | Play のスマートフォン用 6 枚 (1080x1920) |

画像は `follow_support_app/tool/render_store_assets.ps1` で作り直せる。元アイコンは角丸で四隅が透過
(中央も alpha 252) なので、角丸の内側の正方形を切り出して不透明な背景に重ねている。

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
- **Play の内部テストのテスタータブで、新しく作ったメーリングリストは作成時にチェックが入った状態になり、
  「保存」ボタンは押せないまま。** 読み込み直してもチェックが残っていれば保存されている
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
