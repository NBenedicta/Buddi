import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const HIGHLIGHTS = [
  { emoji: "🔒", title: "Private by design", desc: "Only people you invite can ever see your group." },
  { emoji: "🎯", title: "Real accountability", desc: "Track goals and streaks with people who actually care." },
  { emoji: "📣", title: "A feed that supports you", desc: "Share wins, ask for help, and cheer each other on." },
  { emoji: "🪞", title: "Weekly reflections", desc: "Build the habit of looking back and planning forward." },
];

export function AuthSplit({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="gradient-primary relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="blob -left-24 -top-24 h-72 w-72 bg-white/15" />
        <div className="blob -bottom-24 -right-16 h-80 w-80 bg-white/15" />

        <Link href="/" className="relative z-10 text-3xl font-extrabold tracking-tight">
          buddi
        </Link>

        <div className="relative z-10">
          <h2 className="font-display text-4xl font-semibold italic leading-tight">
            Grow together with your people.
          </h2>
          <div className="mt-10 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <div
                key={h.title}
                className="flex items-start gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm"
              >
                <span className="text-2xl">{h.emoji}</span>
                <div>
                  <p className="font-semibold">{h.title}</p>
                  <p className="text-sm text-purple-100">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-sm text-purple-100">
          © {new Date().getFullYear()} Buddi
        </p>
      </div>

      {/* Right panel */}
      <div className="relative flex w-full flex-col justify-center bg-white px-6 py-16 sm:px-12 dark:bg-[var(--background)] lg:w-1/2 lg:px-20">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-block text-2xl font-extrabold lg:hidden">
            <span className="gradient-text">buddi</span>
          </Link>
          <h1 className="font-display text-3xl font-semibold text-gray-900 dark:text-gray-50">{title}</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
