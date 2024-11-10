import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.DATABASE_URL || 'file:local.db',
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

export const handler = async (event, context) => {
  try {
    const { httpMethod: method, queryStringParameters: query, body } = event;
    const parsedBody = body ? JSON.parse(body) : null;

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
    };

    // Handle OPTIONS request for CORS
    if (method === 'OPTIONS') {
      return {
        statusCode: 204,
        headers
      };
    }

    switch (method) {
      case 'GET':
        if (query?.id) {
          const result = await db.execute({
            sql: 'SELECT * FROM diagrams WHERE id = ?',
            args: [query.id]
          });
          
          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Diagram not found' })
            };
          }
          
          const row = result.rows[0];
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              id: row.id,
              name: row.name,
              data: JSON.parse(row.data),
              createdAt: row.created_at,
              updatedAt: row.updated_at
            })
          };
        } else {
          const result = await db.execute('SELECT * FROM diagrams ORDER BY updated_at DESC');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result.rows.map(row => ({
              id: row.id,
              name: row.name,
              data: JSON.parse(row.data),
              createdAt: row.created_at,
              updatedAt: row.updated_at
            })))
          };
        }

      case 'POST':
        const { id, name, data } = parsedBody;
        const now = new Date().toISOString();
        
        if (id) {
          await db.execute({
            sql: 'UPDATE diagrams SET name = ?, data = ?, updated_at = ? WHERE id = ?',
            args: [name, JSON.stringify(data), now, id]
          });
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ id })
          };
        } else {
          const newId = Math.random().toString(36).substring(2, 15);
          await db.execute({
            sql: 'INSERT INTO diagrams (id, name, data) VALUES (?, ?, ?)',
            args: [newId, name, JSON.stringify(data)]
          });
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ id: newId })
          };
        }

      case 'DELETE':
        await db.execute({
          sql: 'DELETE FROM diagrams WHERE id = ?',
          args: [query.id]
        });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: `Method ${method} Not Allowed` })
        };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};