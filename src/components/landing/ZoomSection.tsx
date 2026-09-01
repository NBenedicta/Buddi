"use client";

import { useEffect, useRef } from "react";

/**
 * Scales its background layer up slightly as the section travels through
 * the viewport, for a subtle "zooming in" feel while scrolling past it.
 */
export function ZoomSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    function update() {
      raf = 0;
      const section = sectionRef.current;
      const bg = bgRef.current;
      if (!section || !bg) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the section enters the bottom of the viewport, 1 once fully past the top.
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      const scale = 1 + progress * 0.18;
      bg.style.transform = `scale(${scale})`;
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={sectionRef} className={className}>
      <div className="relative overflow-hidden rounded-[2.5rem]">
        <div ref={bgRef} className="absolute inset-0 will-change-transform gradient-deep" />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
