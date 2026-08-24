-- ============================================================
-- schema.sql
-- ระบบข้อมูลหนังสือ (Library Book Management System)
-- รหัสนิสิต: 67160009 | Pno: 1
-- ============================================================

DROP DATABASE IF EXISTS library_db;
CREATE DATABASE library_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE library_db;

-- ------------------------------------------------------------
-- ตาราง authors : ข้อมูลผู้แต่ง
-- ------------------------------------------------------------
CREATE TABLE authors (
    author_id     INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    nationality   VARCHAR(80),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- ตาราง categories : หมวดหมู่หนังสือ
-- ------------------------------------------------------------
CREATE TABLE categories (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE
);

-- ------------------------------------------------------------
-- ตาราง books : ข้อมูลหนังสือ
--   - FOREIGN KEY ไป authors, categories
--   - isbn ต้องไม่ซ้ำ (UNIQUE)
-- ------------------------------------------------------------
CREATE TABLE books (
    book_id       INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    isbn          VARCHAR(20) NOT NULL UNIQUE,
    publish_year  YEAR,
    author_id     INT NOT NULL,
    category_id   INT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_books_author
        FOREIGN KEY (author_id) REFERENCES authors(author_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_books_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- ตาราง members : สมาชิกห้องสมุด
-- ------------------------------------------------------------
CREATE TABLE members (
    member_id     INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    joined_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- ตาราง borrowings : รายการยืม-คืนหนังสือ
--   - FOREIGN KEY ไป books, members
--   - ON DELETE CASCADE: ถ้าลบสมาชิก ประวัติการยืมของสมาชิกนั้นจะถูกลบตาม
--   - status จำกัดค่าด้วย CHECK constraint
-- ------------------------------------------------------------
CREATE TABLE borrowings (
    borrowing_id  INT AUTO_INCREMENT PRIMARY KEY,
    book_id       INT NOT NULL,
    member_id     INT NOT NULL,
    borrow_date   DATE NOT NULL,
    due_date      DATE NOT NULL,
    return_date   DATE DEFAULT NULL,
    status        ENUM('borrowed', 'returned', 'overdue') NOT NULL DEFAULT 'borrowed',
    CONSTRAINT fk_borrowings_book
        FOREIGN KEY (book_id) REFERENCES books(book_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_borrowings_member
        FOREIGN KEY (member_id) REFERENCES members(member_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_due_after_borrow CHECK (due_date >= borrow_date)
);

-- ------------------------------------------------------------
-- Index เพิ่มเติมเพื่อเร่งการค้นหา
-- ------------------------------------------------------------
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_borrowings_status ON borrowings(status);
