// 今日のフォロー画面。結果は押した時点でサーバーへ保存する。
// Xへの通信・自動操作はしない。プロフィールは /go/:handle 経由で人が開く。
(() => {
  "use strict";

  const ASSIGNED = "当日";
  const DONE = "済";
  const RESULTS = [
    { status: DONE, label: "フォローした", className: "btn-follow" },
    { status: "スキップ", label: "見送る", className: "" },
    { status: "死垢", label: "死垢", className: "btn-dead" },
  ];
  const RESULT_BADGE = { 済: "フォローした", スキップ: "見送り", 死垢: "死垢" };
  const TOAST_TEXT = { 済: "をフォロー済みにしました", スキップ: "を見送りました", 死垢: "を死垢にしました" };
  const OPEN_BATCH = 5;
  const TOAST_MS = 6000;
  const POPUP_BLOCKED_MESSAGE =
    "ポップアップブロックで {blocked} 件が開けませんでした。" +
    "アドレスバー右端のブロックアイコンから「http://127.0.0.1:8787 のポップアップを常に許可」を選び、もう一度押してください。";

  const $ = (id) => document.getElementById(id);
  const list = $("list");
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

  const fmt = (n) => Number(n).toLocaleString("ja-JP");
  const formatTime = (ms) => new Date(ms).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  const openUrl = (handle) => "/go/" + encodeURIComponent(handle);
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

  const openedKey = () => `opened:${state.date}`;

  function loadOpened() {
    try {
      const raw = localStorage.getItem(openedKey());
      state.opened = new Set(raw ? JSON.parse(raw) : []);
    } catch {
      state.opened = new Set();
    }
  }

  function rememberOpened(handle) {
    state.opened = new Set([...state.opened, handle]);
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

  // ---- 指標 ----

  function tile(label, value, lines, ratio) {
    const children = [el("p", { class: "stat-label", text: label }), el("p", { class: "stat-value", text: value })];
    if (ratio !== undefined) {
      const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
      children.push(el("div", { class: "meter", role: "presentation" }, [el("span", { style: `width:${pct}%` })]));
    }
    for (const line of lines) if (line) children.push(line);
    return el("div", { class: "stat" }, children);
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
    return tile("今日の名簿", total ? `${done} / ${total} 件` : "まだありません", [quotaLine, detail], total ? done / total : 0);
  }

  function warmupTile() {
    const w = state.summary.warmup;
    if (!w) return tile("ウォームアップ", "未開始", [sub("最初にフォローした日から数えます")]);
    const limit = state.settings.dailyLimit;
    const lines = [sub(`目安 1日 ${w.min}〜${w.max} 件`), sub(`${w.auto ? "最初のフォロー" : "運用開始"} ${w.startDate} から`, "stat-sub muted")];
    if (limit < w.min || limit > w.max) {
      const note = limit < w.min ? "目安より少なめ" : "目安を超えています";
      lines.push(sub(`24時間の上限 ${limit} 件は${note}`, "stat-sub stat-warn"));
      lines.push(el("button", { type: "button", class: "btn btn-small", id: "adjustLimit", dataset: { limit: String(w.max) }, text: `上限を ${w.max} 件にする` }));
    }
    return tile("ウォームアップ", `${w.week}週目`, lines);
  }

  function renderStats() {
    const { followed, followCap, pending: left, pendingTop } = state.summary;
    const top = pendingTop.map((p) => `${p.label} ${fmt(p.count)}`).join("・");
    $("stats").replaceChildren(
      todayTile(),
      tile("累計フォロー", `${fmt(followed)} / ${fmt(followCap)}`, [sub(`総フォロー上限まであと ${fmt(Math.max(0, followCap - followed))} 件`)], followed / followCap),
      warmupTile(),
      tile("名簿の残り（未着手）", `${fmt(left)} 件`, [top ? sub(top, "stat-sub muted") : null]),
    );
    const q = state.quota;
    $("quotaAlert").hidden = !q.blocked;
    $("quotaAlertText").textContent = q.blocked
      ? `フォロー上限に達しました。${q.retryAt ? `${formatTime(q.retryAt)} 以降に再開できます。` : ""}結果の入力はそのまま続けられます。`
      : "";
  }

  // ---- 一覧 ----

  function resultButtons(item) {
    return RESULTS.map(({ status, label, className }) =>
      el("button", { type: "button", class: `btn ${className}`, dataset: { action: "mark", status, handle: item.handle }, text: label }),
    );
  }

  function opener(item) {
    if (!canOpen()) return el("span", { class: "btn btn-primary", "aria-disabled": "true", text: "上限到達" });
    return el("a", { class: "btn btn-primary", href: openUrl(item.handle), target: "_blank", rel: "noopener", dataset: { action: "open", handle: item.handle }, text: "Xで開く" });
  }

  function renderRow(item, index) {
    const opened = state.opened.has(item.handle);
    const poke = httpUrl(item.profileUrl);
    const meta = [
      `${item.prefectureLabel || item.prefecture} / ${item.shop}`,
      `ポケパラ更新 ${item.lastUpdated || "不明"}`,
      item.occurrences > 1 ? `出現${item.occurrences}回（グループ垢かも）` : "",
    ].filter(Boolean);
    const title = el("div", { class: "row-title" }, [
      el("span", { class: "row-num", text: String(index + 1) }),
      el("strong", { class: "row-name", text: item.castName || "(名前なし)" }),
      el("span", { class: "row-handle", text: `@${item.handle}` }),
      opened ? el("span", { class: "badge badge-opened", text: "開いた" }) : null,
    ]);
    const metaLine = el("p", { class: "row-meta" }, [
      meta.join("　"),
      poke ? el("a", { href: poke, target: "_blank", rel: "noopener noreferrer", class: "row-link", text: "ポケパラ" }) : null,
    ]);
    const actions = el("div", { class: "row-actions" }, [opener(item), el("span", { class: "sep", "aria-hidden": "true" }), ...resultButtons(item)]);
    const active = item.handle === state.active;
    return el("article", { class: `row${active ? " active" : ""}${opened ? " opened" : ""}`, dataset: { handle: item.handle }, "aria-current": active ? "true" : undefined }, [
      el("div", { class: "row-body" }, [title, metaLine]),
      actions,
    ]);
  }

  function renderDoneRow(item, index) {
    const badgeClass = item.status === DONE ? "badge-follow" : item.status === "死垢" ? "badge-dead" : "";
    return el("article", { class: "row done", dataset: { handle: item.handle } }, [
      el("div", { class: "row-title" }, [
        el("span", { class: "row-num", text: String(index + 1) }),
        el("span", { class: "row-name", text: item.castName || "(名前なし)" }),
        el("span", { class: "row-handle", text: `@${item.handle}` }),
        el("span", { class: `badge ${badgeClass}`, text: RESULT_BADGE[item.status] || item.status }),
      ]),
      el("button", { type: "button", class: "btn btn-small btn-ghost", dataset: { action: "revert", handle: item.handle }, text: "戻す" }),
    ]);
  }

  function nextButton(label) {
    return el("button", { type: "button", class: "btn btn-primary btn-large", dataset: { action: "next" }, text: label });
  }

  function emptyCard() {
    const batch = state.settings.batchSize;
    if (!state.summary.pending) {
      return el("div", { class: "empty-card" }, [
        el("h2", { text: "未着手の名簿がありません" }),
        el("p", {}, [el("a", { href: "/admin#data", text: "管理 → データ更新" }), " でキャスト名簿（pokepara_all_casts.csv）を取り込んでください。"]),
      ]);
    }
    return el("div", { class: "empty-card" }, [
      el("h2", { text: "今日の名簿はまだありません" }),
      el("p", { text: `優先度の高い順に ${batch} 件を今日の名簿に入れます。` }),
      nextButton(`今日の ${batch} 件を出す`),
    ]);
  }

  function finishedCard() {
    const batch = state.settings.batchSize;
    const children = [el("h2", { text: "今日の名簿はすべて終わりました" }), el("p", { class: "muted", text: "結果は保存済みです。" })];
    if (state.summary.pending) children.push(nextButton(`さらに ${batch} 件出す`));
    return el("div", { class: "empty-card finished" }, children);
  }

  /** 処理済みは下にまとめて畳む（件数が多い日でも未処理がすぐ見えるように）。 */
  function doneSection(done) {
    const counts = done.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), {});
    const breakdown = Object.entries(counts)
      .map(([status, n]) => `${RESULT_BADGE[status] || status} ${n}`)
      .join("・");
    const details = el("details", { class: "done-section", open: state.showDone }, [
      el("summary", { text: `処理済み ${done.length} 件（${breakdown}）` }),
      el("div", { class: "rows" }, done.map((item, i) => renderDoneRow(item, i))),
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
    const toOpen = left.filter((item) => !state.opened.has(item.handle));
    const openCount = canOpen() ? Math.min(OPEN_BATCH, state.quota.remaining, toOpen.length) : 0;
    $("open5").textContent = openCount ? `まとめて開く（${openCount}件）` : "まとめて開く";
    $("open5").disabled = openCount === 0;
    const openedLeft = left.filter((item) => state.opened.has(item.handle)).length;
    $("doneOpened").textContent = openedLeft ? `開いた ${openedLeft} 件をフォローしたにする` : "開いた分をフォローしたにする";
    $("doneOpened").disabled = openedLeft === 0;
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
    applyToday(await api("/api/today"));
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
    const order = unprocessed().map((item) => item.handle);
    const pos = order.indexOf(handle);
    const before = state.items.find((item) => item.handle === handle);
    try {
      const data = await api(`/api/targets/${encodeURIComponent(handle)}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      state.items = state.items.map((item) => (item.handle === handle ? data.item : item));
      state.quota = data.quota;
      adjustFollowed(before?.status, data.item.status);
      // 最初のフォローでウォームアップの起点が決まるので、そのときだけ指標を取り直す
      if (!state.summary.warmup && data.item.status === DONE) state.summary = (await api("/api/today")).summary;
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
    if (!canOpen()) return;
    const targets = unprocessed().filter((item) => !state.opened.has(item.handle));
    const count = Math.min(OPEN_BATCH, state.quota.remaining, targets.length);
    const blocked = targets.slice(0, count).filter((item) => !openTab(item.handle)).length;
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
        await api("/api/settings", { method: "PUT", body: JSON.stringify({ dailyLimit: Number(target.dataset.limit) }) });
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
        applyToday(await api("/api/today/next", { method: "POST" }));
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

  $("doneOpened").addEventListener("click", (ev) =>
    run(ev.currentTarget, async () => {
      const targets = unprocessed().filter((item) => state.opened.has(item.handle));
      for (const item of targets) await mark(item.handle, DONE);
    }),
  );

  $("toastUndo").addEventListener("click", () => undo());

  $("resetQuota").addEventListener("click", (ev) => {
    const ok = window.confirm(
      "フォロー上限の集計をリセットします。\n" +
        "Xの制限対策として設けている上限なので、短時間に続けてフォローするとアカウント制限のおそれがあります。\n" +
        "フォローした結果は消えません。リセットしますか？",
    );
    if (!ok) return;
    run(ev.currentTarget, async () => {
      state.quota = await api("/api/quota/reset", { method: "POST" });
      showMessage("フォロー上限の集計をリセットしました。");
    });
  });

  $("release").addEventListener("click", (ev) => {
    if (!window.confirm("今日の名簿で結果の付いていない人をすべて未着手に戻します。よいですか？")) return;
    ev.currentTarget.closest("details").open = false;
    run(ev.currentTarget, async () => {
      const data = await api("/api/today/release", { method: "POST" });
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

  load().catch((error) => showMessage(`読み込めませんでした: ${error.message}`));
})();
