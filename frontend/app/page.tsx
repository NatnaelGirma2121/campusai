"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  GraduationCap,
  BookOpen,
  Mic,
  ClipboardCheck,
  Megaphone,
  MapPin,
  FileText,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, Department } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";
import { HeroCircuit } from "@/components/HeroCircuit";

const PLATFORM_TABS = [
  {
    label: "Chat",
    title: "Ask anything, grounded in your documents",
    body: "CampusAI answers from the handbooks, syllabi, and policies your instructors actually uploaded — scoped to a department, a course, or everything. If it doesn't know, it says so.",
  },
  {
    label: "Tutor",
    title: "A tutor that remembers the conversation",
    body: "Pick a course you're enrolled in and work through it step by step. The tutor keeps context across follow-up questions instead of starting fresh each time.",
  },
  {
    label: "Study Tools",
    title: "Turn any document into study material",
    body: "Generate a summary, flashcards, a practice quiz, or a key-concepts list from anything an instructor has uploaded — in seconds, not an evening.",
  },
  {
    label: "Voice",
    title: "Ask out loud",
    body: "Record a question instead of typing it. CampusAI transcribes it and feeds it straight into chat — useful between classes, or when typing isn't convenient.",
  },
];

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Document-grounded chat",
    body: "Get answers sourced from real university documents, not guesses.",
  },
  {
    icon: GraduationCap,
    title: "Per-course AI tutor",
    body: "A patient, step-by-step tutor for every course you're enrolled in.",
  },
  {
    icon: BookOpen,
    title: "Instant study material",
    body: "Summaries, flashcards, quizzes, and key concepts from any upload.",
  },
  {
    icon: Mic,
    title: "Voice input",
    body: "Speak your question instead of typing it, anywhere in the app.",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance & grades",
    body: "Track both in one place, with automatic at-risk flagging.",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    body: "Department-aware, pinned when urgent, delivered as notifications.",
  },
  {
    icon: MapPin,
    title: "Campus directory",
    body: "Find any building or facility without wandering the campus.",
  },
  {
    icon: FileText,
    title: "Resume & study planner",
    body: "Turn your background or your deadlines into a working draft.",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [role, setRole] = useState("student");
  const [departmentId, setDepartmentId] = useState("");

  useEffect(() => {
    api.departments().then(setDepartments).catch(() => {});
  }, []);

  function handleQuickStart(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("role", role);
    if (departmentId) params.set("department", departmentId);
    router.push(`/register?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-bg">
      {/* Nav */}
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-copper text-sm">{"<NHATY />"}</span>
          <span className="font-display text-lg text-text">CampusAI</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted">
          <a href="#platform" className="hover:text-text transition-colors">
            Platform
          </a>
          <a href="#features" className="hover:text-text transition-colors">
            Features
          </a>
          <a href="#start" className="hover:text-text transition-colors">
            Get started
          </a>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="bg-copper hover:bg-copperDim transition-colors text-bg text-sm font-medium rounded px-4 py-2"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:block text-sm text-muted hover:text-text transition-colors px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="bg-copper hover:bg-copperDim transition-colors text-bg text-sm font-medium rounded px-4 py-2"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="circuit-grid relative">
        <div className="max-w-4xl mx-auto px-6 pt-16 pb-8 text-center">
          <p className="font-mono text-xs tracking-[0.25em] text-copper uppercase">
            University AI Platform
          </p>
          <h1 className="font-display text-5xl sm:text-6xl font-medium text-text mt-4 leading-[1.1]">
            Learn smarter,
            <br />
            grow further.
          </h1>
          <p className="text-muted text-base sm:text-lg mt-5 max-w-xl mx-auto">
            One assistant for every department — chat grounded in real course documents, a tutor
            that remembers the conversation, and study tools built from what your instructors
            actually uploaded.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              href={user ? "/dashboard" : "/register"}
              className="bg-copper hover:bg-copperDim transition-colors text-bg text-sm font-medium rounded px-6 py-3"
            >
              {user ? "Go to dashboard" : "Get started"}
            </Link>
            
              href="#platform"
              className="border border-border hover:bg-surfaceRaised transition-colors text-text text-sm font-medium rounded px-6 py-3"
            >
              See how it works
            </a>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 relative" style={{ aspectRatio: "1" }}>
          <HeroCircuit />
        </div>

        <div className="max-w-3xl mx-auto px-6 pb-10 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["S", "T", "A"].map((letter, i) => (
                <div
                  key={letter}
                  className="w-8 h-8 rounded-full bg-surfaceRaised border-2 border-bg flex items-center justify-center text-xs font-mono text-copper"
                  style={{ zIndex: 3 - i }}
                >
                  {letter}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted">
              Built for students, teachers, and admins — one platform, three roles.
            </p>
          </div>
          {departments.length > 0 && (
            <p className="font-mono text-xs text-muted">
              <span className="text-copper">{departments.length}</span>{" "}
              {departments.length === 1 ? "department" : "departments"} live right now
            </p>
          )}
        </div>

        <div className="flex justify-center pb-10">
          
            href="#platform"
            aria-label="Scroll to platform section"
            className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-muted hover:text-text hover:border-copper transition-colors"
          >
            <ChevronDown size={18} />
          </a>
        </div>
      </section>

      {/* Platform */}
      <section id="platform" className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="font-mono text-xs tracking-[0.25em] text-copper uppercase">Platform</p>
            <h2 className="font-display text-3xl sm:text-4xl text-text mt-3 leading-tight">
              Every tool your department needs,
              <br />
              all in one place.
            </h2>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PLATFORM_TABS.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`text-xs rounded-full px-4 py-2 border transition-colors ${
                  activeTab === i
                    ? "bg-copper text-bg border-copper font-medium"
                    : "border-border text-muted hover:text-text hover:bg-surfaceRaised"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <TraceDivider className="my-8" />

        <div className="bg-surface border border-border rounded-lg p-8">
          <h3 className="font-display text-xl text-text">{PLATFORM_TABS[activeTab].title}</h3>
          <p className="text-muted mt-3 max-w-2xl">{PLATFORM_TABS[activeTab].body}</p>
        </div>
      </section>

      {/* Quick start */}
      <section id="start" className="max-w-3xl mx-auto px-6 py-10">
        <form
          onSubmit={handleQuickStart}
          className="bg-surface border border-border rounded-lg p-6 flex flex-wrap items-end gap-4"
        >
          <div className="flex-1 min-w-[10rem]">
            <label className="block text-xs text-muted mb-1.5">I am a</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <div className="flex-1 min-w-[12rem]">
            <label className="block text-xs text-muted mb-1.5">My department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
            >
              <option value="">Not sure yet</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-copper hover:bg-copperDim transition-colors text-bg text-sm font-medium rounded px-6 py-2.5 flex items-center gap-2"
          >
            Get started
            <ArrowRight size={15} />
          </button>
        </form>
      </section>

      {/* Feature grid */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-16">
        <p className="font-mono text-xs tracking-[0.25em] text-copper uppercase text-center">
          Capabilities
        </p>
        <h2 className="font-display text-3xl sm:text-4xl text-text mt-3 text-center">
          Everything, in one place.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-surface border border-border rounded-lg p-5 hover:border-copper/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-copper/10 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-copper" />
                </div>
                <h3 className="text-text text-sm font-medium">{f.title}</h3>
                <p className="text-muted text-sm mt-1.5 leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats footer */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="flex items-center gap-2 mb-10">
            <span className="font-mono text-copper text-sm">{"<NHATY />"}</span>
            <span className="font-display text-text">CampusAI</span>
          </div>
          <TraceDivider className="mb-10" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <Stat value={String(departments.length || "—")} label="Departments live" />
            <Stat value="3" label="User roles" />
            <Stat value="6" label="AI-powered tools" />
            <Stat value="24/7" label="Always-on access" />
          </div>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
        <p>CampusAI — every department, one assistant.</p>
        <div className="flex gap-5">
          <Link href="/login" className="hover:text-text transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="hover:text-text transition-colors">
            Create account
          </Link>
        </div>
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-mono text-3xl text-copper">{value}</p>
      <p className="text-muted text-xs mt-1">{label}</p>
    </div>
  );
}
