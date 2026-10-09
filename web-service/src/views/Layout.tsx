import type { Child } from "hono/jsx";
import { PLATFORM_IDS, PLATFORMS, type PlatformConfig } from "../domain/platform";
import { Icon, IconSprite, type IconName } from "./icons";

export type NavKey = "today" | "list" | "admin";

const NAV: ReadonlyArray<{ path: string; key: NavKey; label: string; icon: IconName }> = [
  { path: "/", key: "today", label: "今日のフォロー", icon: "calendar-check" },
  { path: "/list", key: "list", label: "名簿", icon: "users" },
  { path: "/admin", key: "admin", label: "管理", icon: "sliders" },
];

/** サイドバーの SNS 切り替えに出す頭文字と、行き先のドメイン */
const PLATFORM_MARK: Record<PlatformConfig["id"], { mark: string; domain: string }> = {
  x: { mark: "𝕏", domain: "x.com" },
  instagram: { mark: "IG", domain: "instagram.com" },
};

/** basePath（"" / "/ig"）配下の画面のURL。トップは "/" か "/ig"。 */
export function pageHref(platform: PlatformConfig, path: string): string {
  if (path === "/") return platform.basePath || "/";
  return `${platform.basePath}${path}`;
}

interface LayoutProps {
  title: string;
  platform: PlatformConfig;
  active?: NavKey;
  scripts?: readonly string[];
  children?: Child;
}

function Sidebar({ platform, active }: Pick<LayoutProps, "platform" | "active">) {
  return (
    <aside class="sidebar" id="sidebar" aria-label="メニュー">
      <a class="brand" href={pageHref(platform, "/")}>
        <img class="brand-mark" src="/static/logo-mark.png" alt="" width="34" height="34" />
        <span class="brand-name">
          フォロー優先キュー<b>.</b>
        </span>
      </a>

      <nav class="workspace" aria-label="SNSの切り替え">
        <p class="nav-label">SNS</p>
        {PLATFORM_IDS.map((id) => (
          <a
            href={pageHref(PLATFORMS[id], "/")}
            class={`platform-tab platform-${id}`}
            aria-current={id === platform.id ? "page" : undefined}
          >
            <span class="ws-avatar" aria-hidden="true">
              {PLATFORM_MARK[id].mark}
            </span>
            <span class="ws-text">
              <strong>{PLATFORMS[id].label}フォロー</strong>
              <small>{PLATFORM_MARK[id].domain}</small>
            </span>
          </a>
        ))}
      </nav>

      <nav class="nav" aria-label="メイン">
        <p class="nav-label">メニュー</p>
        {NAV.map((item) => (
          <a href={pageHref(platform, item.path)} aria-current={item.key === active ? "page" : undefined}>
            <Icon name={item.icon} />
            {item.label}
            {item.key === "today" ? <span class="count" id="navRemain" hidden></span> : null}
          </a>
        ))}
      </nav>

      <div class="tip">
        <p class="tip-title">
          <Icon name="shield" />
          自動操作はしません
        </p>
        <p>
          {`自動フォロー・自動いいね・自動DMはしません。この画面はプロフィールを開くだけで、フォローボタンは ${platform.label} の画面で自分で押します。`}
        </p>
      </div>
    </aside>
  );
}

export function Layout({ title, platform, active, scripts = [], children }: LayoutProps) {
  const brand = `${platform.label}フォロー優先キュー`;
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <title>
          {title} | {brand}
        </title>
        <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon-16.png" />
        <link rel="apple-touch-icon" href="/static/apple-touch-icon.png" />
        <link rel="stylesheet" href="/static/style.css" />
        {/* 描画前にテーマを決めて、ちらつきを防ぐ（defer しない） */}
        <script src="/static/shell.js"></script>
      </head>
      <body data-platform={platform.id}>
        <IconSprite />
        <div class="app-shell">
          <Sidebar platform={platform} active={active} />
          <div class="nav-backdrop" id="navBackdrop" hidden></div>
          <div class="main-shell">
            <header class="topbar">
              <button
                type="button"
                class="icon-btn menu-btn"
                id="menuToggle"
                aria-label="メニューを開く"
                aria-controls="sidebar"
                aria-expanded="false"
              >
                <Icon name="menu" />
              </button>
              <p class="crumbs">
                <Icon name="list-checks" />
                <span>{platform.label}フォロー</span>
                <Icon name="chevron-right" />
                <strong>{title}</strong>
              </p>
              <div class="topbar-actions">
                <button type="button" class="icon-btn" id="themeToggle" aria-label="ライト / ダークを切り替える" title="ライト / ダーク">
                  <span class="theme-dark-only">
                    <Icon name="sun" />
                  </span>
                  <span class="theme-light-only">
                    <Icon name="moon" />
                  </span>
                </button>
              </div>
            </header>
            <main class="page">{children}</main>
          </div>
        </div>
        {scripts.map((src) => (
          <script src={src} defer></script>
        ))}
      </body>
    </html>
  );
}
