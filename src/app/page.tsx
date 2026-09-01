"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/landing/Reveal";
import { Parallax } from "@/components/landing/Parallax";
import { ZoomSection } from "@/components/landing/ZoomSection";
import { Scrollytelling, type ScrollyStep } from "@/components/landing/Scrollytelling";

const FEATURES = [
  {
    emoji: "🔒",
    title: "Private Groups",
    desc: "Create invite-only circles for your closest friends, classmates, or teammates. No public feed, no strangers to perform for.",
  },
  {
    emoji: "🎯",
    title: "Goal Tracking",
    desc: "Set goals that actually matter to you, track progress as you go, and build a streak you don't want to break.",
  },
  {
    emoji: "📣",
    title: "Activity Feed",
    desc: "Share updates, wins, and milestones with your group in a feed built to cheer you on, not to keep you scrolling.",
  },
  {
    emoji: "🪞",
    title: "Weekly Reflections",
    desc: "Take five minutes each week to look back honestly, then figure out what's next.",
  },
  {
    emoji: "🙋",
    title: "Help Requests",
    desc: "Stuck on something? Post a help request and let your people step in to support you.",
  },
  {
    emoji: "✉️",
    title: "Easy Invites",
    desc: "Share a simple invite code and your friends are in. No complicated setup, no forms to fill out.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Create your circle",
    desc: "Spin up a private group in a few seconds and drop in an invite code for the people you trust.",
  },
  {
    number: "2",
    title: "Set goals together",
    desc: "Add your goals, post updates as you go, and let your group see the actual work, not just the highlight reel.",
  },
  {
    number: "3",
    title: "Grow, consistently",
    desc: "Build a streak, celebrate the wins, and lean on your people the moment things get hard.",
  },
];

const SCROLLY_STEPS: ScrollyStep[] = [
  {
    eyebrow: "Step one",
    title: "Start with your circle",
    description:
      "Make a private group for the four, five, or ten people who already push you to be better. No invite link floating around the internet. Just the people you picked.",
    image: "/images/friends-laughing.png",
    alt: "A small group of friends laughing together outside",
  },
  {
    eyebrow: "Step two",
    title: "Show your work",
    description:
      "Post an update when you finish something, hit a wall, or just want someone to know you showed up today. Attach a photo if it helps tell the story.",
    image: "/images/solo-focus.png",
    alt: "A person smiling while working on a laptop",
  },
  {
    eyebrow: "Step three",
    title: "Work side by side",
    description:
      "Jump into a focus session together and put in the hours at the same time, even if you're states apart.",
    image: "/images/study-group.png",
    alt: "Students studying together in a classroom",
  },
  {
    eyebrow: "Step four",
    title: "Look back, then look forward",
    description:
      "Every week, take a few minutes to reflect on what actually happened, then tell your group what's next.",
    image: "/images/team-collab.png",
    alt: "A team reviewing work together around a laptop",
  },
];

const AUDIENCES = [
  {
    title: "For students",
    image: "/images/study-group.png",
    alt: "Students studying together",
    desc: "Cramming for the same exam or grinding through the same major? Keep each other honest between study sessions.",
  },
  {
    title: "For small teams",
    image: "/images/team-collab.png",
    alt: "A small team collaborating in an office",
    desc: "Side projects go quiet fast when no one's watching. Post updates so your co-founders know you're still building.",
  },
  {
    title: "For close friends",
    image: "/images/conversation-illustration.png",
    alt: "Illustration of friends talking",
    desc: "Not everything needs a group chat that scrolls into oblivion. Track the goals you actually talked about at dinner.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-app-glow">
      <Navbar />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <Parallax speed={0.18} className="absolute inset-0 -z-10">
          <div className="relative h-full w-full">
            <Image
              src="/images/office-space.png"
              alt="A bright, modern open-plan office"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </Parallax>
        <div className="gradient-deep absolute inset-0 -z-10 opacity-90" />

        <div className="mx-auto max-w-4xl px-4 pb-28 pt-24 text-center sm:px-6 sm:pt-32 lg:px-8">
          <span className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-purple-100 backdrop-blur-sm">
            Built for close-knit circles, not crowds
          </span>
          <h1 className="animate-fade-in-up font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Grow together
            <br />
            <span className="italic text-purple-200">with your people</span>
          </h1>
          <p className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-lg text-purple-100/90 sm:text-xl">
            A private space for the handful of people who actually keep you accountable.
            Post your wins, ask for help when you need it, and show up for each other
            without an audience watching.
          </p>
          <div className="animate-fade-in-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="w-full rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-purple-800 shadow-lg transition-transform hover:scale-105 sm:w-auto"
            >
              New here?
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              Log in
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60">
          <svg width="22" height="34" viewBox="0 0 22 34" fill="none" className="animate-bounce">
            <rect x="1" y="1" width="20" height="32" rx="10" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="11" cy="10" r="2.5" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* Mission line */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="font-display text-2xl italic leading-relaxed text-gray-800 dark:text-gray-100 sm:text-3xl">
            &ldquo;Most apps want your attention. Buddi just wants you to keep your word
            to the few people who&apos;ll actually notice if you don&apos;t.&rdquo;
          </p>
        </Reveal>
      </section>

      {/* Scrollytelling: how it feels day to day */}
      <section className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto mb-4 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold text-gray-900 dark:text-gray-50 sm:text-4xl">
              What it actually feels like
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Scroll through a normal week with your group.
            </p>
          </Reveal>
          <Scrollytelling steps={SCROLLY_STEPS} />
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold text-gray-900 dark:text-gray-50 sm:text-4xl">
              Everything you need to keep each other on track
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              No followers, no algorithm. Just tools for real accountability with people you trust.
            </p>
          </Reveal>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <Card className="h-full p-8">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-3xl dark:bg-purple-500/10">
                    {f.emoji}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">{f.title}</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">{f.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Product showcase, on a deep purple field */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="gradient-deep relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] px-6 py-16 sm:px-12 lg:py-24">
          <div className="blob -left-20 -top-20 h-72 w-72 bg-purple-400/30" />
          <div className="blob -bottom-24 -right-16 h-80 w-80 bg-fuchsia-400/20" />
          <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-wider text-purple-300">
                See it in action
              </span>
              <h2 className="font-display mt-3 text-3xl font-semibold text-white sm:text-4xl">
                What it actually looks like
              </h2>
              <p className="mt-4 max-w-md text-purple-100/90">
                No mockups here. This is a real post, in a real group, from someone
                actually doing the work, with the reactions and comments to prove it.
              </p>
            </Reveal>
            <Reveal variant="scale" delay={100}>
              <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <Image
                  src="/images/app-screenshot.png"
                  alt="A screenshot of the buddi app showing a group post"
                  width={1200}
                  height={900}
                  className="w-full"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold text-gray-900 dark:text-gray-50 sm:text-4xl">
              Made for people who already show up for each other
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {AUDIENCES.map((a, i) => (
              <Reveal key={a.title} delay={i * 80}>
                <Card className="h-full overflow-hidden p-0">
                  <div className="relative aspect-[4/3] w-full">
                    <Image src={a.image} alt={a.alt} fill sizes="33vw" className="object-cover" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">{a.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{a.desc}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <Parallax speed={0.1} className="absolute inset-0 -z-10">
          <div className="relative h-full w-full">
            <Image
              src="/images/team-collab.png"
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </Parallax>
        <div className="absolute inset-0 -z-10 bg-white/80 dark:bg-[var(--background)]/85" />

        <div className="mx-auto max-w-5xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold text-gray-900 dark:text-gray-50 sm:text-4xl">
              How buddi works
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Three simple steps to a more consistent, more supported you.
            </p>
          </Reveal>
          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.number} delay={i * 80} className="text-center">
                <div className="gradient-deep mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-lg shadow-purple-900/30">
                  {s.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">{s.title}</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA with subtle zoom */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <ZoomSection className="mx-auto max-w-5xl">
          <div className="px-8 py-16 text-center sm:px-16">
            <Reveal>
              <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                Ready to grow with your people?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-purple-100/90">
                It takes about a minute to set up your first private group. Your people
                are probably already waiting.
              </p>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-block rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-purple-800 shadow-lg transition-transform hover:scale-105"
                >
                  Let&apos;s grow together
                </Link>
              </div>
            </Reveal>
          </div>
        </ZoomSection>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-purple-100 px-4 py-10 dark:border-purple-900/30 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="gradient-text text-xl font-extrabold">buddi</span>
          <p className="text-sm text-gray-400 dark:text-gray-500">Grow together with your people.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} Buddi
          </p>
        </div>
      </footer>
    </div>
  );
}
