# ロゴ

`logo-source.png` がロゴの原画（2026-10-09 差し替え）。背景はティール `#137D64`、アクセントはミント `#85E2C5`。
アイコン類は原画の記号部分だけを切り出して作る（下の文字は小さいサイズで潰れるため使わない）。

## 作り直し方

原画を差し替えたら、リポジトリのルートで次を順に実行する。

```powershell
node scripts/make-brand-icons.cjs                                  # 各用途のアイコン（下の表）
cd follow_support_app
powershell -ExecutionPolicy Bypass -File tool\render_store_assets.ps1  # ストア用画像
dart run flutter_launcher_icons                                     # Android / iOS のランチャーアイコン
dart run flutter_native_splash:create                               # スプラッシュ
```

`make-brand-icons.cjs` は `web-service` の Playwright を使うので、先に `web-service` で `npm install` しておく。

## 使っている場所

| ファイル | 用途 |
| --- | --- |
| `follow_support_app/assets/app_icon.png` | 角まで塗った正方形。iOS / 旧 Android のアイコンとストア画像の元 |
| `follow_support_app/assets/app_icon_foreground.png` | 記号だけ透過。Android のアダプティブアイコンと Android 12 以降のスプラッシュ |
| `follow_support_app/assets/app_logo.png` | 角丸。アプリ内（ホーム・このアプリについて）とスプラッシュ |
| `follow_support_app/store/*.png` | Play / App Store のアイコンとフィーチャーグラフィック |
| `web-service/src/public/logo-mark.png` | Webサービスのサイドバーのロゴ |
| `web-service/src/public/favicon-*.png`・`apple-touch-icon.png` | Webサービスのタブ・ホーム画面のアイコン |
| `chrome-extension/icons/icon*.png` | Chrome拡張のアイコン（拡張機能の一覧・ツールバー）とオプション画面のロゴ |

X / Instagram / Meta の公式ロゴは使わない（`docs/要件定義.md`）。
