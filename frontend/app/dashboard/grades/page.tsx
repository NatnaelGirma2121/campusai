"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Course, Enrollment, Grade, GpaSummary } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

export default function GradesPage() {
  const { token } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [grades, setGrades] = useState<Record<string, Grade[]>>({});
  const [gpa, setGpa] = useState<GpaSummary | null>(null);

  useEffect(() => {
    if (!token) return;
    api.myEnrollments(token).then(async (enrolls) => {
      setEnrollments(enrolls);
      const allCourses = await api.courses(token);
      setCourses(Object.fromEntries(allCourses.map((c) => [c.id, c])));

      const gradeEntries = await Promise.all(
        enrolls.map(async (e) => [e.id, await api.gradesForEnrollment(token, e.id)] as const)
      );
      setGrades(Object.fromEntries(gradeEntries));
    });
    api.myGpaSummary(token).then(setGpa);
  }, [token]);

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Grades</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">Your grades by course</h1>

      {gpa && (
        <div className="flex gap-4 mt-4">
          <div className="bg-surface border border-border rounded-lg px-4 py-3">
            <p className="text-xs text-muted uppercase tracking-wide">Overall GPA</p>
            <p className="font-mono text-2xl text-copper mt-1">
              {gpa.overall_gpa !== null ? gpa.overall_gpa.toFixed(2) : "—"}
              <span className="text-sm text-muted"> / 4.0</span>
            </p>
          </div>
        </div>
      )}

      <TraceDivider className="my-6" />

      <div className="space-y-6">
        {enrollments.map((e) => {
          const course = courses[e.course_id];
          const courseGrades = grades[e.id] ?? [];
          const summary = gpa?.courses.find((c) => c.enrollment_id === e.id);
          return (
            <div key={e.id} className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg text-text">
                  {course ? `${course.code} — ${course.title}` : "Loading…"}
                </h2>
                <div className="flex items-center gap-3">
                  {summary?.average_percentage !== null && summary?.average_percentage !== undefined && (
                    <span className="font-mono text-xs text-copper">
                      {summary.average_percentage.toFixed(1)}%
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted">{e.semester}</span>
                </div>
              </div>

              {courseGrades.length === 0 ? (
                <p className="text-muted text-sm mt-3">No grades recorded yet.</p>
              ) : (
                <table className="w-full text-sm mt-3">
                  <thead>
                    <tr className="text-muted text-xs uppercase tracking-wide text-left">
                      <th className="py-1.5 font-medium">Component</th>
                      <th className="py-1.5 font-medium">Label</th>
                      <th className="py-1.5 font-medium text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseGrades.map((g) => (
                      <tr key={g.id} className="border-t border-border">
                        <td className="py-1.5 text-muted capitalize">{g.component}</td>
                        <td className="py-1.5 text-text">{g.label}</td>
                        <td className="py-1.5 text-right font-mono text-copper">
                          {g.score}/{g.max_score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
