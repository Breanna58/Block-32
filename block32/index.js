const pg = require('pg')
const express = require('express')
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_acme_notes_db')
const app = express()


app.use(express.json()); 


const init = async () => {
    await client.connect();
    console.log('connected to database');

    let SQL = `
        DROP TABLE IF EXISTS flavors; 
    `;

    await client.query(SQL);
    console.log('tables created');

    SQL = `
    
    
    
    `;

    await client.query(SQL);
    console.log('data seeded');
  };
  
  init();