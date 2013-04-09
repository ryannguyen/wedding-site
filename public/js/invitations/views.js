var Wedding = (window.Wedding = window.Wedding || {});

(function(App) {
    App._events = _.extend({}, Backbone.Events);

    App.AppView = Backbone.View.extend({
        template: Handlebars.compile($('#app-template').html()),
        events: {
            "click a.invitations":"showInvitations",
            "click a.people":"showPeople"
        },
        initialize: function() {
            _.bindAll(this, 'resetPeople', 'editInvitation', 'showInvitations');

            this.invitations = new App.Invitations;
            this.people = new App.People;

            this.invitations.on('reset', this.resetPeople);
            this.invitations.on('edit', this.editInvitation);

            this.listenTo(App._events, 'showInvitations', this.showInvitations);
        },
        render: function() {
            this.$el.html(this.template());
            this.showInvitations();
            this.invitations.fetch();
            return this;
        },
        resetPeople: function() {
            var _this =this;

            this.people.reset();
            this.currentView = null;
            this.invitations.each(function(i) {
                i.people.each(function(p) {
                    var attr = p.attributes;
                    attr.invitation = i.attributes;

                    _this.people.add(p.attributes);

                    if(p.attributes.type == "infant" || p.attributes.type == "Infant")
                        return;

                    console.log(p.attributes.type);
                    switch(attr.response) {
                        case 'y':
                            _this.people.attending = _this.people.attending + 1;
                            break;
                        case 'n':
                            _this.people.notAttending = _this.people.notAttending + 1;
                            break;
                        default:
                            _this.people.noResponse = _this.people.noResponse + 1;
                    };
                });
            });
        },
        editInvitation: function(model) {
            var view = new App.EditInvitationView({ model: model });
            this.$('#content').html(view.render().el);
        },
        showInvitations: function() {
            var view = new App.InvitationsView({ collection: this.invitations })
            this.$('#content').html(view.render().el);
        },
        showPeople: function() {
            var view = new App.PeopleView({ collection: this.people })
            this.$('#content').html(view.render().el);
        }
    });

    App.InvitationsView = Backbone.View.extend({
        template: Handlebars.compile($('#invitations-template').html()),
        initialize: function() {
            _.bindAll(this, 'renderInvitations');
            this.collection.on('reset', this.renderInvitations);
        },
        render: function() {
            this.$el.html(this.template());
            this.renderInvitations();

            return this;
        },
        renderInvitations: function() {
            var _this = this;

            this.collection.each(function(i) {
                var view = new App.InvitationTableRow({ model: i });
                _this.$('tbody').append( view.render().el );
            });
        }
    });

    App.InvitationTableRow = Backbone.View.extend({
        tagName: 'tr',
        template: Handlebars.compile($('#invitation-table-row-template').html()),
        events: {
            'click a.edit' : 'editInvitation',
            'click a.show' : 'showInvitation',
            'click a.trash' : 'deleteInvitation'
        },
        initialize: function() {
            this.listenTo(this.model.collection, 'reset', this.remove);
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(App._events, 'filterInvitationsResponded', this.filterResponded);
            this.listenTo(App._events, 'showAllInvitations', this.show);
        },
        render: function() {
            var obj = _.extend({ hasResponded: this.model.hasResponded()}, this.model.attributes );
            this.$el.html(this.template( obj ));
            return this;
        },
        editInvitation: function (evt) {
            this.model.collection.trigger('edit', this.model);
            return false;
        },
        deleteInvitation: function(evt) {
            var confirm_delete = confirm("Are you sure you want to delete " + this.model.get('label') + "?");
            if(confirm_delete) {
                this.model.destroy();
                this.remove();
            } else {
                console.log('denied!');
            }
        },
        show: function() {
            this.$el.show();
            return false;
        },
        showInvitation: function(evt) {
            evt.stopPropagation();
            this.$('.details').toggle();
            return false;
        },
        filterResponded: function(evt) {
            this.model.hasResponded() ? this.$el.show() : this.$el.hide();
            return false;
        }
    });

    App.NewInvitationView = Backbone.View.extend({
        template: Handlebars.compile($('#invitation-form-template').html()),
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
        initialize: function() {},
        render: function() {
            this.$el.html(this.template(this.model.attributes));

            if(this.model.get('side'))
                this.$('.' + this.model.get('side')).attr('selected', true);

            var _this = this;
            this.model.people.each(function(person) {
                _this.addInviteeToForm(person);
            });

            this.$('.header').html('Edit Invitation Details');

            return this;
        },
        save: function () {
            var label = this.$('#invitation-label').val();
            var side = this.$('#invitation-side').val();
            var address = this.$('#invitation-address').val();

            this.model.prep();
            this.model.save({ label: label, side: side, address:address}, {
                success: function() {
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
        template: Handlebars.compile($('#invitee-item-template').html()),
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

    App.PeopleView = Backbone.View.extend({
        template: Handlebars.compile($('#people-template').html()),
        events: {
            "click a.filter-all":"filterAll",
            "click a.filter-attending":"filterAttending",
            "click a.filter-declined":"filterNotAttending",
            "click a.filter-no-response":"filterNoResponse"
        },
        initialize: function() {
            _.bindAll(this, 'renderPeopleList');
            this.collection.on('reset', this.renderPeopleList);
        },
        render: function() {
            this.$el.html(this.template({
                all: this.collection.attending+this.collection.notAttending+this.collection.noResponse,
                attending: this.collection.attending,
                notAttending: this.collection.notAttending,
                noResponse: this.collection.noResponse
            }));
            this.renderPeopleList();

            return this;
        },
        filterAll: function() {
            App._events.trigger('filterPeopleAll');
            this.$("ul.nav-list li").removeClass('active');
            this.$("ul.nav-list .filter-all").parent().addClass('active');
        },
        filterAttending: function() {
            App._events.trigger('filterPeopleAttending');
            this.$("ul.nav-list li").removeClass('active');
            this.$("ul.nav-list .filter-attending").parent().addClass('active');
        },
        filterNotAttending: function() {
            App._events.trigger('filterPeopleNotAttending');
            this.$("ul.nav-list li").removeClass('active');
            this.$("ul.nav-list .filter-declined").parent().addClass('active');
        },
        filterNoResponse: function() {
            App._events.trigger('filterPeopleNoResponse');
            this.$("ul.nav-list li").removeClass('active');
            this.$("ul.nav-list .filter-no-response").parent().addClass('active');
        },
        renderPeopleList: function() {
            var _this = this;

            this.collection.each(function(p) {
                var view = new App.PeopleTableRow({ model: p });
                _this.$('tbody').append( view.render().el );
            });
        }
    });

    App.PeopleTableRow = Backbone.View.extend({
        tagName: 'tr',
        template: Handlebars.compile($('#people-row-template').html()),
        events: {
            "click a.show":"showInvitation"
        },
        initialize: function() {
            _.bindAll(this, 'filterPeopleAll', 'filterPeopleAttending', 'filterPeopleNotAttending', 'filterPeopleNoResponse');
            this.listenTo(App._events, "filterPeopleAll", this.filterPeopleAll);
            this.listenTo(App._events, "filterPeopleAttending", this.filterPeopleAttending);
            this.listenTo(App._events, "filterPeopleNotAttending", this.filterPeopleNotAttending);
            this.listenTo(App._events, "filterPeopleNoResponse", this.filterPeopleNoResponse);

        },
        showInvitation: function(evt) {
            evt.stopPropagation();
            var invitation = window.App.invitations.get(this.model.get('invitation')._id);
            invitation.collection.trigger('edit', invitation);
            return false;
        },
        filterPeopleAll: function() {
            this.$el.show();
        },
        filterPeopleAttending: function() {
            if(this.model.get('response') == 'y') {
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },
        filterPeopleNotAttending: function() {
            if(this.model.get('response') == 'n') {
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },
        filterPeopleNoResponse: function() {
            if(!this.model.get('response')) {
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },
        render: function() {
            this.$el.html(this.template( this.model.attributes ));
            return this;
        }
    });

})(Wedding);