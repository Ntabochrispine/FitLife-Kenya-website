const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET_IN_PRODUCTION";

const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "fitlife.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS program_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  program TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function adminRequired(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required." });
  next();
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "FitLife Kenya API" });
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });

  const normalizedEmail = String(email).trim().toLowerCase();
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = db.prepare(
      "INSERT INTO users (name,email,password_hash) VALUES (?,?,?)"
    ).run(String(name).trim(), normalizedEmail, hash);
    const user = db.prepare("SELECT id,name,email,role,created_at FROM users WHERE id=?").get(result.lastInsertRowid);
    res.status(201).json({ message: "Account created.", token: createToken(user), user });
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) return res.status(409).json({ message: "An account with that email already exists." });
    res.status(500).json({ message: "Unable to create account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
  const user = db.prepare("SELECT * FROM users WHERE email=?").get(String(email).trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  const safeUser = { id:user.id, name:user.name, email:user.email, role:user.role, created_at:user.created_at };
  res.json({ message:"Login successful.", token:createToken(safeUser), user:safeUser });
});

app.get("/api/me", authRequired, (req,res) => {
  const user = db.prepare("SELECT id,name,email,role,created_at FROM users WHERE id=?").get(req.user.id);
  res.json({ user });
});

app.post("/api/contact", (req,res) => {
  const { name,email,subject,message } = req.body;
  if (!name || !email || !subject || !message) return res.status(400).json({ message:"All contact fields are required." });
  const result = db.prepare(
    "INSERT INTO contacts (name,email,subject,message) VALUES (?,?,?,?)"
  ).run(String(name).trim(),String(email).trim(),String(subject).trim(),String(message).trim());
  res.status(201).json({ message:"Thanks! Your message has been received.", id:result.lastInsertRowid });
});

app.post("/api/memberships", authRequired, (req,res) => {
  const allowed = ["Basic","Premium","Pro"];
  const { plan } = req.body;
  if (!allowed.includes(plan)) return res.status(400).json({ message:"Invalid membership plan." });
  const result = db.prepare(
    "INSERT INTO memberships (user_id,plan) VALUES (?,?)"
  ).run(req.user.id, plan);
  res.status(201).json({ message:`${plan} membership request created.`, id:result.lastInsertRowid });
});

app.get("/api/memberships", authRequired, (req,res) => {
  const rows = db.prepare(
    "SELECT id,plan,status,created_at FROM memberships WHERE user_id=? ORDER BY created_at DESC"
  ).all(req.user.id);
  res.json({ memberships:rows });
});

app.post("/api/program-requests", authRequired, (req,res) => {
  const { program } = req.body;
  const allowed = ["Weight Loss","Muscle Building","Flexibility","Strength Training","Home Fitness","Endurance"];
  if (!allowed.includes(program)) return res.status(400).json({ message:"Invalid program." });
  const result = db.prepare(
    "INSERT INTO program_requests (user_id,program) VALUES (?,?)"
  ).run(req.user.id, program);
  res.status(201).json({ message:`${program} request saved.`, id:result.lastInsertRowid });
});

app.get("/api/programs", (req,res) => {
  res.json({
    programs: [
      {name:"Weight Loss", difficulty:"Beginner", duration:"4 weeks", days:4},
      {name:"Muscle Building", difficulty:"Intermediate", duration:"8 weeks", days:5},
      {name:"Flexibility", difficulty:"All levels", duration:"4 weeks", days:3},
      {name:"Strength Training", difficulty:"Intermediate", duration:"6 weeks", days:4},
      {name:"Home Fitness", difficulty:"Beginner", duration:"4 weeks", days:3},
      {name:"Endurance", difficulty:"Advanced", duration:"8 weeks", days:5}
    ]
  });
});

app.get("/api/admin/stats", authRequired, adminRequired, (req,res) => {
  const users = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  const contacts = db.prepare("SELECT COUNT(*) AS count FROM contacts").get().count;
  const memberships = db.prepare("SELECT COUNT(*) AS count FROM memberships").get().count;
  const requests = db.prepare("SELECT COUNT(*) AS count FROM program_requests").get().count;
  res.json({ users, contacts, memberships, program_requests: requests });
});

app.get("/api/admin/contacts", authRequired, adminRequired, (req,res) => {
  const contacts = db.prepare("SELECT * FROM contacts ORDER BY created_at DESC").all();
  res.json({ contacts });
});

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`FitLife Kenya running at http://localhost:${PORT}`);
  console.log(`API health: http://localhost:${PORT}/api/health`);
});
