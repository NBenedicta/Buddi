"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Avatar } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Notification } from "@/types/database";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/groups", label: "Groups" },
  { href: "/dashboard/goals", label: "Goals" },
  { href: "/dashboard/reflect", label: "Reflect" },
  { href: "/dashboard/focus", label: "Focus" },
];

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("gradient-text text-2xl font-extrabold tracking-tight", className)}>
      buddi
    </span>
  );
}

export function Navbar() {
  const { user, profile } = useUser();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setNotifications(data ?? []));

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    const supabase = createClient();
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-purple-100 bg-[var(--nav)] backdrop-blur-md dark:border-purple-900/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href={user ? "/dashboard" : "/"}>
            <Logo />
          </Link>
          {user && (
            <nav className="hidden items-center gap-1 md:flex">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-purple-50 hover:text-purple-700 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-purple-300"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-1">
            <ThemeToggle />

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-purple-50 hover:text-purple-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-purple-300 cursor-pointer"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 animate-pop-in rounded-2xl border-2 border-purple-100 bg-white p-2 shadow-xl dark:border-purple-900/50 dark:bg-[#1a1428]">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs font-medium text-purple-600 hover:underline dark:text-purple-400 cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 scrollbar-thin overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-3 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                        You&apos;re all caught up 🎉
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.link ?? "#"}
                          onClick={() => setNotifOpen(false)}
                          className={cn(
                            "block rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-purple-50 dark:hover:bg-white/5",
                            !n.read && "bg-purple-50/60 dark:bg-purple-500/10"
                          )}
                        >
                          <p className="text-gray-800 dark:text-gray-200">{n.message}</p>
                          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                            {formatRelativeTime(n.created_at)}
                          </p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link href={`/profile/${profile?.username ?? ""}`} className="ml-1">
              <Avatar name={profile?.username} src={profile?.avatar_url} size={36} />
            </Link>

            <Button variant="ghost" size="sm" className="ml-1 hidden sm:inline-flex" onClick={handleLogout}>
              Log out
            </Button>

            <button
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-purple-50 dark:text-gray-400 dark:hover:bg-white/5 md:hidden cursor-pointer"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        )}
      </div>

      {user && mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-purple-100 px-4 py-3 dark:border-purple-900/40 md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-purple-50 hover:text-purple-700 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-purple-300"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard/join"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-purple-50 hover:text-purple-700 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-purple-300"
          >
            Join Group
          </Link>
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-purple-50 hover:text-purple-700 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-purple-300"
          >
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
          >
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}
