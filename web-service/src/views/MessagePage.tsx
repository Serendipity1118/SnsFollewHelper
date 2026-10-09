import type { PlatformConfig } from "../domain/platform";
import { Icon } from "./icons";
import { Layout, pageHref } from "./Layout";

export function MessagePage({ title, message, platform }: { title: string; message: string; platform: PlatformConfig }) {
  return (
    <Layout title={title} platform={platform}>
      <section class="card empty-card">
        <Icon name="alert-triangle" />
        <h1>{title}</h1>
        <p>{message}</p>
        <a class="btn btn-primary" href={pageHref(platform, "/")}>
          <Icon name="calendar-check" />
          今日のフォローへ戻る
        </a>
      </section>
    </Layout>
  );
}
