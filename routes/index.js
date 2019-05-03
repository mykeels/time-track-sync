var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home', key: '1' });
});

router.get('/logout', function(req, res, next) {
  res.render('logout');
});

router.get('/:key', function(req, res, next) {
  res.render('index', { title: 'Home', key: req.params.key });
});

module.exports = router;
