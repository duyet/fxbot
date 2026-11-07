import { useCallback, useEffect, useRef, useState, type CSSProperties, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";

// Drag to reorder, as in any list. A mouse picks an item up once it moves. A finger picks it up once it has held still
// for a moment, so a swipe still scrolls, and a longer hold opens the item's menu, which ends the drag. `onMove` gets
// the ids in their new order. The list's element takes `list`, and each item `item(id)`'s props, with `data-lifted` on
// the one held. A plugin's page has this as `ui.useReorder`.
const hold = 250;
type Live = { id: string; order: string[]; from: number; to: number; delta: number; mids: number[]; slot: number };

export function useReorder(onMove: (ids: string[]) => void, axis: "x" | "y" = "y") {
  const box = useRef<HTMLElement | null>(null);
  const list = useCallback((element: HTMLElement | null) => void (box.current = element), []);
  const [live, setLive] = useState<Live | null>(null);
  const [lifted, setLifted] = useState<string | null>(null);
  const moved = useRef(onMove);
  moved.current = onMove;
  const end = useRef(() => {});
  useEffect(() => () => end.current(), []);

  // Where each item is as the drag begins, along the axis. The gap between two is part of the slot an item leaves.
  function measure(id: string): Live | null {
    const items = [...(box.current?.querySelectorAll<HTMLElement>("[data-reorder]") ?? [])];
    const order = items.map((el) => el.dataset.reorder!);
    const from = order.indexOf(id);
    if (from < 0 || items.length < 2) return null;
    const boxes = items.map((el) => el.getBoundingClientRect());
    const start = (box: DOMRect) => (axis === "x" ? box.left : box.top);
    const size = (box: DOMRect) => (axis === "x" ? box.width : box.height);
    const gap = Math.max(0, start(boxes[1]) - start(boxes[0]) - size(boxes[0]));
    return { id, order, from, to: from, delta: 0, mids: boxes.map((box) => start(box) + size(box) / 2), slot: size(boxes[from]) + gap };
  }

  function down(event: ReactPointerEvent<HTMLElement>, id: string) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const touch = event.pointerType !== "mouse";
    const target = event.currentTarget;
    const { pointerId, clientX: x0, clientY: y0 } = event;
    let held = !touch;
    let drag: Live | null = null;
    const timer = touch ? setTimeout(() => ((held = true), setLifted(id), navigator.vibrate?.(8)), hold) : undefined;
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const far = Math.hypot(e.clientX - x0, e.clientY - y0);
      if (!drag) {
        // A finger that moves before it has held is scrolling.
        if (!held) return void (far > 8 && stop());
        if (far < 5) return;
        drag = measure(id);
        if (!drag) return stop();
        if (!touch) {
          try {
            target.setPointerCapture(pointerId);
          } catch {}
        }
        setLifted(id);
      }
      const delta = axis === "x" ? e.clientX - x0 : e.clientY - y0;
      const center = drag.mids[drag.from] + delta;
      const to = drag.mids.filter((mid, i) => i !== drag!.from && mid < center).length;
      drag = { ...drag, delta, to };
      setLive(drag);
    };
    // Once held, the page mustn't scroll under the finger.
    const still = (e: TouchEvent) => void (held && e.cancelable && e.preventDefault());
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const done = drag;
      stop();
      if (!done) return;
      // The click a drag ends with isn't one.
      const swallow = (click: MouseEvent) => (click.preventDefault(), click.stopPropagation());
      window.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", swallow, true), 300);
      if (done.to === done.from) return;
      const next = [...done.order];
      next.splice(done.to, 0, ...next.splice(done.from, 1));
      moved.current(next);
    };
    function stop() {
      clearTimeout(timer);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("touchmove", still);
      setLive(null);
      setLifted(null);
      end.current = () => {};
    }
    const cancel = (e: PointerEvent) => void (e.pointerId === pointerId && stop());
    end.current();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("touchmove", still, { passive: false });
    end.current = stop;
  }

  // The item held follows the pointer, and the ones it passes step aside.
  function item(id: string) {
    const style: CSSProperties = {};
    if (live) {
      const at = live.order.indexOf(id);
      const shift = at === live.from ? live.delta : live.from < at && at <= live.to ? -live.slot : live.to <= at && at < live.from ? live.slot : 0;
      if (shift) style.transform = axis === "x" ? `translateX(${shift}px)` : `translateY(${shift}px)`;
      if (at === live.from) Object.assign(style, { position: "relative", zIndex: 20 });
      else style.transition = "transform 150ms ease";
    }
    return {
      "data-reorder": id,
      "data-lifted": lifted === id || undefined,
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => down(event, id),
      onDragStart: (event: DragEvent) => event.preventDefault(),
      style,
    };
  }

  return { list, item, dragging: Boolean(live), cancel: () => end.current() };
}
