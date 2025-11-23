-- sample user
INSERT INTO users (email, full_name) VALUES ('test@example.com', 'Người Dùng') RETURNING user_id;

-- categories
INSERT INTO categories (name) VALUES ('Ăn uống'), ('Đi lại'), ('Giải trí');

-- sample budget for Nov 2025
INSERT INTO budgets (user_id, month, year, limit_amount) VALUES (1, 11, 2025, 7000000);

-- sample expenses (Nov 2025)
INSERT INTO expenses (user_id, category_id, amount, note, created_time) VALUES
(1, 1, 1500000, 'Ăn trưa', '2025-11-02'),
(1, 2, 500000, 'Taxi', '2025-11-05'),
(1, 3, 1200000, 'Xem phim', '2025-11-10'),
(1, 1, 1800000, 'Ăn tối', '2025-11-12');
