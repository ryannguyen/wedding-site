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
            attr = attr || {};

            if(attr.people) {
                this.people = new App.People(attr.people);
            } else {
                this.people = new App.People;
            }

            if(!attr.modified_date)
                this.set('modified_date', null);

            if(attr._id) {
                this.set('id', attr._id);
            }
        },
        _setPeople: function() {
            var people = [];
            this.people.each(function(person) {
                var attr = person.attributes;
                if(attr.invitation)
                    delete attr.invitation
                people.push(attr);
            });


            this.set('people', people);
            return this;
        },
        _generatePassword: function() {
            if(this.get('password')) return;

            var text = "";

            // no i or l to avoid confusion
            var possible = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789";

            for( var i=0; i < 5; i++ )
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            this.set('password', text)
            return this;
        },
        prep: function() {
            this._setPeople()._generatePassword();
            return this;
        },
        clear: function() {
            Backbone.Model.prototype.clear.apply(this, arguments);
            this.people.reset(null);
        },
        hasResponded: function() {
            return !!this.people.find(function(p){ return p.get('response') });
        }

    });

    App.Person = Backbone.Model.extend({});
})(Wedding);
