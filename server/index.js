import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: true });
await fastify.register(cors, {
  origin: true
});

if (!process.env.DATABASE_URL || !process.env.DATABASE_AUTH_TOKEN) {
  console.error('Missing database configuration. Please set DATABASE_URL and DATABASE_AUTH_TOKEN');
  process.exit(1);
}

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
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

// Rest of the server code remains the same...
// Get all diagrams
fastify.get('/api/diagrams', async (request, reply) => {
  const result = await db.execute('SELECT * FROM diagrams ORDER BY updated_at DESC');
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    data: JSON.parse(row.data),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
});

// Get diagram by ID
fastify.get('/api/diagrams/:id', async (request, reply) => {
  const { id } = request.params;
  const result = await db.execute('SELECT * FROM diagrams WHERE id = ?', [id]);
  if (result.rows.length === 0) {
    reply.code(404).send({ error: 'Diagram not found' });
    return;
  }
  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    data: JSON.parse(row.data),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
});

// Save diagram
fastify.post('/api/diagrams', async (request, reply) => {
  const { id, name, data } = request.body;
  const now = new Date().toISOString();
  
  if (id) {
    // Update existing diagram
    await db.execute(
      'UPDATE diagrams SET name = ?, data = ?, updated_at = ? WHERE id = ?',
      [name, JSON.stringify(data), now, id]
    );
  } else {
    // Create new diagram
    const newId = Math.random().toString(36).substring(2, 15);
    await db.execute(
      'INSERT INTO diagrams (id, name, data) VALUES (?, ?, ?)',
      [newId, name, JSON.stringify(data)]
    );
    return { id: newId };
  }
  
  return { id };
});

// Delete diagram
fastify.delete('/api/diagrams/:id', async (request, reply) => {
  const { id } = request.params;
  await db.execute('DELETE FROM diagrams WHERE id = ?', [id]);
  return { success: true };
});

// Start server
try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}