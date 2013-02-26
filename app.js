
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose');

// Connect to DB
var connection = mongoose.connection;
var connection_string = process.env.MONGOLAB_URI || 'mongodb://ryan:password@localhost:27017/rsvp';

mongoose.connect(connection_string);

var invitationSchema = new mongoose.Schema({
  address: String,
  label: String,
  password: String,
  people: Array,
  side: String
});
var Invitation = connection.model('Invitation', invitationSchema);

// Express
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// GET INVITATIONS
app.get('/api/invitations', function(req, res) {
  Invitation
    .find()
    .sort('label')
    .exec(function(err, results) {
      res.send(results);
    });
});

// CREATE INVITATION
app.post('/api/invitations', function(req, res) {
    var invitation = new Invitation(req.body);
    invitation.save(function(err) {
      res.send(invitation.toObject());
    });
});

app.put('/api/invitations/:id', function (req, res) {
  res.send(200)
  return;
  models.Item.remove({ _id: req.params.id }, function(err) {
    res.send(200);
  });
});

// DELETE INVITATION
app.delete('/api/invitations/:id', function (req, res) {
  Invitation.remove({ _id: req.params.id }, function(err) {
    res.send(200);
  });
});

app.post('/api/invitations/:id', function (req, res) {
  res.send(200)
  return;
  models.Item.remove({ _id: req.params.id }, function(err) {
    res.send(200);
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
