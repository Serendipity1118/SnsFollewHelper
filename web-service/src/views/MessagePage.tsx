import { Layout } from "./Layout";

export function MessagePage({ title, message }: { title: string; message: string }) {
  return (
    <Layout title={title}>
      <section class="card">
        <h1>{title}</h1>
        <p>{message}</p>
        <p>
          <a class="btn" href="/">
            今日のフォローへ戻る
          </a>
        </p>
      </section>
    </Layout>
  );
}
