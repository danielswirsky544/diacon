import { createClient } from '@libsql/client';

export const handler = async (event, context) => {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN
  });

  try {
    const { httpMethod: method, queryStringParameters: query, body } = event;
    const parsedBody = body ? JSON.parse(body) : null;

    switch (method) {
      case 'GET':
        if (query?.id) {
          const result = await db.execute('SELECT * FROM diagrams WHERE id = ?', [query.id]);
          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              body: JSON.stringify({ error: 'Diagram not found' })
            };
          }
          const row = result.rows[0];
          return {
            statusCode: 200,
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
          await db.execute(
            'UPDATE diagrams SET name = ?, data = ?, updated_at = ? WHERE id = ?',
            [name, JSON.stringify(data), now, id]
          );
          return {
            statusCode: 200,
            body: JSON.stringify({ id })
          };
        } else {
          const newId = Math.random().toString(36).substring(2, 15);
          await db.execute(
            'INSERT INTO diagrams (id, name, data) VALUES (?, ?, ?)',
            [newId, name, JSON.stringify(data)]
          );
          return {
            statusCode: 200,
            body: JSON.stringify({ id: newId })
          };
        }

      case 'DELETE':
        await db.execute('DELETE FROM diagrams WHERE id = ?', [query.id]);
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: `Method ${method} Not Allowed` })
        };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};