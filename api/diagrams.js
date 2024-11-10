import { createClient } from '@libsql/client';

export const handler = async (event) => {
  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN
  });

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    // Initialize database
    await client.execute(`
      CREATE TABLE IF NOT EXISTS diagrams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers
      };
    }

    if (event.httpMethod === 'GET') {
      if (event.queryStringParameters?.id) {
        const result = await client.execute({
          sql: 'SELECT * FROM diagrams WHERE id = ?',
          args: [event.queryStringParameters.id]
        });

        if (result.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Diagram not found' })
          };
        }

        const diagram = result.rows[0];
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            id: diagram.id,
            name: diagram.name,
            data: JSON.parse(diagram.data)
          })
        };
      } else {
        const result = await client.execute('SELECT id, name FROM diagrams ORDER BY created_at DESC');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };
      }
    }

    if (event.httpMethod === 'POST') {
      const { name, data } = JSON.parse(event.body);
      const id = Math.random().toString(36).substring(2, 15);
      
      await client.execute({
        sql: 'INSERT INTO diagrams (id, name, data) VALUES (?, ?, ?)',
        args: [id, name, JSON.stringify(data)]
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ id })
      };
    }

    if (event.httpMethod === 'DELETE') {
      const { id } = event.queryStringParameters;
      await client.execute({
        sql: 'DELETE FROM diagrams WHERE id = ?',
        args: [id]
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};