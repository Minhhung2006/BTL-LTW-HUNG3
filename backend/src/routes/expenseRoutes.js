const express = require("express");
const router = express.Router();
const pool = require("../server");

// GET all expenses
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM expenses ORDER BY date DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new expense
router.post("/", async (req, res) => {
  try {
    const { title, amount, date } = req.body;

    const result = await pool.query(
      "INSERT INTO expenses (title, amount, date) VALUES ($1, $2, $3) RETURNING *",
      [title, amount, date]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
