// db.js
// ตั้งค่า Connection Pool สำหรับเชื่อมต่อฐานข้อมูล MySQL ด้วย mysql2
// รหัสนิสิต: 67160009 | Pno: 1 (ระบบข้อมูลหนังสือ)

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
