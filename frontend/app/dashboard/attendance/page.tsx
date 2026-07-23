"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Attendance, Course, Enrollment, AttendanceSummaryEntry } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

const STATUS_COLOR: Record<Attendance["status"], string> = {
  present: "text-success",
  late: "text-copper",
  excused: "text-signal",
  absent: "text-danger",
};

export default function AttendancePage() {
  const { token } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [records, setRecords] = useState<Record<string, Attendance[]>>({});
  const [summary, setSummary] = useState<AttendanceSummaryEntry[]>([]);

  useEffect(() => {
    if (!token) return;
    api.myEnrollments(token).then(async (enrolls) => {
      setEnrollments(enrolls);
      const allCourses = await api.courses(token);
      setCourses(Object.fromEntries(allCourses.map((c) => [c.id, c])));

      const entries = await Promise.all(
        enrolls.map(async (e) => [e.id, await api.attendanceForEnrollment(token, e.id)] as const)
      );
      setRecords(Object.fromEntries(entries));
    });
    api.myAttendanceSummary(token).then(setSummary);
  }, [token]);

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Attendance</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">Your attendance record</h1>

      <TraceDivider className="my-6" />

      <div className="space-y-6">
        {enrollments.map((e) => {
          const course = courses[e.course_id];
          const attendance = records[e.id] ?? [];
          const presentCount = attendance.filter((a) => a.status === "present").length;
          const courseSummary = summary.find((s) => s.enrollment_id === e.id);

          return (
            <div key={e.id} className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg text-text">
                  {course ? `${course.code} — ${course.title}` : "Loading…"}
                </h2>
                <div className="flex items-center gap-2">
                  {courseSummary?.is_at_risk && (
                    <span className="text-xs text-danger border border-danger/40 bg-danger/10 rounded px-2 py-0.5">
                      At risk — {courseSummary.percentage}%
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted">
                    {attendance.length > 0
                      ? `${presentCount}/${attendance.length} present`
                      : "No records"}
                  </span>
                </div>
              </div>

              {attendance.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {attendance.map((a) => (
                    <span
                      key={a.id}
                      title={a.note ?? undefined}
                      className={`font-mono text-xs border border-border rounded px-2 py-1 ${STATUS_COLOR[a.status]}`}
                    >
                      {a.date}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {enrollments.length === 0 && (
          <p className="text-muted text-sm">You're not enrolled in any courses yet.</p>
        )}
      </div>
    </div>
  );
}
