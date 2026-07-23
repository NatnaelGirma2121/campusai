"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, Department, UserRole } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [departmentId, setDepartmentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Public endpoint — available even before the user has an account, so
  // they can pick their department during registration.
  useEffect(() => {
    api.departments().then(setDepartments).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.register({
        full_name: fullName,
        email,
        password,
        role,
        department_id: departmentId || null,
      });
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg circuit-grid flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">CampusAI</p>
          <h1 className="font-display text-3xl font-medium text-text mt-2">Create your account</h1>
          <p className="text-muted text-sm mt-2">Every department, one assistant.</p>
        </div>

        <TraceDivider className="mb-8" />

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-lg p-6 space-y-4"
        >
          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded px-3 py-2">
              {error}
            </div>
          )}

          <TextField label="Full name" value={fullName} onChange={setFullName} required />
          <TextField
            label="University email"
            type="email"
            value={email}
            onChange={setEmail}
            required
            placeholder="you@hu.edu.et"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
          />

          <div>
            <label className="block text-xs text-muted mb-1.5">I am a</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {departments.length > 0 && (
            <div>
              <label className="block text-xs text-muted mb-1.5">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
              >
                <option value="">Not set (assign later)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-copper hover:bg-copperDim disabled:opacity-50 transition-colors text-bg font-medium text-sm rounded px-3 py-2.5"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-xs text-muted">
            Already have an account?{" "}
            <a href="/login" className="text-signal hover:underline">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal"
      />
    </div>
  );
}
