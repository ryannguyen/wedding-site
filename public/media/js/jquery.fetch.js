(function($){

	var globalVariables = [ 'n' ],
	requestHandlers = {}, 
	entries = [], 
	defaults = {},
	methods = {				

		// Sends method calls to functions within the Methods object
		api : function( method ) {
			var api_method = methods[method], 
	            args = Array.prototype.slice.call(arguments, 1);        
	       
	        if ( typeof( api_method ) === 'function' ) {
	            return api_method.apply( this, args );
	        }
	        return false;
		},

		// Delegates method calls to the requestHandler. 
		// @return false if the method does not exists
		delegate : function( method ) {
			var delegate_method = this.requestHandler[method],
				args = Array.prototype.slice.call(arguments, 1);

			if ( typeof( delegate_method ) === 'function' ) {
				return delegate_method.apply( this, args );
			}
			return false;
		},

		// Performs the AJAX request
		doRequest : function() {
			var self = this;

			$.ajax({
				url: self.requestURL, 
				dataType: 'json',
				success: function( data ) {					
					// Save data and status
	          		self.data = data;

	              	// Send the returned data back to the requestHandler
	              	self.delegate( 'afterRequest' );     	
				}, 
				error: function( xhr, status, error ) {
					console.log( 'An error occurred while trying to fetch feed from ' + self.requestURL + '. Status: ' + status );
				},
				complete: function( xhr, status ) {
					if ( status === 'success' ) {
						self.api( 'doAfterRequest' );
					}
				}
			});		
		},

		// Performs the AJAX request
		doJsonpRequest : function() {
			var self = this;
			$.ajax({
				url: self.requestURL, 
				dataType: 'jsonp',
				jsonpCallback : self.jsonpCallback,
				contentType : "text/json; charset=utf-8",
                crossDomain : true,
				success: function( data ) {					
					// Save data and status
	          		self.data = data;

	              	// Send the returned data back to the requestHandler
	              	self.delegate( 'afterRequest' );     	
				}, 
				error: function( xhr, status, error ) {
					console.log( 'An error occurred while trying to fetch feed from ' + self.requestURL + '. Status: ' + status );
				},
				complete: function( xhr, status ) {
					if ( status === 'success' ) {
						self.api( 'doAfterRequest' );
					}
				}
			});		
		},		

		// Perform after AJAX request is complete and successful
		doAfterRequest : function() {
			var max = this.entries.length,
				i = 0,
				entry,
				html = '', 
				parsed;				

			for ( i; i < max; i += 1 ) {
				entry = this.entries[i];
				entry.timestamp = this.delegate( 'getTimestamp', entry ) || this.api( 'getTimestamp', entry ) || '';
				parsed = this.api( 'parseEntry', entry, i ); 
				if ( typeof ( this.requestHandler['afterEntryParsed'] ) === 'function' ) {
					parsed = this.delegate( 'afterEntryParsed', parsed, entry, i );
				}
				html += parsed;
			}

			// Replace element HTML and add fetched class
			this.html(html).addClass('fetched');
		},

		// Parse entry
		parseEntry : function( entry, index ) {
			var handlerVariables = this.requestHandler.variables, 
				globalVariables = this.globalVariables,
				variables = this.requestHandler.variables,				
				i = 0,
				parsed = this.format,
				max;

			// First parse global variables
			for ( i, max = globalVariables.length; i < max; i += 1 ) {
				parsed = this.api( 'fillVariable', globalVariables[i], entry, parsed, index );
			}

			// Parse request handler variables
			for ( i = 0, max = handlerVariables.length; i < max; i += 1 ) {
				parsed = this.delegate( 'fillVariable', variables[i], entry, parsed, index );				
			}			

			return parsed;
		},

		// Fill variable
		fillVariable : function(name, entry, parsed, index) {
			switch(name) {
				case 'n': 
					return parsed.replace( /\%n\%/g, index );
					break;

				default:
					return parsed;
					break;
			}
		},

		// Sort feed items
        sortBy : function(field, reverse) {                       
            var key = function(x) {
                return x[field];
            };
          
            return function( a, b ) {
                var A = key(a), 
                    B = key(b);
                    
                return ( (A < B) ? -1 :
                         (A > B) ? +1 : 0) * [-1,1][+!!reverse];
            }          
        },   

        // Get timestamp
        getTimestamp : function( entry ) {
        	return new Date( entry.publishedDate );
        },

        // Default date format
        getFormattedDate: function( timestamp ) {
            var date = new Date( timestamp ),
                months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            return date.getDate() + ' ' + months[ date.getMonth() ]; // eg. 16 Aug
        },

        // Default way to display time ago
        getTimeAgo : function( date ) {
            var now = new Date(),
                elapsed = now.getTime() - date.getTime(), // milliseconds elapsed
                day = 86400000,
                minute = 60000,
                hour = 3600000,                            
                units,
                timeago;
            
            if (elapsed < hour) {
                units = Math.ceil( elapsed / minute);                            
                timeago = units > 1 ? units + ' minutes ago' : units + ' minute ago';
            } else if (elapsed < day) {
                units = Math.ceil( elapsed / hour);                            
                timeago = units > 1 ? units + ' hours ago' : units + ' hour ago';
            } else {                
                units = Math.ceil( elapsed / day);                            
                timeago = units > 1 ? units + ' days ago' : units + ' day ago';
            }  

            return timeago;
        },

		// Runs on plugin instantiation
		init : function( options ) {
			this.api = methods.api;
			this.delegate = methods.delegate;			
			this.request = this.data().request;
			this.globalVariables = globalVariables;

			// Confirm that requestHandler is registered
			if ( requestHandlers.hasOwnProperty( this.request ) ) {

				// Set up the requestHandler
				this.requestHandler = requestHandlers[this.request];

				// Load settings
				this.settings = $.extend( {}, defaults, this.requestHandler.defaults, options, this.data() );

				// Set format
				this.formatKey = this.children().data().format + 'Format';
				this.format = this.settings[this.formatKey];

				// Perform startup method
				this.delegate( 'prepareRequest' );

				// Perform AJAX request
				this.api( 'doJsonpRequest' );
			}
			else {
				console.log( 'Error: call to an unregistered request handler: ' + this.request );
			}
		}

	};

	// Register Fetch as a jQuery plugin
	$.fn.fetch = function( options ) {
		return this.each( function() {		
			methods.api.call( $(this), 'init', options );		
		});
	};

	// Register a Fetch request handler
	$.fn.fetch.registerHandler = function( type, vars ) {
		requestHandlers[type] = vars;
	};

	// Register Twitter 
	$.fn.fetch.registerHandler( 'twitter', {

		// Settings
		defaults : {
			excerptLength : 100,
			openLinksInNewWindow : true, 
			includeRetweets : true,
			excludeReplies : true, 
			username : '',
			count : 3,
			twitterRequestUrl : '',
			twitterFormat : '<li class="fetch-%n%">'
						+ '<p class="tweet"><a href="%profile_link%" target="_blank"><i class="icon-twitter"></i></a> %content%</p>'					
						+ '<p class="time_ago">%date%</p>'					
						+ '</li>'
		},

		// Set up requestURL
		prepareRequest : function() {			
			this.requestURL = this.settings.twitterRequestUrl			
							+ '?screen_name='+encodeURIComponent(this.settings.username) 
							+ '&count='+parseInt(this.settings.count)
							+ '&include_rts='+this.settings.includeRetweets
							+ '&exclude_replies='+this.settings.excludeReplies;

			this.jsonpCallback = 'fetch_tweets';
		}, 

		// Get objects from fetched data
		afterRequest : function() {
			this.entries = this.data;
		},

		// Get timestamp
		getTimestamp : function( entry ) {
			var v = entry.created_at.split(' ');
            return new Date(Date.parse( v[1] + " " + v[2] + ", " +v[5] + " " + v[3] + " UTC"));
		},

		// Fill variable
		fillVariable : function(name, entry, parsed) {
			switch(name) {
				case 'profile_link':
					return parsed.replace( /\%profile_link\%/g, 'https://twitter.com/#!/' + entry.user.screen_name );
					break;

				case 'tweet_link':
					return parsed.replace( /\%tweet_link\%/g, 'https://twitter.com/#!/'+ entry.user.name + '/statuses/'+ entry.id_str );
					break;

				case 'excerpt':
					return parsed.replace( /\%excerpt\%/g, this.delegate( 'parseTwitterText', entry, true, false ) );
					break;

				case 'time_ago':
					return parsed.replace( /\%time_ago\%/g, this.api( 'getTimeAgo', entry.timestamp ) );
					break;

				case 'author': 
					return parsed.replace( /\%author\%/g, entry.user.name );
					break;

				case 'date':
					return parsed.replace( /\%date\%/g, this.api( 'getFormattedDate', entry.timestamp ) ); 
					break;

				case 'content': 
					return parsed.replace( /\%content\%/g, this.delegate( 'parseTwitterText', entry, true, true ));
					break;

				default:
					return parsed;
					break;
			}
		},

		// Parse Twitter text
		parseTwitterText : function( entry, parseLinks, returnFull ) {        
            var text = entry.text,                
                self = this,
                entities = [],
                links,
                entity;           

            text = returnFull || text.length <= this.settings.excerptLength 
                ? text
                : text.slice(0, this.settings.excerptLength);                
            
            if ( parseLinks === false ) {
                return text;
            }   
                     
            // Parse URLs in tweets            
            $.each( entry.entities, function(name, links) {                
                for ( var i = 0, max = links.length; i < max; i += 1 ) {
                    entity = links[i];
                    entity.type = name;
                    entity.start = entity.indices[0];
                    entities.push( entity );
                }
            });

            entities.sort( this.api( 'sortBy', 'start', false) );

            for ( var i = 0, max = entities.length; i < max; i += 1 ) {
                text = this.delegate( 'parseTwitterLink', text, entities[i] );
            }

            return text;
        },
        
        // Parse Twitter link
        parseTwitterLink: function( text, entity ) {
            var start = entity.start,
                end = entity.indices[1],
                url,
                text;
                
            if ( start < this.settings.excerptLength ) {
                url = this.delegate( 'getTwitterLink', entity );    
                text = text.slice(0, start) + url + text.slice(end);    
            }
            
            return text;
        },        
        
        // Get Twitter link, depending on whether it's a URL, user mention or hashtag
        getTwitterLink: function( entity ) {
            var target = this.settings.openLinksInNewWindow === true ? 'target="_blank"' : '';
            switch ( entity.type ) {
                case 'urls' : 
                    return '<a href="' + entity.url + '" ' + target + '>' + entity.display_url + '</a>';
                    break;
                case 'user_mentions':
                    return '<a href="https://twitter.com/#!/' + entity.screen_name + '" ' + target + '>@' + entity.screen_name + '</a>';
                    break;
                case 'hashtags':
                    return '<a href="https://twitter.com/#!/search/' + entity.text + '" ' + target + '>#' + entity.text + '</a>';                
                    break;                
            }
        },

		// Variables		
		variables : [ 'profile_link', 'tweet_link', 'excerpt', 'time_ago', 'username', 'date', 'content' ]
	});	

	// Register Flickr
	$.fn.fetch.registerHandler( 'flickr', {

		// Settings
		defaults : {
			flickrApiKey : '',
			userId : '',
			count : 8, 				
			flickrFormat : '<li class="fetch-%n%"><a href="%fullsize_src%" class="flickr_gallery" title="%title%">'
						+ '<img alt="%title%" title="%title%" src="%thumbnail_src%" width="60" height="60" />'
						+ '</a></li>'
		},

		// Set up requestURL
		prepareRequest : function() {
			this.requestURL = 'http://api.flickr.com/services/rest/'							
							+ '?method=flickr.people.getPublicPhotos'
							+ '&api_key='+this.settings.flickrApiKey
							+ '&user_id='+this.settings.userId
							+ '&per_page='+this.settings.count
							+ '&format=json'
							+ '&jsoncallback=?';
		}, 

		// Get objects from fetched data
		afterRequest : function() {
			this.entries = this.data.photos.photo;
		},

		afterEntryParsed : function( parsed, entry, i ) {			
			return parsed;
		},

		// Fill variable
		fillVariable : function(name, entry, parsed) {
			switch(name) {
				case 'title':
					return parsed.replace( /\%title\%/g, entry.title );
					break;

				case 'thumbnail_src':
					return parsed.replace( /\%thumbnail_src\%/g, 'http://farm'+entry.farm+'.staticflickr.com/'+entry.server+'/'+entry.id+'_'+entry.secret+'_s.jpg' );
					break;

				case 'fullsize_src':
					return parsed.replace( /\%fullsize_src\%/g, 'http://farm'+entry.farm+'.staticflickr.com/'+entry.server+'/'+entry.id+'_'+entry.secret+'_b.jpg' );
					break;

				default:
					return parsed;
					break;
			}
		},

		// Variables		
		variables : [ 'title', 'thumbnail_src', 'fullsize_src' ]
	});	

		// Register Instagram
	$.fn.fetch.registerHandler( 'instagram', {

		// Settings
		defaults : {
			openLinksInNewWindow : true,
			instagramToken : '',
			userId : '',
			count : 12,
			instagramFormat : '<li class="fetch-%n%"><a href="%fullsize_src%" class="instagram_gallery" title="%title%">'
							+ '<img alt="%title%" title="%title%" src="%thumbnail_src%" width="60" height="60" />'
							+ '</a></li>',
		},

		// Set up requestURL
		prepareRequest : function() {
			this.requestURL = 'https://api.instagram.com/v1/users/'+this.settings.userId+'/media/recent/'
							+ '?access_token='+this.settings.instagramToken
							+ '&count='+this.settings.count
							+ '&callback=?';
		}, 

		// Get objects from fetched data
		afterRequest : function() {
			this.entries = this.data.data;
		},

		// Fill variable
		fillVariable : function(name, entry, parsed) {
			switch(name) {
				case 'title':
					return parsed.replace( /\%title\%/g, entry.caption ? entry.caption.text : '' );
					break;

				case 'thumbnail_src':
					return parsed.replace( /\%thumbnail_src\%/g, entry.images.thumbnail.url );
					break;

				case 'fullsize_src':
					return parsed.replace( /\%fullsize_src\%/g, entry.images.standard_resolution.url );
					break;

				default:
					return parsed;
					break;
			}
		},

		// Variables		
		variables : [ 'title', 'thumbnail_src', 'fullsize_src' ]
	});	
	
})(jQuery);