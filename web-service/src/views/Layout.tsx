import type { Child } from "hono/jsx";
import { PLATFORM_IDS, PLATFORMS, type PlatformConfig } from "../domain/platform";

const NAV = [
  { path: "/", key: "today", label: "今日のフォロー" },
  { path: "/list", key: "list", label: "名簿" },
  { path: "/admin", key: "admin", label: "管理" },
] as const;

export type NavKey = (typeof NAV)[number]["key"];

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
        <link rel="stylesheet" href="/static/style.css" />
      </head>
      <body data-platform={platform.id}>
        <nav class="platform-tabs" aria-label="SNSの切り替え">
          <div class="platform-tabs-inner">
            {PLATFORM_IDS.map((id) => (
              <a
                href={pageHref(PLATFORMS[id], "/")}
                class={`platform-tab platform-${id}`}
                aria-current={id === platform.id ? "page" : undefined}
              >
                {PLATFORMS[id].label}フォロー
              </a>
            ))}
          </div>
        </nav>
        <header class="topbar">
          <div class="topbar-inner">
            <a class="brand" href={pageHref(platform, "/")}>
              {brand}
            </a>
            <nav class="nav" aria-label="メイン">
              {NAV.map((item) => (
                <a href={pageHref(platform, item.path)} aria-current={item.key === active ? "page" : undefined}>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </header>
        <main class="page">{children}</main>
        <footer class="footer">
          {`自動フォロー・自動いいね・自動DMはしません。この画面はプロフィールを開くだけで、フォローボタンは ${platform.label} の画面で自分で押します。`}
        </footer>
        {scripts.map((src) => (
          <script src={src} defer></script>
        ))}
      </body>
    </html>
  );
}
