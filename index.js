const pg = require('pg');
const express = require('express');
const morgan = require('morgan');

const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_acme_notes_db');
const app = express();

app.use(express.json());
app.use(morgan('dev'));

// Initialize database
const init = async () => {
  await client.connect();
  console.log('Connected to database');

  let SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      is_favorite BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
  await client.query(SQL);
  console.log('Table created');

  SQL = `
    INSERT INTO flavors (name, is_favorite) VALUES
    ('vanilla', true),
    ('strawberry', true),
    ('chocolate', false);
  `;
  await client.query(SQL);
  console.log('Data seeded');
};

// Routes
app.get("/api/flavors", async (req, res, next) => {
  try {
    const result = await client.query('SELECT * FROM flavors');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const result = await client.query('SELECT * FROM flavors WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).send('Flavor not found');
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.post("/api/flavors", async (req, res, next) => {
  try {
    const { name, is_favorite } = req.body;
    const result = await client.query(
      `INSERT INTO flavors (name, is_favorite) VALUES ($1, $2) RETURNING *`,
      [name, is_favorite]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    await client.query('DELETE FROM flavors WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const { name, is_favorite } = req.body;
    const result = await client.query(
      `UPDATE flavors
       SET name = $1,
           is_favorite = $2,
           updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [name, is_favorite, req.params.id]
    );
    if (!result.rows.length) return res.status(404).send('Flavor not found');
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Start the server
const start = async () => {
  await init();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
  });
};

start();
