# Xフォロー優先キュー（ローカルWebサービス）

`PokePlus-Sales/tools/x-follow-queue`（Python CLI + `out/today.html`）と同じ作業を、ローカルのWebサービスで行う。
Flutterアプリ（`../follow_support_app/`）とは独立している。

## 方針（厳守）

- 自動フォロー・自動いいね・自動DMはしない。XのAPI呼び出し、スクレイピング、ブラウザ自動操作のコードは置かない。
- この画面はプロフィールを開くだけ。FollowボタンはXの画面で人が押す。
- 待ち受けは `127.0.0.1` のみ。外部DB・外部サーバーは使わない（SQLite: `data/app.db`）。

## 起動

Node.js 22 以上（確認: v24.12.0）。

```powershell
cd web-service
npm install
npm run dev      # http://127.0.0.1:8787 （ファイル変更で自動再起動）
npm start        # 通常起動
```

環境変数: `PORT`（既定 8787）、`DB_PATH`（既定 `web-service/data/app.db`）。

## 使い方

1. **取込・出力** で CSV を取り込む。
   - 旧ツールから移行するとき: `x_follow_queue.csv`（と `x_follow_shop_candidates.csv`）を「既存のキューCSV」で取り込む。
     結果の付いていない「当日」は「未」に戻る。未反映の `follow_results_*.csv` があれば「結果CSV」で反映する。
   - 元データを更新したとき: `pokepara_all_casts.csv` を「元データ」で取り込む。handle ごとの進捗は残る。
2. **当日キュー** で「次の件を出す」→「Xを開く」→ 手動でフォロー → 済 / スキップ / 死垢。
   押した結果はその場で保存される（CSVのダウンロードは不要）。
   キー操作: `J`/`K` 移動、`O` 開く、`1`/`2`/`3` 済/スキップ/死垢、`U` 直前を取り消す。
   「未処理の5件を開く」で複数タブを開くには、Chrome で `http://127.0.0.1:8787` のポップアップを「常に許可」にしておく
   （許可していないと1タブしか開かず、画面に手順が表示される）。
3. 前日までに残った「当日」は、翌日に画面を開いた時点で自動的に「未」へ戻る。
4. **店舗一覧** は `pokepara_all_shops.csv` を「店舗一覧を取り込む」で入れると見られる。都道府県・キーワード（店舗名・カナ・エリア・住所）で絞り込め、
   店舗ごとに個人キューの件数（同じ都道府県・店舗名）を表示する。件数のリンクからその店舗のキューだけを一覧できる。
5. **設定** の上限（直近1時間・24時間に新しく「済」にした件数）に達すると「開く」が止まる。結果の入力と書き出しは続けられる。

## 旧ツールとの対応

| 旧ツール | このサービス |
|---|---|
| `python build_queue.py` | 取込・出力 → 元データからキューを作る（並び順・正規化は Python 版と同一） |
| `python today.py -n 15` | 当日キュー → 次の件を出す（件数は設定の「1回に出す件数」） |
| `python today.py --resume` | 当日キューを開き直す（当日分は保存されている） |
| `today.html` の「結果を保存」+ `apply_results.py` | 不要（押した時点で保存） |
| `x_follow_queue.csv` | 取込・出力 → CSVで書き出す（同じ列・UTF-8 BOM・CRLF） |

書き出したCSVは旧ツールと同じ形式のまま（セルの先頭 `=` などを加工しない）。店舗名・キャスト名は外部サイト由来なので、
Excel で直接開かず、取込やテキストエディタで扱う。

## 開発

```powershell
npm run lint           # tsc --noEmit
npm test               # vitest（unit + API 統合）
npm run test:coverage  # カバレッジ（80%未満で失敗）
npm run test:e2e       # Playwright（初回は npx playwright install chromium）
```

- 構成: `src/domain`（Python版の移植・上限判定）、`src/db`（SQLite リポジトリ）、`src/services/queueService.ts`（ユースケース）、
  `src/routes`（Hono の API / 画面）、`src/views`（hono/jsx）、`src/public`（ブラウザ側JS/CSS）。
- `test/fixtures/expected_*.csv` は元の `build_queue.build()` を `test/fixtures/casts.csv` に対して実行した出力。
  移植ロジックを変えるときは Python 版と突き合わせて更新する。
