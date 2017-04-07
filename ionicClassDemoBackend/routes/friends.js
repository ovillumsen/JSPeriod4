var express = require('express');
var router = express.Router();
var cors = require("cors");

router.all("/register", cors(), function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE'
  res.header['Access-Control-Allow-Headers'] = ' Content-Type, Accept';
  next();
})


router.post("/register/:distance", function (req, res) {
  var db = connection.get();
  var user = req.body;
  var distance = req.params.distance * 1000;//in km
  delete user.distance;
  user.created = new Date();  //This is the property with the TTL index
  db.collection("friends").findOneAndReplace(
    { userName: user.userName }, user, function (err, result) {
      if (err) {
        res.statusCode = 500;
        return res.json({ code: 500, msg: err.message });
      }
      if (result.value == null) {  //User was not found
        db.collection("friends").insertOne(user, function (err, result) {
          if (err) {
            res.statusCode = 500;
            return res.json({ code: 500, msg: err.message });
          }
          return findNearestAndMakeResponse(user, distance, res)
        });
      }
      else {
        return findNearestAndMakeResponse(user, distance, res);
      }
    });
});


function findNearestAndMakeResponse(user, distance, res) {
  var db = connection.get();
  db.collection("friends").find({
    userName: { $ne: user.userName },
    loc: { $near: user.loc, $maxDistance: distance }
  }, { _id: 0, created: 0 }).toArray(function (err, docs) {
    if (err) {
      res.statusCode = 500;
      return res.json({ code: 500, msg: err.message });
    }
    return res.json(docs);
  });
}

module.exports = router;