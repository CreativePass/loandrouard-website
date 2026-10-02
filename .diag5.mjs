import { chromium } from "playwright-core";
const url = process.argv[2];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true, reducedMotion: "no-preference" });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 120)));
await p.route((u) => !u.href.startsWith("http://127.0.0.1"), async (r) => { try { const x = await r.fetch({ timeout: 20000 }); await r.fulfill({ response: x }); } catch { await r.abort(); } });
await p.goto(url, { waitUntil: "load", timeout: 90000 });
await p.waitForTimeout(6000);
await p.mouse.move(720, 450);
const etat = () => p.evaluate(() => { const v = document.querySelector(".vfk"); const r = v.getBoundingClientRect(); const c = document.querySelector(".vfk-course");
  return [Math.round(scrollY), "top=" + Math.round(r.top), "course=" + c.offsetHeight, document.querySelector(".vfk-tete")?.hasAttribute("data-on") ? "T" : "-", [...document.querySelectorAll(".vfk-c")].map((k) => k.hasAttribute("data-vu") ? "v" : ".").join(""), "tenue=" + getComputedStyle(document.querySelector(".vf")).getPropertyValue("--vfk-tenue")].join(" "); });
console.log("départ", await etat());
for (let i = 0; i < 160; i++) { await p.mouse.wheel(0, 150); await p.waitForTimeout(60); const e = await etat(); if (i % 8 === 0 || /T|v/.test(e.split(" ")[3] + e.split(" ")[4])) console.log(i, e); if (/vvv/.test(e)) break; }
console.log("erreurs", errs.slice(0, 5));
await b.close();
