# プロジェクトでの開発方針

## Androidエミュレーター

- ユーザー指定（2026-09-09）: 既存の `Pixel_9a_Large` を開発・実行・検証に使用する。
- 起動済みであれば、そのエミュレーターを利用する。別のAVDを新規作成しない。
- 確認時の端末IDは `emulator-5554`、OSは Android 17（API 37）。端末IDは起動順で変わるため、実行前に `flutter devices` と `adb -s <device-id> emu avd name` で確認する。
- 環境構築時に作成した `SnsFollowHelper_API_36` はユーザーの指示で削除済み。再作成しない。
- ユーザーが起動したエミュレーターは、検証終了後もそのまま維持する。

開発環境と起動手順は `docs/DEVELOPMENT.md` を参照する。
