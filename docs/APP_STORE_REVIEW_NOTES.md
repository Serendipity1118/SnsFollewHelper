# App Store Review Notes — Follow Work Notes

This app does not automate any action on third-party social networking services.
It manages user-provided profile targets and manually recorded results locally using SQLite.
The user opens each profile, performs any action directly in the third-party app or browser, returns to this app, and manually records the result.
The app does not scrape, inspect, or control third-party applications. No social-network credentials, cookies, or access tokens are collected or stored.

## Review steps (Japanese UI)

1. Launch the app and tap `サンプルデータを読み込む` (Load sample data).
2. Select X or Instagram and the fictional `サンプル運用元` account.
3. Tap `この運用元で始める`, then `確認しました` to acknowledge the account selection.
4. Tap `作業開始・再開`, then `サンプルで結果入力を体験`.
5. Select a manual result. A saved-result screen is displayed. No next target is opened automatically.
6. Tap `次のアカウントを確認` to select another target; opening it requires another explicit tap.
7. Check `対象一覧`, `操作履歴`, `エクスポート・バックアップ`, `設定`, and the privacy policy.

Sample records are explicitly marked and never invoke an external browser or social app.
For user-imported records, HTTPS URLs are delegated to the operating system, which can open a social app or browser. Custom HTTPS overrides are supported.

## Data and safety

- Multiple operating accounts are labels only; login is never performed in this app.
- New follows manually recorded by the user are limited to 15 per rolling hour and 60 per rolling 24 hours per operating account. This is an app-specific margin, not an official or guaranteed safe service limit.
- Requests and previously followed accounts do not contribute to the limits. Corrections change the current count.
- Interrupted work restores manual input without inferring a result.
- CSV import supports UTF-8 and Shift_JIS. Export uses UTF-8 BOM. Full ZIP backups preserve owners, targets, history, and interrupted-work settings.
- File selection and export use the OS document picker. No broad storage, accessibility, usage-statistics, tracking, or package-list permission is requested by the application.
- No advertising or analytics SDK is included.

## Before submission

The current artifact is a development build. Confirm the final application ID, signing/provisioning, provider name, support contact, public privacy-policy URL, store screenshots, and store privacy disclosures before submission. iOS signing/build/device review requires macOS and Xcode.
