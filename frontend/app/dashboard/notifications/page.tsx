"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, NotificationEntry, NotificationKind } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

const KIND_STYLE: Record<NotificationKind, string> = {
  announcement: "text-signal border-signal/40",
  attendance_risk: "text-danger border-danger/40",
  grade_posted: "text-copper border-copper/40",
  general: "text-muted border-border",
};

const KIND_LABEL: Record<NotificationKind, string> = {
  announcement: "Announcement",
  attendance_risk: "Attendance",
  grade_posted: "Grade",
  general: "General",
};

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);

  useEffect(() => {
    if (!token) return;
    refresh();
  }, [token]);

  function refresh() {
    if (!token) return;
    api.notifications(token).then(setNotifications);
  }

  async function handleMarkRead(id: string) {
    if (!token) return;
    await api.markNotificationRead(token, id);
    refresh();
  }

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Notifications</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">Your notifications</h1>

      <TraceDivider className="my-6" />

      <div className="space-y-2 max-w-2xl">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`bg-surface border rounded-lg p-4 ${n.is_read ? "border-border opacity-60" : "border-border"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] uppercase tracking-wide border rounded px-1.5 py-0.5 ${KIND_STYLE[n.kind]}`}
                  >
                    {KIND_LABEL[n.kind]}
                  </span>
                  {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-signal" />}
                </div>
                <p className="text-text text-sm font-medium mt-1.5">{n.title}</p>
                <p className="text-muted text-sm mt-1">{n.body}</p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="text-xs text-muted hover:text-text transition-colors shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
            <p className="font-mono text-xs text-muted mt-2">
              {new Date(n.created_at).toLocaleString()}
            </p>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-muted text-sm">Nothing here yet.</p>
        )}
      </div>
    </div>
  );
}
