const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export type UserRole = "student" | "teacher" | "admin";

export interface UserRead {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  credit_hours: number;
  department_id: string;
  instructor_id: string | null;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  semester: string;
  status: "active" | "completed" | "dropped";
  enrolled_at: string;
}

export interface Grade {
  id: string;
  enrollment_id: string;
  component: string;
  label: string;
  score: number;
  max_score: number;
  created_at: string;
}

export interface Attendance {
  id: string;
  enrollment_id: string;
  date: string;
  status: "present" | "absent" | "excused" | "late";
  note: string | null;
}

export interface ChatSource {
  document_id: string;
  document_title: string;
  chunk_content: string;
  similarity: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export interface RosterEntry {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  semester: string;
  status: "active" | "completed" | "dropped";
}

export interface CampusDocument {
  id: string;
  title: string;
  department_id: string | null;
  course_id: string | null;
  uploaded_by_id: string | null;
  created_at: string;
  chunk_count: number;
}

export interface GpaSummary {
  courses: {
    enrollment_id: string;
    course_id: string;
    course_code: string;
    course_title: string;
    credit_hours: number;
    semester: string;
    average_percentage: number | null;
    grade_points: number | null;
  }[];
  overall_gpa: number | null;
}

export type StudyMode = "summary" | "flashcards" | "quiz" | "key_concepts";

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  choices: string[];
  correct_index: number;
}

export interface KeyConcept {
  term: string;
  explanation: string;
}

export interface StudyToolResponse {
  mode: StudyMode;
  document_id: string;
  document_title: string;
  summary: string | null;
  flashcards: Flashcard[] | null;
  quiz: QuizQuestion[] | null;
  key_concepts: KeyConcept[] | null;
}

export type AnnouncementCategory = "academic" | "sports" | "scholarships" | "events" | "emergency";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  department_id: string | null;
  posted_by_id: string | null;
  is_pinned: boolean;
  created_at: string;
}

export type LocationCategory =
  | "academic"
  | "lab"
  | "library"
  | "cafeteria"
  | "dormitory"
  | "administration"
  | "parking"
  | "other";

export interface CampusLocationEntry {
  id: string;
  name: string;
  category: LocationCategory;
  description: string | null;
  department_id: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type NotificationKind = "announcement" | "attendance_risk" | "grade_posted" | "general";

export interface NotificationEntry {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface AttendanceSummaryEntry {
  enrollment_id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  semester: string;
  total_records: number;
  present_count: number;
  percentage: number | null;
  is_at_risk: boolean;
}

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TutorResponse {
  answer: string;
  sources: ChatSource[];
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; refresh_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    full_name: string;
    email: string;
    password: string;
    role: UserRole;
    department_id?: string | null;
  }) =>
    request<UserRead>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: (token: string) => request<UserRead>("/auth/me", { token }),

  departments: (token?: string | null) => request<Department[]>("/departments/", { token }),

  courses: (token: string, departmentId?: string, instructorId?: string) => {
    const params = new URLSearchParams();
    if (departmentId) params.set("department_id", departmentId);
    if (instructorId) params.set("instructor_id", instructorId);
    const qs = params.toString();
    return request<Course[]>(`/courses/${qs ? `?${qs}` : ""}`, { token });
  },

  myEnrollments: (token: string) => request<Enrollment[]>("/enrollments/me", { token }),

  gradesForEnrollment: (token: string, enrollmentId: string) =>
    request<Grade[]>(`/grades/enrollment/${enrollmentId}`, { token }),

  attendanceForEnrollment: (token: string, enrollmentId: string) =>
    request<Attendance[]>(`/attendance/enrollment/${enrollmentId}`, { token }),

  enroll: (token: string, courseId: string, semester: string) =>
    request<Enrollment>("/enrollments/", {
      method: "POST",
      token,
      body: JSON.stringify({ course_id: courseId, semester }),
    }),

  chat: (
    token: string,
    question: string,
    scope: { course_id?: string; department_id?: string } = {}
  ) =>
    request<ChatResponse>("/chat/", {
      method: "POST",
      token,
      body: JSON.stringify({ question, ...scope }),
    }),

  roster: (token: string, courseId: string) =>
    request<RosterEntry[]>(`/enrollments/course/${courseId}`, { token }),

  recordAttendance: (
    token: string,
    payload: { enrollment_id: string; date: string; status: string; note?: string }
  ) =>
    request<Attendance>("/attendance/", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),

  recordGrade: (
    token: string,
    payload: {
      enrollment_id: string;
      component: string;
      label: string;
      score: number;
      max_score: number;
    }
  ) =>
    request<Grade>("/grades/", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),

  myGpaSummary: (token: string) => request<GpaSummary>("/grades/me/summary", { token }),

  documents: (token: string, opts: { departmentId?: string; courseId?: string } = {}) => {
    const params = new URLSearchParams();
    if (opts.departmentId) params.set("department_id", opts.departmentId);
    if (opts.courseId) params.set("course_id", opts.courseId);
    const qs = params.toString();
    return request<CampusDocument[]>(`/documents/${qs ? `?${qs}` : ""}`, { token });
  },

  uploadDocument: (
    token: string,
    payload: { title: string; content: string; department_id?: string; course_id?: string }
  ) =>
    request<CampusDocument>("/documents/", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),

  uploadDocumentFile: async (
    token: string,
    payload: { title: string; department_id?: string; course_id?: string; file: File }
  ) => {
    const form = new FormData();
    form.append("title", payload.title);
    if (payload.department_id) form.append("department_id", payload.department_id);
    if (payload.course_id) form.append("course_id", payload.course_id);
    form.append("file", payload.file);

    const res = await fetch(`${API_BASE}/documents/upload-file`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(res.status, body.detail ?? "Upload failed");
    }
    return res.json() as Promise<CampusDocument>;
  },

  createDepartment: (token: string, payload: { name: string; code: string }) =>
    request<Department>("/departments/", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),

  createCourse: (
    token: string,
    payload: {
      code: string;
      title: string;
      credit_hours: number;
      department_id: string;
      instructor_id?: string;
    }
  ) =>
    request<Course>("/courses/", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),

  users: (token: string) => request<UserRead[]>("/users/", { token }),

  generateStudyTool: (token: string, documentId: string, mode: StudyMode) =>
    request<StudyToolResponse>("/study-tools/", {
      method: "POST",
      token,
      body: JSON.stringify({ document_id: documentId, mode }),
    }),

  announcements: (
    token: string,
    opts: { departmentId?: string; category?: AnnouncementCategory } = {}
  ) => {
    const params = new URLSearchParams();
    if (opts.departmentId) params.set("department_id", opts.departmentId);
    if (opts.category) params.set("category", opts.category);
    const qs = params.toString();
    return request<Announcement[]>(`/announcements/${qs ? `?${qs}` : ""}`, { token });
  },

  createAnnouncement: (
    token: string,
    payload: {
      title: string;
      content: string;
      category: AnnouncementCategory;
      department_id?: string;
      is_pinned?: boolean;
    }
  ) =>
    request<Announcement>("/announcements/", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),

  deleteAnnouncement: (token: string, id: string) =>
    request<void>(`/announcements/${id}`, { method: "DELETE", token }),

  campusLocations: (
    token: string,
    opts: { q?: string; category?: LocationCategory; departmentId?: string } = {}
  ) => {
    const params = new URLSearchParams();
    if (opts.q) params.set("q", opts.q);
    if (opts.category) params.set("category", opts.category);
    if (opts.departmentId) params.set("department_id", opts.departmentId);
    const qs = params.toString();
    return request<CampusLocationEntry[]>(`/campus-locations/${qs ? `?${qs}` : ""}`, { token });
  },

  createCampusLocation: (
    token: string,
    payload: {
      name: string;
      category: LocationCategory;
      description?: string;
      department_id?: string;
      latitude?: number;
      longitude?: number;
    }
  ) =>
    request<CampusLocationEntry>("/campus-locations/", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),

  deleteCampusLocation: (token: string, id: string) =>
    request<void>(`/campus-locations/${id}`, { method: "DELETE", token }),

  notifications: (token: string, unreadOnly = false) =>
    request<NotificationEntry[]>(`/notifications/${unreadOnly ? "?unread_only=true" : ""}`, { token }),

  markNotificationRead: (token: string, id: string) =>
    request<NotificationEntry>(`/notifications/${id}/read`, { method: "POST", token }),

  myAttendanceSummary: (token: string) =>
    request<AttendanceSummaryEntry[]>("/attendance/me/summary", { token }),

  askTutor: (
    token: string,
    courseId: string,
    question: string,
    history: TutorMessage[]
  ) =>
    request<TutorResponse>("/tutor/", {
      method: "POST",
      token,
      body: JSON.stringify({ course_id: courseId, question, history }),
    }),

  transcribeAudio: async (token: string, audioBlob: Blob) => {
    const form = new FormData();
    form.append("file", audioBlob, "recording.webm");
    const res = await fetch(`${API_BASE}/voice/transcribe`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(res.status, body.detail ?? "Transcription failed");
    }
    return (await res.json()) as { text: string };
  },

  generateResume: (token: string, background: string) =>
    request<{ resume_text: string }>("/resume/generate", {
      method: "POST",
      token,
      body: JSON.stringify({ background }),
    }),

  generateStudyPlan: (token: string, goals: string) =>
    request<{ plan_text: string }>("/study-planner/generate", {
      method: "POST",
      token,
      body: JSON.stringify({ goals }),
    }),
};
