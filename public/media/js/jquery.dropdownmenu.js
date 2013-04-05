/*
 * jQuery Dropdown Menu Script
 *
 * Copyright 2012, Studio 164a
 * 
 * August 2012
 */
 // Optional parameter includeMargin is used when calculating outer dimensions
(function($){
	// Default settings
	var settings = {
		trigger 		: 'hover', 		// How to trigger drop down action (options: 'hover')
		menuItem 		: 'li', 		// The menu elements
		submenuParent 	: 'ul', 		// The parent element of the sub menu
		animation 		: 'slide', 		// Type of animation to use (options: 'slide', 'fade')
		alignment		: 'left',		// How to align child menu (options: 'left', 'right', 'center', 'auto')
		slideInSpeed 	: 100, 			// Speed of slide when appearing
		slideOutSpeed 	: 200,			// Speed of slide when disappearing
		fadeInSpeed		: 100,			// Speed at which sub menu fades in
		fadeOutSpeed	: 200,			// Speed at which sub menu fades out
		hoverDelay		: 200			// Time before which to display sub menu, when hoverIntent function is used
	},

	// Instance (empty, filled by each menu instance)
	instance = {},

	// Methods
	methods = {

		// Method to execute on hover
		show : function( el, child ) {
			switch( settings.animation ) {
				case 'slide' :
					child.slideDown( settings.slideInSpeed, function() { el.addClass('active') } );
					break;

				case 'fade' :
					child.show().animate( { 'opacity' : 100 }, settings.fadeInSpeed );
					break;
			}
		},

		// Method to execute when not hovering
		hide : function( el, child ) {
			switch( settings.animation ) {
				case 'slide' :
					child.slideUp( settings.slideOutSpeed, function() { el.removeClass('active') } );
					break;

				case 'fade' :
					child.animate( { 'opacity' : 0 }, settings.fadeOutSpeed, function() {
						$(this).hide();
					} );
					break;
			}
		},

		// Set up animations
		animate : function( el, child ) {
			var trigger = settings.trigger;

			if ( trigger === 'hover' ) {
				// Check for hoverIntent
				if ( typeof $.fn.hoverIntent === 'function' ) {
					el.hoverIntent({
						over : function(){ methods.show( el, child ) },
						out : function(){ methods.hide( el, child ) },
						timeout : settings.hoverDelay
					});
				}
				else {
					el.on({
						mouseenter : function(){ methods.show( el, child ) }, 
						mouseleave : function(){ methods.hide( el, child ) } 
					});
				}				
			}	
		},

		// Prepare child item
		// @param 	el 		The parent element (li)
		// @param   child   The child element (ul)
		prepareChild : function( el, child ) {
			var is_grandchild = el.parent().hasClass('sub_menu'),
				position = el.position(),
				top = is_grandchild ? 0 : el.outerHeight(),
				left = is_grandchild ? el.parent().parent().position().left  - instance.position.left : position.left - instance.position.left,
				right = child.width() + left,
				percentile = parseInt( 100 * left / instance.width ), 
				css_obj = { 'position' : 'absolute', 'top' : top }, 
				parent_dimensions;

			// Submenu is left-aligned with the parent item
			if ( settings.alignment === 'left' || percentile < 40 && right < instance.width ) {
				css_obj.left = is_grandchild ? el.getHiddenDimensions(true).outerWidth : 0;
				child.addClass('left_bound sub_menu').css( css_obj );
			}
			// Submenu is centered with the parent item
			else if ( settings.alignment === 'center' || percentile < 80 && right < instance.width ) {
				css_obj.left = ( css_obj.left + css_obj.right ) / 2;
				child.addClass('center_bound sub_menu').css( css_obj );
			}
			// Submenu is right-aligned with the parent item
			else {
				css_obj.right = 0;
				if ( is_grandchild ) {					
					css_obj.margin = "-1px 0 0 -" + (el.getHiddenDimensions(true).outerWidth * 2) + "px";
				}
				
				child.addClass('right_bound sub_menu').css( css_obj );
			}

			// Make invisible, then hide, if fade
			if ( settings.animation === 'fade' ) {
				child.css({ 'opacity' : 0 }).hide();
			}
		},

		// Prepare node (list item)
		prepareNode : function( el ) {
			var child = el.children( settings.submenuParent );

			// Check for a sub-menu
			if ( child.length !== 0 ) {				

				// Set up animations
				methods.animate( el, child );

				// Add class
				el.addClass('has_sub');

				// Set up child node
				methods.prepareChild( el, child );
			}
		},

		// Method to execute on plugin initialization
		init : function( el ) {
			
			// Set up instance object
			instance = {
				position: el.position(),
				width: el.width()
			};

			return el.find( settings.menuItem ).each( function() {
				methods.prepareNode( $(this) );
			});
		}

	};

	// The plugin wrapper
	$.fn.dropdownMenu = function( options ) {

		// Override the default settings if user provides some
		if (options) {
			$.extend( settings, options );
		}

		return $(this).each( function() {
			methods.init( $(this) );
			instance = {};
        });		
	}; 

	$.fn.getHiddenDimensions = function(includeMargin) {
	    var $item = this,
	        props = { position: 'absolute', visibility: 'hidden', display: 'block' },
	        dim = { width:0, height:0, innerWidth: 0, innerHeight: 0,outerWidth: 0,outerHeight: 0 },
	        $hiddenParents = $item.parents().andSelf().not(':visible'),
	        includeMargin = (includeMargin == null)? false : includeMargin;

	    var oldProps = [];
	    $hiddenParents.each(function() {
	        var old = {};

	        for ( var name in props ) {
	            old[ name ] = this.style[ name ];
	            this.style[ name ] = props[ name ];
	        }

	        oldProps.push(old);
	    });

	    dim.width = $item.width();
	    dim.outerWidth = $item.outerWidth(includeMargin);
	    dim.innerWidth = $item.innerWidth();
	    dim.height = $item.height();
	    dim.innerHeight = $item.innerHeight();
	    dim.outerHeight = $item.outerHeight(includeMargin);

	    $hiddenParents.each(function(i) {
	        var old = oldProps[i];
	        for ( var name in props ) {
	            this.style[ name ] = old[ name ];
	        }
	    });

	    return dim;
	}

})( jQuery );