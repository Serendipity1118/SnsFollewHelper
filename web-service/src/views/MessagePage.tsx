import { Layout } from "./Layout";

export function MessagePage({ title, message }: { title: string; message: string }) {
  return (
    <Layout title={title}>
      <h1>{title}</h1>
      <p>{message}</p>
      <p>
        <a href="/">当日キューへ戻る</a>
      </p>
    </Layout>
  );
}
