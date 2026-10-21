"use client";
// Tiny, dependency-free micro-interactions.

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function haptic(ms = 12) {
  try { if ("vibrate" in navigator) navigator.vibrate(ms); } catch { /* noop */ }
}

function visibleTarget(): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-target]"));
  return els.find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; }) ?? null;
}

/** Flies a thumbnail from `from` into the visible cart button along an arc, then makes the cart jump. */
export function flyToCart(from: Element | null) {
  if (typeof window === "undefined" || reduced()) return;
  const target = visibleTarget();
  if (!from || !target) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = Math.min(a.width, a.height, 96);
  const ghost = document.createElement("div");
  const img = from.querySelector("img");
  ghost.style.cssText = `position:fixed;z-index:9999;pointer-events:none;left:${a.left + a.width / 2 - size / 2}px;top:${a.top + a.height / 2 - size / 2}px;width:${size}px;height:${size}px;border-radius:22px;overflow:hidden;box-shadow:0 14px 34px -10px rgba(245,196,0,.9);background:#fff center/contain no-repeat;border:3px solid #FFD21F;${img ? `background-image:url("${img.currentSrc || img.src}")` : "background:#FFD21F"}`;
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = ghost.animate(
    [
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 110}px) scale(.75) rotate(-12deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(.16) rotate(8deg)`, opacity: 0.5 },
    ],
    { duration: 700, easing: "cubic-bezier(.5,0,.3,1)" },
  );
  anim.onfinish = () => {
    ghost.remove();
    target.animate(
      [{ transform: "translateY(0) scale(1)" }, { transform: "translateY(-6px) scale(1.15) rotate(-6deg)" }, { transform: "translateY(0) scale(.96)" }, { transform: "scale(1)" }],
      { duration: 420, easing: "ease-out" },
    );
    burst(target, 7);
  };
}

/** Little yellow/black sparks from an element (used when adding to cart and on success). */
export function burst(el: Element | null, n = 10) {
  if (typeof window === "undefined" || reduced() || !el) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    const size = 5 + Math.random() * 6;
    s.style.cssText = `position:fixed;z-index:9999;pointer-events:none;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;border-radius:${Math.random() > 0.5 ? "50%" : "2px"};background:${i % 3 === 0 ? "#131210" : "#FFD21F"}`;
    document.body.appendChild(s);
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.6;
    const dist = 26 + Math.random() * 30;
    s.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(.2)`, opacity: 0 }], { duration: 520 + Math.random() * 200, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = () => s.remove();
  }
}

/** Full-screen falling confetti in the brand colours (order placed / delivered). */
export function confetti(pieces = 70) {
  if (typeof window === "undefined" || reduced()) return;
  const colors = ["#FFD21F", "#131210", "#F5C400", "#ffffff"];
  for (let i = 0; i < pieces; i++) {
    const s = document.createElement("span");
    const w = 6 + Math.random() * 8;
    s.style.cssText = `position:fixed;z-index:9999;pointer-events:none;top:-20px;left:${Math.random() * 100}vw;width:${w}px;height:${w * (0.4 + Math.random())}px;background:${colors[i % colors.length]};border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.05)`;
    document.body.appendChild(s);
    const dur = 1800 + Math.random() * 1600;
    s.animate(
      [{ transform: `translate(0,0) rotate(0deg)`, opacity: 1 }, { transform: `translate(${(Math.random() - 0.5) * 220}px, ${innerHeight + 60}px) rotate(${Math.random() * 900}deg)`, opacity: 0.9 }],
      { duration: dur, delay: Math.random() * 400, easing: "cubic-bezier(.25,.6,.4,1)" },
    ).onfinish = () => s.remove();
  }
}
