"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Moves its children at a different rate than the page scrolls, based on the
 * element's position relative to the viewport center. `speed` above 0 moves
 * slower than scroll (background feel); negative moves faster (foreground).
 */
export function Parallax({
  children,
  speed = 0.15,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    function update() {
      raf = 0;
      const wrapper = wrapperRef.current;
      const inner = innerRef.current;
      if (!wrapper || !inner) return;
      const rect = wrapper.getBoundingClientRect();
      const viewportMid = window.innerHeight / 2;
      const distanceFromMid = rect.top + rect.height / 2 - viewportMid;
      inner.style.transform = `translate3d(0, ${distanceFromMid * speed}px, 0)`;
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
  }, [speed]);

  return (
    <div ref={wrapperRef} className={cn("overflow-hidden", className)}>
      <div ref={innerRef} className="h-[130%] w-full will-change-transform">
        {children}
      </div>
    </div>
  );
}
