var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/:filename', (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'static', fileName);
  
  // Check file extension and set content type
  if (fileName.endsWith('.pdf')) {
    res.contentType('application/pdf');
  }
  
  const options = {
    root: path.join(__dirname, '../static'),
    dotfiles: 'deny'
  };
  
  res.sendFile(fileName, options, (err) => {
    if (err) {
      res.status(err.status || 404).end();
    }
  });
});

module.exports = router;