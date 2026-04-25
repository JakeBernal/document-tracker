const db = require("../config/db");

exports.createRequest = (req, res) => {
  const {
    user_id,
    document_type_id,
    full_name,
    birth_date,
    address,
    notes
  } = req.body;

  if (!user_id || !document_type_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const sql = `
    INSERT INTO requests 
    (user_id, document_type_id, full_name, birth_date, address, notes, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW())
  `;

  db.query(
    sql,
    [user_id, document_type_id, full_name, birth_date, address, notes],
    (err, result) => {
      if (err) {
        console.log("Insert error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({
        message: "Request submitted successfully",
        request_id: result.insertId
      });
    }
  );
};