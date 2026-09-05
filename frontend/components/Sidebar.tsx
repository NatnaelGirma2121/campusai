"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", roles: ["student", "teacher", "admin"] },
  { href: "/dashboard/notifications", label: "Notifications", roles: ["student", "teacher", "admin"] },
  { href: "/dashboard/announcements", label: "Announcements", roles: ["student", "teacher", "admin"] },
  { href: "/dashboard/chat", label: "Ask CampusAI", roles: ["student", "teacher", "admin"] },
  { href: "/dashboard/tutor", label: "Course Tutor", roles: ["student"] },
  { href: "/dashboard/study", label: "Study Tools", roles: ["student", "teacher", "admin"] },
  { href: "/dashboard/planner", label: "Study Planner", roles: ["student"] },
  { href: "/dashboard/resume", label: "Resume Builder", roles: ["student"] },
  { href: "/dashboard/campus", label: "Campus Directory", roles: ["student", "teacher", "admin"] },
  { href: "/dashboard/courses", label: "Courses", roles: ["student", "teacher", "admin"] },
  { href: "/dashboard/roster", label: "Roster", roles: ["teacher", "admin"] },
  { href: "/dashboard/documents", label: "Documents", roles: ["teacher", "admin"] },
  { href: "/dashboard/grades", label: "Grades", roles: ["student"] },
  { href: "/dashboard/attendance", label: "Attendance", roles: ["student"] },
  { href: "/dashboard/admin", label: "Admin", roles: ["admin"] },
];

export function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const { user, token, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    api.notifications(token, true).then((n) => setUnreadCount(n.length));
  }, [token, pathname]);

  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-56 shrink-0 bg-surface border-r border-border min-h-screen flex flex-col p-5 transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">CampusAI</p>
            {user && (
              <p className="text-sm text-muted mt-1 truncate">
                {user.full_name} · <span className="capitalize">{user.role}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="md:hidden text-muted hover:text-text transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <TraceDivider className="my-5" />

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = pathname === item.href;
            const isNotifications = item.href === "/dashboard/notifications";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-surfaceRaised text-text border border-border"
                    : "text-muted hover:text-text hover:bg-surfaceRaised/60"
                }`}
              >
                <span>{item.label}</span>
                {isNotifications && unreadCount > 0 && (
                  <span className="bg-copper text-ink text-[10px] font-mono rounded-full px-1.5 py-0.5 leading-none">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="text-sm text-muted hover:text-danger transition-colors text-left px-3 py-2"
        >
          Sign out
        </button>
      </aside>
    </>
  );
}
