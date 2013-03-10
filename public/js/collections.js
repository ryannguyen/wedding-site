/**
    COLLECTIONS
 */

var Wedding = (window.Wedding = window.Wedding || {});

(function(App) {
    App.Invitations = Backbone.Collection.extend({
        adultCount: 0,
        childrenCount: 0,
        toddlerCount: 0,
        infantCount: 0,
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
        model: App.Person
    });

})(Wedding);
