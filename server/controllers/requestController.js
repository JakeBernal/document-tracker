const db = require("../config/db");

// CREATE REQUEST
exports.createRequest = (req, res) => {
  const { user_id, document_type_id, notes } = req.body;

  const sql = `
    INSERT INTO requests (user_id, document_type_id, notes)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [user_id, document_type_id, notes], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({ message: "Request created successfully!" });
  });
};

// GET USER REQUESTS
exports.getMyRequests = (req, res) => {
  const { user_id } = req.params;

  db.query(
    "SELECT * FROM requests WHERE user_id = ?",
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json(err);

      res.json(results);
    }
  );
};

// GET SINGLE REQUEST
exports.getRequestById = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM requests WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json(err);

      res.json(results[0]);
    }
  );
};

// UPDATE STATUS (ADMIN)
exports.updateStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query(
    "UPDATE requests SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({ message: "Status updated!" });
    }
  );
};

// FILE UPLOAD (placeholder)
exports.uploadFile = (req, res) => {
  res.json({ message: "File upload works" });
};