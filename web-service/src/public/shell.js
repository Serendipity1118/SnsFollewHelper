// 全画面共通の枠（テーマ切り替え・スマホのメニュー）。<head> で読み込み、描画前にテーマを決める。
(() => {
  "use strict";

  const THEME_KEY = "follow-queue-theme";
  const root = document.documentElement;

  function savedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null; // 保存できない環境では OS の設定に従う
    }
  }

  const initial = savedTheme();
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.classList.toggle("dark", initial ? initial === "dark" : prefersDark);

  function toggleTheme() {
    const dark = root.classList.toggle("dark");
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      // 保存できなくても今の画面は切り替わる
    }
  }

  function setupMenu() {
    const toggle = document.getElementById("menuToggle");
    const backdrop = document.getElementById("navBackdrop");
    if (!toggle || !backdrop) return;
    const setOpen = (open) => {
      document.body.classList.toggle("nav-open", open);
      backdrop.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => setOpen(!document.body.classList.contains("nav-open")));
    backdrop.addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && document.body.classList.contains("nav-open")) setOpen(false);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
    setupMenu();
  });
})();
