const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const db = new Database("./server/data/fitlife.db");

(async () => {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "FitLife Admin";
  if (!email || !password) {
    console.log("Usage: node server/create-admin.js admin@example.com StrongPassword \"Admin Name\"");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  const existing = db.prepare("SELECT id FROM users WHERE email=?").get(email.toLowerCase());
  if (existing) {
    db.prepare("UPDATE users SET role='admin', password_hash=?, name=? WHERE id=?").run(hash,name,existing.id);
  } else {
    db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,'admin')").run(name,email.toLowerCase(),hash);
  }
  console.log(`Admin ready: ${email}`);
  db.close();
})();
