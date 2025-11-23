const pool = require('../server');

exports.addExpense = async (req, res) => {
  try {
    const { user_id, category_id, amount, note, created_time } = req.body;
    const r = await pool.query(
      `INSERT INTO expenses (user_id, category_id, amount, note, created_time)
       VALUES ($1,$2,$3,$4, COALESCE($5, CURRENT_TIMESTAMP)) RETURNING expense_id`,
      [user_id, category_id, amount, note, created_time]
    );
    res.json({ expense_id: r.rows[0].expense_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.listExpenses = async (req, res) => {
  try {
    const user_id = parseInt(req.query.user_id) || 1;
    const month = parseInt(req.query.month);
    const year = parseInt(req.query.year);

    let rows;
    if (month && year) {
      rows = (await pool.query(
        `SELECT e.*, c.name as category_name
         FROM expenses e LEFT JOIN categories c ON e.category_id=c.category_id
         WHERE e.user_id=$1
           AND EXTRACT(MONTH FROM e.created_time)=$2
           AND EXTRACT(YEAR FROM e.created_time)=$3
         ORDER BY e.created_time DESC`,
        [user_id, month, year]
      )).rows;
    } else {
      rows = (await pool.query(
        `SELECT e.*, c.name as category_name FROM expenses e LEFT JOIN categories c ON e.category_id=c.category_id WHERE e.user_id=$1 ORDER BY e.created_time DESC`,
        [user_id]
      )).rows;
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { category_id, amount, note } = req.body;
    await pool.query(
      `UPDATE expenses SET category_id=$1, amount=$2, note=$3 WHERE expense_id=$4`,
      [category_id, amount, note, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query(`DELETE FROM expenses WHERE expense_id=$1`, [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
