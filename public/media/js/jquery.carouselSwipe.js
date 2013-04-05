(function($){
	
	/**
	 * Plugin properties
	 */
	var carousel, viewport, viewport_left, viewport_right, viewport_width, viewport_start, distance, wrapper, next, previous, items,
		browser_supports = document.createElement('div'),
		vendors = 'Khtml Ms O Moz Webkit'.split(' '),
		supports = {}, 
		carousel_width = 0,
		swipe = { start : {}, delta : {}, direction : null, distance : 0, duration : 0, is_scrolling : undefined },

	/**
	 * Default settings
	 */
	settings = {
		autoPlay : false,							// Whether carousel should start playing automatically. Boolean.
		showButtons : true,							// Whether to show next and previous buttons. Boolean.
		buttonsPosition : 'inside center',			// Set button positions. Options: 'inside center', 'inside top', 'inside bottom', 'outside center', 'outside top', 'outside bottom'
		nextButtonText : 'Next',					// Set next button text. Set to false if no text desired
		previousButtonText : 'Previous',			// Set previous button text. Set to false if no text desired
		buttonsBackgroundColour : '#444',			// Set background colour for buttons. Set to false if no background colour desired
		buttonsBackgroundOpacity: '0.8',			// Set background opacity for buttons.
		buttonsTextPadding : '6px 10px',			// Set padding around button text.
		duration : '300ms',							// Length of sliding action
		itemsPerSlide : '', 						// Number of items to slide
		easing : 'ease-out',						// Easing function to use. Options: 'ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out'
		endBehaviour : 'return'						// What should happen when the carousel reaches its end. Options: 'return', 'stay', 'cycle'
	},

	/** 
	 * Methods
	 */ 
	methods = {

		// Runs when screen is touched
		touchStart : function( e ) {
			// Reset swipe 
			this.swipe = { 
				start : { x : e.touches[0].pageX, y : e.touches[0].pageY, ts : methods.getTimestamp() }, 
				delta : { x : 0, y : 0, ts : null },
				direction : null,
				distance : 0, 
				duration : 0, 
				is_scrolling : undefined
			}

			e.stopPropagation();
		},

		// Runs when move is made
		touchMove : function( e ) {	
			// Capture coordinates
			this.swipe.delta.x = e.touches[0].pageX;
			this.swipe.delta.y = e.touches[0].pageY; 					

			// Set swipe's direction and absolute distance
			this.swipe.direction = this.swipe.delta.x - this.swipe.start.x < 0 ? 'next' : 'previous';	
			this.swipe.distance = Math.abs( this.swipe.delta.x - this.swipe.start.x );

			if ( typeof this.swipe.is_scrolling === 'undefined' ) {
				this.swipe.is_scrolling = this.swipe.distance < ( this.swipe.delta.y - this.swipe.start.y );
			}			

			// If we're scrolling sideways, prevent default browser scrolling
			if ( this.swipe.is_scrolling === false ) {				
				e.preventDefault();
				methods.moveCarousel( this.swipe.delta.x - this.swipe.start.x + carousel.position().left );
				e.stopPropagation();
			}
		},

		// Runs when screen is touched
		touchEnd : function( e ) {
			// Set swipe's duration, direct and absolute distance
			this.swipe.delta.ts = methods.getTimestamp();
			this.swipe.duration = this.swipe.delta.ts - this.swipe.start.ts;
			
			// Length of swipe must exceed 50 milliseconds, and it must be more horizontal than vertical
			if ( this.swipe.duration > 50 && this.swipe.is_scrolling === false ) {
				methods.move( e, this.swipe.direction );							
			}
			
			e.stopPropagation();
		},

		// Get current timestamp
		getTimestamp : function() {
			return new Date().getTime();
		},

		// Runs when next button is clicked
		getNext : function( e ) {
			var offset = viewport_left - carousel.children('.in_view').last().next().outerWidth(true);
			if ( Math.abs( offset ) + distance >= carousel_width ) {
				offset = 0;
			}				
			methods.doMove( offset );
		},

		// Runs when previous button is clicked
		getPrevious : function( e ) {carousel
			var offset = viewport_left + carousel.children('.in_view').first().prev().outerWidth(true);
			if ( Math.abs( offset ) + distance >= carousel_width ) {
				offset = 0;
			}		
			methods.doMove( offset );
		},

		// Moves the carousel
		moveCarousel : function( offset ) {
			var c = carousel[0],
				translate;

			if ( methods.browserSupports( 'perspective' ) ) {
				translate = 'translate3d('+offset+'px, 0, 0)';
				c.style.MozTransform = c.style.webkitTransform = c.style.OTransform = c.style.msTransform = translate;
			}
			else if ( methods.browserSupports( 'transform' ) ) {
				translate = 'translateX('+offset+'px)';
				c.style.MozTransform = c.style.webkitTransform = c.style.OTransform = c.style.msTransform = translate;
			}
			else {
				carousel.animate({ left : offset+'px' }, settings.duration );
			}
		},

		// Move carousel items
		doMove : function( offset ) {
			var i = 0, 
				len = items.length, 
				el;				

			methods.moveCarousel( offset );
			methods.setViewportBounds( offset );
			
			for ( i; i < len; i += 1 ) {
				el = $(items[i]);
				
				if ( methods.isItemInViewport( el, offset ) ) { el.removeClass('out_of_view').addClass('in_view'); }
				else { el.removeClass('in_view').addClass('out_of_view'); }
			}
		},

		// Start process of moving carousel items
		move : function( e, dir ) {
			e.preventDefault();

			// If it's the first time a move has been made, define the 
			// viewport parameters and apply classes
			if ( typeof viewport_right === 'undefined' ) {
				var i = 0, 
					len = items.length, 
					el;

				methods.setViewportBounds( 0 );				

				// console.log(viewport_left);
				for ( i; i < len; i += 1 ) {
					el = $(items[i]);

					if ( methods.isItemInViewport( el, 0 ) ) { el.addClass('in_view'); }
					else { el.addClass('out_of_view'); }
				}
			}

			if ( dir === 'next' ) return methods.getNext( e );
			if ( dir === 'previous' ) return methods.getPrevious( e );
		},

		// Set viewport bounds
		setViewportBounds : function( offset ) {
			if ( offset === 0 ) { 
				viewport_left = viewport.position().left;
				viewport_right = viewport_left + viewport.width();				
			}
			else if ( offset < viewport_left ) {
				viewport_right = viewport_right - viewport_left + offset;
				viewport_left = offset;				
			}
			else {
				viewport_right = offset + viewport_right;
				viewport_left = offset;				
			}

			// Update distance
			distance = Math.abs( offset ); 
		},

		// Check whether item is in viewport. Returns true or false. 
		isItemInViewport : function( el, offset ) {
			var right = el.position().left + el.width() - distance;
			return right >= viewport_start && right <= viewport_width;
		},		

		// Check whether browser supports given CSS property
		browserSupports : function( prop ) {
			var length = vendors.length;

			// Check each property only once
			if ( prop in supports ) return supports.prop;

			supports.prop = false;

			if ( prop in browser_supports.style ) {
				supports.prop = true;
			}
			
			prop = prop.replace(/^[a-z]/, function( val ) {
				return val.toUpperCase();
			});

			while ( length-- ) {
				if ( vendors[length] + prop in browser_supports.style ) {
					supports.prop = true;
				}
			}

			return supports.prop;
		},

		// Called by the init method on each carousel item
		itemSetup : function( el ) {
			var outer = el.show().outerWidth(true), // We call show on the element first to account for hidden elements
				inner = el.width(),
				margin = outer - inner;

			carousel_width += outer;
			el.css({ 'width' : inner+'px', 'margin-right' : margin+'px' });
		},

		// Called by the init method after the prevous and next buttons are created
		buttonsSetup : function() {
			var next_css = { 'position' : 'absolute', 'z-index' : 35 },
				previous_css = { 'position' : 'absolute', 'z-index' : 35 },
				margin_top;

			wrapper.append('<div class="carousel_previous" /><div class="carousel_next" />');
			previous = wrapper.children('.carousel_previous');
			next = wrapper.children('.carousel_next');
			previous.append('<a href="" />');
			next.append('<a href="" />');

			// Set up design for buttons
			if ( settings.previousButtonText ) {
				previous.children('a').text(settings.previousButtonText);

				if ( settings.buttonsBackgroundColour ) {
					previous_css['background-color'] = settings.buttonsBackgroundColour;				
					previous_css['opacity'] = settings.buttonsBackgroundOpacity;					
					previous_css['padding'] = settings.buttonsTextPadding;
				}
			}				

			if ( settings.nextButtonText ) {
				next.children('a').text(settings.nextButtonText);				

				if ( settings.buttonsBackgroundColour ) {
					next_css['background-color'] = settings.buttonsBackgroundColour;
					next_css['opacity'] = settings.buttonsBackgroundOpacity;		
					next_css['padding'] = settings.buttonsTextPadding;			
				}
			}				

			switch ( settings.buttonsPosition ) {
				case 'inside top' : 
				case 'outside top' :
					next_css.top = 0;					
					next_css.right = 0;

					previous_css.top = 0;
					previous_css.left = 0;
					break;

				case 'inside bottom' : 
				case 'outside bottom' : 
					next_css.bottom = 0;					
					next_css.right = 0;

					previous_css.bottom = 0;	
					previous_css.left = 0;									
					break;

				case 'inside center' :
				case 'outside center' :
					// Apply the CSS so padding is taken into account
					next.css( next_css );
					previous.css( previous_css );

					// Calculate top margin
					margin_top = '-' + next.height() + 'px';

					next_css = { 'top' : '50%', 'right' : 0, 'margin-top' : margin_top };
					previous_css = { 'top' : '50%', 'left' : 0, 'margin-top' : margin_top };		
					break;
			}

			// Apply negative horizontal margins if it's to be positioned outside the viewport
			if ( settings.buttonsPosition === 'outside top' || settings.buttonsPosition === 'outside bottom' || settings.buttonsPosition === 'outside center') {
				if ( settings.buttonsPosition === 'outside top' || settings.buttonsPosition === 'outside bottom' ) {
					next.css( next_css );
					previous.css( previous_css );
					next_css = {};
					previous_css = {};
				}

				next_css['margin-right'] = '-'+next.outerWidth()+'px';
				previous_css['margin-left'] = '-'+previous.outerWidth()+'px';
			}

			next.css( next_css );
			previous.css( previous_css );
		},
		
		// Runs on plugin instantiation
		init : function( el ) {
			var transition, c;

			// Set up our instance variables
			carousel = el;	
			items = carousel.children();			

			// Create viewport
			carousel.wrap('<div class="carousel_viewport" />');
			viewport = carousel.parent().css({ 'overflow' : 'hidden', 'position' : 'relative', 'width' : '100%', 'height' : carousel.height( true ) });
			viewport_width = viewport.width();
			viewport_start = viewport.position().left;

			// Create wrapper
			viewport.wrap('<div class="carousel_wrapper" />');
			wrapper = viewport.parent().css({ 'position' : 'relative', 'overflow' : 'visible', 'width' : '100%' });

			// Create "next" and "previous" arrows
			if ( settings.showButtons ) {				
				methods.buttonsSetup();
			}

			// Calculate total carousel width and set width and margin for carousel items
			items.each( function() {				
				methods.itemSetup( $(this) )
			});

			// Set total width for carousel
			if ( methods.browserSupports( 'transition' ) ) {
				transition = 'all ' + settings.duration + ' ' + settings.easing;				
				carousel.css({ 
					'width' : carousel_width+'px', 
					'left' : 0,
					'-webkit-transition' : transition,
					'-moz-transition' : transition,
					'-o-transition' : transition,
					'-ms-transition' : transition,
					'transition' : transition 
				});		
			} else {
				carousel.css({ 'width' : carousel_width+'px' });
			}					

			// Set up event handlers			
			next.on( 'click', function( e ) { methods.move( e, 'next' ); } );
			previous.on( 'click', function( e ) { methods.move( e, 'previous' ); } );

			// Browser that don't support addEventListener (i.e. older IE), don't need touch support anyway
			if ( carousel[0].addEventListener ) {
				carousel[0].addEventListener('touchstart', function( e ) { methods.touchStart( e ); } , false );
				carousel[0].addEventListener('touchmove', function( e ) { methods.touchMove( e ); } , false );
				carousel[0].addEventListener('touchend', function( e ) { methods.touchEnd( e ); } , false );
				carousel[0].addEventListener('touchcancel', function( e ) { methods.touchCancel( e ); } , false );			
			} 			
		}
	};

	/**
	 * Function definition
	 */
	$.fn.carouselSwipe = function( options ) {		
		var self = this;

		// Override the default settings if user provides some
		if (options) {
			$.extend( settings, options );
		}

		return this.each( function() {		
			methods.init( $(this) );
		});
	}
})( jQuery );