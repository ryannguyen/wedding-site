/**
    COLLECTIONS
 */

var Wedding = (window.Wedding = window.Wedding || {});

(function(App) {
    App.Invitations = Backbone.Collection.extend({
        url: '/api/invitations',
        model: App.Invitation,
        comparator: function(model) {
            return model.get('label').toLowerCase();
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
        ryanAll: 0,
        ryanAttending: 0,
        ryanNotAttending: 0,
        ryanNoResponse: 0,
        lisaAll: 0,
        lisaAttending: 0,
        lisaNotAttending: 0,
        lisaNoResponse: 0,
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

                var response = person.get('response');
                var invitation = window.App.invitations.get(person.get('invitation'));

                if( response === 'y') {
                    _this.attending = _this.attending + 1;

                    if(invitation.get('side') == "ryan") {
                        _this.ryanAttending = _this.ryanAttending + 1;
                    } else {
                        _this.lisaAttending = _this.lisaAttending + 1;
                    }
                } else if (response === 'n') {
                    _this.notAttending = _this.notAttending + 1;

                    if(invitation.get('side') == "ryan") {
                        _this.ryanNotAttending = _this.ryanNotAttending + 1;
                    } else {
                        _this.lisaNotAttending = _this.lisaNotAttending + 1;
                    }

                } else {
                    _this.noResponse = _this.noResponse + 1;

                    if(invitation.get('side') == "ryan") {
                        _this.ryanNoResponse = _this.ryanNoResponse + 1;
                    } else {
                        _this.lisaNoResponse = _this.lisaNoResponse + 1;
                    }
                }
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
                infantCount: this.infantCount,
                ryanAll: this.ryanNoResponse + this.ryanNotAttending + this.ryanAttending,
                ryanNoResponse: this.ryanNoResponse,
                ryanNotAttending: this.ryanNotAttending,
                ryanAttending: this.ryanAttending,
                lisaAll: this.lisaNoResponse + this.lisaNotAttending + this.lisaAttending,
                lisaNoResponse: this.lisaNoResponse,
                lisaNotAttending: this.lisaNotAttending,
                lisaAttending: this.lisaAttending
            }
        }


    });

})(Wedding);
