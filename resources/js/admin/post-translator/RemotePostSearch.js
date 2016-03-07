/* global ajaxurl */
(function( $, MultilingualPress ) {
	'use strict';

	/**
	 * Settings for the MultilingualPress RemotePostSearch module. Only available on the targeted admin pages.
	 * @type {Object}
	 */
	var moduleSettings = MultilingualPress.getSettings( 'RemotePostSearch' );

	/**
	 * @class RemotePostSearchResult
	 * @classdesc MultilingualPress RemotePostSearchResult model.
	 * @extends Backbone.Model
	 */
	var RemotePostSearchResult = Backbone.Model.extend( /** @lends RemotePostSearchResult# */ {
		urlRoot: ajaxurl
	} );

	var RemotePostSearch = Backbone.View.extend( /** @lends RemotePostSearch# */ {
		/**
		 * @constructs RemotePostSearch
		 * @classdesc MultilingualPress RemotePostSearch module.
		 * @augments Backbone.View
		 */
		initialize: function() {
			/**
			 * Array holding the default search result HTML strings.
			 * @type {string[]}
			 */
			this.defaultResults = [];

			/**
			 * Array holding jQuery objects representing the search result containers.
			 * @type {jQuery[]}
			 */
			this.resultsContainers = [];

			/**
			 * Minimum number of characters required to fire the remote post search.
			 * @type {number}
			 */
			this.searchThreshold = parseInt( moduleSettings.searchThreshold, 10 );

			this.model = new RemotePostSearchResult();
			this.listenTo( this.model, 'change', this.render );

			this.initializeResults();
		},

		/**
		 * Initializes both the default search result views as well as the result containers.
		 */
		initializeResults: function() {
			$( '.mlp-search-field' ).each( function( index, element ) {
				var $element = $( element ),
					$resultsContainer = $( '#' + $element.data( 'results-container-id' ) ),
					siteID = $element.data( 'remote-site-id' );

				this.defaultResults[ siteID ] = $resultsContainer.html();
				this.resultsContainers[ siteID ] = $resultsContainer;
			}.bind( this ) );
		},

		/**
		 * Prevents form submission due to the enter key being pressed.
		 * @param {Event} event - The keydown event of a post search element.
		 */
		preventFormSubmission: function( event ) {
			if ( 13 === event.which ) {
				event.preventDefault();
			}
		},

		/**
		 * According to the user input, either search for posts, or display the initial post selection.
		 * @param {Event} event - The keyup event of a post search element.
		 */
		reactToInput: function( event ) {
			var $input = $( event.target ),
				remoteSiteID,
				value = $.trim( $input.val() || '' );

			if ( value === $input.data( 'value' ) ) {
				return;
			}

			clearTimeout( this.reactToInputTimer );

			$input.data( 'value', value );

			remoteSiteID = $input.data( 'remote-site-id' );

			if ( '' === value ) {
				this.resultsContainers[ remoteSiteID ].html( this.defaultResults[ remoteSiteID ] );
			} else if ( value.length >= this.searchThreshold ) {
				this.reactToInputTimer = setTimeout( function() {
					this.model.fetch( {
						data: {
							action: 'mlp_rc_remote_post_search',
							remote_site_id: remoteSiteID,
							remote_post_id: $input.data( 'remote-post-id' ),
							source_site_id: $input.data( 'source-site-id' ),
							source_post_id: $input.data( 'source-post-id' ),
							s: value
						},
						processData: true
					} );
				}.bind( this ), 400 );
			}
		},

		/**
		 * Renders the found posts to the according results container.
		 */
		render: function() {
			var data;
			if ( this.model.get( 'success' ) ) {
				data = this.model.get( 'data' );

				this.resultsContainers[ data.remoteSiteID ].html( data.html );
			}
		}
	} );

	// Register the RemotePostSearch module for the Add New Post and the Edit Post admin pages.
	MultilingualPress.registerModule( [ 'post.php', 'post-new.php' ], 'RemotePostSearch', RemotePostSearch, {
		el: 'body',
		events: {
			'keydown .mlp-search-field': 'preventFormSubmission',
			'keyup .mlp-search-field': 'reactToInput'
		}
	} );
})( jQuery, window.MultilingualPress );
