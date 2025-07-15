// Express + SQLite3 backend for story reader
import express from 'express';
import sqlite3Pkg from 'sqlite3';
import cors from 'cors';
import util from 'util';
import path from 'path';

const sqlite3 = sqlite3Pkg.verbose();
const app = express();
const PORT = process.env.PORT || 8081;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files like index.html

// Open (or create) the SQLite3 database
// Use Render's persistent disk for the database
const dbPath = path.join(process.env.RENDER_DISK_PATH || '.', 'stories.db');
const db = new sqlite3.Database(dbPath);
const dbRun = util.promisify(db.run.bind(db));
const dbGet = util.promisify(db.get.bind(db));
const dbAll = util.promisify(db.all.bind(db));

// Initialize DB and seed with demo stories if empty
async function initDb() {
  await dbRun(`CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    full_text TEXT NOT NULL
  )`);
  const row = await dbGet('SELECT COUNT(*) as c FROM stories');
  if (row.c === 0) {
    await dbRun('INSERT INTO stories (title, full_text) VALUES (?, ?)',
      'The Enchanted Forest',
      'Once upon a time, in a forest filled with magical creatures, a young girl named Lily discovered a hidden path that led to a world beyond her imagination...'
    );
    await dbRun('INSERT INTO stories (title, full_text) VALUES (?, ?)',
      'The Lost Treasure',
      'Captain Redbeard had searched the seven seas for the legendary lost treasure. One stormy night, his map revealed a clue that would change everything...'
    );
  }
}

// API: Get all stories (id, title)
app.get('/api/stories', async (req, res) => {
  try {
    const stories = await dbAll('SELECT id, title FROM stories');
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get full story by id
app.get('/api/stories/:id', async (req, res) => {
  try {
    const story = await dbGet('SELECT * FROM stories WHERE id = ?', req.params.id);
    if (story) res.json(story);
    else res.status(404).json({ error: 'Story not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Add a new story
app.post('/api/stories', async (req, res) => {
  const { title, full_text } = req.body;
  if (!title || !full_text) {
    return res.status(400).json({ error: 'Missing title or full_text' });
  }
  try {
    await dbRun('INSERT INTO stories (title, full_text) VALUES (?, ?)', title, full_text);
    const row = await dbGet('SELECT last_insert_rowid() as id');
    res.json({ id: row.id, title, full_text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Update a story
app.put('/api/stories/:id', async (req, res) => {
  const { title, full_text } = req.body;
  if (!title || !full_text) {
    return res.status(400).json({ error: 'Missing title or full_text' });
  }
  try {
    const result = await dbRun('UPDATE stories SET title = ?, full_text = ? WHERE id = ?', title, full_text, req.params.id);
    res.json({ id: req.params.id, title, full_text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Delete a story
app.delete('/api/stories/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM stories WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server after DB is ready
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

