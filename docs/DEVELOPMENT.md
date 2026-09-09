# Flutter開発環境

確認日: 2026-09-09

## 現在の構成

| 項目 | 確認済み環境 |
| --- | --- |
| OS | Windows 11 |
| Flutter | 3.41.4 / stable / `C:\flutter` |
| Dart | 3.11.1（Flutter同梱） |
| Java | Android Studio同梱OpenJDK 21.0.10 |
| Android SDK | `C:\Users\takayanagi\AppData\Local\Android\sdk` |
| SDK Platform | Android 36 / 36.1などを導入済み |
| Build Tools | 36.1.0 |
| 開発用AVD | `Pixel_9a_Large` / Android 17 / API 37 / x86_64 |
| エディター | VS Code・CursorともFlutter / Dart拡張を導入済み |

既存のFlutter stableを使用して動作確認した。SDKの更新は今回行っていない。
Android SDKのライセンスはすでに承諾済み。
ユーザー環境変数に`ANDROID_HOME`を設定し、ユーザーPATHにAndroidの`platform-tools`と`emulator`を追加した。
環境変数を反映するにはターミナルやエディターを開き直す。

`follow_support_app/`は`flutter create --platforms=android,ios --project-name follow_support_app follow_support_app`で作成した雛形。
現在の画面とテストはFlutter標準のカウンターサンプルで、業務機能やRiverpod / Drift等の追加依存は未実装。
アプリIDは雛形の`com.example.follow_support_app`で、公開時には正式なIDと署名設定が必要。

## Windowsで開発を開始する

このワークスペースのパスには日本語の`初期設定`が含まれるため、直接AndroidビルドするとAndroid Gradle Pluginが拒否する。
`subst`で同じフォルダーを英数字のドライブパスから開いて開発する。
ファイルのコピーや移動は行わず、`S:\`と元のワークスペースは同じファイルを参照する。

リポジトリのルートでPowerShellを開き、次を実行する。

```powershell
. .\scripts\Enter-FlutterDev.ps1
```

`S:\follow_support_app`に移動する。`S:`はサインインセッション中の割り当てなので、Windows再起動後は再度実行する。
すでに別の用途で`S:`が使われている場合は、空いているドライブ文字を指定する。

```powershell
. .\scripts\Enter-FlutterDev.ps1 -DriveLetter T
```

スクリプトは既存ドライブを上書きしない。このGitワークツリーの`.git`ファイルが一致する場合だけ既存の割り当てを再利用する。

エディターも、移動後の英数字パスで開く。

```powershell
code .
# Cursorを使用する場合
cursor .
```

アプリ配下の`.vscode/`に、推奨拡張・Dart保存時整形・F5デバッグ設定を用意している。

## エミュレーターと実行

ユーザー指定により、既存の`Pixel_9a_Large`を使用する。
起動済みのエミュレーターを優先し、別のAVDは作成しない。検証後もユーザーのエミュレーターを終了しない。

```powershell
flutter devices
# 確認時の端末ID。起動順によって変わるため、実際に表示されたIDを指定する。
adb -s emulator-5554 emu avd name
```

AVD名が`Pixel_9a_Large`であることを確認して実行する。

```powershell
flutter run -d emulator-5554
```

`Pixel_9a_Large`が起動していない場合のみ、既存AVDを起動する。

```powershell
flutter emulators --launch Pixel_9a_Large
```

VS Code / Cursorでは、ステータスバーでAndroid端末を選択してF5でも起動できる。
環境確認用に作成した`SnsFollowHelper_API_36`は、2026-09-09にユーザーの指示で削除した。

## 検証とビルド

`S:\follow_support_app`で実行する。

```powershell
flutter pub get
dart format lib test
flutter analyze
flutter test
flutter build apk --debug
```

APK出力先: `follow_support_app/build/app/outputs/flutter-apk/app-debug.apk`

初回環境構築時の確認結果（Android 16の検証用AVDで実施。このAVDは確認後に削除済み）:

- `flutter analyze`: 問題なし
- `flutter test`: 標準Widgetテスト1件成功
- `flutter build apk --debug`: 成功
- 専用Android 16エミュレーターへのAPKインストール: 成功
- アプリの前面表示、Dart VM起動ログ、カウンター画面のスクリーンショットを確認
- `flutter doctor -v`: Flutter / Android toolchain / ネットワーク正常

`flutter doctor`にはVisual Studio未導入の警告が残る。これはWindowsデスクトップアプリ用で、このプロジェクトのAndroid開発には不要。

## iOS

`ios/`の雛形は作成済み。WindowsではiOSビルドを検証していない。
ビルドとシミュレーター検証はMac・Xcodeを用意した環境で行う。
詳細は[Flutter公式のiOSセットアップ手順](https://docs.flutter.dev/platform-integration/ios/setup)を参照。

Android環境の再構築は[Flutter公式のAndroidセットアップ手順](https://docs.flutter.dev/platform-integration/android/setup)を参照。
