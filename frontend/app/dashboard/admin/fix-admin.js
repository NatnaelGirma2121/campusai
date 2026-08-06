const fs = require('fs');
let content = fs.readFileSync('page.tsx', 'utf8');

function replaceOnce(label, oldStr, newStr) {
  const count = content.split(oldStr).length - 1;
  if (count !== 1) {
    console.error(`FAILED (${label}): expected 1 match, found ${count}`);
    process.exit(1);
  }
  content = content.replace(oldStr, newStr);
  console.log(`OK: ${label}`);
}

// Edit 1: state + header
replaceOnce(
  'state and header',
  `export default function AdminPage() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<UserRead[]>([]);

  useEffect(() => {
    if (!token) return;
    refreshAll();
  }, [token]);

  function refreshAll() {
    if (!token) return;
    api.departments(token).then(setDepartments);
    api.courses(token).then(setCourses);
    api.users(token).then((users) => setTeachers(users.filter((u) => u.role === "teacher")));
  }

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Admin</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">
        Manage departments &amp; courses
      </h1>`,
  `export default function AdminPage() {
  const { user: currentUser, token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allUsers, setAllUsers] = useState<UserRead[]>([]);
  const teachers = allUsers.filter((u) => u.role === "teacher");

  useEffect(() => {
    if (!token) return;
    refreshAll();
  }, [token]);

  function refreshAll() {
    if (!token) return;
    api.departments(token).then(setDepartments);
    api.courses(token).then(setCourses);
    api.users(token).then(setAllUsers);
  }

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Admin</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">
        Manage departments, courses &amp; users
      </h1>`
);

// Edit 2: insert Users section after the courses table
replaceOnce(
  'users section insertion',
  `      <h2 className="font-display text-lg text-text mt-8 mb-3">All courses</h2>
      <CourseManagementTable
        token={token}
        courses={courses}
        departments={departments}
        teachers={teachers}
        onUpdated={refreshAll}
      />
    </div>
  );
}`,
  `      <h2 className="font-display text-lg text-text mt-8 mb-3">All courses</h2>
      <CourseManagementTable
        token={token}
        courses={courses}
        departments={departments}
        teachers={teachers}
        onUpdated={refreshAll}
      />

      <h2 className="font-display text-lg text-text mt-8 mb-3">All users</h2>
      <p className="text-muted text-sm mb-3">
        Change a user's role here — this is the only way to grant admin access; it can't be
        self-selected during registration.
      </p>
      <UserManagementTable
        token={token}
        users={allUsers}
        currentUserId={currentUser?.id ?? null}
        onUpdated={refreshAll}
      />
    </div>
  );
}`
);

// Edit 3: insert the UserManagementTable component before Field()
replaceOnce(
  'UserManagementTable component insertion',
  `function Field({ label, children }: { label: string; children: React.ReactNode }) {`,
  `function UserManagementTable({
  token,
  users,
  currentUserId,
  onUpdated,
}: {
  token: string | null;
  users: UserRead[];
  currentUserId: string | null;
  onUpdated: () => void;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowMessage, setRowMessage] = useState<Record<string, { text: string; error?: boolean }>>(
    {}
  );

  async function handleRoleChange(userId: string, role: string) {
    if (!token) return;
    setSavingId(userId);
    try {
      await api.updateUserRole(token, userId, role);
      setRowMessage((prev) => ({ ...prev, [userId]: { text: "Updated." } }));
      onUpdated();
    } catch (err) {
      setRowMessage((prev) => ({
        ...prev,
        [userId]: {
          text: err instanceof ApiError ? err.message : "Couldn't update role.",
          error: true,
        },
      }));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface text-muted text-xs uppercase tracking-wide text-left">
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="px-4 py-2.5 font-medium">Email</th>
            <th className="px-4 py-2.5 font-medium">Role</th>
            <th className="px-4 py-2.5 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-2.5 text-text">{u.full_name}</td>
                <td className="px-4 py-2.5 text-muted font-mono">{u.email}</td>
                <td className="px-4 py-2.5 text-muted capitalize">{u.role}</td>
                <td className="px-4 py-2.5 text-right">
                  {isSelf ? (
                    <span className="text-xs text-muted">You</span>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <select
                        defaultValue={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={savingId === u.id}
                        className="bg-surfaceRaised border border-border rounded px-2 py-1.5 text-xs text-text disabled:opacity-50"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                      {rowMessage[u.id] && (
                        <span
                          className={\`text-xs \${rowMessage[u.id].error ? "text-danger" : "text-success"}\`}
                        >
                          {rowMessage[u.id].text}
                        </span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {users.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-muted">
                No users yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {`
);

fs.writeFileSync('page.tsx', content, 'utf8');
console.log('All 3 edits applied successfully.');
