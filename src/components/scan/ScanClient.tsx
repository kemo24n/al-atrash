"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check, CircleHelp, Loader2, ScanLine, X } from "lucide-react";
import { applyScanAction, cancelScanAction, confirmScanAction, endScanAction, startScanAction } from "@/app/scan/actions";
import { cn } from "@/lib/format";

type Product = { id: string; name: string; image: string | null; state: "seen" | "unsure" | "unseen"; confidence: number; confirmed: boolean | null };
type Summary = {
  session: { id: string; status: "open" | "review" | "applied" | "cancelled" };
  photos: { total: number; done: number; failed: number };
  products: Product[];
};

/** Shrinks a phone photo before upload (the AI works at a smaller size anyway, and uploads stay fast on mobile data). */
async function shrink(file: File, maxSide = 1920): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((ok) => canvas.toBlob((b) => ok(b ?? file), "image/jpeg", 0.88));
}

const present = (p: Product) => p.confirmed ?? p.state === "seen";

export function ScanClient({ initialSessionId, userName }: { initialSessionId: string | null; userName: string }) {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [sum, setSum] = useState<Summary | null>(null);
  const [uploading, setUploading] = useState(0);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ available: number; unavailable: number } | null>(null);
  const [waitingSince, setWaitingSince] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    const r = await fetch(`/api/scan/session?id=${sessionId}`, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
    if (r?.ok) setSum(r);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [sessionId, refresh]);

  const pending = sum ? sum.photos.total - sum.photos.done - sum.photos.failed : 0;
  useEffect(() => { setWaitingSince((w) => (pending > 0 ? w ?? Date.now() : null)); }, [pending]);
  const workerSlow = waitingSince !== null && Date.now() - waitingSince > 90_000;

  async function start() {
    setBusy(true);
    setResult(null);
    setSessionId(await startScanAction());
    setBusy(false);
  }

  async function upload(files: FileList | null) {
    if (!files || !sessionId) return;
    setUploadErr(null);
    for (const f of Array.from(files)) {
      setUploading((n) => n + 1);
      try {
        const fd = new FormData();
        fd.append("file", new File([await shrink(f)], "shelf.jpg", { type: "image/jpeg" }));
        fd.append("sessionId", sessionId);
        fd.append("takenAt", String(f.lastModified || Date.now()));
        const r = await fetch("/api/scan/photo", { method: "POST", body: fd }).then((x) => x.json());
        if (!r.ok) setUploadErr(r.error ?? "ما انرفعت الصورة");
      } catch {
        setUploadErr("ما انرفعت الصورة، تأكد من النت وجرّب مرة تانية");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (input.current) input.current.value = "";
    refresh();
  }

  async function answer(p: Product, value: boolean | null) {
    if (!sessionId) return;
    setSum((x) => x && { ...x, products: x.products.map((q) => (q.id === p.id ? { ...q, confirmed: value } : q)) });
    await confirmScanAction(sessionId, p.id, value);
  }

  async function end() {
    if (!sessionId) return;
    setBusy(true);
    await endScanAction(sessionId);
    await refresh();
    setBusy(false);
  }

  async function apply() {
    if (!sessionId) return;
    setBusy(true);
    const r = await applyScanAction(sessionId);
    setBusy(false);
    if (r.ok) { setResult(r); setSessionId(null); setSum(null); } else setUploadErr(r.error);
  }

  async function cancel() {
    if (!sessionId || !window.confirm("متأكد بدك تلغي هالوردية؟ ما رح يتغير شي بالمتجر.")) return;
    await cancelScanAction(sessionId);
    setSessionId(null);
    setSum(null);
  }

  const status = sum?.session.status;
  const products = sum?.products ?? [];
  const seen = products.filter((p) => p.state === "seen");
  const unsure = products.filter((p) => p.state === "unsure");
  const unseen = products.filter((p) => p.state === "unseen");
  const unanswered = unsure.filter((p) => p.confirmed === null).length;

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-paper pb-36">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-ink px-4 py-3 text-white">
        <div className="flex items-center gap-2 font-black"><ScanLine className="h-5 w-5 text-brand-400" /> مسح الرفوف</div>
        <span className="text-xs text-white/60">أهلين {userName}</span>
      </header>

      {result && (
        <div className="m-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          تمام، انحدّث المتجر: {result.available} صنف متوفر و {result.unavailable} صنف مو متوفر.
        </div>
      )}

      {!sessionId ? (
        <div className="p-4">
          <div className="card space-y-3 p-5 text-sm leading-7">
            <p className="font-black">ببداية كل وردية:</p>
            <ol className="list-decimal space-y-1 pr-5">
              <li>اضغط "بلّش الوردية".</li>
              <li>صوّر الرفوف صف صف، من مسافة متر تقريباً، والصورة واضحة ومو مهزوزة.</li>
              <li>لما تخلص اضغط "إنهاء الوردية"، وأكّد الأصناف اللي ما كنا متأكدين منها.</li>
            </ol>
          </div>
          <button onClick={start} disabled={busy} className="btn-primary mt-4 h-14 w-full text-lg">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanLine className="h-5 w-5" />} بلّش الوردية
          </button>
          <Link href="/admin/ai" className="mt-3 block text-center text-xs font-bold text-ink-mute">سجل المسح بالإدارة</Link>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat n={sum?.photos.total ?? 0} label="صورة" />
            <Stat n={seen.length} label="شفناه" tone="green" />
            <Stat n={unsure.length} label="مو متأكدين" tone="amber" />
          </div>
          {(pending > 0 || uploading > 0) && (
            <p className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-ink-soft">
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploading > 0 ? `عم نرفع ${uploading} صورة...` : `عم نفحص ${pending} صورة...`}
            </p>
          )}
          {workerSlow && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">الصور عم تتأخر. تأكد إنو جهاز الذكاء الصناعي شغّال.</p>}
          {uploadErr && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{uploadErr}</p>}

          {status === "review" && unsure.length > 0 && (
            <Section title={`أكّد هدول (${unanswered} باقي)`} hint="شفناهن بس مو متأكدين. اطّلع عالرف وجاوب.">
              {unsure.map((p) => <Row key={p.id} p={p}>
                <Choice on={p.confirmed === true} onClick={() => answer(p, p.confirmed === true ? null : true)} yes />
                <Choice on={p.confirmed === false} onClick={() => answer(p, p.confirmed === false ? null : false)} />
              </Row>)}
            </Section>
          )}

          <Section title={status === "review" ? `ما شفناهن (${unseen.length})` : `لسا ما شفناهن (${unseen.length})`}
            hint={status === "review" ? "رح ينعرضوا مو متوفرين. إذا شي واحد موجود عالرف علّم عليه." : "كمّل صوّر الرفوف."}>
            {unseen.map((p) => <Row key={p.id} p={p}>
              {status === "review" && <Choice on={p.confirmed === true} onClick={() => answer(p, p.confirmed === true ? null : true)} yes label="موجود" />}
            </Row>)}
          </Section>

          {status === "open" && unsure.length > 0 && (
            <Section title={`مو متأكدين (${unsure.length})`} hint="بتأكّدهن بآخر الوردية.">
              {unsure.map((p) => <Row key={p.id} p={p} />)}
            </Section>
          )}

          <Section title={`شفناهن (${seen.length})`} hint="رح ينعرضوا متوفرين.">
            {seen.map((p) => <Row key={p.id} p={p}>
              {status === "review" && <Choice on={p.confirmed === false} onClick={() => answer(p, p.confirmed === false ? null : false)} label="مو موجود" />}
            </Row>)}
          </Section>

          <button onClick={cancel} className="w-full text-center text-xs font-bold text-ink-mute">إلغاء الوردية</button>
        </div>
      )}

      {sessionId && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg space-y-2 border-t border-ink-line bg-white p-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
          {status === "open" ? (
            <>
              <input ref={input} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => upload(e.target.files)} />
              <button onClick={() => input.current?.click()} className="btn-primary h-14 w-full text-lg"><Camera className="h-6 w-6" /> صوّر الرف</button>
              <button onClick={end} disabled={busy || (sum?.photos.total ?? 0) === 0} className="btn-ghost h-11 w-full">إنهاء الوردية</button>
            </>
          ) : (
            <button onClick={apply} disabled={busy || pending > 0 || uploading > 0} className="btn-primary h-14 w-full text-base">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              {pending > 0 ? `استنى، في ${pending} صورة عم تنفحص` : `تأكيد وتحديث المتجر (${products.filter(present).length} متوفر)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ n, label, tone }: { n: number; label: string; tone?: "green" | "amber" }) {
  return (
    <div className={cn("rounded-2xl bg-white p-3", tone === "green" && "text-emerald-700", tone === "amber" && "text-amber-700")}>
      <div className="text-2xl font-black tabular">{n}</div><div className="text-xs font-bold">{label}</div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <h2 className="font-black">{title}</h2>
      <p className="mb-3 text-xs text-ink-mute">{hint}</p>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ p, children }: { p: Product; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-paper">
        {p.image ? <img src={p.image} alt="" className="h-full w-full object-contain" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{p.name}</div>
        {p.state === "unsure" && <div className="flex items-center gap-1 text-[11px] text-amber-700"><CircleHelp className="h-3 w-3" />متأكدين {Math.round(p.confidence * 100)}%</div>}
      </div>
      <div className="flex shrink-0 gap-1.5">{children}</div>
    </div>
  );
}

function Choice({ on, onClick, yes, label }: { on: boolean; onClick: () => void; yes?: boolean; label?: string }) {
  return (
    <button onClick={onClick} className={cn("flex h-9 items-center gap-1 rounded-xl px-3 text-xs font-black ring-1 transition",
      on ? (yes ? "bg-emerald-600 text-white ring-emerald-600" : "bg-red-600 text-white ring-red-600") : "bg-white text-ink-soft ring-ink-line")}>
      {yes ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}{label ?? (yes ? "موجود" : "مو موجود")}
    </button>
  );
}
