import type { Child } from "hono/jsx";

const NAV = [
  { href: "/", key: "today", label: "今日のフォロー" },
  { href: "/list", key: "list", label: "名簿" },
  { href: "/admin", key: "admin", label: "管理" },
] as const;

export type NavKey = (typeof NAV)[number]["key"];

interface LayoutProps {
  title: string;
  active?: NavKey;
  scripts?: readonly string[];
  children?: Child;
}

export function Layout({ title, active, scripts = [], children }: LayoutProps) {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <title>{title} | Xフォロー優先キュー</title>
        <link rel="stylesheet" href="/static/style.css" />
      </head>
      <body>
        <header class="topbar">
          <div class="topbar-inner">
            <a class="brand" href="/">
              Xフォロー優先キュー
            </a>
            <nav class="nav" aria-label="メイン">
              {NAV.map((item) => (
                <a href={item.href} aria-current={item.key === active ? "page" : undefined}>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </header>
        <main class="page">{children}</main>
        <footer class="footer">
          自動フォロー・自動いいね・自動DMはしません。この画面はプロフィールを開くだけで、Followボタンは X の画面で自分で押します。
        </footer>
        {scripts.map((src) => (
          <script src={src} defer></script>
        ))}
      </body>
    </html>
  );
}
