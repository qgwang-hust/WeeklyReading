import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import multer from "multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import { fileURLToPath } from "url";

const _bcrypt = (bcrypt as any).default || bcrypt;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.sqlite");
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    phone TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'student',
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    abstract TEXT,
    pdf_url TEXT,
    slides_url TEXT,
    tags TEXT,
    author_id INTEGER,
    meeting_date TEXT,
    publisher_email TEXT,
    conference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paper_id INTEGER,
    user_id INTEGER,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(paper_id) REFERENCES papers(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS announcement_reads (
    announcement_id INTEGER,
    user_id INTEGER,
    read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(announcement_id, user_id),
    FOREIGN KEY(announcement_id) REFERENCES announcements(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Migration: Add meeting_date, publisher_email, and conference to papers if they don't exist
try {
  db.prepare("ALTER TABLE papers ADD COLUMN meeting_date TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE papers ADD COLUMN publisher_email TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE papers ADD COLUMN conference TEXT").run();
} catch (e) {}

// Initialize SMTP settings if not exists
const initSettings = [
  { key: 'SMTP_HOST', value: process.env.SMTP_HOST || '' },
  { key: 'SMTP_PORT', value: process.env.SMTP_PORT || '587' },
  { key: 'SMTP_USER', value: process.env.SMTP_USER || '' },
  { key: 'SMTP_PASS', value: process.env.SMTP_PASS || '' },
  { key: 'SMTP_FROM', value: process.env.SMTP_FROM || 'Weekly Reading' },
];

initSettings.forEach(s => {
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run(s.key, s.value);
});

// Seed supervisor if not exists
const supervisor = db.prepare("SELECT * FROM users WHERE role = 'supervisor'").get();
if (!supervisor) {
  const hash = _bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (name, student_id, email, role, password_hash) VALUES (?, ?, ?, ?, ?)").run(
    "Supervisor", "admin", "supervisor@example.com", "supervisor", hash
  );
}

const app = express();
app.use(cors());
app.use(express.json());

// File Upload Setup
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const isSupervisor = (req: any, res: any, next: any) => {
  if (req.user.role !== "supervisor") return res.status(403).json({ error: "Forbidden" });
  next();
};

// API Routes

// Login
app.post("/api/login", (req, res) => {
  try {
    const { student_id: raw_id, password: raw_password } = req.body;
    const student_id = String(raw_id || "").trim();
    const password = String(raw_password || "").trim();
    console.log(`Login attempt for student_id: "${student_id}"`);
    console.log(`Password provided length: ${password?.length}`);
    
    if (!student_id || !password) {
      return res.status(400).json({ error: "Student ID and password are required" });
    }

    let user = db.prepare("SELECT * FROM users WHERE student_id = ?").get(student_id) as any;
    
    if (!user) {
      console.log(`User not found with exact match for: "${student_id}". Trying case-insensitive...`);
      user = db.prepare("SELECT * FROM users WHERE LOWER(student_id) = LOWER(?)").get(student_id) as any;
    }
    
    if (!user) {
      console.log(`User not found in database for student_id: "${student_id}"`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`User found: "${user.name}" (ID: ${user.id}, Role: ${user.role})`);
    console.log(`Stored hash starts with: ${user.password_hash?.substring(0, 10)}...`);
    
    const isMatch = _bcrypt.compareSync(String(password), user.password_hash);
    console.log(`Bcrypt comparison result: ${isMatch}`);
    
    if (!isMatch) {
      console.log(`Invalid password for: ${student_id}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`Login successful: ${user.name}`);
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET);
    
    // Artificial delay for a smoother, more deliberate feel and basic rate limiting
    setTimeout(() => {
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          name: user.name, 
          role: user.role,
          student_id: user.student_id
        } 
      });
    }, 400);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User Management (Supervisor only)
app.post("/api/users", authenticate, isSupervisor, (req, res) => {
  const { name, student_id, phone, email, role } = req.body;
  const password = String(student_id); // Ensure it's a string
  const hash = _bcrypt.hashSync(password, 10);
  try {
    db.prepare("INSERT INTO users (name, student_id, phone, email, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)").run(
      name, student_id, phone, email, role || "student", hash
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/users", authenticate, isSupervisor, (req, res) => {
  const users = db.prepare("SELECT id, name, student_id, phone, email, role FROM users").all();
  res.json(users);
});

app.post("/api/users/:id/reset-password", authenticate, isSupervisor, (req, res) => {
  const { id } = req.params;
  const user = db.prepare("SELECT student_id FROM users WHERE id = ?").get(id) as any;
  if (!user) return res.status(404).json({ error: "User not found" });
  
  const hash = _bcrypt.hashSync(user.student_id, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, id);
  res.json({ success: true });
});

app.delete("/api/users/:id", authenticate, isSupervisor, (req, res) => {
  const { id } = req.params;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
  if (user && user.role === 'supervisor') {
    return res.status(403).json({ error: "Cannot delete supervisor" });
  }
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ success: true });
});

// Settings
app.get("/api/settings", authenticate, isSupervisor, (req, res) => {
  const settings = db.prepare("SELECT * FROM settings").all();
  const config: any = {};
  settings.forEach((s: any) => config[s.key] = s.value);
  res.json(config);
});

app.post("/api/settings", authenticate, isSupervisor, (req, res) => {
  const updates = req.body;
  const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  const transaction = db.transaction((data) => {
    for (const [key, value] of Object.entries(data)) {
      stmt.run(key, value);
    }
  });
  transaction(updates);
  res.json({ success: true });
});

// Papers
app.post("/api/papers", authenticate, upload.fields([{ name: "pdf" }, { name: "slides" }]), async (req: any, res) => {
  try {
    const { title, abstract, tags, meeting_date, publisher_email, conference } = req.body;
    console.log("Publishing paper:", { title, meeting_date, publisher_email });
    
    const pdfFile = req.files?.["pdf"]?.[0];
    const slidesFile = req.files?.["slides"]?.[0];
    
    const pdf_url = pdfFile ? `/uploads/${pdfFile.filename}` : null;
    const slides_url = slidesFile ? `/uploads/${slidesFile.filename}` : null;

    const result = db.prepare("INSERT INTO papers (title, abstract, pdf_url, slides_url, tags, author_id, meeting_date, publisher_email, conference) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      title, abstract, pdf_url, slides_url, tags, (req as any).user.id, meeting_date, publisher_email, conference
    );

    const paperId = result.lastInsertRowid;
    console.log("Paper inserted with ID:", paperId);
    
    res.json({ id: paperId });
  } catch (error: any) {
    console.error("Paper publish error:", error);
    res.status(500).json({ error: error.message || "Failed to publish paper" });
  }
});

app.get("/api/papers", authenticate, (req, res) => {
  const papers = db.prepare(`
    SELECT p.*, u.name as author_name 
    FROM papers p 
    JOIN users u ON p.author_id = u.id 
    ORDER BY p.created_at DESC
  `).all();
  res.json(papers);
});

app.get("/api/papers/:id", authenticate, (req, res) => {
  const paper = db.prepare(`
    SELECT p.*, u.name as author_name 
    FROM papers p 
    JOIN users u ON p.author_id = u.id 
    WHERE p.id = ?
  `).get(req.params.id);
  
  const comments = db.prepare(`
    SELECT c.*, u.name as user_name 
    FROM comments c 
    JOIN users u ON c.user_id = u.id 
    WHERE c.paper_id = ? 
    ORDER BY c.created_at ASC
  `).all(req.params.id);

  res.json({ ...paper, comments });
});

// Comments
app.post("/api/comments", authenticate, (req: any, res) => {
  const { paper_id, content } = req.body;
  db.prepare("INSERT INTO comments (paper_id, user_id, content) VALUES (?, ?, ?)").run(
    paper_id, (req as any).user.id, content
  );
  res.json({ success: true });
});

// Announcements
app.post("/api/announcements", authenticate, isSupervisor, (req: any, res) => {
  const { title, content } = req.body;
  db.prepare("INSERT INTO announcements (title, content, author_id) VALUES (?, ?, ?)").run(
    title, content, (req as any).user.id
  );
  res.json({ success: true });
});

app.get("/api/announcements", authenticate, (req: any, res) => {
  const announcements = db.prepare(`
    SELECT a.*, u.name as author_name,
    (SELECT COUNT(*) FROM announcement_reads WHERE announcement_id = a.id AND user_id = ?) as is_read
    FROM announcements a 
    JOIN users u ON a.author_id = u.id 
    ORDER BY a.created_at DESC
  `).all((req as any).user.id);
  res.json(announcements);
});

app.post("/api/announcements/:id/read", authenticate, (req: any, res) => {
  try {
    db.prepare("INSERT OR IGNORE INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)").run(
      req.params.id, (req as any).user.id
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

app.get("/api/announcements/:id/reads", authenticate, isSupervisor, (req, res) => {
  const reads = db.prepare(`
    SELECT u.name, u.student_id, ar.read_at 
    FROM announcement_reads ar 
    JOIN users u ON ar.user_id = u.id 
    WHERE ar.announcement_id = ?
  `).all(req.params.id);
  res.json(reads);
});

app.delete("/api/announcements/:id", authenticate, isSupervisor, (req, res) => {
  db.prepare("DELETE FROM announcement_reads WHERE announcement_id = ?").run(req.params.id);
  db.prepare("DELETE FROM announcements WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.put("/api/announcements/:id", authenticate, isSupervisor, (req, res) => {
  const { title, content } = req.body;
  db.prepare("UPDATE announcements SET title = ?, content = ? WHERE id = ?").run(title, content, req.params.id);
  res.json({ success: true });
});

app.delete("/api/papers/:id", authenticate, isSupervisor, (req, res) => {
  db.prepare("DELETE FROM comments WHERE paper_id = ?").run(req.params.id);
  db.prepare("DELETE FROM papers WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.put("/api/papers/:id", authenticate, isSupervisor, upload.fields([{ name: "pdf" }, { name: "slides" }]), (req: any, res) => {
  const { title, abstract, tags, meeting_date, publisher_email, conference } = req.body;
  const pdfFile = req.files["pdf"]?.[0];
  const slidesFile = req.files["slides"]?.[0];

  let query = "UPDATE papers SET title = ?, abstract = ?, tags = ?, meeting_date = ?, publisher_email = ?, conference = ?";
  const params = [title, abstract, tags, meeting_date, publisher_email, conference];

  if (pdfFile) {
    query += ", pdf_url = ?";
    params.push(`/uploads/${pdfFile.filename}`);
  }
  if (slidesFile) {
    query += ", slides_url = ?";
    params.push(`/uploads/${slidesFile.filename}`);
  }

  query += " WHERE id = ?";
  params.push(req.params.id);

  db.prepare(query).run(...params);
  res.json({ success: true });
});

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "An internal server error occurred" });
});

startServer();
