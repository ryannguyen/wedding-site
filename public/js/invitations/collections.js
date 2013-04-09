/**
    COLLECTIONS
 */

var Wedding = (window.Wedding = window.Wedding || {});

(function(App) {
    App.Invitations = Backbone.Collection.extend({
        attendingCount: 0,
        notAttendingCount: 0,
        url: '/api/invitations',
        model: App.Invitation,
        initialize: function() {
            this.count();
            this.listenTo(this, 'reset', this.count);
        },
        comparator: function(model) {
            return model.get('label').toLowerCase();
        },
        count: function() {
            var _this = this;
            this.each(function(model) {
                model.people.each(function(person) {
                    if(person.get('type') == "adult" )
                        _this.adultCount = _this.adultCount + 1;
                    if(person.get('type') == "child" )
                        _this.childrenCount = _this.childrenCount + 1;
                    if(person.get('type') == "infant" || person.get('type') == "Infant" )
                        _this.infantCount = _this.infantCount + 1;
                    if(person.get('type') == "toddler" )
                        _this.toddlerCount = _this.toddlerCount + 1;

                });

                if(model.hasResponded()) {
                    model.people.each(function(person) {
                        if(person.get('response') == 'y') {
                            _this.attendingCount = _this.attendingCount + 1;
                        } else if(person.get('response') == 'n'){
                            _this.notAttendingCount = _this.notAttendingCount + 1;
                        }
                    })
                }
            });
        }
    });

    App.People = Backbone.Collection.extend({
        model: App.Person,
        attending: 0,
        notAttending: 0,
        noResponse: 0,
        adultCount: 0,
        childrenCount: 0,
        toddlerCount: 0,
        infantCount: 0,
        comparator: function(model) {
            return model.get('name').toLowerCase();
        },
        count: function() {
            var _this = this;
            this.attending = 0;
            this.notAttending = 0;
            this.noResponse = 0;
            this.adultCount = 0;
            this.childrenCount = 0;
            this.toddlerCount = 0;
            this.infantCount = 0;

            this.each(function(person) {
                if(person.get('type') == "adult" )
                    _this.adultCount = _this.adultCount + 1;
                if(person.get('type') == "child" )
                    _this.childrenCount = _this.childrenCount + 1;
                if(person.get('type') == "infant" || person.get('type') == "Infant" )
                    _this.infantCount = _this.infantCount + 1;
                if(person.get('type') == "toddler" )
                    _this.toddlerCount = _this.toddlerCount + 1;

                if(person.get('type') == "infant" || person.get('type') == "Infant")
                    return;

                switch(person.get('response')) {
                    case 'y':
                        _this.attending = _this.attending + 1;
                        break;
                    case 'n':
                        _this.notAttending = _this.notAttending + 1;
                        break;
                    default:
                        _this.noResponse = _this.noResponse + 1;
                };

            });
        },
        getCount: function() {
            return {
                all: this.adultCount+this.childrenCount+this.toddlerCount,
                attending: this.attending,
                notAttending: this.notAttending,
                noResponse: this.noResponse,
                adultCount: this.adultCount,
                childrenCount: this.childrenCount,
                toddlerCount: this.toddlerCount,
                infantCount: this.infantCount
            }
        }


    });

})(Wedding);
