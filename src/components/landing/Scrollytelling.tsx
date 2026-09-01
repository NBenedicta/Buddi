"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ScrollyStep {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  alt: string;
}

/**
 * Classic scrollytelling layout: an image pinned in place on one side while
 * the reader scrolls through numbered steps beside it. Each step is watched
 * with its own IntersectionObserver entry; whichever crosses the midline of
 * the viewport becomes "active" and its image crossfades in.
 */
export function Scrollytelling({ steps }: { steps: ScrollyStep[] }) {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = stepRefs.current.findIndex((el) => el === entry.target);
            if (idx !== -1) setActive(idx);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [steps.length]);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="order-2 lg:order-1">
        <div className="space-y-24 py-4 lg:space-y-40 lg:py-20">
          {steps.map((step, i) => (
            <div
              key={step.title}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className={cn(
                "transition-opacity duration-500 lg:opacity-40",
                active === i && "lg:opacity-100"
              )}
            >
              <span className="font-display text-sm font-semibold text-purple-500 dark:text-purple-400">
                {step.eyebrow}
              </span>
              <h3 className="font-display mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-50">
                {step.title}
              </h3>
              <p className="mt-3 max-w-md text-gray-500 dark:text-gray-400">{step.description}</p>

              {/* Image shows inline on small screens where sticky isn't used */}
              <div className="relative mt-6 aspect-[4/3] w-full overflow-hidden rounded-2xl lg:hidden">
                <Image src={step.image} alt={step.alt} fill className="object-cover" sizes="100vw" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="order-1 hidden lg:sticky lg:top-24 lg:order-2 lg:block lg:h-[calc(100vh-8rem)]">
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] shadow-2xl shadow-purple-900/20">
          {steps.map((step, i) => (
            <Image
              key={step.title}
              src={step.image}
              alt={step.alt}
              fill
              sizes="50vw"
              className={cn(
                "object-cover transition-opacity duration-700 ease-out",
                active === i ? "opacity-100" : "opacity-0"
              )}
              priority={i === 0}
            />
          ))}
          <div className="gradient-deep absolute inset-0 mix-blend-multiply opacity-30" />
        </div>
      </div>
    </div>
  );
}
