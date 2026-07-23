"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Department, Enrollment } from "@/lib/api";

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [department, setDepartment] = useState<Department | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    if (!token || !user) return;
    api.departments(token).then((depts) => {
      setDepartment(depts.find((d) => d.id === user.department_id) ?? null);
    });
    if (user.role === "student") {
      api.myEnrollments(token).then(setEnrollments);
    }
  }, [token, user]);

  if (!user) return null;

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Overview</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">
        Welcome back, {user.full_name.split(" ")[0]}
      </h1>
      <p className="text-muted text-sm mt-1">
        {department ? department.name : "No department assigned yet"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <StatCard label="Role" value={user.role} />
        <StatCard label="Department code" value={department?.code ?? "—"} />
        {user.role === "student" && (
          <StatCard label="Active enrollments" value={String(enrollments.length)} />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p className="font-mono text-lg text-text mt-1 capitalize">{value}</p>
    </div>
  );
}
