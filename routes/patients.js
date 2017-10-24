var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET user page. */
router.get('/:id', function(req, res, next) {
  res.render('index', { title: 'Express', patientId: req.params.id });
});

module.exports = router;
