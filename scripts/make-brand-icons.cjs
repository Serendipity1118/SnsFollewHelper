// ロゴ原画（docs/brand/logo-source.png）から各用途のアイコン画像を作り、所定の場所へ書き出す。
//   node scripts/make-brand-icons.cjs
// web-service の Playwright（Chromium の canvas）を使う。先に web-service で npm install しておく。
// ストア用画像はこのあと follow_support_app/tool/render_store_assets.ps1、
// Flutter のランチャーアイコン・スプラッシュは flutter_launcher_icons / flutter_native_splash で作る。
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const { chromium } = require(path.join(ROOT, "web-service/node_modules/playwright"));
const SOURCE = path.join(ROOT, "docs/brand/logo-source.png");

// 出力先 → { size, kind: full（角まで塗る）| rounded（角丸・外は透過）| foreground（記号だけ透過）, scale: 記号の幅 / 画像の幅 }
// listOnly: 32px 以下は右の矢印を外してリストだけを大きく描く（潰れないように）
const JOBS = {
  "follow_support_app/assets/app_icon.png": { size: 1024, kind: "full", scale: 0.6 },
  "follow_support_app/assets/app_logo.png": { size: 1024, kind: "rounded", scale: 0.6 },
  "follow_support_app/assets/app_icon_foreground.png": { size: 1024, kind: "foreground", scale: 0.46 },
  "web-service/src/public/apple-touch-icon.png": { size: 180, kind: "full", scale: 0.62 },
  "web-service/src/public/logo-mark.png": { size: 96, kind: "rounded", scale: 0.66 },
  "web-service/src/public/favicon-32.png": { size: 32, kind: "rounded", scale: 0.66, listOnly: true },
  "web-service/src/public/favicon-16.png": { size: 16, kind: "rounded", scale: 0.7, listOnly: true },
  "chrome-extension/icons/icon128.png": { size: 128, kind: "rounded", scale: 0.64 },
  "chrome-extension/icons/icon48.png": { size: 48, kind: "rounded", scale: 0.7 },
  "chrome-extension/icons/icon32.png": { size: 32, kind: "rounded", scale: 0.66, listOnly: true },
  "chrome-extension/icons/icon16.png": { size: 16, kind: "rounded", scale: 0.7, listOnly: true },
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const src = "data:image/png;base64," + fs.readFileSync(SOURCE).toString("base64");
  const result = await page.evaluate(async ({ src, JOBS }) => {
    const TEAL = [19, 125, 100], MINT = [133, 226, 197], WHITE = [255, 255, 255];
    const FULL = { x: 354, y: 254, w: 696, h: 579 }; // 記号（文字は含めない）
    const LIST = { x: 354, y: 254, w: 483, h: 579 }; // 小さいサイズ用: 右の矢印を除いたリストだけ
    const PAD = 24;
    const img = new Image();
    img.src = src;
    await img.decode();

    function makeCut(BOX) {
    // 記号部分を切り出し、背景のティールを透過にする（白・ミントのどちらかとの混色とみなして不透明度を逆算）
    const cut = new OffscreenCanvas(BOX.w + PAD * 2, BOX.h + PAD * 2);
    const cx = cut.getContext("2d");
    cx.drawImage(img, BOX.x - PAD, BOX.y - PAD, cut.width, cut.height, 0, 0, cut.width, cut.height);
    const id = cx.getImageData(0, 0, cut.width, cut.height);
    const d = id.data;
    for (let k = 0; k < d.length; k += 4) {
      const c = [d[k] - TEAL[0], d[k + 1] - TEAL[1], d[k + 2] - TEAL[2]];
      let best = null;
      for (const ref of [WHITE, MINT]) {
        const v = [ref[0] - TEAL[0], ref[1] - TEAL[1], ref[2] - TEAL[2]];
        const a = (c[0] * v[0] + c[1] * v[1] + c[2] * v[2]) / (v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
        const res = Math.hypot(c[0] - a * v[0], c[1] - a * v[1], c[2] - a * v[2]);
        if (!best || res < best.res) best = { a, res, ref };
      }
      const a = Math.min(1, Math.max(0, best.a));
      d[k] = best.ref[0]; d[k + 1] = best.ref[1]; d[k + 2] = best.ref[2]; d[k + 3] = Math.round(a * 255);
    }
    cx.putImageData(id, 0, 0);
    return { cut, BOX };
    }
    const cuts = { full: makeCut(FULL), list: makeCut(LIST) };

    const toUrl = async (canvas) => {
      const blob = await canvas.convertToBlob({ type: "image/png" });
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = ""; for (const b of buf) s += String.fromCharCode(b);
      return btoa(s);
    };

    // 大きく描いてから半分ずつ縮める（小さいサイズでもにじませない）
    function draw(size, kind, scale, listOnly) {
      const { cut, BOX } = listOnly ? cuts.list : cuts.full;
      const c = new OffscreenCanvas(size, size);
      const x = c.getContext("2d");
      x.imageSmoothingQuality = "high";
      if (kind !== "foreground") {
        x.fillStyle = "rgb(19,125,100)";
        if (kind === "rounded") { x.beginPath(); x.roundRect(0, 0, size, size, size * 0.225); x.fill(); }
        else x.fillRect(0, 0, size, size);
      }
      const w = size * scale * (cut.width / BOX.w), h = w * cut.height / cut.width;
      x.drawImage(cut, (size - w) / 2, (size - h) / 2, w, h);
      return c;
    }
    function shrink(canvas, size) {
      let cur = canvas;
      while (cur.width / 2 >= size) {
        const n = new OffscreenCanvas(cur.width / 2, cur.height / 2);
        const x = n.getContext("2d"); x.imageSmoothingQuality = "high";
        x.drawImage(cur, 0, 0, n.width, n.height); cur = n;
      }
      if (cur.width !== size) {
        const n = new OffscreenCanvas(size, size);
        const x = n.getContext("2d"); x.imageSmoothingQuality = "high";
        x.drawImage(cur, 0, 0, size, size); cur = n;
      }
      return cur;
    }
    const out = {};
    for (const [name, job] of Object.entries(JOBS)) {
      const base = Math.max(1024, job.size) * (job.size < 1024 ? 2 : 1);
      out[name] = await toUrl(shrink(draw(base, job.kind, job.scale, job.listOnly), job.size));
    }
    return out;
  }, { src, JOBS });
  for (const [name, b64] of Object.entries(result)) {
    const file = path.join(ROOT, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(b64, "base64"));
    console.log("wrote", name);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
