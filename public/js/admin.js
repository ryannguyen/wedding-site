var Wedding = (window.Wedding = window.Wedding || {});

(function(App) {
    App._events = _.extend({}, Backbone.Events);

    /**
       VIEWS
     */
    App.InvitationsView = Backbone.View.extend({
        className: 'row',
        template: _.template($('#invitations-template').html()),
        initialize: function() {
            this.listenTo(this.collection, 'add', this.addInvitation);
            this.listenTo(this.collection, 'reset', this.renderInvitations);
            this.listenTo(this.collection, 'reset', this.updateCount);
            this.listenTo(App._events, "editInvitation", this.hide);
        },
        render: function() {
            this.$el.html(this.template({
                adultCount: this.collection.adultCount,
                infantCount: this.collection.infantCount,
                childCount: this.collection.childrenCount,
                toddlerCount: this.collection.toddlerCount
            }));
            return this;
        },
        updateCount: function() {
            this.$('.adultCount').html(this.collection.adultCount);
            this.$('.infantCount').html(this.collection.infantCount);
            this.$('.childCount').html(this.collection.childrenCount);
            this.$('.toddlerCount').html(this.collection.toddlerCount);
        },
        renderInvitations: function() {
            this.collection.each(function(i) {
                var view = new App.InvitationTableRow({ model: i });
                this.$('.table tbody').append( view.render().el );
            });
        },
        addInvitation: function(invitation) {
            var view = new App.InvitationTableRow({ model: invitation });
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

    App.InvitationTableRow = Backbone.View.extend({
        tagName: 'tr',
        template: _.template($('#invitation-table-row-template').html()),
        events: {
            'click a.edit' : 'editInvitation'
        },
        initialize: function() {
            this.listenTo(this.model.collection, 'reset', this.remove);
            this.listenTo(this.model, 'change', this.render);
        },
        render: function() {
            this.$el.html(this.template( this.model.attributes ));
            return this;
        },
        editInvitation: function (evt) {
            console.log("1");
            var view = new App.EditInvitationView({ model: this.model });
            console.log("2");
            $("#content").append(view.render().$el);
            console.log("3");
            App._events.trigger('editInvitation');

            return false;
        }
    });

    App.NewInvitationView = Backbone.View.extend({
        className: 'row',
        template: _.template($('#invitation-form-template').html()),
        events: {
            'click .add-invitee-btn' : 'addInvitee',
            'click .save' : 'save',
            'click .cancel' : 'cancel'
        },
        initialize: function() {
            this.model = new App.Invitation();
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
                person = new App.Person({
                    name: $name.val(),
                    type: $type.val()
                });

            this.model.people.add(person);
            this.addInviteeToForm(person);

            $name.val('');
            $type.val('adult');
        },
        addInviteeToForm: function(person) {
            var view = new App.InviteeItemView({ model: person, collection: this.model.people});
            this.$('#invitees').append( view.render().el );
        },
        cancel: function() {
            App._events.trigger('showInvitations');
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
                    App._events.trigger('showInvitations');
                }
            });
        }
    });

    App.EditInvitationView = App.NewInvitationView.extend({
        initialize: function() {
            this.listenTo(App._events, "showInvitations", this.remove);
                        console.log(this.model.id);
        },
        render: function() {
            App.NewInvitationView.prototype.render.apply(this, arguments);


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
                    App._events.trigger('showInvitations');
                },
                error: function() {
                    console.log('error');
                }
            });
        }
    });

    App.InviteeItemView = Backbone.View.extend({
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

    App.AppView = Backbone.View.extend({
        template: _.template($('#app-template').html()),
        events: {
            'click .invitations-link' : 'showInvitations',
            'click .new-invitation-link' : 'showNewInvitationForm'
        },
        initialize: function() {
            _.bindAll(this, '_showInvitations', '_showNewInvitationForm');

            this.$app = $('#app');
            this.invitations = new App.Invitations;

            this.invitationFormView = new App.NewInvitationView({
                collection: this.invitations
            })
            this.invitationsView = new App.InvitationsView({
                collection: this.invitations
            });

            App._events.on("showInvitations", this._showInvitations);
            App._events.on("showInvitationForm", this._showNewInvitationForm);
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
            App._events.trigger('showInvitations');
        },
        _showInvitations: function() {
            $('.active').removeClass('active')
            this.$('.invitations-link').parent().addClass('active');
            this.invitationFormView.hide();
            this.invitationsView.show();
        },
        showNewInvitationForm: function() {
            App._events.trigger('showInvitationForm');
        },
        _showNewInvitationForm: function() {
            $('.active').removeClass('active')
            this.$('.new-invitation-link').parent().addClass('active');
            this.invitationsView.hide();
            this.invitationFormView.show();
        }
    });
})(Wedding);
