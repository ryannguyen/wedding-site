/**
 * Primary Javascript file for Hithed by Studio 164a
 *
 * Copyright 2012, Studio 164a
 */

// Ensure jQuery is present as $
var $ = jQuery.noConflict();

HITCHED = {

	// Load Google Map
	loadMap : function() {
		var map = $('.google_map'), 
			data = map.data(),
			latitude = data.latitude, 
			longtitude = data.longtitude, 
			marker = data.marker,
			zoom = data.zoom;

		// Google Map
		map.gmap({ 
            'center': latitude+','+longtitude, 
            'zoom': zoom, 
            'callback' : function() {
                var self = this;
                self.addMarker( {'position': this.get('map').getCenter() } ).click( function() {
                    self.openInfoWindow( { 'content': marker }, this);
                }); 
            }
        });
	},

	// Run setup functions once document is ready
	documentReady : function() {		
		if ( $.fn.fetch ) {
			$('.fetch').fetch({ 

				// Flickr API key
				flickrApiKey : 'f6a0dc37cdd5cf239a825f858f7c1d8f', 

				// Instagram access token
				instagramToken : '1035032.7ff0c4c.25d5ab43d6f74eae8c25377f9d3d4af2', 

				// Twitter request URL. 
				// If you are hosting this elsewhere, you need to 
				// change this to the exact location of the fetch.php 
				// script. See the documentation for details.
				twitterRequestUrl : 'lib/twitter/fetch.php',

				// Format for individual tweet
				twitterFormat : '<li class="fetched-%n%">'
					+ '<p class="tweet"><a href="%profile_link%" target="_blank"><i class="icon-twitter"></i></a> %content%</p>'					
					+ '<p class="time_ago">%date%</p>'					
					+ '</li>', 

				// Format for Instagram images
				instagramFormat : '<li class="fetched-%n%"><a href="%fullsize_src%" class="instagram_gallery" title="%title%">'
					+ '<img alt="%title%" title="%title%" src="%thumbnail_src%" width="60" height="60" />'
					+ '</a></li>', 

				// Format for Flickr images
				flickrFormat : '<li class="fetched-%n%"><a href="%fullsize_src%" class="flickr_gallery" title="%title%">'
					+ '<img alt="%title%" title="%title%" src="%thumbnail_src%" width="60" height="60" />'
					+ '</a></li>'
			});
		}

		// Local scroll
		if ( $.localScroll ) 
			$.localScroll({ offset: {left: 0, top: -84} });

		// Sticky nav
		if ( $.fn.sticky ) 
			$('#primary_nav').sticky({ topSpacing: 0 });

		// Sliders
		if ( $.fn.responsiveSlides )
			$('.rslides').responsiveSlides({ pager : true, timeout : 4000 });

		// Carousel
		if ( $.fn.carouselSwipe )
			$('.carousel').carouselSwipe({ nextButtonText : false, previousButtonText : false, buttonsPosition : 'outside center', easing : 'ease-in-out' });

		// Google Maps
		if ($.fn.gmap)
			HITCHED.loadMap();		

		// RoundRect (for IE7&8)		
		if ( window.PIE ) {
			$('.rslides_tabs li, .panel, img').each( function() {
				PIE.attach(this);
			});
		}			

		// Dropdown menus
		if ( $.fn.dropdownMenu ) {
			$('#primary_nav ul').dropdownMenu({ alignment : 'left' });
		}
	},

	// Run setup functions once window is loaded
	windowLoad : function() {
		var $window = $(window);
	
		if ( $.fn.flexNav ) {
			$(".responsive_menu").flexNav({ 
				breakpoint: 600, 
				toggleCallback: function($button) {
					$button.children('i').toggleClass('icon-chevron-down').toggleClass('icon-chevron-up');
				} 
			});
		}		

		// Colorbox
		if ($.fn.colorbox) {

			var colorbox_defaults = { 
				opacity: '0.5', 
				maxWidth: '94%', 
				maxHeight: '94%', 
				initialWidth: '100px', 
				initialHeight : '100px',
				previous : '<i class="icon-arrow-left"></i>',
				next : '<i class="icon-arrow-right"></i>',
				close : '<i class="icon-remove"></i>',
				slideshowStop : '<i class="icon-pause"></i>',
				slideshowStart : '<i class="icon-play"></i>',
				slideshow : false, 
				rel : false }

			// Individual Colorbox photos
			$('a.colorbox').colorbox( colorbox_defaults );

			// Colorbox galleries
			$('.colorbox_gallery').each( function() {
				$(this).find('a').colorbox( $.extend( colorbox_defaults, {
					rel : $(this).data().album || 'colorbox_gallery',
					slideshow : $(this).data().slideshow
				}));
			});

			if ( window.addEventListener ) {
				window.addEventListener("orientationchange", function() {
				    if($('#cboxOverlay').is(':visible')){
				        $.colorbox.load(true);
				    }
				}, false);
			}
		}

		// Image Hover
		if ($.fn.imageHover)
			$('a.colorbox img, figure img, .gallery img, .colorbox_gallery img').imageHover();
	}
};