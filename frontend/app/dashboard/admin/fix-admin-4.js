const fs = require('fs');
let content = fs.readFileSync('page.tsx', 'utf8').replace(/\r\n/g, '\n');

function replaceOnce(label, oldStr, newStr) {
  const count = content.split(oldStr).length - 1;
  if (count !== 1) {
    console.error(`FAILED (${label}): expected 1 match, found ${count}`);
    return false;
  }
  content = content.replace(oldStr, newStr);
  console.log(`OK: ${label}`);
  return true;
}

replaceOnce(
  'destructure currentUser',
  `const { token } = useAuth();`,
  `const { user: currentUser, token } = useAuth();`
);

replaceOnce(
  'rename teachers state to allUsers',
  `const [teachers, setTeachers] = useState<UserRead[]>([]);`,
  `const [allUsers, setAllUsers] = useState<UserRead[]>([]);\n  const teachers = allUsers.filter((u) => u.role === "teacher");`
);

replaceOnce(
  'simplify users fetch',
  `api.users(token).then((users) => setTeachers(users.filter((u) => u.role === "teacher")));`,
  `api.users(token).then(setAllUsers);`
);

replaceOnce(
  'update header text',
  `Manage departments &amp; courses`,
  `Manage departments, courses &amp; users`
);

fs.writeFileSync('page.tsx', content, 'utf8');
console.log('Done — check above for any FAILED lines.');
