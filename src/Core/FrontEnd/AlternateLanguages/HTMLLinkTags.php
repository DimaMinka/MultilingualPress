<?php # -*- coding: utf-8 -*-

namespace Inpsyde\MultilingualPress\Core\FrontEnd\AlternateLanguages;

/**
 * Alternate language HTML link tags.
 *
 * @package Inpsyde\MultilingualPress\Core\FrontEnd\AlternateLanguages
 * @since   3.0.0
 */
class HTMLLinkTags {

	/**
	 * @var Translations
	 */
	private $translations;

	/**
	 * Constructor. Sets up the properties.
	 *
	 * @since 3.0.0
	 *
	 * @param Translations $translations Translations access object.
	 */
	public function __construct( Translations $translations ) {

		$this->translations = $translations;
	}

	/**
	 * Renders an alternate language HTML link tag for each available translation into the HTML head.
	 *
	 * @wp-hook wp_head
	 *
	 * @return bool Whether or not headers have been sent.
	 */
	public function render() {

		$translations = $this->translations->get();
		if ( ! $translations ) {
			return false;
		}

		foreach ( $translations as $language => $url ) {
			$html = sprintf(
				'<link rel="alternate" hreflang="%1$s" href="%2$s">',
				esc_attr( $language ),
				esc_url( $url )
			);

			/**
			 * Filters the output of the hreflang links in the HTML head.
			 *
			 * @since TODO
			 *
			 * @param string $html     Alternate language HTML link tag.
			 * @param string $language HTTP language code (e.g., "en-US").
			 * @param string $url      Target URL.
			 */
			echo apply_filters( 'mlp_hreflang_html', $html, $language, $url );
		}

		return true;
	}
}