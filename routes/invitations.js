var models = require('./../lib/models');

exports.index = function(req, res) {
    res.render('invitations.html');
}

// LIST INVITATIONS
exports.list = function(req, res) {
	models.Invitation
		.find()
 		.sort('label')
 		.exec(function(err, results) {
			res.send(results);
  		});
};

exports.edit = function(req, res) {
    res.render('invitations/edit.html', {
        invitation: req.invitation
    });
};

exports.find = function (req, res, next) {
    models.Invitation.findById(req.params.id, function(err, invitation) {
        req.invitation = invitation;
        next();
    });
}

// DELETE INVITATION
exports.delete = function (req, res) {
  models.Invitation.remove({ _id: req.params.id }, function(err) {
    res.send(200);
  });
};

// var app = {};

// CREATE INVITATION
exports.create =  function(req, res) {
    var invitation = new models.Invitation(req.body);
    invitation.save(function(err) {
      res.send(invitation.toObject());
    });
};

//UPDATE INVITATION
exports.update = function (req, res) {
  delete req.body.id
  delete req.body._id
  delete req.body._v

  req.body.modified_date = Date.now();

  models.Invitation.update( { _id: req.params.id }, req.body,function(err, numAffected){
      console.log(numAffected);
      models.Invitation.findOne( { _id: req.params.id }, function(err, invitation) {
        res.send(invitation.toObject());
      });
    });
};



// app.post('/api/invitations/:id', function (req, res) {
//   res.send(200)
//   return;
//   models.Item.remove({ _id: req.params.id }, function(err) {
//     res.send(200);
//   });
// });
