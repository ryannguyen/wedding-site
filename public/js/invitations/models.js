/**
 * MODELS
*/
var Wedding = (window.Wedding = window.Wedding || {});

(function(App) {

    App.Invitation = Backbone.Model.extend({
        defaults: {
            address: '',
            side: ''
        },
        initialize: function(attr, options) {
            _.bindAll(this, 'updateID');
            attr = attr || {};
            if(!attr.modified_date)
                this.set('modified_date', null);

            if(attr._id) {
                this.set('id', attr._id);
            } else {
                this.on("change:_id", this.updateID);
                this.generatePassword();
            }

        },
        updateID: function() {
            this.id = this.get("_id");
        },
        generatePassword: function() {
            if(this.get('password')) return;

            var text = "";

            // no i or l to avoid confusion
            var possible = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789";

            for( var i=0; i < 5; i++ )
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            this.set('password', text)
            return this;
        },
        clear: function() {
            Backbone.Model.prototype.clear.apply(this, arguments);
            this.people.reset(null);
        },
        hasResponded: function() {
            return !!_.find(this.get('people'), function(p){ return p.response });
        }

    });

    App.Person = Backbone.Model.extend({
        initialize: function() {
            _.bindAll(this, 'update', 'removeFromCollection');

            if(this.get('invitation')) {
                this.invitation = window.App.invitations.get(this.get('invitation'));
                this.invitation.on('change:people', this.update);
                this.invitation.on('destroy', this.removeFromCollection);
            }
        },
        removeFromCollection: function() {
            if(this.collection)
                this.collection.remove(this);
        },
        update: function() {
            var shouldDelete = true;
            var _this = this;

            _.each(this.invitation.get('people'), function(p) {
                if(p.name == _this.get('name')) {
                    shouldDelete = false;

                    _this.set(p);
                }
            });

            if(shouldDelete && this.collection) {
                this.collection.remove(this);
            }
        }
    });
})(Wedding);
