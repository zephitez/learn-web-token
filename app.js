//get the packages

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
var config = require('./config'); //get config file
var User = require('./models/user');


//configuration

var port = process.env.PORT || 5000;
mongoose.connect(config.database);
app.set('superSecret', config.secret); //secret variable

//use body parser so we can get info in JSON format from post and/or url parameters
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//use morgan to log requests to console
app.use(morgan('dev'));

//routes
app.get('/', function(req, res) {
  res.send('Hello! the API is at http://localhost:' + port + '/API');
});

app.get('/setup', function(req, res) {

  //create a sample User
  var nick = new User({
    name: 'Nick Cranberry',
    password: 'password',
    admin: true
  });


//save the sample User
  nick.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');
    res.json({ success: true });


  });
});
//api routes

 //get an instance of the router for api routes

 var apiRoutes = express.Router();

 //route to authenticate a User
apiRoutes.post('/authenticate', function(req, res) {

  //find the users
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if(err) throw err;

    if(!user) {
      res.json({ success: false,
                  message: 'auth failed. user not found'});
    }
    else if (user) {

      //check if match
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'auth fail wrong pwd'});

      } else {
        //if user is found and pwd is right
        //create token
        console.log(app.get('superSecret'));
        var token = jwt.sign(user, app.get('superSecret'));

        //return information including token as json
        res.json({
          success: true,
          message: 'enjoy your token',
          token: token
        });

    }
    }
  });
});
 //route middleware to verify a token
apiRoutes.use(function(req, res, next) {

  var token = req.body.token || req.query.token || req.headers['x-access-token'];

//decode token

if (token) {

  //verifies secret
  jwt.verify(token, app.get('superSecret'), function(err, decoded) {
    if (err) return res.json({success: false, message: 'failed to auth token'});
  else {

     req.decoded = decoded;
     next();
  }

  });
} else {

  //if no token return Error
  return res.status(403).send({
    success: false,
    message: 'no token lar'
  });
}

});


 //route to show a random message
 apiRoutes.get('/', function(req, res) {
   res.json({message: 'Welcome to the coolest Api'});
 });

//route to return all users
apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

//apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);






 //start the server
 app.listen(port);
 console.log('magic happens at http://localhost:' + port);
