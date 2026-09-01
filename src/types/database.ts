export type PostType =
  | "update"
  | "achievement"
  | "help_request"
  | "reflection"
  | "milestone";

export type HelpStatus = "open" | "offered" | "resolved";
export type GoalStatus = "active" | "completed" | "abandoned";
export type Priority = "high" | "medium" | "low";
export type MemberRole = "owner" | "admin" | "member";
export type NotificationType =
  | "new_post"
  | "reaction"
  | "comment"
  | "help_accepted"
  | "new_member";

export interface Profile {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  invite_code: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  group_id: string;
  type: PostType;
  content: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  help_status: HelpStatus | null;
  created_at: string;
}

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  group_id: string | null;
  title: string;
  description: string | null;
  status: GoalStatus;
  priority: Priority;
  progress: number;
  deadline: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  updated_at: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  group_id: string | null;
  week: string;
  wins: string | null;
  struggles: string | null;
  next_goals: string | null;
  help_needed: string | null;
  created_at: string;
}

export interface FocusSession {
  id: string;
  creator_id: string;
  group_id: string | null;
  title: string;
  duration_minutes: number;
  status: "active" | "completed";
  started_at: string;
  ended_at: string | null;
}

export interface FocusParticipant {
  id: string;
  session_id: string;
  user_id: string;
  goal: string | null;
  joined_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}
