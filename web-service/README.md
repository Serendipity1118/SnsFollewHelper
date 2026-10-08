# X / Instagram フォロー優先キュー（ローカルWebサービス）

`PokePlus-Sales/tools/x-follow-queue`（Python CLI + `out/today.html`）と同じ作業を、ローカルのWebサービスで行う。
Flutterアプリ（`../follow_support_app/`）とは独立している。
X に加えて Instagram の名簿も同じ手順で回せる（ユーザー指定 2026-10-08）。

## 方針（厳守）

- 自動フォロー・自動いいね・自動DMはしない。XのAPI呼び出し、スクレイピング、ブラウザ自動操作のコードは置かない。
- この画面はプロフィールを開くだけ。FollowボタンはXの画面で人が押す。
- 例外として、Chrome拡張 [`chrome-extension/`](../chrome-extension/README.md) が**開いているプロフィールの表示を読み取り**、
  存在しない・フォロー済みのタブを閉じて結果を知らせる（ユーザー決定 2026-09-28）。拡張もフォローボタンは**絶対に押さない**。
- 待ち受けは `127.0.0.1` のみ。外部DB・外部サーバーは使わない（SQLite: `data/app.db`）。

## 起動

Node.js 22 以上（確認: v24.12.0）。

```powershell
cd web-service
npm install
npm run dev      # http://127.0.0.1:8787 （ファイル変更で自動再起動）
npm start        # 通常起動
```

`npm install` が `better-sqlite3` の `node-gyp rebuild`（`gyp ERR! find VS`）で失敗する場合は、
`npm install --ignore-scripts` で入れる。`better-sqlite3` はWindows用のビルド済みバイナリ（`prebuilds/win32-x64.node`）を同梱しているが、
`binding.gyp` があるため npm が自動でソースからのビルドを試み、Visual Studio（C++ビルドツール）がない環境では失敗する。

環境変数: `PORT`（既定 8787）、`DB_PATH`、`EXTENSION_ID`（結果の書き込みを許可するChrome拡張のID。既定は `chrome-extension/manifest.json` の key から決まる `liiicjpegnmagfdlnmbnebdfkdkjjlpl`）。

DBの場所（起動ログの `DB:` に表示）:

1. `DB_PATH` を指定したらそのファイル
2. 指定がなければ、**どのワークツリーから起動しても本体チェックアウトの `web-service/data/app.db`**
   （`git rev-parse --git-common-dir` の親。この環境では `C:\00.git_repo\SnsFollewHelper\web-service\data\app.db`）
3. git リポジトリ外なら `web-service/data/app.db`

`data/` は git 管理外。

## 使い方

### X と Instagram の切り替え

画面のいちばん上のタブ「Xフォロー」「Instagramフォロー」で切り替える。下の3画面はどちらも同じ作りで、URL の前置きだけが違う。

| | Xフォロー | Instagramフォロー |
|---|---|---|
| 画面 | `/`・`/list`・`/admin` | `/ig`・`/ig/list`・`/ig/admin` |
| API | `/api/...` | `/api/ig/...` |
| キャストCSVで読む列 | `X(Twitter)` | `Instagram` |
| 初期の上限（1回／1時間／24時間） | 15／15／15 | 10／10／20 |
| ウォームアップ目安（件/日） | 10〜15 → 20〜25 → 30〜40 | 10〜20 → 20〜40 → 40〜60 |
| 総フォロー上限の目安 | 5,000 | 7,500 |
| 書き出しファイル名 | `x_follow_queue.csv` など | `instagram_follow_queue.csv` など |

- 名簿・結果・上限の集計・設定は **X と Instagram で別々**。同じ人が両方の名簿にいてもよい。
- キャストCSVの取込は**表示中のタブ側だけ**を作り直す（X で取り込んでも Instagram の名簿は変わらない）。
- 店舗一覧（店舗タブ）は共通。人数の列は表示中の SNS の名簿を数える。
- Instagram の handle は英数字・`_`・`.` の30文字まで。`/p/...`（投稿）・`/stories/...`・`/invites/...`・ポケパラのURLなどは取り込まない。

画面は3つ。毎日使うのは「今日のフォロー」だけ。以下は X で書くが、Instagram も同じ。

1. **今日のフォロー**（`/`）
   - 上部の指標: 今日の進捗と残り枠／累計フォロー（総フォロー上限5,000の目安に対して）／ウォームアップ何週目と1日の目安件数／名簿の残り（未着手）。
     24時間の上限がウォームアップの目安から外れていると「上限を N 件にする」が出る（自動では変えない）。
   - 「今日の 15 件を出す」→ 各行の「Xで開く」→ 生きている個人垢なら X でフォロー →「フォローした／見送る／死垢」。
     押した結果はその場で保存され、次の人へ進む。直後のお知らせの「取り消す」か `U` で戻せる。処理済みは下の「処理済み」に畳まれ、「戻す」で今日の名簿に戻せる。
   - 「まとめて開く」は未処理で未オープンの上から最大5件（残り枠まで）を開き、開いた行に「開いた」印を付ける（印はこのブラウザにだけ保存）。
     未オープンの人がいなければ、未処理のまま残っている人を開いた順の古い方から「まとめて開き直す」（拡張がタブを閉じた・手で閉じた人を開き直すため）。
     結果はChrome拡張が自動で記録する（拡張を使わない場合は行ごとのボタンで付ける）。
     開いただけでは「フォローした」にならないよう、印の付いた行をまとめて「済」にするボタンは置かない（ユーザー決定 2026-09-28）。
     複数タブを開くには、Chrome で `http://127.0.0.1:8787` のポップアップを「常に許可」にしておく（許可していないと1タブしか開かず、画面に手順が表示される）。
   - キー操作: `J`/`K` 移動、`O` 開く、`1`/`2`/`3` フォローした/見送る/死垢、`U` 直前を取り消す。
   - 前日までに残った「当日」は、翌日に画面を開いた時点で自動的に未着手へ戻る。
   - 上限（直近1時間・24時間に新しく「済」にした件数）に達すると「開く」が止まり、「制限をリセットする」が出る。結果の入力は続けられる。
2. **名簿**（`/list`）: 個人／店舗垢候補／店舗のタブ。キーワード（名前・@handle・店舗名、店舗タブは店舗名・カナ・エリア・住所）、
   都道府県、状態で絞り込める（閲覧のみ）。店舗タブの人数リンクから、その店舗の人だけを一覧できる。
3. **管理**（`/admin`）
   - 設定: 1回に名簿へ入れる件数、1時間・24時間の上限、運用開始日（空欄なら最初にフォローした日からウォームアップを数える）。
   - データ更新: `pokepara_all_casts.csv`（handle ごとの結果は残る）と `pokepara_all_shops.csv`。
     X のURLに紛れた空白・全角＠／＿（`%20`・`%EF%BC%A0` など）は取り除いて半角にする。
     それでもXのユーザー名（英数字と `_`、15文字まで）にならない値は取り込まない（取込結果の「X欄が使えず除いた行」に数える）。
   - 書き出し: 旧ツール互換の CSV。
   - 旧ツールからの移行（折りたたみ）: `x_follow_queue.csv` / `x_follow_shop_candidates.csv` と `follow_results_*.csv`。

画面の言葉は行動で書く（フォローした／見送り／未着手／今日の名簿）が、DB・CSV に保存する値は旧ツール互換の「済／スキップ／未／当日」のまま。
Chrome拡張が「開いた時点でフォロー済みだった」と判定した人は `既フォロー`（画面では「フォロー済みだった」）で保存し、フォロー上限の件数には数えない。
今日のフォロー画面は表示中10秒ごと（とタブに戻ったとき）に名簿を取り直すので、拡張が記録した結果は自動で一覧から消える。
旧URL（`/queue` `/shops` `/import` `/settings`）は新しい画面へ転送する。

## 旧ツールとの対応

| 旧ツール | このサービス |
|---|---|
| `python build_queue.py` | 管理 → データ更新 → キャスト名簿を取り込む（並び順・正規化は Python 版と同一） |
| `python today.py -n 15` | 今日のフォロー →「今日の N 件を出す」（N は設定の「1回に名簿へ入れる件数」） |
| `python today.py --resume` | 今日のフォローを開き直す（当日分は保存されている） |
| `today.html` の「結果を保存」+ `apply_results.py` | 不要（押した時点で保存） |
| `x_follow_queue.csv` | 管理 → 書き出し（同じ列・UTF-8 BOM・CRLF） |

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
