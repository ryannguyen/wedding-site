var mongoose = require('mongoose');

// Connect to DB
var connection = mongoose.connection;
var connection_string = process.env.MONGOLAB_URI || 'mongodb://ryan:password@localhost:27017/rsvp';

mongoose.connect(connection_string);

var invitationSchema = new mongoose.Schema({
    address: String,
    comments: String,
    email: String,
    label: String,
    lodging: Number,
    password: String,
    people: Array,
    photos: Array,
    side: String,
    modified_date: Date
});

exports.Invitation = connection.model('Invitation', invitationSchema);
