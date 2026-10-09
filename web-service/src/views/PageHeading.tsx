import type { Child } from "hono/jsx";
import { Icon, type IconName } from "./icons";

interface PageHeadingProps {
  icon: IconName;
  /** 見出しの上の小さな英字ラベル */
  eyebrow: string;
  title: string;
  lead?: Child;
  actions?: Child;
}

/** 各画面の先頭。アイコンのタイル・見出し・説明と、右側の操作ボタン。 */
export function PageHeading({ icon, eyebrow, title, lead, actions }: PageHeadingProps) {
  return (
    <div class="page-heading">
      <span class="heading-tile">
        <Icon name={icon} />
      </span>
      <div class="heading-text">
        <p class="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {lead ? <p class="lead">{lead}</p> : null}
      </div>
      {actions ? <div class="heading-actions">{actions}</div> : null}
    </div>
  );
}
