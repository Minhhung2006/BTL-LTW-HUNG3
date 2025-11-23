import pool from '../config/db.js';

export const getMonthlyReport = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                SUM(amount) AS total_spent,
                (SUM(amount) / 7000000.0) * 100 AS percent_of_limit
            FROM expenses
            WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
        `);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

export const getCategoryReport = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT category, SUM(amount) AS total
            FROM expenses
            GROUP BY category
        `);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

export const getYearlyStats = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                EXTRACT(MONTH FROM created_at) AS month,
                SUM(amount) AS total_spent,
                7000000 AS limit_amount,
                CASE 
                    WHEN SUM(amount) > 7000000 THEN SUM(amount) - 7000000 
                    ELSE 0 
                END AS exceeded
            FROM expenses
            WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            GROUP BY month
            ORDER BY month
        `);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};
