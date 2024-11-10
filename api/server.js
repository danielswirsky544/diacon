import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

// Initialize database
app.post('/api/init', async (req, res) => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS diagrams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize database' });
  }
});

// Get all diagrams
app.get('/api/diagrams', async (req, res) => {
  try {
    const result = await db.execute('SELECT id, name, created_at, updated_at FROM diagrams ORDER BY updated_at DESC');
    const diagrams = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(diagrams);
  } catch (error) {
    console.error('Failed to fetch diagrams:', error);
    res.status(500).json({ error: 'Failed to fetch diagrams' });
  }
});

// Get diagram by ID
app.get('/api/diagrams/:id', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM diagrams WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Diagram not found' });
    }
    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      data: JSON.parse(row.data),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Failed to fetch diagram:', error);
    res.status(500).json({ error: 'Failed to fetch diagram' });
  }
});

// Save diagram
app.post('/api/diagrams', async (req, res) => {
  try {
    const { name, data } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    
    await db.execute(
      'INSERT INTO diagrams (id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, name, JSON.stringify(data), now, now]
    );
    
    res.json({ id });
  } catch (error) {
    console.error('Failed to save diagram:', error);
    res.status(500).json({ error: 'Failed to save diagram' });
  }
});

// Delete diagram
app.delete('/api/diagrams/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM diagrams WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete diagram:', error);
    res.status(500).json({ error: 'Failed to delete diagram' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});