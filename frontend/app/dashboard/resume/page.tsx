"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

export default function ResumePage() {
  const { token } = useAuth();
  const [background, setBackground] = useState("");
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!token || !background.trim()) return;
    setGenerating(true);
    setError(null);
    setResumeText(null);
    try {
      const { resume_text } = await api.generateResume(token, background);
      setResumeText(resume_text);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't generate a resume draft.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Resume</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">Resume builder</h1>
      <p className="text-muted text-sm mt-1">
        Describe your education, experience, skills, and projects in your own words — CampusAI
        organizes it into a resume draft without inventing anything you didn't mention.
      </p>

      <TraceDivider className="my-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
        <div>
          <textarea
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            rows={14}
            placeholder="e.g. I'm a 3rd-year Electrical and Computer Engineering student at Hawassa University. I know Python and C. I built a VLSI circuit design project for my digital logic class. I interned at a local electronics repair shop over the summer, troubleshooting circuit boards…"
            className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50 font-mono"
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !background.trim()}
            className="mt-3 bg-copper hover:bg-copperDim disabled:opacity-50 transition-colors text-ink font-medium text-sm rounded px-4 py-2"
          >
            {generating ? "Generating…" : "Generate resume draft"}
          </button>
          {error && <p className="text-sm text-danger mt-2">{error}</p>}
        </div>

        <div className="bg-surface border border-border rounded-lg p-4">
          {resumeText ? (
            <pre className="text-sm text-text whitespace-pre-wrap font-mono">{resumeText}</pre>
          ) : (
            <p className="text-muted text-sm">Your draft will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
