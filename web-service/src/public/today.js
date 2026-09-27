// 当日キュー画面。旧 today.html の操作を移植し、結果は押した時点でサーバーへ保存する。
// Xへの通信・自動操作はしない。プロフィールは /go/:handle 経由で人が開く。
(() => {
  "use strict";

  const STATUS_ASSIGNED = "当日";
  const OPEN_BATCH = 5;
  const $ = (id) => document.getElementById(id);
  const list = $("list");
  const progress = $("progress");
  const quotaLine = $("quota");
  const message = $("message");

  const state = { date: "", items: [], quota: null, settings: null, active: null, history: [] };
  const pending = new Set();

  function showMessage(text) {
    message.textContent = text || "";
  }

  async function api(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: { "content-type": "application/json", ...(options.headers || {}) },
    });
    const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
    if (!res.ok || !body.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body.data;
  }

  const openUrl = (handle) => "/go/" + encodeURIComponent(handle);
  const httpUrl = (s) => (/^https?:\/\//.test(String(s || "")) ? String(s) : "");
  const visible = () => state.items.filter((item) => item.status === STATUS_ASSIGNED);
  const canOpen = () => state.quota && state.quota.remaining > 0;

  function formatTime(epochMs) {
    return new Date(epochMs).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  }

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === "text") node.textContent = value;
      else if (key === "dataset") Object.assign(node.dataset, value);
      else node.setAttribute(key, value);
    }
    for (const child of children) if (child) node.appendChild(child);
    return node;
  }

  function renderQuota() {
    const q = state.quota;
    const s = state.settings;
    if (!q || !s) return;
    const base = `直近1時間 ${q.followed1h}/${s.hourlyLimit}件・24時間 ${q.followed24h}/${s.dailyLimit}件　あと ${q.remaining} 件開ける`;
    const retry = q.blocked && q.retryAt ? `（${formatTime(q.retryAt)} 以降に再開）` : "";
    quotaLine.textContent = q.blocked ? `フォロー上限に達しました。${base}${retry}` : base;
    quotaLine.classList.toggle("blocked", q.blocked);
    $("open5").disabled = q.blocked || visible().length === 0;
  }

  function renderRow(item, index) {
    const opener = canOpen()
      ? el("a", { class: "btn primary", href: openUrl(item.handle), target: "_blank", rel: "noopener", text: "Xを開く" })
      : el("span", { class: "btn disabled", "aria-disabled": "true", text: "上限到達" });
    const pokeUrl = httpUrl(item.profileUrl);
    const poke = pokeUrl
      ? el("a", { class: "btn", href: pokeUrl, target: "_blank", rel: "noopener noreferrer", text: "ポケパラ" })
      : null;
    const buttons = ["済", "スキップ", "死垢"].map((status) =>
      el("button", { type: "button", dataset: { status }, text: status }),
    );
    const row = el("div", { class: "row" + (item.handle === state.active ? " active" : "") }, [
      el("div", { class: "name", text: `${index + 1}. @${item.handle}　${item.castName}` }),
      el("div", {
        class: "sub",
        text: `${item.prefecture} / ${item.shop}　出現${item.occurrences}　更新 ${item.lastUpdated || "なし"}　優先度 ${item.priority}`,
      }),
      el("div", { class: "actions" }, [opener, poke, ...buttons]),
    ]);
    row.dataset.handle = item.handle;
    buttons.forEach((btn) => btn.addEventListener("click", () => mark(item.handle, btn.dataset.status)));
    row.addEventListener("click", (ev) => {
      if (ev.target.closest("a, button")) return;
      state.active = item.handle;
      render();
    });
    return row;
  }

  function render() {
    const vis = visible();
    if (!vis.some((item) => item.handle === state.active)) state.active = vis[0]?.handle ?? null;
    list.replaceChildren();
    if (!state.items.length) {
      list.appendChild(el("p", { class: "meta", text: "今日の名簿はまだありません。「次の件を出す」を押してください。" }));
    } else if (!vis.length) {
      list.appendChild(el("p", { class: "meta", text: "このバッチはすべて処理しました。結果は保存済みです。" }));
    }
    state.items.forEach((item, i) => {
      if (item.status === STATUS_ASSIGNED) list.appendChild(renderRow(item, i));
    });
    $("date").textContent = state.date ? `（${state.date}）` : "";
    progress.textContent = state.items.length ? `残り ${vis.length} / ${state.items.length}` : "";
    $("next").textContent = `次の${state.settings ? state.settings.batchSize : ""}件を出す`;
    $("undo").disabled = state.history.length === 0;
    renderQuota();
  }

  function applyToday(data) {
    state.date = data.date;
    state.items = data.items;
    state.quota = data.quota;
    state.settings = data.settings;
  }

  async function load() {
    applyToday(await api("/api/today"));
    render();
  }

  async function mark(handle, status, { remember = true } = {}) {
    // 保存中の行への連打・キーリピートで二重送信しない
    if (pending.has(handle)) return;
    pending.add(handle);
    const vis = visible().map((item) => item.handle);
    const pos = vis.indexOf(handle);
    try {
      const data = await api(`/api/targets/${encodeURIComponent(handle)}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      state.items = state.items.map((item) => (item.handle === handle ? data.item : item));
      state.quota = data.quota;
      if (remember && status !== STATUS_ASSIGNED) state.history.push(handle);
      if (status !== STATUS_ASSIGNED) state.active = vis[pos + 1] ?? vis[pos - 1] ?? null;
      else state.active = handle;
      showMessage("");
    } catch (error) {
      showMessage(`保存できませんでした: ${error.message}`);
    } finally {
      pending.delete(handle);
    }
    render();
  }

  async function run(button, task) {
    button.disabled = true;
    try {
      await task();
    } catch (error) {
      showMessage(error.message);
    } finally {
      button.disabled = false;
      render();
    }
  }

  $("next").addEventListener("click", (ev) =>
    run(ev.currentTarget, async () => {
      applyToday(await api("/api/today/next", { method: "POST" }));
      if (!visible().length) showMessage("未実施の件がありません。取込画面でキューを確認してください。");
    }),
  );

  $("open5").addEventListener("click", () => {
    if (!canOpen()) return;
    const count = Math.min(OPEN_BATCH, state.quota.remaining);
    visible()
      .slice(0, count)
      .forEach((item) => window.open(openUrl(item.handle), "_blank", "noopener"));
  });

  $("done5").addEventListener("click", (ev) =>
    run(ev.currentTarget, async () => {
      // 「5件を開く」と同じく残り枠の分だけ（開いていない行を済にしない）
      const count = Math.min(OPEN_BATCH, state.quota ? state.quota.remaining : 0);
      for (const item of visible().slice(0, count)) await mark(item.handle, "済");
    }),
  );

  $("undo").addEventListener("click", () => undo());

  $("release").addEventListener("click", (ev) => {
    if (!window.confirm("今日の名簿で結果の付いていない件をすべて「未」に戻します。よいですか？")) return;
    run(ev.currentTarget, async () => {
      const data = await api("/api/today/release", { method: "POST" });
      showMessage(`${data.released} 件を未に戻しました。`);
      state.history = [];
      await load();
    });
  });

  async function undo() {
    const handle = state.history.pop();
    if (handle) await mark(handle, STATUS_ASSIGNED, { remember: false });
  }

  document.addEventListener("keydown", (ev) => {
    if (ev.target.closest("input, textarea, select") || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const key = ev.key.toLowerCase();
    if (key === "u") {
      undo();
      return;
    }
    const vis = visible().map((item) => item.handle);
    if (!vis.length) return;
    const pos = Math.max(0, vis.indexOf(state.active));
    const handle = vis[pos];
    if (key === "j") {
      state.active = vis[Math.min(pos + 1, vis.length - 1)];
      render();
    } else if (key === "k") {
      state.active = vis[Math.max(pos - 1, 0)];
      render();
    } else if (key === "o") {
      if (canOpen()) window.open(openUrl(handle), "_blank", "noopener");
    } else if (key === "1") {
      mark(handle, "済");
    } else if (key === "2") {
      mark(handle, "スキップ");
    } else if (key === "3") {
      mark(handle, "死垢");
    }
  });

  load().catch((error) => showMessage(`読み込めませんでした: ${error.message}`));
})();
