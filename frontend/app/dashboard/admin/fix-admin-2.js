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

replaceOnce(
  'users section insertion',
  `      <h2 className="font-display text-lg text-text mt-8 mb-3">All courses</h2>
      <SimpleTable
        rows={courses}
        columns={[
          { header: "Code", render: (c: Course) => c.code },
          { header: "Title", render: (c: Course) => c.title },
          {
            header: "Department",
            render: (c: Course) => departments.find((d) => d.id === c.department_id)?.code ?? "—",
          },
          { header: "Credits", render: (c: Course) => String(c.credit_hours) },
        ]}
        emptyText="No courses yet."
      />
    </div>
  );
}`,
  `      <h2 className="font-display text-lg text-text mt-8 mb-3">All courses</h2>
      <SimpleTable
        rows={courses}
        columns={[
          { header: "Code", render: (c: Course) => c.code },
          { header: "Title", render: (c: Course) => c.title },
          {
            header: "Department",
            render: (c: Course) => departments.find((d) => d.id === c.department_id)?.code ?? "—",
          },
          { header: "Credits", render: (c: Course) => String(c.credit_hours) },
        ]}
        emptyText="No courses yet."
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
console.log('Both edits applied successfully.');
