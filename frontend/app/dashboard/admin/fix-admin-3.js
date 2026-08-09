const fs = require('fs');
let raw = fs.readFileSync('page.tsx', 'utf8');
// normalize CRLF -> LF before matching, to avoid Windows line-ending mismatches
let content = raw.replace(/\r\n/g, '\n');

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
  'state declaration fix',
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

fs.writeFileSync('page.tsx', content, 'utf8');
console.log('Fix applied successfully.');
