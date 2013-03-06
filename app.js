
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
  comments: String,
  label: String,
  password: String,
  people: Array,
  photos: Array,
  side: String
});
var Invitation = connection.model('Invitation', invitationSchema);

// Express
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.engine('html', require('ejs').renderFile);
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

app.all('/admin/*', express.basicAuth('ryanandlisa', 'whitecollar'));


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

//UPDATE INVITATION
app.put('/api/invitations/:id', function (req, res) {
  delete req.body.id
  delete req.body._id
  delete req.body._v

  Invitation.update( { _id: req.params.id }, req.body,function(err, numAffected){
      console.log(numAffected);
      Invitation.findOne( { _id: req.params.id }, function(err, invitation) {
        res.send(invitation.toObject());
      });
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

// RSVP
app.get('/rsvp', function(req, res) {
  res.render('rsvp.html', {invitation: null });
});

app.post('/rsvp', function(req, res) {
  console.log(req.body.password);

  Invitation.findOne({ password: req.body.password }, function(err, result) {
      if(result)
        res.render('rsvp.html', {invitation: JSON.stringify(result.toObject())  });
      else
        res.redirect('/rsvp');
  })
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
