var Wedding = (window.Wedding = window.Wedding || {});

(function(App) {
    App._events = _.extend({}, Backbone.Events);

    App.AppView = Backbone.View.extend({
        template: Handlebars.compile($('#app-template').html()),
        events: {
            "click a.invitations":"showInvitations",
            "click a.people":"showPeople",
            "click a.new":"showNewInvitation"
        },
        initialize: function() {
            _.bindAll(this, 'resetPeople', 'editInvitation', 'showInvitations', 'showPeople', 'addPeople');

            this.invitations = new App.Invitations;
            this.people = new App.People;

            this.invitations.on('reset', this.resetPeople);
            this.invitations.on('change', this.resetPeople);
            this.invitations.on('edit', this.editInvitation);
            this.invitations.on('add', this.addPeople);

            this.listenTo(App._events, 'showInvitations', this.showInvitations);
            this.listenTo(App._events, 'showPeople', this.showPeople);
        },
        render: function() {
            this.$el.html(this.template());
            this.showPeople();
            this.invitations.fetch();
            return this;
        },
        resetPeople: function() {
            var _this =this;

            this.currentView = null;
            var peopleArr = [];
            this.invitations.each(function(i) {
                _.each(i.get('people'), function(p) {
                    p.invitation = i.get('_id');
                    peopleArr.push(p);
                });
            });

            this.people.reset(peopleArr);
        },
        addPeople: function(invitation) {
            var _this = this;

            _.each(invitation.get('people'), function(p) {
                p.invitation = invitation.get('_id');
                _this.people.add(p);
            });
        },
        editInvitation: function(model) {
            var view = new App.EditInvitationView({ model: model });
            this.$('#content').html(view.render().el);
        },
        showInvitations: function() {
            var view = new App.InvitationsView({ collection: this.invitations });
            this.$('#content').html(view.render().el);
        },
        showPeople: function() {
            var view = new App.PeopleView({ collection: this.people });
            this.$('#content').html(view.render().el);
        },
        showNewInvitation: function() {
            var view = new App.NewInvitationView({collection: this.invitations});
            this.$('#content').html(view.render().el);
        }

    });

    App.InvitationsView = Backbone.View.extend({
        template: Handlebars.compile($('#invitations-template').html()),
        events: {
            'click .filter-all':'filterAll',
            'click .filter-ryan':'filterRyan',
            'click .filter-lisa':'filterLisa'
        },
        initialize: function() {
            _.bindAll(this, 'renderInvitations');
            this.collection.on('reset', this.renderInvitations);
        },
        filterAll: function(evt) {
            evt.stopPropagation();
            this.collection.trigger('filterAll');
            this.$("ul.nav-list li").removeClass('active');
            this.$("ul.nav-list .filter-all").parent().addClass('active');


            return false;
        },
        filterLisa: function(evt) {
            evt.stopPropagation();
            this.collection.trigger('filterLisa');
            this.$("ul.nav-list li").removeClass('active');
            this.$("ul.nav-list .filter-lisa").parent().addClass('active');


            return false;
        },
        filterRyan: function(evt) {
            evt.stopPropagation();
            this.collection.trigger('filterRyan');
            this.$("ul.nav-list li").removeClass('active');
            this.$("ul.nav-list .filter-ryan").parent().addClass('active');


            return false;
        },
        render: function() {
            this.$el.html(this.template());
            this.renderInvitations();

            return this;
        },
        renderInvitations: function() {
            var _this = this;

            this.collection.each(function(i) {
                var view = new App.InvitationTableRow({ model: i, collection: _this.collection });
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
            _.bindAll(this, 'show', 'filterRyan', 'filterLisa');
            this.listenTo(this.model.collection, 'reset', this.remove);
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(App._events, 'showAllInvitations', this.show);
            this.collection.on('filterAll', this.show);
            this.collection.on('filterRyan', this.filterRyan);
            this.collection.on('filterLisa', this.filterLisa);
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
        },
        filterLisa: function(evt) {
            this.model.get('side') == 'lisa' ? this.$el.show() : this.$el.hide();
            return false;
        },
        filterRyan: function(evt) {
            this.model.get('side') == 'ryan' ? this.$el.show() : this.$el.hide();
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
            this.people = new App.People();
        },
        render: function() {
            this.$el.html(this.template(this.model.attributes));
            this.$(".header").html("New Invitation");
            return this;
        },
        addInvitee: function() {
            var $name = this.$("#invitee-name"),
                $type = this.$("#invitee-type"),
                person = new App.Person({
                    name: $name.val(),
                    type: $type.val()
                });

            this.people.add(person);
            this.addInviteeToForm(person);

            $name.val('');
            $type.val('adult');
        },
        addInviteeToForm: function(person) {
            var view = new App.InviteeItemView({ model: person, collection: this.people});
            this.$('#invitees').append( view.render().el );
        },
        cancel: function() {
            App._events.trigger('showPeople');
            return false;
        },
        save: function() {
            var attr = {
                label:      this.$('#invitation-label').val(),
                side:       this.$('#invitation-side').val(),
                address:    this.$('#invitation-address').val(),
                people:     this.people.toJSON()
            };

            var _this = this;

            if(!attr.label) {
                window.alert('You need to set a label');
                return;
            }

            this.model.set(attr);
            this.collection.create(this.model.attributes, {
                success: function(model, response) {
                    App._events.trigger('showPeople');
                },
                wait: true
            });
        }
    });

    App.EditInvitationView = App.NewInvitationView.extend({
        initialize: function() {
            this.people = new App.People(this.model.get('people'));
        },
        render: function() {
            this.$el.html(this.template(this.model.attributes));

            if(this.model.get('side'))
                this.$('.' + this.model.get('side')).attr('selected', true);

            var _this = this;
            this.people.each(function(person) {
                _this.addInviteeToForm(person);
            });

            this.$('.header').html('Edit Invitation Details');

            return this;
        },
        save: function () {
            var attr = {
                label:      this.$('#invitation-label').val(),
                side:       this.$('#invitation-side').val(),
                address:    this.$('#invitation-address').val(),
                people:     this.people.toJSON()
            };

            this.model.save(attr, {
                success: function() {
                    App._events.trigger('showPeople');
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
            'click a.remove' : 'removeInvitee',
            'click a.response': 'toggleResponse'
        },
        render: function() {
            var type = this.model.get('type').substr(0,1).toUpperCase()
                        +  this.model.get('type').substr(1);
            this.$el.html(
                this.template(this.model.attributes)
            );

            return this;
        },
        removeInvitee: function() {
            this.collection.remove(this.model);
            this.remove();
            return false;
        },
        toggleResponse: function(evt) {
            evt.stopPropagation();

            if(this.model.get('response') == 'y') {
                this.model.set('response', 'n');
            } else {
                this.model.set('response', 'y');
            }

            this.$('a.response').html(this.model.get('response'));

            return false;
        }
    });

    App.PeopleView = Backbone.View.extend({
        template: Handlebars.compile($('#people-template').html()),
        events: {
            "click a.filter-all":"filterAll",
            "click a.filter-attending":"filterAttending",
            "click a.filter-declined":"filterNotAttending",
            "click a.filter-no-response":"filterNoResponse",
            "click a.filter-adults":"filterAdults",
            "click a.filter-children":"filterChildren",
            "click a.filter-toddlers":"filterToddlers",
            "click a.filter-infants":"filterInfants",
            "click a.filter-lisa":"filterLisa",
            "click a.filter-lisaAttending":"filterLisaAttending",
            "click a.filter-lisaNotAttending":"filterLisaNotAttending",
            "click a.filter-lisaNoResponse":"filterLisaNoResponse",
            "click a.filter-ryan":"filterRyan",
            "click a.filter-ryanAttending":"filterRyanAttending",
            "click a.filter-ryanNotAttending":"filterRyanNotAttending",
            "click a.filter-ryanNoResponse":"filterRyanNoResponse"
        },
        initialize: function() {
            _.bindAll(this, 'renderPeopleList', 'addPerson', 'render');
            this.collection.on('reset', this.render);
            this.collection.on('add', this.render);
        },
        render: function() {
            this.collection.count();
            this.$el.html(this.template(this.collection.getCount()));
            this.renderPeopleList();

            return this;
        },
        renderPeopleList: function() {
            var _this = this;

            this.collection.each(function(p) {
                _this.addPerson(p);
            });
        },
        addPerson: function(person) {
            var view = new App.PeopleTableRow({ model: person, collection: this.collection});
            this.$('tbody').append( view.render().el );
        },
        filter: function(evt, trigger, className) {
            evt.stopPropagation();
            this.collection.trigger(trigger);
            this.$("ul.nav-list li").removeClass('active');
            this.$("ul.nav-list " + className).parent().addClass('active');
        },
        filterLisa: function(evt) {
            this.filter(evt, 'filterLisa',".filter-lisa");
            return false;
        },
        filterLisaAttending: function(evt) {
            this.filter(evt, 'filterLisaAttending',".filter-lisaAttending");
            return false;
        },
        filterLisaNotAttending: function(evt) {
            this.filter(evt, 'filterLisaNotAttending',".filter-lisaNotAttending");
            return false;
        },
        filterLisaNoResponse: function(evt) {
            this.filter(evt, 'filterLisaNoResponse',".filter-lisaNoResponse");
            return false;
        },
        filterRyan: function(evt) {
            this.filter(evt, 'filterRyan',".filter-ryan");
            return false;
        },
        filterRyanAttending: function(evt) {
            this.filter(evt, 'filterRyanAttending',".filter-ryanAttending");
            return false;
        },
        filterRyanNotAttending: function(evt) {
            this.filter(evt, 'filterRyanNotAttending',".filter-ryanNotAttending");
            return false;
        },
        filterRyanNoResponse: function(evt) {
            this.filter(evt, 'filterRyanNoResponse',".filter-ryanNoResponse");
            return false;
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
        filterAdults: function(evt) {
            this.filter(evt, 'filterAdults',".filter-adults");
            return false;
        },
        filterChildren: function(evt) {
            this.filter(evt, 'filterChildren',".filter-children");
            return false;
        },
        filterToddlers: function(evt) {
            this.filter(evt, 'filterToddlers',".filter-toddlers");
            return false;
        },
        filterInfants: function(evt) {
            this.filter(evt, 'filterInfants',".filter-infants");
            return false;
        }
    });

    App.PeopleTableRow = Backbone.View.extend({
        tagName: 'tr',
        template: Handlebars.compile($('#people-row-template').html()),
        events: {
            "click a.show":"showInvitation"
        },
        initialize: function() {
            _.bindAll(this, 'filterPeopleAll', 'filterPeopleAttending', 'filterPeopleNotAttending', 'filterPeopleNoResponse',
                        'filterAdults', 'filterChildren', 'filterToddlers', 'filterInfants', 'filterRyan', 'filterLisa',
                        'filterRyanAttending', 'filterRyanNotAttending', 'filterRyanNoResponse',
                        'filterLisaAttending', 'filterLisaNotAttending', 'filterLisaNoResponse');

            this.listenTo(App._events, "filterPeopleAll", this.filterPeopleAll);
            this.listenTo(App._events, "filterPeopleAttending", this.filterPeopleAttending);
            this.listenTo(App._events, "filterPeopleNotAttending", this.filterPeopleNotAttending);
            this.listenTo(App._events, "filterPeopleNoResponse", this.filterPeopleNoResponse);
            this.collection.on("filterAdults", this.filterAdults);
            this.collection.on("filterChildren", this.filterChildren);
            this.collection.on("filterToddlers", this.filterToddlers);
            this.collection.on("filterInfants", this.filterInfants);
            this.collection.on("filterRyan", this.filterRyan);
            this.collection.on("filterRyanAttending", this.filterRyanAttending);
            this.collection.on("filterRyanNotAttending", this.filterRyanNotAttending);
            this.collection.on("filterRyanNoResponse", this.filterRyanNoResponse);
            this.collection.on("filterLisa", this.filterLisa);
            this.collection.on("filterLisaAttending", this.filterLisaAttending);
            this.collection.on("filterLisaNotAttending", this.filterLisaNotAttending);
            this.collection.on("filterLisaNoResponse", this.filterLisaNoResponse);
        },
        showInvitation: function(evt) {
            evt.stopPropagation();
            var invitation = window.App.invitations.get(this.model.get('invitation'));
            invitation.collection.trigger('edit', invitation);
            return false;
        },
        filterAdults: function() {
            if(this.model.get('type') == 'adult') {
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },
        filterChildren: function() {
            if(this.model.get('type') == 'child') {
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },
        filterToddlers: function() {
            if(this.model.get('type') == 'toddler') {
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },
        filterInfants: function() {
          if(this.model.get('type') == 'infant' || this.model.get('type') == 'Infant' ) {
                this.$el.show();
            } else {
                this.$el.hide();
            }
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
        filterRyan: function() {
            var invitation = window.App.invitations.get(this.model.get('invitation'));
            if(invitation.get('side') == 'ryan') {
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },
        filterRyanAttending: function() {
            var invitation = window.App.invitations.get(this.model.get('invitation'));
            if(invitation.get('side') == 'ryan' && this.model.get('response') == 'y') {
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },
        filterRyanNotAttending: function(){
            var invitation = window.App.invitations.get(this.model.get('invitation'));
            if(invitation.get('side') == 'ryan' && this.model.get('response') == 'n') {
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },
        filterRyanNoResponse: function() {
            var invitation = window.App.invitations.get(this.model.get('invitation'));
            if(invitation.get('side') == 'ryan' &&
                (this.model.get('response') == null || this.model.get('response') == undefined)){

                this.$el.show();

            } else {
                this.$el.hide();
            }
        },
        filterLisa: function() {
            var invitation = window.App.invitations.get(this.model.get('invitation'));
            if(invitation.get('side') == 'lisa') {
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },
        filterLisaAttending: function() {
            var invitation = window.App.invitations.get(this.model.get('invitation'));
            if(invitation.get('side') == 'lisa' && this.model.get('response') == 'y') {
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },
        filterLisaNotAttending: function(){
            var invitation = window.App.invitations.get(this.model.get('invitation'));
            if(invitation.get('side') == 'lisa' && this.model.get('response') == 'n') {
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },
        filterLisaNoResponse: function() {
            var invitation = window.App.invitations.get(this.model.get('invitation'));
            if(invitation.get('side') == 'lisa' &&
                (this.model.get('response') == null || this.model.get('response') == undefined)){

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
