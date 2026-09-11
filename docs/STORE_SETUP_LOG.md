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
| Apple Developer | App ID `jp.serendipy.snsfollowhelper` (名前 SnsFollowHelper、Capabilities なし) |

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
- 撮影中、操作履歴にはサンプルでも「プロフィール起動」が記録され、対象 ID が UUID で表示される。
  ストア画像には使っていない
