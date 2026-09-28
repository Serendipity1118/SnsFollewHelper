// data-api を持つフォームを fetch で送信し、結果を文章で同じフォーム内に表示する。
(() => {
  "use strict";

  const n = (v) => Number(v).toLocaleString("ja-JP");
  const UNKNOWN_SHOWN = 10;

  // 画面に出す結果の言い回し（APIの返す項目名はそのまま見せない）
  const FORMATTERS = {
    "/api/import/casts": (d) =>
      `取り込みました。個人 ${n(d.personal)} 人（うち未着手 ${n(d.pending)} 人）・店舗垢候補 ${n(d.shop)} 件。` +
      (d.skipped ? `X欄が使えず除いた行: ${n(d.skipped)}。` : ""),
    "/api/import/shops": (d) =>
      `${n(d.imported)} 店舗を取り込みました。` +
      (d.skipped || d.duplicates ? `（店舗URLなし ${n(d.skipped)}・重複 ${n(d.duplicates)} を除外）` : ""),
    "/api/import/queue": (d) =>
      `${n(d.imported)} 件を取り込みました。` +
      (d.released ? `結果のない「当日」${n(d.released)} 件は未着手に戻しました。` : ""),
    "/api/import/results": (d) => {
      const unknown = d.unknown.length
        ? `名簿にない handle ${n(d.unknown.length)} 件: ${d.unknown.slice(0, UNKNOWN_SHOWN).join(", ")}${d.unknown.length > UNKNOWN_SHOWN ? " ほか" : ""}。`
        : "";
      return `${n(d.updated)} 件の結果を反映しました。${unknown}${d.ignored ? `対象外の状態 ${n(d.ignored)} 行は読み飛ばしました。` : ""}`;
    },
    "/api/settings": () => "保存しました。",
  };

  function formToJson(form) {
    const entries = [...new FormData(form).entries()].map(([key, value]) => {
      const input = form.elements.namedItem(key);
      return [key, input && input.type === "number" ? Number(value) : value];
    });
    return JSON.stringify(Object.fromEntries(entries));
  }

  function setResult(output, text, kind) {
    output.textContent = text;
    output.classList.toggle("error", kind === "error");
    output.classList.toggle("success", kind === "success");
  }

  document.querySelectorAll("form[data-api]").forEach((form) => {
    const output = form.querySelector("[data-result]");
    const submit = form.querySelector("button[type=submit]");
    const format = FORMATTERS[form.dataset.api] || (() => "完了しました。");
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const isJson = form.hasAttribute("data-json");
      submit.disabled = true;
      setResult(output, isJson ? "保存中…" : "取り込み中…");
      try {
        const res = await fetch(form.dataset.api, {
          method: form.dataset.method || "POST",
          headers: isJson ? { "content-type": "application/json" } : undefined,
          body: isJson ? formToJson(form) : new FormData(form),
        });
        const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
        if (!res.ok || !body.ok) throw new Error(body.error || `HTTP ${res.status}`);
        setResult(output, format(body.data), "success");
      } catch (error) {
        setResult(output, `失敗しました: ${error.message}`, "error");
      } finally {
        submit.disabled = false;
      }
    });
  });
})();
