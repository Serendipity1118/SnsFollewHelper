// 今日のフォロー画面。結果は押した時点でサーバーへ保存する。
// X / Instagram への通信・自動操作はしない。プロフィールは <basePath>/go/:handle 経由で人が開く。
// Chrome拡張（chrome-extension/）が記録した結果は、定期的な再取得で一覧に反映する。
(() => {
  "use strict";

  const ASSIGNED = "当日";
  const DONE = "済";
  const RESULTS = [
    { status: DONE, label: "フォローした", className: "btn-follow", icon: "check" },
    { status: "スキップ", label: "見送る", className: "", icon: "skip" },
    { status: "死垢", label: "死垢", className: "btn-dead", icon: "user-x" },
  ];
  const RESULT_BADGE = { 済: "フォローした", 既フォロー: "フォロー済みだった", スキップ: "見送り", 死垢: "死垢" };
  const RESULT_BADGE_CLASS = { 済: "badge-follow", 既フォロー: "badge-already", スキップ: "badge-skip", 死垢: "badge-dead" };
  const TOAST_TEXT = { 済: "をフォロー済みにしました", スキップ: "を見送りました", 死垢: "を死垢にしました" };
  const OPEN_BATCH = 5;
  const TOAST_MS = 6000;
  const REFRESH_MS = 10_000;
  const POPUP_BLOCKED_MESSAGE =
    "ポップアップブロックで {blocked} 件が開けませんでした。" +
    "アドレスバー右端のブロックアイコンから「http://127.0.0.1:8787 のポップアップを常に許可」を選び、もう一度押してください。";

  const $ = (id) => document.getElementById(id);
  const list = $("list");
  // どのSNSの名簿か（TodayPage.tsx の #today に埋め込む）。X は API "/api"・画面 ""、Instagram は "/api/ig"・"/ig"
  const config = $("today").dataset;
  const API = config.apiBase || "/api";
  const BASE = config.basePath || "";
  const LABEL = config.label || "X";
  const PLATFORM = config.platform || "x";
  const state = {
    date: "",
    items: [],
    quota: null,
    settings: null,
    summary: null,
    active: null,
    history: [],
    opened: new Set(),
    showDone: false,
  };
  const pending = new Set();
  // 保存を始めるたびに進める。再取得の途中で保存が走ったら、その再取得の結果（古い名簿）は捨てる。
  let markSeq = 0;
  let toastTimer = null;

  // ---- 共通 ----

  async function api(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: { "content-type": "application/json", ...(options.headers || {}) },
    });
    const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
    if (!res.ok || !body.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body.data;
  }

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "text") node.textContent = value;
      else if (key === "dataset") Object.assign(node.dataset, value);
      else node.setAttribute(key, value === true ? "" : value);
    }
    for (const child of children) if (child) node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    return node;
  }

  const SVG_NS = "http://www.w3.org/2000/svg";

  /** Layout.tsx が埋め込んだアイコン定義（#i-名前）を参照する。 */
  function icon(name) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "i");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", `#i-${name}`);
    svg.appendChild(use);
    return svg;
  }

  const fmt = (n) => Number(n).toLocaleString("ja-JP");
  const formatTime = (ms) => new Date(ms).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  const openUrl = (handle) => `${BASE}/go/` + encodeURIComponent(handle);
  const httpUrl = (s) => (/^https?:\/\//.test(String(s || "")) ? String(s) : "");
  const displayName = (item) => item.castName || `@${item.handle}`;
  const unprocessed = () => state.items.filter((item) => item.status === ASSIGNED);
  const canOpen = () => Boolean(state.quota && state.quota.remaining > 0);

  function showMessage(text) {
    const message = $("message");
    message.textContent = text || "";
    message.hidden = !text;
  }

  // ---- 開いた印（ブラウザにだけ保存。日付ごと） ----

  // X の印は従来のキーのまま（更新前に付けた印を消さない）
  const openedKey = () => (PLATFORM === "x" ? `opened:${state.date}` : `opened:${PLATFORM}:${state.date}`);

  function loadOpened() {
    try {
      const raw = localStorage.getItem(openedKey());
      state.opened = new Set(raw ? JSON.parse(raw) : []);
    } catch {
      state.opened = new Set();
    }
  }

  // 開いた順に並べる（開き直した人は末尾へ）。まとめて開き直すときに古い順に選ぶため。
  function rememberOpened(handle) {
    state.opened = new Set([...[...state.opened].filter((h) => h !== handle), handle]);
    try {
      localStorage.setItem(openedKey(), JSON.stringify([...state.opened]));
    } catch {
      // 保存できなくても画面上の印は付く
    }
  }

  // 新しいタブで開く。"noopener" 指定だと戻り値が常に null になりブロックを検知できないため、開いた後に opener を切る。
  function openTab(handle) {
    const win = window.open(openUrl(handle), "_blank");
    if (!win) return false;
    win.opener = null;
    rememberOpened(handle);
    return true;
  }

  /**
   * まとめて開く対象。未処理のうち、まだ開いていない人（名簿順）を優先し、
   * 足りなければ開いた順の古い人から開き直す（Chrome拡張がタブを閉じた未処理の人、手で閉じた人を開き直すため）。
   */
  function batchTargets() {
    const left = unprocessed();
    const fresh = left.filter((item) => !state.opened.has(item.handle));
    const order = [...state.opened];
    const reopen = left
      .filter((item) => state.opened.has(item.handle))
      .sort((a, b) => order.indexOf(a.handle) - order.indexOf(b.handle));
    const limit = canOpen() ? Math.min(OPEN_BATCH, state.quota.remaining) : 0;
    const targets = [...fresh, ...reopen].slice(0, limit);
    return { targets, reopenOnly: fresh.length === 0 };
  }

  // ---- 指標 ----

  /** 指標のカード。value は大きな数字、unit はその後ろの小さな文字（「/ 15 件」など）。 */
  function tile({ iconName, label, value, unit = "" }, lines, ratio) {
    const children = [
      el("p", { class: "stat-label" }, [icon(iconName), label]),
      el("p", { class: "stat-value" }, [value, unit ? el("small", { text: unit }) : null]),
    ];
    if (ratio !== undefined) {
      const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
      children.push(el("div", { class: "meter", role: "presentation" }, [el("span", { style: `width:${pct}%` })]));
    }
    for (const line of lines) if (line) children.push(line);
    return el("div", { class: "stat card" }, children);
  }

  const sub = (text, className = "stat-sub") => el("p", { class: className, text });

  function todayTile() {
    const q = state.quota;
    const s = state.settings;
    const total = state.items.length;
    const done = total - unprocessed().length;
    const quotaLine = q.blocked
      ? sub(`上限に到達${q.retryAt ? `（${formatTime(q.retryAt)} 以降に再開）` : ""}`, "stat-sub stat-warn")
      : sub(`あと ${fmt(q.remaining)} 件フォローできます`);
    const detail = sub(`1時間 ${q.followed1h}/${s.hourlyLimit}・24時間 ${q.followed24h}/${s.dailyLimit}`, "stat-sub muted");
    const value = total ? { value: String(done), unit: `/ ${total} 件` } : { value: "まだありません" };
    return tile({ iconName: "calendar-check", label: "今日の名簿", ...value }, [quotaLine, detail], total ? done / total : 0);
  }

  function warmupTile() {
    const w = state.summary.warmup;
    const head = { iconName: "flame", label: "ウォームアップ" };
    if (!w) return tile({ ...head, value: "未開始" }, [sub("最初にフォローした日から数えます")]);
    const limit = state.settings.dailyLimit;
    const lines = [sub(`目安 1日 ${w.min}〜${w.max} 件`), sub(`${w.auto ? "最初のフォロー" : "運用開始"} ${w.startDate} から`, "stat-sub muted")];
    if (limit < w.min || limit > w.max) {
      const note = limit < w.min ? "目安より少なめ" : "目安を超えています";
      lines.push(sub(`24時間の上限 ${limit} 件は${note}`, "stat-sub stat-warn"));
      lines.push(el("button", { type: "button", class: "btn btn-small btn-soft", id: "adjustLimit", dataset: { limit: String(w.max) }, text: `上限を ${w.max} 件にする` }));
    }
    return tile({ ...head, value: String(w.week), unit: "週目" }, lines);
  }

  function renderStats() {
    const { followed, followCap, pending: left, pendingTop } = state.summary;
    const top = pendingTop.map((p) => `${p.label} ${fmt(p.count)}`).join("・");
    $("stats").replaceChildren(
      todayTile(),
      tile(
        { iconName: "trending-up", label: "累計フォロー", value: fmt(followed), unit: `/ ${fmt(followCap)}` },
        [sub(`総フォロー上限まであと ${fmt(Math.max(0, followCap - followed))} 件`)],
        followed / followCap,
      ),
      warmupTile(),
      tile({ iconName: "inbox", label: "名簿の残り（未着手）", value: fmt(left), unit: "件" }, [top ? sub(top, "stat-sub muted") : null]),
    );
    const q = state.quota;
    $("quotaAlert").hidden = !q.blocked;
    $("quotaAlertText").textContent = q.blocked
      ? `フォロー上限に達しました。${q.retryAt ? `${formatTime(q.retryAt)} 以降に再開できます。` : ""}結果の入力はそのまま続けられます。`
      : "";
  }

  // ---- 一覧 ----

  function resultButtons(item) {
    return RESULTS.map(({ status, label, className, icon: iconName }) =>
      el("button", { type: "button", class: `btn btn-small ${className}`, dataset: { action: "mark", status, handle: item.handle } }, [icon(iconName), label]),
    );
  }

  function opener(item) {
    if (!canOpen()) return el("span", { class: "btn btn-small btn-primary", "aria-disabled": "true", text: "上限到達" });
    return el(
      "a",
      { class: "btn btn-small btn-primary", href: openUrl(item.handle), target: "_blank", rel: "noopener", dataset: { action: "open", handle: item.handle } },
      [icon("external-link"), `${LABEL}で開く`],
    );
  }

  const metaItem = (iconName, text) => el("span", {}, [icon(iconName), text]);

  function renderRow(item, index) {
    const opened = state.opened.has(item.handle);
    const poke = httpUrl(item.profileUrl);
    const title = el("div", { class: "row-title" }, [
      el("strong", { class: "row-name", text: item.castName || "(名前なし)" }),
      el("span", { class: "row-handle", text: `@${item.handle}` }),
      opened ? el("span", { class: "badge badge-opened", text: "開いた" }) : null,
    ]);
    const metaLine = el("p", { class: "row-meta" }, [
      metaItem("map-pin", `${item.prefectureLabel || item.prefecture} / ${item.shop}`),
      metaItem("clock", `ポケパラ更新 ${item.lastUpdated || "不明"}`),
      item.occurrences > 1 ? el("span", { class: "badge badge-skip", text: `出現${item.occurrences}回（グループ垢かも）` }) : null,
      poke ? el("a", { href: poke, target: "_blank", rel: "noopener noreferrer", class: "row-link" }, ["ポケパラ", icon("external-link")]) : null,
    ]);
    const actions = el("div", { class: "row-actions" }, [opener(item), ...resultButtons(item)]);
    const active = item.handle === state.active;
    return el("article", { class: `row${active ? " active" : ""}${opened ? " opened" : ""}`, dataset: { handle: item.handle }, "aria-current": active ? "true" : undefined }, [
      el("span", { class: "row-num", text: String(index + 1) }),
      el("div", { class: "row-body" }, [title, metaLine]),
      actions,
    ]);
  }

  function renderDoneRow(item) {
    return el("article", { class: "row done", dataset: { handle: item.handle } }, [
      el("span", { class: `badge ${RESULT_BADGE_CLASS[item.status] || ""}`, text: RESULT_BADGE[item.status] || item.status }),
      el("div", { class: "row-title" }, [
        el("strong", { class: "row-name", text: item.castName || "(名前なし)" }),
        el("span", { class: "row-handle", text: `@${item.handle}` }),
      ]),
      el("button", { type: "button", class: "btn btn-small btn-ghost", dataset: { action: "revert", handle: item.handle } }, [icon("rotate-ccw"), "戻す"]),
    ]);
  }

  function nextButton(label) {
    return el("button", { type: "button", class: "btn btn-primary btn-large", dataset: { action: "next" } }, [icon("plus"), label]);
  }

  function emptyCard() {
    const batch = state.settings.batchSize;
    if (!state.summary.pending) {
      return el("div", { class: "empty-card card" }, [
        icon("inbox"),
        el("h2", { text: "未着手の名簿がありません" }),
        el("p", {}, [el("a", { href: `${BASE}/admin#data`, text: "管理 → データ更新" }), " でキャスト名簿（pokepara_all_casts.csv）を取り込んでください。"]),
      ]);
    }
    return el("div", { class: "empty-card card" }, [
      icon("calendar-check"),
      el("h2", { text: "今日の名簿はまだありません" }),
      el("p", { text: `優先度の高い順に ${batch} 件を今日の名簿に入れます。` }),
      nextButton(`今日の ${batch} 件を出す`),
    ]);
  }

  function finishedCard() {
    const batch = state.settings.batchSize;
    const children = [icon("check"), el("h2", { text: "今日の名簿はすべて終わりました" }), el("p", { text: "結果は保存済みです。お疲れさまでした。" })];
    if (state.summary.pending) children.push(nextButton(`さらに ${batch} 件出す`));
    return el("div", { class: "empty-card card finished" }, children);
  }

  /** 処理済みは下にまとめて畳む（件数が多い日でも未処理がすぐ見えるように）。 */
  function doneSection(done) {
    const counts = done.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), {});
    const breakdown = Object.entries(counts)
      .map(([status, n]) => `${RESULT_BADGE[status] || status} ${n}`)
      .join("・");
    const details = el("details", { class: "done-section card", open: state.showDone }, [
      el("summary", {}, [icon("chevron-right"), el("span", { text: `処理済み ${done.length} 件（${breakdown}）` })]),
      el("div", { class: "done-rows" }, done.map(renderDoneRow)),
    ]);
    details.addEventListener("toggle", () => (state.showDone = details.open));
    return details;
  }

  function renderList() {
    const left = unprocessed();
    const done = state.items.filter((item) => item.status !== ASSIGNED);
    if (!left.some((item) => item.handle === state.active)) state.active = left[0]?.handle ?? null;
    const head = !state.items.length ? [emptyCard()] : !left.length ? [finishedCard()] : [];
    const rows = left.map((item, i) => renderRow(item, i));
    list.replaceChildren(...head, ...rows, ...(done.length ? [doneSection(done)] : []));
  }

  function renderToolbar() {
    const total = state.items.length;
    const left = unprocessed();
    $("date").textContent = state.date ? `（${state.date}）` : "";
    $("progress").textContent = total ? `残り ${left.length} 件 / ${total} 件` : "";
    $("bulk").hidden = left.length === 0;
    $("release").hidden = left.length === 0;
    const navRemain = $("navRemain");
    navRemain.textContent = String(left.length);
    navRemain.hidden = left.length === 0;
    const { targets, reopenOnly } = batchTargets();
    const verb = reopenOnly ? "まとめて開き直す" : "まとめて開く";
    $("open5Label").textContent = targets.length ? `${verb}（${targets.length}件）` : "まとめて開く";
    $("open5").disabled = targets.length === 0;
  }

  function render() {
    if (!state.settings) return;
    renderStats();
    renderToolbar();
    renderList();
  }

  // ---- 操作 ----

  function applyToday(data) {
    const dateChanged = data.date !== state.date;
    state.date = data.date;
    state.items = data.items;
    state.quota = data.quota;
    state.settings = data.settings;
    state.summary = data.summary;
    if (dateChanged) loadOpened();
  }

  async function load() {
    applyToday(await api(`${API}/today`));
    render();
  }

  function showToast(item, status) {
    const toast = $("toast");
    $("toastText").textContent = `${displayName(item)}${TOAST_TEXT[status] || "を更新しました"}`;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), TOAST_MS);
  }

  /** 累計フォローはサーバーに聞き直さず、済の増減だけ反映する。 */
  function adjustFollowed(before, after) {
    const delta = (after === DONE ? 1 : 0) - (before === DONE ? 1 : 0);
    if (delta) state.summary = { ...state.summary, followed: state.summary.followed + delta };
  }

  async function mark(handle, status, { remember = true } = {}) {
    // 保存中の行への連打・キーリピートで二重送信しない
    if (pending.has(handle)) return;
    pending.add(handle);
    markSeq += 1;
    const order = unprocessed().map((item) => item.handle);
    const pos = order.indexOf(handle);
    const before = state.items.find((item) => item.handle === handle);
    try {
      const data = await api(`${API}/targets/${encodeURIComponent(handle)}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      state.items = state.items.map((item) => (item.handle === handle ? data.item : item));
      state.quota = data.quota;
      adjustFollowed(before?.status, data.item.status);
      // 最初のフォローでウォームアップの起点が決まるので、そのときだけ指標を取り直す
      if (!state.summary.warmup && data.item.status === DONE) state.summary = (await api(`${API}/today`)).summary;
      if (status === ASSIGNED) {
        state.history = state.history.filter((h) => h !== handle);
        state.active = handle;
        $("toast").hidden = true;
      } else {
        if (remember) state.history = [...state.history, handle];
        state.active = order[pos + 1] ?? order[pos - 1] ?? null;
        showToast(data.item, status);
      }
      showMessage("");
    } catch (error) {
      showMessage(`保存できませんでした: ${error.message}`);
    } finally {
      pending.delete(handle);
    }
    render();
  }

  async function undo() {
    const handle = state.history[state.history.length - 1];
    if (handle) await mark(handle, ASSIGNED, { remember: false });
  }

  async function run(button, task) {
    if (button) button.disabled = true;
    try {
      await task();
    } catch (error) {
      showMessage(error.message);
    } finally {
      if (button) button.disabled = false;
      render();
    }
  }

  function openBatch() {
    const { targets } = batchTargets();
    const blocked = targets.filter((item) => !openTab(item.handle)).length;
    showMessage(blocked ? POPUP_BLOCKED_MESSAGE.replace("{blocked}", String(blocked)) : "");
    render();
  }

  // 一覧・指標のボタンは描画のたびに作り直すので、親でまとめて受ける
  document.addEventListener("click", (ev) => {
    const target = ev.target.closest("[data-action], #adjustLimit");
    if (!target) return;
    const { action, handle, status } = target.dataset;
    if (target.id === "adjustLimit") {
      run(target, async () => {
        await api(`${API}/settings`, { method: "PUT", body: JSON.stringify({ dailyLimit: Number(target.dataset.limit) }) });
        await load();
      });
    } else if (action === "open") {
      // リンク本来の遷移を先に走らせてから印を付ける（描画し直すとリンク要素が置き換わるため）
      state.active = handle;
      setTimeout(() => {
        rememberOpened(handle);
        render();
      }, 0);
    } else if (action === "mark") {
      mark(handle, status);
    } else if (action === "revert") {
      mark(handle, ASSIGNED, { remember: false });
    } else if (action === "next") {
      run(target, async () => {
        applyToday(await api(`${API}/today/next`, { method: "POST" }));
        if (!unprocessed().length) showMessage("未着手の名簿がありません。管理 → データ更新で元データを取り込んでください。");
      });
    }
  });

  list.addEventListener("click", (ev) => {
    if (ev.target.closest("a, button")) return;
    const row = ev.target.closest(".row:not(.done)");
    if (!row) return;
    state.active = row.dataset.handle;
    render();
  });

  $("open5").addEventListener("click", openBatch);

  $("toastUndo").addEventListener("click", () => undo());
  $("toastClose").addEventListener("click", () => ($("toast").hidden = true));

  $("resetQuota").addEventListener("click", (ev) => {
    const ok = window.confirm(
      "フォロー上限の集計をリセットします。\n" +
        `${LABEL}の制限対策として設けている上限なので、` +
        "短時間に続けてフォローするとアカウント制限のおそれがあります。\n" +
        "フォローした結果は消えません。リセットしますか？",
    );
    if (!ok) return;
    run(ev.currentTarget, async () => {
      state.quota = await api(`${API}/quota/reset`, { method: "POST" });
      showMessage("フォロー上限の集計をリセットしました。");
    });
  });

  $("release").addEventListener("click", (ev) => {
    if (!window.confirm("今日の名簿で結果の付いていない人をすべて未着手に戻します。よいですか？")) return;
    run(ev.currentTarget, async () => {
      const data = await api(`${API}/today/release`, { method: "POST" });
      showMessage(`${data.released} 件を未着手に戻しました。`);
      state.history = [];
      await load();
    });
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.target.closest("input, textarea, select") || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const key = ev.key.toLowerCase();
    if (key === "u") {
      undo();
      return;
    }
    const order = unprocessed().map((item) => item.handle);
    if (!order.length) return;
    const pos = Math.max(0, order.indexOf(state.active));
    const handle = order[pos];
    if (key === "j" || key === "k") {
      state.active = order[key === "j" ? Math.min(pos + 1, order.length - 1) : Math.max(pos - 1, 0)];
      render();
      document.querySelector(".row.active")?.scrollIntoView({ block: "nearest" });
    } else if (key === "o") {
      if (!canOpen()) return;
      if (!openTab(handle)) showMessage(POPUP_BLOCKED_MESSAGE.replace("{blocked}", "1"));
      render();
    } else if (key === "1" || key === "2" || key === "3") {
      mark(handle, RESULTS[Number(key) - 1].status);
    }
  });

  // 拡張がタブを閉じて記録した結果を拾う。保存中は上書きしないよう見送る。
  async function refresh() {
    if (document.hidden || pending.size) return;
    const seq = markSeq;
    let data;
    try {
      data = await api(`${API}/today`);
    } catch {
      return; // 一時的な失敗は次回の再取得に任せる
    }
    if (pending.size || seq !== markSeq) return;
    applyToday(data);
    render();
  }

  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("focus", refresh);
  setInterval(refresh, REFRESH_MS);

  load().catch((error) => showMessage(`読み込めませんでした: ${error.message}`));
})();
