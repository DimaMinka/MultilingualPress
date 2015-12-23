/* global mlpSettings */
(function( $ ) {
	'use strict';

	/**
	 * Constructor for the MultilingualPress router.
	 * @constructor
	 */
	var MultilingualPressRouter = Backbone.Router.extend( {} );

	/**
	 * Constructor for the MultilingualPress admin controller.
	 * @returns {{Modules: Array, registerModule: registerModule, initialize: initialize}}
	 * @constructor
	 */
	var MultilingualPress = function() {
		var Modules = [],
			Router = new MultilingualPressRouter();

		return {
			Modules: Modules,

			/**
			 * Returns the settings object for the given module or settings name.
			 * @param {string} name - The name of either the MulitilingualPress module or the settings object itself.
			 * @returns {Object} - The settings object.
			 */
			getSettings: function( name ) {
				if ( 'undefined' !== typeof window[ 'mlp' + name + 'Settings' ] ) {
					return window[ 'mlp' + name + 'Settings' ];
				}

				if ( 'undefined' !== typeof window[ name ] ) {
					return window[ name ];
				}

				return {};
			},

			/**
			 * Registers a new module with the given Module callback under the given name for the given route.
			 * @param {string|string[]} routes - The routes for the module.
			 * @param {string} name - The name of the module.
			 * @param {Function} Module - The constructor callback for the module.
			 * @param {Object} [options={}] - Optional. The options for the module. Default to {}.
			 */
			registerModule: function( routes, name, Module, options ) {
				if ( _.isFunction( Module ) ) {
					options = options || {};
					$.each( _.isArray( routes ) ? routes : [ routes ], function( index, route ) {
						Router.route( route, name, function() {
							Modules[ name ] = new Module( options );
						} );
					} );
				}
			},

			/**
			 * Initializes the instance.
			 */
			initialize: function() {
				Backbone.history.start( {
					root: mlpSettings.adminUrl,
					pushState: true,
					hashChange: false
				} );
			}
		};
	};

	/**
	 * The MultilingualPress admin instance.
	 * @type {MultilingualPress}
	 */
	window.MultilingualPress = new MultilingualPress();

	$( window.MultilingualPress.initialize );
})( jQuery );

/* global MultilingualPress */
(function( $ ) {
	'use strict';

	/**
	 * Constructor for the MultilingualPress Common module.
	 * @constructor
	 */
	var Common = Backbone.View.extend( {
		el: 'body',

		events: {
			'click .mlp-click-toggler': 'toggleElement'
		},

		/**
		 * Initializes the Common module.
		 */
		initialize: function() {
			this.initializeStateTogglers();
		},

		/**
		 * Initializes the togglers that work by using their individual state.
		 */
		initializeStateTogglers: function() {
			$( '.mlp-state-toggler' ).each( function( index, element ) {
				var $toggler = $( element );
				$( '[name="' + $toggler.attr( 'name' ) + '"]' )
					.on( 'change', { $toggler: $toggler }, this.toggleElementIfChecked );
			}.bind( this ) );
		},

		/**
		 * Toggles the element with the ID given in the according toggler's data attribute if the toggler is checked.
		 * @param {Event} event - The change event of an input element.
		 */
		toggleElementIfChecked: function( event ) {
			var $toggler = event.data.$toggler,
				targetID = $toggler.data( 'toggle-target' );
			if ( targetID ) {
				$( targetID ).toggle( $toggler.is( ':checked' ) );
			}
		},

		/**
		 * Toggles the element with the ID given in the according data attribute.
		 * @param {Event} event - The click event of a toggler element.
		 */
		toggleElement: function( event ) {
			var targetID = $( event.target ).data( 'toggle-target' ) || '';
			if ( targetID ) {
				$( targetID ).toggle();
			}
		}
	} );

	// Register the Common module for all admin pages.
	MultilingualPress.Modules.Common = new Common();
})( jQuery );

/* global MultilingualPress */
(function( $ ) {
	'use strict';

	/**
	 * Settings for the MultilingualPress NavMenus module. Only available on the targeted admin pages.
	 * @type {Object}
	 */
	var moduleSettings = MultilingualPress.getSettings( 'NavMenus' );

	/**
	 * Constructor for the MultilingualPress NavMenus module.
	 * @constructor
	 */
	var NavMenus = Backbone.View.extend( {
		el: '#' + moduleSettings.metaBoxID,

		events: {
			'click #submit-mlp-language': 'sendRequest'
		},

		/**
		 * Initializes the NavMenus module.
		 */
		initialize: function() {
			this.$languages = this.$el.find( 'li [type="checkbox"]' );

			this.$menu = $( '#menu' );

			this.$menuToEdit = $( '#menu-to-edit' );

			this.$spinner = this.$el.find( '.spinner' );

			this.$submit = this.$el.find( '#submit-mlp-language' );
		},

		/**
		 * Requests the according markup for the checked languages in the Languages meta box.
		 * @param {Event} event - The click event of the submit button.
		 */
		sendRequest: function( event ) {
			var data;

			event.preventDefault();

			this.$submit.prop( 'disabled', true );

			/**
			 * The "is-active" class was introduced in WordPress 4.2. Since MultilingualPress has to stay
			 * backwards-compatible with the last four major versions of WordPress, we can only rely on this with the
			 * release of WordPress 4.6.
			 * TODO: Remove "show()" with the release of WordPress 4.6.
			 */
			this.$spinner.addClass( 'is-active' ).show();

			data = {
				action: moduleSettings.action,
				menu: this.$menu.val(),
				mlp_sites: this.getSites()
			};
			data[ moduleSettings.nonceName ] = moduleSettings.nonce;
			$.post( moduleSettings.ajaxURL, data, this.handleResponse.bind( this ) );
		},

		/**
		 * Returns the site IDs for the checked languages in the Languages meta box.
		 * @returns {string[]} - The site IDs.
		 */
		getSites: function() {
			var languages = [];
			this.$languages.filter( ':checked' ).each( function() {
				languages.push( $( this ).val() );
			} );

			return languages;
		},

		/**
		 * Adds the nav menu item's markup in the response object to the currently edited menu.
		 * @param {Object} response - The response data object.
		 */
		handleResponse: function( response ) {
			if ( response.success && response.data ) {
				this.$menuToEdit.append( response.data );
			}

			this.$languages.prop( 'checked', false );

			/**
			 * The "is-active" class was introduced in WordPress 4.2. Since MultilingualPress has to stay
			 * backwards-compatible with the last four major versions of WordPress, we can only rely on this with the
			 * release of WordPress 4.6.
			 * TODO: Remove "hide()" with the release of WordPress 4.6.
			 */
			this.$spinner.addClass( 'is-active' ).hide();

			this.$submit.prop( 'disabled', false );
		}
	} );

	// Register the NavMenus module for the Menus admin page.
	MultilingualPress.registerModule( 'nav-menus.php', 'NavMenus', NavMenus );
})( jQuery );

/* global MultilingualPress */
(function( $ ) {
	'use strict';

	/**
	 * Constructor for the MultilingualPress AddNewSite module.
	 * @constructor
	 */
	var AddNewSite = Backbone.View.extend( {
		el: '#wpbody-content form',

		events: {
			'change #site-language': 'adaptLanguage',
			'change #mlp-base-site-id': 'togglePluginsRow'
		},

		template: _.template( $( '#mlp-add-new-site-template' ).html() || '' ),

		/**
		 * Initializes the AddNewSite module.
		 */
		initialize: function() {
			this.render();

			this.$language = $( '#mlp-site-language' );

			this.$pluginsRow = $( '#mlp-activate-plugins' ).closest( 'tr' );
		},

		/**
		 * Renders the MultilingualPress table markup.
		 * @returns {AddNewSite}
		 */
		render: function() {
			this.$el.find( '.submit' ).before( this.template() );

			return this;
		},

		/**
		 * Sets MultilingualPress's language select to the currently selected site language.
		 * @param {Event} event - The change event of the site language select element.
		 */
		adaptLanguage: function( event ) {
			var language = this.getLanguage( $( event.target ) );
			if ( this.$language.find( '[value="' + language + '"]' ).length ) {
				this.$language.val( language );
			}
		},

		/**
		 * Returns the selected language of the given select element.
		 * @param {Object} $select - A select element.
		 * @returns {string} - The selected language.
		 */
		getLanguage: function( $select ) {
			var language = $select.val();
			if ( language ) {
				return language.replace( '_', '-' );
			}

			return 'en-US';
		},

		/**
		 * Toggles the Plugins row according to the source site ID select element's value.
		 * @param {Event} event - The change event of the source site ID select element.
		 */
		togglePluginsRow: function( event ) {
			this.$pluginsRow.toggle( 0 < $( event.target ).val() );
		}
	} );

	// Register the AddNewSite module for the Add New Site network admin page.
	MultilingualPress.registerModule( 'network/site-new.php', 'AddNewSite', AddNewSite );
})( jQuery );

/* global MultilingualPress */
(function( $ ) {
	'use strict';

	/**
	 * Constructor for the MultilingualPress CopyPost module.
	 * @constructor
	 */
	var CopyPost = Backbone.View.extend( {
		el: '#post-body',

		events: {
			'click .mlp_copy_button': 'copyPostData'
		},

		/**
		 * Initializes the CopyPost module.
		 */
		initialize: function() {
			this.$content = $( '#content' );

			this.$excerpt = $( '#excerpt' );

			this.$slug = $( '#editable-post-name' );

			this.$title = $( '#title' );
		},

		/**
		 * Copies the post data of the source post to a translation post.
		 * @param {Event} event - The click event of a "Copy source post" button.
		 */
		copyPostData: function( event ) {
			var prefix = 'mlp_translation_data_' + this.getSiteID( $( event.target ) );

			event.preventDefault();

			$( '#' + prefix + '_title' ).val( this.getTitle() );

			$( '#' + prefix + '_name' ).val( this.getSlug() );

			this.copyTinyMCEContent( prefix + '_content' );

			$( '#' + prefix + '_content' ).val( this.getContent() );

			$( '#' + prefix + '_excerpt' ).val( this.getExcerpt() );
		},

		/**
		 * Returns the site ID data attribute value of the given "Copy source post" button.
		 * @param {Object} $button - A "Copy source post" button.
		 * @returns {number} -  The site ID.
		 */
		getSiteID: function( $button ) {
			return $button.data( 'blog_id' ) || 0;
		},

		/**
		 * Returns the title of the original post.
		 * @returns {string}
		 */
		getTitle: function() {
			return this.$title.val() || '';
		},

		/**
		 * Returns the slug of the original post.
		 * @returns {string}
		 */
		getSlug: function() {
			return this.$slug.text() || '';
		},

		/**
		 * Copies the content of the main TinyMCE editor to the TinyMCE editor with the given ID.
		 * @param {string} targetEditorID - The target TinyMCE editor's ID.
		 */
		copyTinyMCEContent: function( targetEditorID ) {
			var sourceEditor,
				targetEditor;

			if ( 'undefined' === typeof window.tinyMCE ) {
				return;
			}

			sourceEditor = window.tinyMCE.get( 'content' );
			if ( ! sourceEditor ) {
				return;
			}

			targetEditor = window.tinyMCE.get( targetEditorID );
			if ( ! targetEditor ) {
				return;
			}

			targetEditor.setContent( sourceEditor.getContent() );
		},

		/**
		 * Returns the content of the original post.
		 * @returns {string}
		 */
		getContent: function() {
			return this.$content.val() || '';
		},

		/**
		 * Returns the excerpt of the original post.
		 * @returns {string}
		 */
		getExcerpt: function() {
			return this.$excerpt.val() || '';
		}
	} );

	// Register the CopyPost module for the Edit Post and Add New Post admin pages.
	MultilingualPress.registerModule( [ 'post.php', 'post-new.php' ], 'CopyPost', CopyPost );
})( jQuery );

/* global MultilingualPress */
(function( $ ) {
	'use strict';

	/**
	 * Settings for the MultilingualPress RelationshipControl module. Only available on the targeted admin pages.
	 * @type {Object}
	 */
	var moduleSettings = MultilingualPress.getSettings( 'RelationshipControl' );

	/**
	 * Constructor for the MultilingualPress RelationshipControl module.
	 * @constructor
	 */
	var RelationshipControl = Backbone.View.extend( {
		el: 'body',

		events: {
		},

		/**
		 * Initializes the RelationshipControl module.
		 */
		initialize: function() {
		}
	} );

	// Register the RelationshipControl module for the Add New Post and the Edit Post admin pages.
	MultilingualPress.registerModule( [ 'post.php', 'post-new.php' ], 'RelationshipControl', RelationshipControl );
})( jQuery );

/* global ajaxurl, mlpRelationshipControlL10n */
;( function( $, mlpL10n ) {
	"use strict";

	var relChanged = [];

	$( '.mlp_rsc_action_list input' ).on( 'change', function() {
		var $this = $( this ),
			$metabox = $this.parent( '.mlp_advanced_translator_metabox' ),
			stay = $this.val() === 'stay',
			elIndex = containsElement( relChanged, $metabox );

		if ( elIndex === -1 ) {
			if ( !stay ) {
				relChanged.push( $metabox );
			}
		} else {
			if ( stay ) {
				relChanged.splice( elIndex, 1 );
			}
		}
	} );

	if ( $( 'body' ).hasClass( 'post-php' ) ) {
		$( '#publish' ).on( 'click', function( e ) {
			if ( relChanged.length && !confirm( mlpL10n.unsavedPostRelationships ) ) {
				e.preventDefault();
				e.stopPropagation();
			}
		} );
	}

	/**
	 * Checks if a jQuery object is already in an array
	 * @param array
	 * @param element
	 * @returns {number}
	 */
	function containsElement( array, element ) {
		for ( var i = 0; i < array.length; i++ ) {
			if ( array[ i ][ 0 ] !== undefined && element[ 0 ] !== undefined && array[ i ][ 0 ] === element[ 0 ] ) {
				return i;
			}
		}

		return -1;
	}

	$.fn.mlp_search = function( options ) {

		var settings = $.extend( {
				remote_blog_id  : this.data( 'remote_blog_id' ),
				remote_post_id  : this.data( 'remote_post_id' ),
				source_blog_id  : this.data( 'source_blog_id' ),
				source_post_id  : this.data( 'source_post_id' ),
				search_field    : 'input.mlp_search_field',
				result_container: 'ul.mlp_search_results',
				action          : 'mlp_search',
				nonce           : '',
				spinner         : '<span class="spinner no-float" style="display:block"></span>'
			}, options ),

			original_content = $( settings.result_container ).html(),
			$search_field = $( settings.search_field ),
			stored = [],

			insert = function( content ) {
				$( settings.result_container ).html( content );
			},

			fetch = function( keywords ) {
				if ( stored[ keywords ] ) {
					insert( stored[ keywords ] );

					return;
				}

				insert( settings.spinner );

				var ajax = $.post(
					ajaxurl,
					{
						action        : settings.action,
						source_post_id: settings.source_post_id,
						source_blog_id: settings.source_blog_id,
						remote_post_id: settings.remote_post_id,
						remote_blog_id: settings.remote_blog_id,
						s             : keywords
					}
				);

				ajax.done( function( data ) {
					stored[ keywords ] = data;
					insert( data );
				} );
			};

		// Prevent submission via Enter key
		$search_field.on( 'keypress', function( event ) {
			if ( 13 == event.which ) {
				return false;
			}
		} ).on( 'keyup', function( event ) {
			event.preventDefault();
			event.stopPropagation();

			var str = $.trim( $( this ).val() );

			if ( !str || 0 === str.length ) {
				insert( original_content );
			} else if ( 2 < str.length ) {
				fetch( str );
			}
		} );
	};

	$( '.mlp_rsc_save_reload' ).on( 'click.mlp', function( event ) {
		event.preventDefault();
		event.stopPropagation();

		var $this = $( this ),
			source_post_id = $this.data( 'source_post_id' ),
			source_blog_id = $this.data( 'source_blog_id' ),
			remote_post_id = $this.data( 'remote_post_id' ),
			remote_blog_id = $this.data( 'remote_blog_id' ),
			current_value = $( 'input[name="mlp_rsc_action[' + remote_blog_id + ']"]:checked' ).val(),
			new_post_id = 0,
			new_post_title = '',

			disconnect = function() {
				changeRelationship( 'disconnect' );
			},

			newRelation = function() {
				new_post_title = $( 'input[name="post_title"]' ).val();
				changeRelationship( 'new_relation' );
			},

			connectExisting = function() {
				new_post_id = $( 'input[name="mlp_add_post[' + remote_blog_id + ']"]:checked' ).val();

				if ( !new_post_id || '0' === new_post_id ) {
					alert( mlpL10n.noPostSelected );
				} else {
					changeRelationship( 'connect_existing' );
				}
			},

			changeRelationship = function( action ) {
				// We use jQuery's ajax function (and not $.post) due to synchrony
				$.ajax( {
					type   : 'POST',
					url    : ajaxurl,
					data   : {
						action        : 'mlp_rsc_' + action,
						source_post_id: source_post_id,
						source_blog_id: source_blog_id,
						remote_post_id: remote_post_id,
						remote_blog_id: remote_blog_id,
						new_post_id   : new_post_id,
						new_post_title: new_post_title
					},
					success: function() {
						window.location.reload( true );
					},
					async  : false
				} );
			};

		if ( !current_value || 'stay' == current_value ) {
			return;
		}

		switch ( current_value ) {
			case 'disconnect':
				disconnect();
				break;

			case 'new':
				newRelation();
				break;

			case 'search':
				connectExisting();
				break;
		}
	} );

} )( jQuery, mlpRelationshipControlL10n );

/* global MultilingualPress */
(function( $ ) {
	'use strict';

	/**
	 * Constructor for the MultilingualPress TermTranslator module.
	 * @constructor
	 */
	var TermTranslator = Backbone.View.extend( {
		el: '#mlp-term-translations',

		events: {
			'change select': 'propagateSelectedTerm'
		},

		/**
		 * Initializes the TermTranslator module.
		 */
		initialize: function() {
			this.$selects = this.$el.find( 'select' );
		},

		/**
		 * Propagates the new value of one term select element to all other term select elements.
		 * @param {Event} event - The change event of a term select element.
		 */
		propagateSelectedTerm: function( event ) {
			var $select,
				relation;

			if ( this.isPropagating ) {
				return;
			}

			this.isPropagating = true;

			$select = $( event.target );

			relation = this.getSelectedRelation( $select );
			if ( '' !== relation ) {
				this.$selects.not( $select ).each( function( index, element ) {
					this.selectTerm( $( element ), relation );
				}.bind( this ) );
			}

			this.isPropagating = false;
		},

		/**
		 * Returns the relation of the given select element (i.e., its currently selected option).
		 * @param {Object} $select - A select element.
		 * @returns {string} - The relation of the selected term.
		 */
		getSelectedRelation: function( $select ) {
			return $select.find( 'option:selected' ).data( 'relation' ) || '';
		},

		/**
		 * Sets the given select element's value to that of the option with the given relation, or the first option.
		 * @param {Object} $select - A select element.
		 * @param {string} relation - The relation of a term.
		 */
		selectTerm: function( $select, relation ) {
			var $option = $select.find( 'option[data-relation="' + relation + '"]' );
			if ( $option.length ) {
				$select.val( $option.val() );
			} else if ( this.getSelectedRelation( $select ) ) {
				$select.val( $select.find( 'option' ).first().val() );
			}
		}
	} );

	// Register the TermTranslator module for the Edit Tags admin page.
	MultilingualPress.registerModule( 'edit-tags.php', 'TermTranslator', TermTranslator );
})( jQuery );

/* global MultilingualPress */
(function() {
	'use strict';

	/**
	 * Settings for the MultilingualPress UserBackendLanguage module. Only available on the targeted admin pages.
	 * @type {Object}
	 */
	var moduleSettings = MultilingualPress.getSettings( 'UserBackendLanguage' );

	/**
	 * Constructor for the MultilingualPress UserBackendLanguage module.
	 * @constructor
	 */
	var UserBackendLanguage = Backbone.View.extend( {
		el: '#WPLANG',

		/**
		 * Initializes the UserBackendLanguage module.
		 */
		initialize: function() {
			this.$el.val( moduleSettings.locale );
		}
	} );

	// Register the UserBackendLanguage module for the General Settings admin page.
	MultilingualPress.registerModule( 'options-general.php', 'UserBackendLanguage', UserBackendLanguage );
})();
