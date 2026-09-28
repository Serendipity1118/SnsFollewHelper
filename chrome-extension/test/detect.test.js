import { beforeEach, describe, expect, test } from "vitest";
import "../src/detect.js";

const { detectProfile, profileFollowButton } = globalThis.FollowHelper;

/** X のプロフィール画面を模した最小限の DOM。 */
function page(primary, sidebar = "") {
  document.body.innerHTML = `
    <main><div data-testid="primaryColumn">${primary}</div></main>
    <div data-testid="sidebarColumn">${sidebar}</div>`;
  return document;
}

const button = (testid, label) => `<button data-testid="${testid}" aria-label="${label}"><span>x</span></button>`;
const header = (inner) => `<div data-testid="placementTracking">${inner}</div>`;
const emptyState = (text) => `<div data-testid="emptyState"><span>${text}</span></div>`;

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("detectProfile", () => {
  test("is unknown while the profile is still loading", () => {
    expect(detectProfile(page(""), "alice")).toBe("unknown");
  });

  test("detects accounts that do not exist (Japanese and English)", () => {
    expect(detectProfile(page(emptyState("このアカウントは存在しません")), "alice")).toBe("not_found");
    expect(detectProfile(page(emptyState("This account doesn’t exist")), "alice")).toBe("not_found");
    expect(detectProfile(page(emptyState("This account doesn't exist")), "alice")).toBe("not_found");
  });

  test("detects X's 'this page does not exist' page for names that cannot be accounts", () => {
    // 2026-09-28 に実際の X で確認した形: primaryColumn が無く error-detail だけが出る
    document.body.innerHTML = '<main><div data-testid="error-detail"><span>このページは存在しません。他のページを検索してみましょう。</span></div></main>';
    expect(detectProfile(document, "%20alice")).toBe("not_found");
    document.body.innerHTML = '<main><div data-testid="error-detail"><span>Hmm...this page doesn’t exist. Try searching for something else.</span></div></main>';
    expect(detectProfile(document, "%20alice")).toBe("not_found");
    document.body.innerHTML = '<main><div data-testid="error-detail"><span>問題が発生しました。</span></div></main>';
    expect(detectProfile(document, "%20alice")).toBe("unknown");
  });

  test("detects suspended accounts", () => {
    expect(detectProfile(page(emptyState("アカウントは凍結されています")), "alice")).toBe("suspended");
    expect(detectProfile(page(emptyState("Account suspended")), "alice")).toBe("suspended");
  });

  test("leaves other empty states (errors, blocked) as unknown", () => {
    expect(detectProfile(page(emptyState("問題が発生しました。再読み込みしてください。")), "alice")).toBe("unknown");
    expect(detectProfile(page(emptyState("@alice さんからブロックされています")), "alice")).toBe("unknown");
  });

  test("reads the follow state from the profile header", () => {
    expect(detectProfile(page(header(button("1-follow", "@aliceさんをフォロー"))), "alice")).toBe("unfollowed");
    expect(detectProfile(page(header(button("1-unfollow", "@aliceさんのフォローを解除"))), "alice")).toBe("followed");
    expect(detectProfile(page(header(button("1-cancel", "@aliceさんへのフォローリクエストを取り消す"))), "alice")).toBe("pending");
  });

  test("reads the follow state of protected accounts, whose posts area shows a private notice", () => {
    // 2026-09-28 に実際の X で確認した形: 「未承認」ボタンは aria-label なし、ポスト欄に emptyState が出る
    const privateNotice = emptyState("ポストは非公開です@aliceさんから承認された場合のみポストを表示できます。");
    const pendingButton = '<div data-testid="placementTracking"><button data-testid="202-cancel"><span>未承認</span></button></div>';
    expect(detectProfile(page(`${pendingButton}${privateNotice}`), "alice")).toBe("pending");
    expect(detectProfile(page(`${header(button("202-follow", "フォロー @alice"))}${privateNotice}`), "alice")).toBe("unfollowed");
    expect(detectProfile(page(`${header(button("202-unfollow", "フォロー中 @alice"))}${privateNotice}`), "alice")).toBe("followed");
  });

  test("prefers the button labelled with the profile's handle over suggestions", () => {
    const suggestion = button("2-unfollow", "@bobさんのフォローを解除");
    expect(detectProfile(page(`${suggestion}${button("1-follow", "Follow @Alice")}`), "alice")).toBe("unfollowed");
  });

  test("does not confuse a handle that merely starts with the profile's handle", () => {
    const other = button("2-unfollow", "@alice_2さんのフォローを解除");
    expect(detectProfile(page(`${other}${header(button("1-follow", "@aliceさんをフォロー"))}`), "alice")).toBe("unfollowed");
  });

  test("ignores follow buttons in the sidebar", () => {
    expect(detectProfile(page("", button("9-unfollow", "@aliceさんのフォローを解除")), "alice")).toBe("unknown");
  });

  test("is unknown on your own profile or when you blocked the account", () => {
    expect(detectProfile(page(header('<a data-testid="editProfileButton">編集</a>')), "me")).toBe("unknown");
    expect(detectProfile(page(header(button("1-unblock", "@aliceさんのブロックを解除"))), "alice")).toBe("unknown");
  });
});

describe("profileFollowButton", () => {
  test("returns the header button so clicks on it can be recognised", () => {
    const doc = page(header(button("1-follow", "@aliceさんをフォロー")));
    expect(profileFollowButton(doc, "alice")?.getAttribute("data-testid")).toBe("1-follow");
  });

  test("returns null when there is no follow button", () => {
    expect(profileFollowButton(page(""), "alice")).toBeNull();
  });
});
