(function($){
	// Default settings
	var settings = {
		easing : 'ease',
		duration : '500ms'
	},

	// Execute when hovering
	onMouseover = function( $el, $hover ) {
		$hover.css({ 'opacity' : 1 });
	},

	// Execute when no longer hovering
	onMouseout = function( $el, $hover ) {
		$hover.css({ 'opacity' : 0 });
	},

	// Runs on plugin instantiation
	init = function( $el ) {
		var transition = 'opacity ' + settings.duration + ' ' + settings.easing, 			
			$parent = $el.parent(), 
			$hover;

		$('<span class="image_hover" />').insertAfter($el); 
		
		$hover = $el.next('.image_hover').css({ 
			'width': $el.outerWidth(), 
			'height': $el.outerHeight(),
			'display' : 'block',
			'position' : 'absolute',
			'z-index' : 4,
			'top' : $el.position().top + parseInt( $el.css('marginTop') ),
			'left' : $el.position().left + parseInt( $el.css('marginLeft') ),
			'opacity' : 0, 
			'transition' : transition,
			'-webkit-transition' : transition,
			'-moz-transition' : transition,
			'-o-transition' : transition,
			'-ms-transition' : transition
		});

		$parent.on( 'mouseover', function() {
			onMouseover( $(this), $hover );
		});

		$parent.on( 'mouseout', function() {
			onMouseout( $(this), $hover );
		});
	}

	/**
	 * Function definition
	 */
	$.fn.imageHover = function( options ) {		
		var self = this;

		return this.each( function() { init( $(this) ); });
	}
})( jQuery );