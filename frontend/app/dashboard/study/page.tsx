"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, CampusDocument, StudyMode, StudyToolResponse } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

const MODES: { value: StudyMode; label: string }[] = [
  { value: "summary", label: "Summary" },
  { value: "flashcards", label: "Flashcards" },
  { value: "quiz", label: "Quiz" },
  { value: "key_concepts", label: "Key concepts" },
];

export default function StudyToolsPage() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<CampusDocument[]>([]);
  const [documentId, setDocumentId] = useState("");
  const [mode, setMode] = useState<StudyMode>("summary");
  const [result, setResult] = useState<StudyToolResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.documents(token).then(setDocuments);
  }, [token]);

  async function handleGenerate() {
    if (!token || !documentId) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const response = await api.generateStudyTool(token, documentId, mode);
      setResult(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't generate study material.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Study tools</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">
        Turn a document into study material
      </h1>
      <p className="text-muted text-sm mt-1">
        Pick something an instructor uploaded, then generate a summary, flashcards, a practice
        quiz, or key concepts from it.
      </p>

      <div className="flex flex-wrap items-end gap-3 mt-6">
        <div>
          <label className="block text-xs text-muted mb-1.5">Document</label>
          <select
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            className="bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50 w-full sm:w-auto sm:min-w-[16rem]"
          >
            <option value="">Select a document…</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`text-xs rounded px-3 py-2 border transition-colors ${
                mode === m.value
                  ? "bg-copper text-bg border-copper font-medium"
                  : "border-border text-muted hover:text-text hover:bg-surfaceRaised"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={!documentId || generating}
          className="bg-signal hover:opacity-90 disabled:opacity-40 transition-opacity text-bg font-medium text-sm rounded px-4 py-2"
        >
          {generating ? "Generating…" : "Generate"}
        </button>
      </div>

      <TraceDivider className="my-6" />

      {documents.length === 0 && (
        <p className="text-muted text-sm">
          No documents available yet — ask an instructor or admin to upload one from the
          Documents page.
        </p>
      )}

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded px-3 py-2 max-w-2xl">
          {error}
        </div>
      )}

      {result && <StudyResult result={result} />}
    </div>
  );
}

function StudyResult({ result }: { result: StudyToolResponse }) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs text-muted mb-4">
        From <span className="text-copper">{result.document_title}</span>
      </p>

      {result.mode === "summary" && result.summary && (
        <div className="bg-surface border border-border rounded-lg p-4 text-sm text-text leading-relaxed">
          {result.summary}
        </div>
      )}

      {result.mode === "flashcards" && result.flashcards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.flashcards.map((card, i) => (
            <Flashcard key={i} front={card.front} back={card.back} />
          ))}
        </div>
      )}

      {result.mode === "quiz" && result.quiz && (
        <div className="space-y-4">
          {result.quiz.map((q, i) => (
            <QuizQuestionCard key={i} index={i} question={q} />
          ))}
        </div>
      )}

      {result.mode === "key_concepts" && result.key_concepts && (
        <div className="space-y-2">
          {result.key_concepts.map((c, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-3">
              <p className="text-text text-sm font-medium">{c.term}</p>
              <p className="text-muted text-sm mt-1">{c.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Flashcard({ front, back }: { front: string; back: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      className="bg-surface border border-border rounded-lg p-4 text-left h-28 flex items-center hover:border-signal/50 transition-colors"
    >
      <p className="text-sm text-text">{flipped ? back : front}</p>
    </button>
  );
}

function QuizQuestionCard({
  index,
  question,
}: {
  index: number;
  question: { question: string; choices: string[]; correct_index: number };
}) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-text text-sm font-medium">
        {index + 1}. {question.question}
      </p>
      <div className="mt-3 space-y-1.5">
        {question.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isCorrect = i === question.correct_index;
          const showState = selected !== null;
          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              disabled={selected !== null}
              className={`w-full text-left text-sm rounded px-3 py-2 border transition-colors ${
                showState && isCorrect
                  ? "border-success bg-success/10 text-success"
                  : showState && isSelected && !isCorrect
                    ? "border-danger bg-danger/10 text-danger"
                    : "border-border text-muted hover:bg-surfaceRaised"
              }`}
            >
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}
