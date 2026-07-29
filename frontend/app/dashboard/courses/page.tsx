"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, Course, Department, Enrollment } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

const CURRENT_SEMESTER = "2026-S1";

export default function CoursesPage() {
  const { token, user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const isStudent = user?.role === "student";

  useEffect(() => {
    if (!token) return;
    api.departments(token).then(setDepartments);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api.courses(token, filter || undefined).then(setCourses);
  }, [token, filter]);

  useEffect(() => {
    if (!token || !isStudent) return;
    api.myEnrollments(token).then(setEnrollments);
  }, [token, isStudent]);

  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? "—";
  const enrolledCourseIds = new Set(
    enrollments.filter((e) => e.semester === CURRENT_SEMESTER).map((e) => e.course_id)
  );

  async function handleEnroll(courseId: string) {
    if (!token) return;
    setEnrollingId(courseId);
    setRowError((prev) => ({ ...prev, [courseId]: "" }));
    try {
      const enrollment = await api.enroll(token, courseId, CURRENT_SEMESTER);
      setEnrollments((prev) => [...prev, enrollment]);
    } catch (err) {
      setRowError((prev) => ({
        ...prev,
        [courseId]: err instanceof ApiError ? err.message : "Couldn't enroll. Try again.",
      }));
    } finally {
      setEnrollingId(null);
    }
  }

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Courses</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">
        Browse across every department
      </h1>
      {isStudent && (
        <p className="text-muted text-sm mt-1">
          Enrolling for <span className="font-mono text-copper">{CURRENT_SEMESTER}</span>
        </p>
      )}

      <div className="flex items-center gap-3 mt-6">
        <label className="text-sm text-muted" htmlFor="dept-filter">
          Department
        </label>
        <select
          id="dept-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-surfaceRaised border border-border rounded px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <TraceDivider className="my-6" />

      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-muted text-xs uppercase tracking-wide text-left">
              <th className="px-4 py-2.5 font-medium">Code</th>
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Department</th>
              <th className="px-4 py-2.5 font-medium">Credits</th>
              {isStudent && <th className="px-4 py-2.5 font-medium text-right">Enrollment</th>}
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => {
              const alreadyEnrolled = enrolledCourseIds.has(c.id);
              return (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-2.5 font-mono text-copper">{c.code}</td>
                  <td className="px-4 py-2.5 text-text">{c.title}</td>
                  <td className="px-4 py-2.5 text-muted">{deptName(c.department_id)}</td>
                  <td className="px-4 py-2.5 text-muted font-mono">{c.credit_hours}</td>
                  {isStudent && (
                    <td className="px-4 py-2.5 text-right">
                      {alreadyEnrolled ? (
                        <span className="text-xs font-mono text-success">Enrolled</span>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={() => handleEnroll(c.id)}
                            disabled={enrollingId === c.id}
                            className="text-xs bg-copper hover:bg-copperDim disabled:opacity-50 transition-colors text-bg font-medium rounded px-3 py-1.5"
                          >
                            {enrollingId === c.id ? "Enrolling…" : "Enroll"}
                          </button>
                          {rowError[c.id] && (
                            <span className="text-xs text-danger">{rowError[c.id]}</span>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {courses.length === 0 && (
              <tr>
                <td
                  colSpan={isStudent ? 5 : 4}
                  className="px-4 py-6 text-center text-muted"
                >
                  No courses found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
