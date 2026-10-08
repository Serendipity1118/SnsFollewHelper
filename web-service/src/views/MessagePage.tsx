import type { PlatformConfig } from "../domain/platform";
import { Layout, pageHref } from "./Layout";

export function MessagePage({ title, message, platform }: { title: string; message: string; platform: PlatformConfig }) {
  return (
    <Layout title={title} platform={platform}>
      <section class="card">
        <h1>{title}</h1>
        <p>{message}</p>
        <p>
          <a class="btn" href={pageHref(platform, "/")}>
            今日のフォローへ戻る
          </a>
        </p>
      </section>
    </Layout>
  );
}
