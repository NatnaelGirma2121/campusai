"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

export default function PlannerPage() {
  const { token } = useAuth();
  const [goals, setGoals] = useState("");
  const [planText, setPlanText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!token || !goals.trim()) return;
    setGenerating(true);
    setError(null);
    setPlanText(null);
    try {
      const { plan_text } = await api.generateStudyPlan(token, goals);
      setPlanText(plan_text);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't generate a study plan.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Planner</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">Study planner</h1>
      <p className="text-muted text-sm mt-1">
        List your upcoming exams, assignments, and deadlines, plus when you're actually free —
        CampusAI builds a realistic day-by-day schedule around it.
      </p>

      <TraceDivider className="my-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
        <div>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={12}
            placeholder="e.g. VLSI midterm next Friday, covers chapters 1-4. Circuits assignment due Wednesday. I'm free most evenings after 6pm and all day Saturday. I find chapter 3 (transistor sizing) the hardest…"
            className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50 font-mono"
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !goals.trim()}
            className="mt-3 bg-copper hover:bg-copperDim disabled:opacity-50 transition-colors text-bg font-medium text-sm rounded px-4 py-2"
          >
            {generating ? "Building plan…" : "Generate study plan"}
          </button>
          {error && <p className="text-sm text-danger mt-2">{error}</p>}
        </div>

        <div className="bg-surface border border-border rounded-lg p-4">
          {planText ? (
            <pre className="text-sm text-text whitespace-pre-wrap font-mono">{planText}</pre>
          ) : (
            <p className="text-muted text-sm">Your plan will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
