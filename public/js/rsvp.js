$(function() {
    var _events = _.extend({}, Backbone.Events);

    var Person = Backbone.Model.extend({

    });

    var Invitation = Backbone.Model.extend({
        url: '/api/invitations/',
        defaults: {
            address: '',
            side: ''
        },
        initialize: function(attr, options) {
            attr = attr || {};

            if(attr.people) {
                this.people = new People(attr.people);
            } else {
                this.people = new People;
            }

            if(attr._id) {
                this.set('id', attr._id);
                this.url = this.url + attr._id;
            }
        },
        _setPeople: function() {
            var people = [];
            this.people.each(function(person) {
                people.push(person.attributes);
            });

            this.set('people', people);
            return this;
        }
    });

    var People = Backbone.Collection.extend({
        model: Person
    });

    var PersonInputView = Backbone.View.extend({
        template: Handlebars.compile($('#person-input-template').html()),
        events: {
            'change select[name=response]':'update_response',
            'change select[name=chair]':'update_seating',
        },
        render: function() {
            var options = {
                show_seating_option: this.model.get('type') == "Infant" || this.model.get('type') == "infant" || this.model.get('type') == "toddler",
                attending: this.model.get('response') == 'y',
                not_attending: this.model.get('response') == 'n',
                provided: this.model.get('seating') == '1',
                booster: this.model.get('seating') == '2',
                high_chair: this.model.get('seating') == '3'
            };


            this.$el.html(this.template(_.extend(options, this.model.attributes)));
            return this;
        },
        update_response: function() {
            this.model.set('response', this.$('select[name=response]').val());
        },
        update_seating: function() {
            this.model.set('seating', this.$('select[name=chair]').val());
        }
    });

    var InvitationView = Backbone.View.extend({
        className: 'row',
        template: Handlebars.compile($('#invitation-template').html()),
        events: {
            'click .save' : 'save',
        },
        render: function() {
            this.$el.html(this.template(this.model.attributes));

            var _this = this;
            this.model.people.each(function(person) {
                var view = new PersonInputView({ model: person });

                _this.$(".people").append( view.render().$el);
            });

            return this;
        },
        save: function() {
            var _this = this;

            this.model._setPeople();
            this.model.save({comments: this.$("#invitation-comments").val()}, {
                success: function(invitation, response) {
                    _this.$('.alert').show();
                    _this.$('.form-actions').hide();
                }
            });
        }
    });

    var LoginView = Backbone.View.extend({
        className: 'row',
        template: _.template($('#login-template').html()),
        render: function() {
            this.$el.html(this.template());
            return this;
        }
    });

    var AppView = Backbone.View.extend({
        className: 'row',
        template: _.template($('#app-template').html()),
        initialize: function() {
            this.invitation = null;

            if(window.VARS.invitation) {
                this.invitation = new Invitation(window.VARS.invitation);
            }
        },
        render: function() {
            var $app = $('#app');

            this.$el.html(this.template());

            if(this.invitation) {
                var view = new InvitationView({ model: this.invitation });
                this.$el.append(view.render().$el);
            } else {
                var view = new LoginView;
                this.$el.append(view.render().$el);
            }

            $app.html(this.$el);
        }
    });


    window.App = new AppView;
    window.App.render();
});
