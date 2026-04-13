exports.uploadFile = (req, res) => {
  const { request_id } = req.body;
  const filePath = req.file.path;

  db.query(
    "INSERT INTO uploads (request_id, file_path) VALUES (?, ?)",
    [request_id, filePath],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "File uploaded successfully" });
    }
  );
};