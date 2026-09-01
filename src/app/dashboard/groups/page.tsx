"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, Avatar, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Group, MemberRole } from "@/types/database";

type GroupWithRole = Group & { role: MemberRole };

const ROLE_LABEL: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export default function GroupsListPage() {
  const { user } = useUser();
  const [groups, setGroups] = useState<GroupWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    supabase
      .from("group_members")
      .select("role, groups(*)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const rows = (data ?? [])
          .map((m) => {
            const group = m.groups as unknown as Group;
            return group ? { ...group, role: m.role as MemberRole } : null;
          })
          .filter(Boolean) as GroupWithRole[];
        setGroups(rows);
        setLoading(false);
      });
  }, [user]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">Your Groups</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">The private circles you&apos;re growing with.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/join">
            <Button variant="outline">Join Group</Button>
          </Link>
          <Link href="/dashboard/groups/create">
            <Button>+ New Group</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 dark:text-gray-500">Loading…</p>
      ) : groups.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-5xl">👥</span>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">No groups yet</p>
          <p className="max-w-sm text-gray-500 dark:text-gray-400">
            Create your first private group or join one with an invite code to
            start growing together.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/dashboard/join">
              <Button variant="outline">Join Group</Button>
            </Link>
            <Link href="/dashboard/groups/create">
              <Button>+ New Group</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link key={g.id} href={`/dashboard/groups/${g.id}`}>
              <Card className="flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <Avatar name={g.name} size={48} />
                  <Badge variant={g.role === "owner" ? "default" : "outline"}>
                    {ROLE_LABEL[g.role]}
                  </Badge>
                </div>
                <p className="mt-4 text-lg font-bold text-gray-900 dark:text-gray-50">{g.name}</p>
                <p className="mt-1 flex-1 text-sm text-gray-500 dark:text-gray-400">
                  {g.description || "No description yet."}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-purple-50 dark:border-purple-900/30 pt-4">
                  <span className="text-xs text-gray-400 dark:text-gray-500">Invite code</span>
                  <span className="rounded-md bg-purple-50 dark:bg-purple-500/10 px-2 py-1 font-mono text-xs font-semibold text-purple-700 dark:text-purple-300">
                    {g.invite_code}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
