$(function() {
    /**
        MODELS
     */
    var _events = _.extend({}, Backbone.Events);

    var Invitation = Backbone.Model.extend({
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
            }
        },
        _setPeople: function() {
            var people = [];
            this.people.each(function(person) {
                people.push(person.attributes);
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
        }

    });

    var Person = Backbone.Model.extend({});

    /**
        COLLECTIONS
     */
    var Invitations = Backbone.Collection.extend({
        url: '/api/invitations',
        model: Invitation,
        comparator: function(model) {
            return model.get('label').toLowerCase();
        }
    });

    var People = Backbone.Collection.extend({
        model: Person
    });

    /**
       VIEWS
     */
    var InvitationsView = Backbone.View.extend({
        className: 'row',
        template: _.template($('#invitations-template').html()),
        initialize: function() {
            this.listenTo(this.collection, 'add', this.addInvitation);
            this.listenTo(this.collection, 'reset', this.renderInvitations);
            this.listenTo(_events, "editInvitation", this.hide);
        },
        render: function() {
            this.$el.html(this.template());
            return this;
        },
        renderInvitations: function() {
            this.collection.each(function(i) {
                var view = new InvitationTableRow({ model: i });
                this.$('.table tbody').append( view.render().el );
            });
        },
        addInvitation: function(invitation) {
            var view = new InvitationTableRow({ model: invitation });
            var index = this.collection.indexOf(invitation);

            if(index == 0) {
                this.$('.table tbody').prepend( view.render().el );
            } else {
                 view.render().$el.insertAfter(this.$('.table tbody tr')[index-1]);
            }
        },
        hide: function() {
            this.$el.hide();
        },
        show: function() {
            this.$el.show();
        },
    });

    var InvitationTableRow = Backbone.View.extend({
        tagName: 'tr',
        template: _.template($('#invitation-table-row-template').html()),
        events: {
            'click' : 'editInvitation'
        },
        initialize: function() {
            this.listenTo(this.model.collection, 'reset', this.remove);
            this.listenTo(this.model, 'change', this.render);
        },
        render: function() {
            this.$el.html(this.template( this.model.attributes ));
            return this;
        },
        editInvitation: function () {
            var view = new EditInvitationView({ model: this.model });
            $("#content").append(view.render().$el);
            _events.trigger('editInvitation');
        }
    });

    var NewInvitationView = Backbone.View.extend({
        className: 'row',
        template: _.template($('#invitation-form-template').html()),
        events: {
            'click .add-invitee-btn' : 'addInvitee',
            'click .save' : 'save',
            'click .cancel' : 'cancel'
        },
        initialize: function() {
            this.model = new Invitation();
        },
        render: function() {
            this.$el.html(this.template());
            return this;
        },
        hide: function() {
            this.model.clear();
            this.$el.hide();
        },
        show: function() {
            this.render();
            this.$el.show();
        },
        addInvitee: function() {
            var $name = this.$("#invitee-name"),
                $type = this.$("#invitee-type"),
                person = new Person({
                    name: $name.val(),
                    type: $type.val()
                });

            this.model.people.add(person);
            this.addInviteeToForm(person);

            $name.val('');
            $type.val('adult');
        },
        addInviteeToForm: function(person) {
            var view = new InviteeItemView({ model: person, collection: this.model.people});
            this.$('#invitees').append( view.render().el );
        },
        cancel: function() {
            _events.trigger('showInvitations');
        },
        save: function() {
            var label = this.$('#invitation-label').val();
            var side = this.$('#invitation-side').val();
            var address = this.$('#invitation-address').val();
            var _this = this;

            if(!label) {
                window.alert('You need to set a label');
                return;
            }

            this.model.set({ label: label, side: side, address:address});
            this.collection.create(this.model.prep().attributes, {
                success: function() {
                    _events.trigger('showInvitations');
                }
            });
        }
    });

    var EditInvitationView = NewInvitationView.extend({
        initialize: function() {
            this.listenTo(_events, "showInvitations", this.remove);
        },
        render: function() {
            NewInvitationView.prototype.render.apply(this, arguments);


            this.$('#invitation-label').val(this.model.get('label'));
            this.$('#invitation-address').val(this.model.get('address'));

            if(this.model.get('side'))
                this.$('.' + this.model.get('side')).attr('selected', true);

            var _this = this;
            this.model.people.each(function(person) {
                _this.addInviteeToForm(person);
            });

            this.$('.header').html('Edit Invitation Details');
            this.$('.save').html('Update');

            return this;
        },
        save: function () {
            var label = this.$('#invitation-label').val();
            var side = this.$('#invitation-side').val();
            var address = this.$('#invitation-address').val();

            this.model.prep();
            this.model.save({ label: label, side: side, address:address}, {
                success: function() {
                    console.log('hi');
                    _events.trigger('showInvitations');
                },
                error: function() {
                    console.log('error');
                }
            });
        }
    });

    var InviteeItemView = Backbone.View.extend({
        tagName: 'li',
        template: _.template($('#invitee-item-template').html()),
        events: {
            'click a' : 'removeInvitee'
        },
        render: function() {
            var type = this.model.get('type').substr(0,1).toUpperCase()
                        +  this.model.get('type').substr(1);
            this.$el.html(
                this.template({
                    name: this.model.get('name'),
                    type: type
                })
            );
            return this;
        },
        removeInvitee: function() {
            this.collection.remove(this.model);
            this.remove();
        }
    });

    var AppView = Backbone.View.extend({
        className: 'row',
        template: _.template($('#app-template').html()),
        events: {
            'click .invitations-link' : 'showInvitations',
            'click .new-invitation-link' : 'showNewInvitationForm'
        },
        initialize: function() {
            _.bindAll(this, '_showInvitations', '_showNewInvitationForm');

            this.$app = $('#app');
            this.invitations = new Invitations;

            this.invitationFormView = new NewInvitationView({
                collection: this.invitations
            })
            this.invitationsView = new InvitationsView({
                collection: this.invitations
            });

            _events.on("showInvitations", this._showInvitations);
            _events.on("showInvitationForm", this._showNewInvitationForm);
        },
        render: function() {
            this.$el.html(this.template());
            this.$('#content').append(this.invitationsView.render().el);
            this.$('#content').append(this.invitationFormView.render().el);

            this.invitationFormView.hide();
            this.$app.html(this.$el);

            this.invitations.fetch();
        },
        showInvitations: function() {
            _events.trigger('showInvitations');
        },
        _showInvitations: function() {
            $('.active').removeClass('active')
            this.$('.invitations-link').parent().addClass('active');
            this.invitationFormView.hide();
            this.invitationsView.show();
        },
        showNewInvitationForm: function() {
            _events.trigger('showInvitationForm');
        },
        _showNewInvitationForm: function() {
            $('.active').removeClass('active')
            this.$('.new-invitation-link').parent().addClass('active');
            this.invitationsView.hide();
            this.invitationFormView.show();
        }
    });

    window.App = new AppView;
    window.App.render();
});
