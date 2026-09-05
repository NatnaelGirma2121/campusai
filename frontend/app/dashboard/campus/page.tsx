"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, CampusLocationEntry, Department, LocationCategory } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

const CATEGORIES: LocationCategory[] = [
  "academic",
  "lab",
  "library",
  "cafeteria",
  "dormitory",
  "administration",
  "parking",
  "other",
];

export default function CampusPage() {
  const { token, user } = useAuth();
  const [locations, setLocations] = useState<CampusLocationEntry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<LocationCategory | "">("");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!token) return;
    api.departments(token).then(setDepartments);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, query, category]);

  function refresh() {
    if (!token) return;
    api.campusLocations(token, { q: query || undefined, category: category || undefined }).then(setLocations);
  }

  async function handleDelete(id: string) {
    if (!token) return;
    await api.deleteCampusLocation(token, id);
    refresh();
  }

  const deptName = (id: string | null) => (id ? departments.find((d) => d.id === id)?.name : null);

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Campus</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">Find a building or facility</h1>
      <p className="text-muted text-sm mt-1">
        A searchable directory — not a live map, but each entry can hold coordinates for whenever
        an interactive map is wired up.
      </p>

      <div className="flex flex-wrap items-center gap-3 mt-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="bg-surfaceRaised border border-border rounded px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as LocationCategory | "")}
          className="bg-surfaceRaised border border-border rounded px-3 py-1.5 text-sm text-text capitalize focus:outline-none focus:ring-2 focus:ring-signal/50"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <TraceDivider className="my-6" />

      {isAdmin && (
        <AddLocationForm departments={departments} onCreated={refresh} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
        {locations.map((loc) => (
          <div key={loc.id} className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text text-sm font-medium">{loc.name}</p>
                <p className="text-xs text-copper capitalize mt-0.5">{loc.category}</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(loc.id)}
                  className="text-xs text-muted hover:text-danger transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
            {loc.description && <p className="text-muted text-sm mt-2">{loc.description}</p>}
            {deptName(loc.department_id) && (
              <p className="text-xs text-muted mt-2 font-mono">{deptName(loc.department_id)}</p>
            )}
          </div>
        ))}
        {locations.length === 0 && (
          <p className="text-muted text-sm col-span-2">No locations match this search.</p>
        )}
      </div>
    </div>
  );
}

function AddLocationForm({
  departments,
  onCreated,
}: {
  departments: Department[];
  onCreated: () => void;
}) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<LocationCategory>("other");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await api.createCampusLocation(token, {
        name,
        category,
        description: description || undefined,
        department_id: departmentId || undefined,
      });
      setMessage({ text: `Added "${name}".` });
      setName("");
      setDescription("");
      onCreated();
    } catch (err) {
      setMessage({
        text: err instanceof ApiError ? err.message : "Couldn't add location.",
        error: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-border rounded-lg p-4 space-y-3 max-w-2xl"
    >
      <h2 className="font-display text-lg text-text">Add a location</h2>
      {message && (
        <p className={`text-xs ${message.error ? "text-danger" : "text-success"}`}>{message.text}</p>
      )}
      <div className="flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Building name"
          className="flex-1 bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as LocationCategory)}
          className="bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text capitalize focus:outline-none focus:ring-2 focus:ring-signal/50"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
      />
      <select
        value={departmentId}
        onChange={(e) => setDepartmentId(e.target.value)}
        className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
      >
        <option value="">Not department-specific</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={submitting}
        className="bg-copper hover:bg-copperDim disabled:opacity-50 transition-colors text-ink font-medium text-sm rounded px-4 py-2"
      >
        {submitting ? "Adding…" : "Add location"}
      </button>
    </form>
  );
}
