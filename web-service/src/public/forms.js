// data-api を持つフォームを fetch で送信し、結果を同じフォーム内に表示する。
(() => {
  "use strict";

  function formToJson(form) {
    const entries = [...new FormData(form).entries()].map(([key, value]) => {
      const input = form.elements.namedItem(key);
      return [key, input && input.type === "number" ? Number(value) : value];
    });
    return JSON.stringify(Object.fromEntries(entries));
  }

  function describe(data) {
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") || "なし" : value}`)
      .join("\n");
  }

  document.querySelectorAll("form[data-api]").forEach((form) => {
    const output = form.querySelector("[data-result]");
    const submit = form.querySelector("button[type=submit]");
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const isJson = form.hasAttribute("data-json");
      submit.disabled = true;
      output.textContent = "送信中…";
      output.classList.remove("error");
      try {
        const res = await fetch(form.dataset.api, {
          method: form.dataset.method || "POST",
          headers: isJson ? { "content-type": "application/json" } : undefined,
          body: isJson ? formToJson(form) : new FormData(form),
        });
        const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
        if (!res.ok || !body.ok) throw new Error(body.error || `HTTP ${res.status}`);
        output.textContent = "完了\n" + describe(body.data);
      } catch (error) {
        output.textContent = `失敗: ${error.message}`;
        output.classList.add("error");
      } finally {
        submit.disabled = false;
      }
    });
  });
})();
