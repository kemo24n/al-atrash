import "server-only";

// The shelf AI runs on a cloud GPU that sleeps between scans (tools/modal_scan.py). We wake it after uploads and
// whenever the scan page sees photos still waiting, at most once every 30 s: one running worker takes every
// waiting photo, so a burst of photos needs a single wake-up. Without SCAN_TRIGGER_URL (worker on a PC) it does nothing.
let lastWake = 0;

export function wakeAiWorker() {
  const url = process.env.SCAN_TRIGGER_URL;
  if (!url || Date.now() - lastWake < 30_000) return;
  lastWake = Date.now();
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: process.env.SCAN_TRIGGER_KEY ?? "" }) })
    .catch((e) => { lastWake = 0; console.error("[scan] could not wake the AI worker", e); });
}
