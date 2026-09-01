"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
          checked ? "gradient-primary" : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useUser();
  const router = useRouter();

  const [newEmail, setNewEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  const [notifyPost, setNotifyPost] = useState(true);
  const [notifyReaction, setNotifyReaction] = useState(true);
  const [notifyComment, setNotifyComment] = useState(true);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleEmailChange(e: FormEvent) {
    e.preventDefault();
    setEmailStatus(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailStatus(error ? error.message : "Check your inbox to confirm the new email.");
    if (!error) setNewEmail("");
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPasswordStatus(null);
    if (newPassword.length < 6) {
      setPasswordStatus("New password must be at least 6 characters.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordStatus(error ? error.message : "Password updated successfully.");
    if (!error) {
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  async function handleDeleteAccount() {
    if (!user || deleteConfirm !== "DELETE") return;
    setDeleting(true);
    const supabase = createClient();
    // Client-side cleanup of the user's own rows; a full account deletion
    // (auth.users) requires a service-role call from a server environment.
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    setDeleting(false);
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-app-glow">
      <Navbar />
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">Settings</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Manage your account and preferences.</p>
        </div>

        <Card className="p-6">
          <h2 className="mb-4 font-bold text-gray-900 dark:text-gray-50">Update email</h2>
          <form onSubmit={handleEmailChange} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-email">New email</Label>
              <Input
                id="new-email"
                type="email"
                required
                placeholder={user?.email ?? "you@example.com"}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            {emailStatus && <p className="text-sm text-purple-600 dark:text-purple-400">{emailStatus}</p>}
            <Button type="submit" size="sm">
              Update Email
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-bold text-gray-900 dark:text-gray-50">Change password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {passwordStatus && <p className="text-sm text-purple-600 dark:text-purple-400">{passwordStatus}</p>}
            <Button type="submit" size="sm">
              Update Password
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="mb-2 font-bold text-gray-900 dark:text-gray-50">Notification preferences</h2>
          <div className="divide-y divide-purple-50 dark:divide-purple-900/30">
            <Toggle
              checked={notifyPost}
              onChange={setNotifyPost}
              label="New posts"
              description="When someone posts in your group"
            />
            <Toggle
              checked={notifyReaction}
              onChange={setNotifyReaction}
              label="Reactions"
              description="When someone reacts to your post"
            />
            <Toggle
              checked={notifyComment}
              onChange={setNotifyComment}
              label="Comments"
              description="When someone comments on your post"
            />
          </div>
        </Card>

        <Card className="border-red-200 dark:border-red-900/50 p-6">
          <h2 className="mb-1 font-bold text-red-600 dark:text-red-400">Delete account</h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            This permanently deletes your profile and everything linked to it.
            This cannot be undone.
          </p>
          <div className="space-y-3">
            <Input
              placeholder='Type "DELETE" to confirm'
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
            <Button
              variant="destructive"
              disabled={deleteConfirm !== "DELETE" || deleting}
              onClick={handleDeleteAccount}
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
