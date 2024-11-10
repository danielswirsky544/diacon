import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';

const app = express();
app.use(cors());
app.use(express.json());

const db = createClient({
  url: 'file:local.db'
});

// Initialize database
await db.execute(`
  CREATE TABLE IF NOT EXISTS diagrams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.get('/api/diagrams', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM diagrams ORDER BY updated_at DESC');
    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      data: JSON.parse(row.data),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })));
  } catch (error) {
    console.error('Failed to fetch diagrams:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/diagrams/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM diagrams WHERE id = ?',
      args: [req.params.id]
    });
    
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/diagrams', async (req, res) => {
  try {
    const { id, name, data } = req.body;
    const now = new Date().toISOString();
    
    if (id) {
      await db.execute({
        sql: 'UPDATE diagrams SET name = ?, data = ?, updated_at = ? WHERE id = ?',
        args: [name, JSON.stringify(data), now, id]
      });
      res.json({ id });
    } else {
      const newId = Math.random().toString(36).substring(2, 15);
      await db.execute({
        sql: 'INSERT INTO diagrams (id, name, data) VALUES (?, ?, ?)',
        args: [newId, name, JSON.stringify(data)]
      });
      res.json({ id: newId });
    }
  } catch (error) {
    console.error('Failed to save diagram:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/diagrams/:id', async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM diagrams WHERE id = ?',
      args: [req.params.id]
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete diagram:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});