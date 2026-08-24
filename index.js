// index.js
// Route ทดสอบสำหรับ query ข้อมูลจริงจากฐานข้อมูลที่ออกแบบไว้
// รหัสนิสิต: 67160009 | Pno: 1 (ระบบข้อมูลหนังสือ)

const express = require('express');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// GET /books - ดึงรายการหนังสือทั้งหมด พร้อมชื่อผู้แต่งและหมวดหมู่ (JOIN)
app.get('/books', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.book_id, b.title, b.isbn, b.publish_year,
              a.name AS author, c.name AS category
       FROM books b
       JOIN authors a ON b.author_id = a.author_id
       JOIN categories c ON b.category_id = c.category_id
       ORDER BY b.book_id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /books/:id - ดึงข้อมูลหนังสือเล่มเดียวตาม book_id
app.get('/books/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.book_id, b.title, b.isbn, b.publish_year,
              a.name AS author, c.name AS category
       FROM books b
       JOIN authors a ON b.author_id = a.author_id
       JOIN categories c ON b.category_id = c.category_id
       WHERE b.book_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST /books - เพิ่มหนังสือเล่มใหม่เข้าระบบ
app.post('/books', async (req, res) => {
  const { title, isbn, publish_year, author_id, category_id } = req.body;

  if (!title || !isbn || !author_id || !category_id) {
    return res.status(400).json({
      error: 'กรุณาระบุ title, isbn, author_id และ category_id ให้ครบถ้วน'
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO books (title, isbn, publish_year, author_id, category_id)
       VALUES (?, ?, ?, ?, ?)`,
      [title, isbn, publish_year || null, author_id, category_id]
    );
    res.status(201).json({
      book_id: result.insertId,
      title,
      isbn,
      publish_year: publish_year || null,
      author_id,
      category_id
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'ISBN นี้มีอยู่ในระบบแล้ว' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'ไม่พบ author_id หรือ category_id ที่ระบุ' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// PUT /books/:id - แก้ไขข้อมูลหนังสือทั้งระเบียน (ต้องส่งครบทุกฟิลด์)
app.put('/books/:id', async (req, res) => {
  const { title, isbn, publish_year, author_id, category_id } = req.body;

  if (!title || !isbn || !author_id || !category_id) {
    return res.status(400).json({
      error: 'กรุณาระบุ title, isbn, author_id และ category_id ให้ครบถ้วน'
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE books
       SET title = ?, isbn = ?, publish_year = ?, author_id = ?, category_id = ?
       WHERE book_id = ?`,
      [title, isbn, publish_year || null, author_id, category_id, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ book_id: Number(req.params.id), title, isbn, publish_year, author_id, category_id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'ISBN นี้มีอยู่ในระบบแล้ว' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// PATCH /books/:id - แก้ไขข้อมูลหนังสือเฉพาะบางฟิลด์ (เช่น อัปเดตแค่ publish_year)
app.patch('/books/:id', async (req, res) => {
  const { title, isbn, publish_year, author_id, category_id } = req.body;
  const fields = [];
  const values = [];

  if (title !== undefined) { fields.push('title = ?'); values.push(title); }
  if (isbn !== undefined) { fields.push('isbn = ?'); values.push(isbn); }
  if (publish_year !== undefined) { fields.push('publish_year = ?'); values.push(publish_year); }
  if (author_id !== undefined) { fields.push('author_id = ?'); values.push(author_id); }
  if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'ไม่มีข้อมูลที่ต้องการแก้ไข' });
  }

  values.push(req.params.id);

  try {
    const [result] = await pool.query(
      `UPDATE books SET ${fields.join(', ')} WHERE book_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const [rows] = await pool.query('SELECT * FROM books WHERE book_id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'ISBN นี้มีอยู่ในระบบแล้ว' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// DELETE /books/:id - ลบหนังสือที่สูญหายออกจากระบบ
app.delete('/books/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM books WHERE book_id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.status(200).json({ message: 'ลบหนังสือสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /borrowings/overdue - รายการหนังสือที่เกินกำหนดคืน
app.get('/borrowings/overdue', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT br.borrowing_id, b.title, m.name AS member, br.due_date
       FROM borrowings br
       JOIN books b ON br.book_id = b.book_id
       JOIN members m ON br.member_id = m.member_id
       WHERE br.status = 'overdue'`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});