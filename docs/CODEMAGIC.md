# Codemagic署名済みストアビルド

Flutterアプリは`follow_support_app/`、正式なAndroid application IDとiOS bundle IDは
`jp.serendipy.snsfollowhelper`。ルートの`codemagic.yaml`に次のワークフローを定義する。

| ワークフロー | 出力 | 配信先 |
| --- | --- | --- |
| `android-release` | 署名済みAAB、APK、mapping.txt | Google Play内部テスト |
| `ios-appstore` | App Store署名済みIPA | TestFlight |

Flutterはローカルと同じ`3.41.4`に固定する。両ワークフローとも依存取得、Driftコード生成、
静的解析、ユニット／Widgetテストを通過してから成果物を作る。

## Androidの事前設定

1. `jp.serendipy.snsfollowhelper`でGoogle Play Consoleにアプリを作る。
2. 専用upload keystoreをリポジトリ外に作り、別途安全にバックアップする。
3. CodemagicのTeam settings → Code signing identities → Android keystoresへ登録する。
4. Reference nameは**`snsfollowhelper_upload`**にする。
5. Google PlayサービスアカウントJSONをsecret変数
   `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`として、変数グループ`google_play`へ登録する。
6. サービスアカウントへ対象アプリの内部テストリリース権限を付ける。

Codemagicは選択したkeystoreから`CM_KEYSTORE_PATH`、`CM_KEYSTORE_PASSWORD`、
`CM_KEY_ALIAS`、`CM_KEY_PASSWORD`を展開する。ワークフローがこれを
`follow_support_app/android/key.properties`へ書き出す。ファイルとkeystoreはGit除外済み。

Google Play APIによる自動配信は、同じpackage nameの初回AABをPlay Consoleへ手動で
アップロードした後に利用できる。初回は成果物のAABをダウンロードして内部テストへ登録する。

## iOSの事前設定

1. Apple Developerで`jp.serendipy.snsfollowhelper`のApp IDを作る。
2. App Store Connectに「SnsFollowHelper」のアプリレコードを作る。
3. App Store配布用Provisioning Profileを作る。
4. CodemagicのCode signing identitiesへApple Distribution証明書とProfileを登録する。
5. Profileのbundle IDが`jp.serendipy.snsfollowhelper`と一致することを確認する。
6. CodemagicのApp Store Connect integrationは、WSIBrowserと同じ`Codemagic`を使う。

`ios_signing`はbundle IDと`app_store`配布種別で一致する証明書・Profileを取得し、
`xcode-project use-profiles`でRunnerプロジェクトへ適用する。ビルド番号には
Codemagicの`PROJECT_BUILD_NUMBER`を使う。

`Info.plist`には`ITSAppUsesNonExemptEncryption=false`を設定している。このアプリが使うのは
HTTPSとOS標準の暗号機能だけである。

## Codemagicへの登録と実行

1. GitHubリポジトリ`Serendipity1118/SnsFollewHelper`をCodemagicへ追加する。
2. 対象ブランチでルートの`codemagic.yaml`をScanする。
3. 上記の署名identity、integration、secret変数を登録する。
4. `android-release`または`ios-appstore`を手動実行する。

自動トリガーは設定していない。署名済み成果物がストアへ送信されるワークフローなので、
Codemagic画面から明示的に開始する。
