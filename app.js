
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var models = require('./lib/models');
var invitations = require('./routes/invitations');

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

// redirect to items if you go to index
app.get('/admin', function(req, res, next){
  res.redirect('/admin/invitations');
});
app.get('/admin/invitations', invitations.index);
app.get('/api/invitations', invitations.list);
app.post('/api/invitations', invitations.create);
app.put('/api/invitations/:id', invitations.update)
app.delete('/api/invitations/:id', invitations.delete);

// RSVP
app.get('/rsvp', function(req, res) {
  res.render('rsvp.html', {invitation: null });
});

app.post('/rsvp', function(req, res) {
  console.log(req.body.password);

  models.Invitation.findOne({ password: req.body.password }, function(err, result) {
      if(result)
        res.render('rsvp.html', {invitation: JSON.stringify(result.toObject())  });
      else
        res.redirect('/rsvp');
  })
});

// Status Board
app.get('/status_board', function(req, res) {
  models.Invitation
    .find()
    .sort('label')
    .exec(function(err, results) {
        res.render('status_board_table.html');
    });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
