"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-muted text-sm font-mono">Loading…</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row">
      <header className="md:hidden flex items-center justify-between border-b border-border bg-surface px-4 py-3 sticky top-0 z-30">
        <span className="font-mono text-xs tracking-[0.2em] text-copper uppercase">CampusAI</span>
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="text-muted hover:text-text transition-colors"
        >
          <Menu size={20} />
        </button>
      </header>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 p-4 sm:p-6 md:p-8 min-w-0">{children}</main>
    </div>
  );
}
