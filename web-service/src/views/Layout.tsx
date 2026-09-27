import type { Child } from "hono/jsx";

const NAV = [
  { href: "/", key: "today", label: "当日キュー" },
  { href: "/queue", key: "queue", label: "キュー一覧" },
  { href: "/shops", key: "shops", label: "店舗一覧" },
  { href: "/import", key: "import", label: "取込・出力" },
  { href: "/settings", key: "settings", label: "設定" },
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
        <title>{title} | Xフォロー優先キュー</title>
        <link rel="stylesheet" href="/static/style.css" />
      </head>
      <body>
        <nav class="nav">
          {NAV.map((item) => (
            <a href={item.href} class={item.key === active ? "current" : undefined}>
              {item.label}
            </a>
          ))}
        </nav>
        <div class="page">
          <div class="warn">
            自動フォロー・自動いいね・自動DMはしない。この画面はプロフィールを開くだけで、FollowボタンはXの画面で自分で押す。
          </div>
          {children}
        </div>
        {scripts.map((src) => (
          <script src={src} defer></script>
        ))}
      </body>
    </html>
  );
}
