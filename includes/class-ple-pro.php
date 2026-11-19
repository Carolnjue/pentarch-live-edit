<?php
/**
 * PLE Pro features: site kit (colours, fonts, presets, site effects), saved sections and
 * global components, versions, review comments, live WordPress lists, display conditions,
 * page import, WebP uploads and client mode.
 *
 * @package Pentarch_Live_Edit
 */

defined( 'ABSPATH' ) || exit;

final class PLE_Pro {

	const NS  = 'ple/v2';
	const KIT = 'ple2_kit';
	const TPL = 'ple_tpl';

	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ), 6 );
		add_action( 'rest_api_init', array( __CLASS__, 'rest' ) );
		add_action( 'wp_head', array( __CLASS__, 'kit_head' ), 5 );
		add_action( 'wp_footer', array( __CLASS__, 'kit_footer' ), 5 );
		add_shortcode( 'ple_component', array( __CLASS__, 'sc_component' ) );
		add_shortcode( 'ple_posts', array( __CLASS__, 'sc_posts' ) );
		add_filter( 'do_shortcode_tag', array( __CLASS__, 'nested_shortcodes' ), 10, 2 );
		add_filter( 'body_class', array( __CLASS__, 'body_class' ) );
		add_filter( 'image_editor_output_format', array( __CLASS__, 'webp' ) );
		add_action( 'show_user_profile', array( __CLASS__, 'profile_field' ) );
		add_action( 'edit_user_profile', array( __CLASS__, 'profile_field' ) );
		add_action( 'personal_options_update', array( __CLASS__, 'profile_save' ) );
		add_action( 'edit_user_profile_update', array( __CLASS__, 'profile_save' ) );
	}

	public static function register() {
		register_post_type(
			self::TPL,
			array(
				'labels'       => array( 'name' => __( 'Saved sections', 'pentarch-live-edit' ), 'singular_name' => __( 'Saved section', 'pentarch-live-edit' ), 'menu_name' => __( 'Saved sections', 'pentarch-live-edit' ) ),
				'public'       => false,
				'show_ui'      => false,
				'supports'     => array( 'title' ),
			)
		);
	}

	/* ---------------------------------------------------------------- kit */

	public static function kit() {
		$k = get_option( self::KIT, array() );
		return wp_parse_args(
			is_array( $k ) ? $k : array(),
			array(
				'colors'  => array(
					array( 'name' => 'Primary', 'val' => '#2563eb' ),
					array( 'name' => 'Accent', 'val' => '#f59e0b' ),
					array( 'name' => 'Dark', 'val' => '#0f172a' ),
					array( 'name' => 'Light', 'val' => '#f8fafc' ),
				),
				'fonts'   => array( 'heading' => '', 'body' => '' ),
				'presets' => array(),
				'effects' => array( 'cursor' => '', 'fade' => '', 'smooth' => '' ),
				'bp'      => array( 't' => 1024, 'm' => 767 ),
				'webp'    => 1,
			)
		);
	}

	private static function slug( $s ) {
		return trim( preg_replace( '/[^a-z0-9]+/', '-', strtolower( (string) $s ) ), '-' );
	}

	private static function font_link( $kit ) {
		$fams = array();
		foreach ( array( 'heading', 'body' ) as $k ) {
			$f = trim( (string) $kit['fonts'][ $k ] );
			if ( $f && ! preg_match( '/^(system-ui|Georgia|Arial|"?Trebuchet|"?Courier)/i', $f ) ) {
				$fams[ $f ] = 'family=' . str_replace( ' ', '+', $f ) . ':wght@400;500;600;700;800';
			}
		}
		return $fams ? 'https://fonts.googleapis.com/css2?' . implode( '&', $fams ) . '&display=swap' : '';
	}

	public static function kit_css( $kit = null ) {
		$kit = $kit ? $kit : self::kit();
		$css = ':root{';
		foreach ( (array) $kit['colors'] as $i => $c ) {
			if ( ! empty( $c['val'] ) && sanitize_hex_color( $c['val'] ) ) {
				$css .= '--pl-c' . ( $i + 1 ) . ':' . $c['val'] . ';--pl-' . self::slug( $c['name'] ) . ':' . $c['val'] . ';';
			}
		}
		if ( ! empty( $kit['colors'][0]['val'] ) ) {
			$css .= '--pa:' . $kit['colors'][0]['val'] . ';';
		}
		$css .= '}';
		$hf = trim( (string) $kit['fonts']['heading'] );
		$bf = trim( (string) $kit['fonts']['body'] );
		if ( $bf ) {
			$css .= '.ple-page,.ple-embed{font-family:' . ( false !== strpos( $bf, ',' ) ? $bf : '"' . $bf . '",system-ui,sans-serif' ) . '}';
		}
		if ( $hf ) {
			$css .= '.ple-page h1,.ple-page h2,.ple-page h3,.ple-page h4,.ple-w-heading,.ple-embed h1,.ple-embed h2,.ple-embed h3{font-family:' . ( false !== strpos( $hf, ',' ) ? $hf : '"' . $hf . '",system-ui,sans-serif' ) . '}';
		}
		foreach ( (array) $kit['presets'] as $p ) {
			if ( ! empty( $p['css'] ) ) {
				$css .= wp_strip_all_tags( (string) $p['css'] );
			}
		}
		if ( ! empty( $kit['effects']['fade'] ) ) {
			$css .= '@media (prefers-reduced-motion:no-preference){body{animation:ple-pagein .6s ease both}@keyframes ple-pagein{from{opacity:0}}}';
		}
		if ( ! empty( $kit['effects']['smooth'] ) ) {
			$css .= 'html{scroll-behavior:smooth}';
		}
		return $css;
	}

	public static function kit_head() {
		$kit  = self::kit();
		$font = self::font_link( $kit );
		if ( $font ) {
			echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="' . esc_url( $font ) . '">' . "\n";
		}
		echo '<style id="ple-kit">' . self::kit_css( $kit ) . "</style>\n"; // phpcs:ignore
	}

	public static function kit_footer() {
		$kit = self::kit();
		if ( 1024 !== (int) $kit['bp']['t'] || 767 !== (int) $kit['bp']['m'] ) {
			echo '<script>window.PLE_BP=' . wp_json_encode( array( 't' => (int) $kit['bp']['t'], 'm' => (int) $kit['bp']['m'] ) ) . ';</script>' . "\n";
		}
		if ( ! empty( $kit['effects']['cursor'] ) ) {
			echo '<script>document.body.setAttribute("data-fx-cursor",' . wp_json_encode( $kit['effects']['cursor'] ) . ');</script>' . "\n";
		}
	}

	/* -------------------------------------------------------- shortcodes */

	public static function sc_component( $atts ) {
		$id = isset( $atts['id'] ) ? (int) $atts['id'] : 0;
		$p  = $id ? get_post( $id ) : null;
		if ( ! $p || self::TPL !== $p->post_type ) {
			return '';
		}
		$css = (string) get_post_meta( $id, '_css', true );
		$css = $css ? '<style class="ple-comp-css">' . wp_strip_all_tags( $css ) . '</style>' : '';
		return $css . do_shortcode( (string) get_post_meta( $id, '_html', true ) );
	}

	/* Live lists of posts, pages or any public content type (courses, team, projects). */
	public static function sc_posts( $atts ) {
		$a = shortcode_atts( array( 'type' => 'post', 'count' => 6, 'cat' => '', 'cols' => 3, 'filters' => '', 'search' => '', 'excerpt' => 1, 'btn' => 'Read more', 'order' => 'date' ), $atts );
		if ( ! post_type_exists( $a['type'] ) || ! is_post_type_viewable( $a['type'] ) ) {
			return '';
		}
		$args = array( 'post_type' => $a['type'], 'posts_per_page' => max( 1, min( 48, (int) $a['count'] ) ), 'post_status' => 'publish', 'orderby' => 'title' === $a['order'] ? 'title' : ( 'menu' === $a['order'] ? 'menu_order' : 'date' ), 'order' => 'title' === $a['order'] || 'menu' === $a['order'] ? 'ASC' : 'DESC', 'ignore_sticky_posts' => true );
		if ( $a['cat'] && 'post' === $a['type'] ) {
			$args['category_name'] = sanitize_title( $a['cat'] );
		}
		$q = new WP_Query( $args );
		if ( ! $q->have_posts() ) {
			return '<p class="pl-alert info">' . esc_html__( 'Nothing to show yet.', 'pentarch-live-edit' ) . '</p>';
		}
		$uid   = 'plp' . wp_rand( 1000, 99999 );
		$terms = array();
		$cards = '';
		foreach ( $q->posts as $p ) {
			$tax  = get_object_taxonomies( $p->post_type, 'objects' );
			$tags = array();
			foreach ( $tax as $t ) {
				if ( $t->public && $t->hierarchical ) {
					foreach ( (array) get_the_terms( $p, $t->name ) as $term ) {
						if ( $term && ! is_wp_error( $term ) ) {
							$tags[ $term->slug ]  = $term->name;
							$terms[ $term->slug ] = $term->name;
						}
					}
				}
			}
			$img    = get_the_post_thumbnail_url( $p, 'medium_large' );
			$cards .= '<article class="ple-card pl-post" data-terms="' . esc_attr( implode( ' ', array_keys( $tags ) ) ) . '" data-title="' . esc_attr( strtolower( get_the_title( $p ) ) ) . '" style="background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,.08)">' . ( $img ? '<img src="' . esc_url( $img ) . '" alt="' . esc_attr( get_the_title( $p ) ) . '" loading="lazy">' : '' ) . '<div class="ple-card-b">' . ( $tags ? '<small style="color:var(--pa,#2563eb);font-weight:700">' . esc_html( implode( ' · ', $tags ) ) . '</small>' : '' ) . '<h3><a href="' . esc_url( get_permalink( $p ) ) . '" style="color:inherit;text-decoration:none">' . esc_html( get_the_title( $p ) ) . '</a></h3>' . ( $a['excerpt'] ? '<p>' . esc_html( wp_trim_words( $p->post_excerpt ? $p->post_excerpt : wp_strip_all_tags( strip_shortcodes( $p->post_content ) ), 22 ) ) . '</p>' : '' ) . '<a class="ple-card-a" href="' . esc_url( get_permalink( $p ) ) . '">' . esc_html( $a['btn'] ) . ' &rarr;</a></div></article>';
		}
		$bar = '';
		if ( $a['filters'] && $terms ) {
			$bar .= '<div class="pl-filter" role="group" aria-label="' . esc_attr__( 'Filter', 'pentarch-live-edit' ) . '"><button type="button" class="on" data-f="">' . esc_html__( 'All', 'pentarch-live-edit' ) . '</button>';
			foreach ( $terms as $slug => $name ) {
				$bar .= '<button type="button" data-f="' . esc_attr( $slug ) . '">' . esc_html( $name ) . '</button>';
			}
			$bar .= '</div>';
		}
		if ( $a['search'] ) {
			$bar .= '<input type="search" class="pl-fsearch" placeholder="' . esc_attr__( 'Search…', 'pentarch-live-edit' ) . '" aria-label="' . esc_attr__( 'Search', 'pentarch-live-edit' ) . '">';
		}
		return '<div class="pl-posts" id="' . $uid . '" data-posts>' . ( $bar ? '<div class="pl-pbar">' . $bar . '</div>' : '' ) . '<div class="pl-pgrid" style="--pc:' . (int) $a['cols'] . '">' . $cards . '</div></div>';
	}

	/* Live Blocks may contain other shortcodes (components, lists). */
	public static function nested_shortcodes( $out, $tag ) {
		if ( 'ple' === $tag && is_string( $out ) && ( false !== strpos( $out, '[ple_component' ) || false !== strpos( $out, '[ple_posts' ) ) ) {
			return do_shortcode( $out );
		}
		return $out;
	}

	public static function body_class( $c ) {
		if ( is_user_logged_in() ) {
			foreach ( (array) wp_get_current_user()->roles as $r ) {
				$c[] = 'pl-role-' . sanitize_html_class( $r );
			}
		}
		return $c;
	}

	public static function webp( $map ) {
		if ( empty( self::kit()['webp'] ) ) {
			return $map;
		}
		$map['image/jpeg'] = 'image/webp';
		$map['image/png']  = 'image/webp';
		return $map;
	}

	/* ---------------------------------------------------------- client mode */

	public static function is_client( $uid = 0 ) {
		$uid = $uid ? $uid : get_current_user_id();
		return (bool) get_user_meta( $uid, '_ple_client', true );
	}

	public static function profile_field( $user ) {
		if ( ! current_user_can( 'promote_users' ) ) {
			return;
		}
		echo '<h2>PLE</h2><table class="form-table"><tr><th>' . esc_html__( 'Client mode', 'pentarch-live-edit' ) . '</th><td><label><input type="checkbox" name="ple_client" value="1" ' . checked( self::is_client( $user->ID ), true, false ) . '> ' . esc_html__( 'In the PLE builder, this person can only change text, pictures and links, so the design stays safe.', 'pentarch-live-edit' ) . '</label></td></tr></table>';
	}

	public static function profile_save( $uid ) {
		if ( ! current_user_can( 'promote_users' ) || ! isset( $_POST['_wpnonce'] ) ) { // phpcs:ignore
			return;
		}
		update_user_meta( $uid, '_ple_client', empty( $_POST['ple_client'] ) ? 0 : 1 ); // phpcs:ignore
	}

	/* ---------------------------------------------------------------- REST */

	public static function rest() {
		$edit  = function () { return current_user_can( 'edit_pages' ); };
		$theme = function () { return current_user_can( 'edit_theme_options' ); };
		$page  = function ( $r ) { return current_user_can( 'edit_post', (int) $r['id'] ); };
		$routes = array(
			array( '/kit', 'GET', 'kit_get', $edit ),
			array( '/kit', 'POST', 'kit_save', $theme ),
			array( '/templates', 'GET', 'tpl_list', $edit ),
			array( '/templates', 'POST', 'tpl_save', $edit ),
			array( '/templates/(?P<tid>\d+)', 'DELETE', 'tpl_delete', $edit ),
			array( '/page/(?P<id>\d+)/versions', 'GET', 'ver_list', $page ),
			array( '/page/(?P<id>\d+)/versions', 'POST', 'ver_save', $page ),
			array( '/page/(?P<id>\d+)/comments', 'GET', 'cm_list', $page ),
			array( '/page/(?P<id>\d+)/comments', 'POST', 'cm_save', $page ),
			array( '/import', 'POST', 'import_url', $edit ),
			array( '/types', 'GET', 'types', $edit ),
		);
		foreach ( $routes as $r ) {
			register_rest_route( self::NS, $r[0], array( 'methods' => $r[1], 'callback' => array( __CLASS__, $r[2] ), 'permission_callback' => $r[3] ) );
		}
	}

	public static function kit_get() {
		return self::kit();
	}

	public static function kit_save( $req ) {
		$in  = $req->get_json_params();
		$kit = self::kit();
		if ( isset( $in['colors'] ) && is_array( $in['colors'] ) ) {
			$kit['colors'] = array();
			foreach ( array_slice( $in['colors'], 0, 12 ) as $c ) {
				$v = sanitize_hex_color( (string) ( $c['val'] ?? '' ) );
				if ( $v ) {
					$kit['colors'][] = array( 'name' => sanitize_text_field( (string) ( $c['name'] ?? 'Colour' ) ), 'val' => $v );
				}
			}
		}
		if ( isset( $in['fonts'] ) && is_array( $in['fonts'] ) ) {
			foreach ( array( 'heading', 'body' ) as $f ) {
				$kit['fonts'][ $f ] = preg_replace( '/[^A-Za-z0-9 ,"\-]/', '', (string) ( $in['fonts'][ $f ] ?? '' ) );
			}
		}
		if ( isset( $in['presets'] ) && is_array( $in['presets'] ) ) {
			$kit['presets'] = array();
			foreach ( array_slice( $in['presets'], 0, 60 ) as $p ) {
				$name = sanitize_text_field( (string) ( $p['name'] ?? '' ) );
				if ( '' === $name ) {
					continue;
				}
				$kit['presets'][] = array( 'name' => $name, 'cls' => 'ple-pre-' . self::slug( $name ), 'style' => is_array( $p['style'] ?? null ) ? $p['style'] : array(), 'css' => wp_strip_all_tags( (string) ( $p['css'] ?? '' ) ) );
			}
		}
		if ( isset( $in['effects'] ) && is_array( $in['effects'] ) ) {
			$kit['effects'] = array(
				'cursor' => in_array( $in['effects']['cursor'] ?? '', array( '', 'dot', 'ring' ), true ) ? $in['effects']['cursor'] : '',
				'fade'   => empty( $in['effects']['fade'] ) ? '' : '1',
				'smooth' => empty( $in['effects']['smooth'] ) ? '' : '1',
			);
		}
		if ( isset( $in['bp'] ) && is_array( $in['bp'] ) ) {
			$kit['bp'] = array( 't' => max( 600, min( 1400, (int) $in['bp']['t'] ) ), 'm' => max( 320, min( 900, (int) $in['bp']['m'] ) ) );
		}
		if ( isset( $in['webp'] ) ) {
			$kit['webp'] = empty( $in['webp'] ) ? 0 : 1;
		}
		update_option( self::KIT, $kit );
		do_action( 'litespeed_purge_all' );
		return $kit;
	}

	private static function tpl_out( $p ) {
		return array(
			'id'     => $p->ID,
			'title'  => $p->post_title,
			'global' => (bool) get_post_meta( $p->ID, '_global', true ),
			'tree'   => json_decode( (string) get_post_meta( $p->ID, '_tree', true ), true ),
		);
	}

	public static function tpl_list() {
		return array_map( array( __CLASS__, 'tpl_out' ), get_posts( array( 'post_type' => self::TPL, 'post_status' => 'private', 'numberposts' => 200, 'orderby' => 'title', 'order' => 'ASC' ) ) );
	}

	public static function tpl_save( $req ) {
		$id    = (int) $req['tid'];
		$title = sanitize_text_field( (string) $req['title'] );
		$tree  = $req->get_param( 'tree' );
		if ( ! is_array( $tree ) ) {
			return new WP_Error( 'ple_bad', __( 'Nothing to save.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
		}
		$data = array( 'post_type' => self::TPL, 'post_status' => 'private', 'post_title' => $title ? $title : __( 'Saved section', 'pentarch-live-edit' ) );
		if ( $id ) {
			$p = get_post( $id );
			if ( ! $p || self::TPL !== $p->post_type ) {
				return new WP_Error( 'ple_404', 'Not found', array( 'status' => 404 ) );
			}
			$data['ID'] = $id;
			wp_update_post( wp_slash( $data ) );
		} else {
			$id = wp_insert_post( wp_slash( $data ) );
		}
		$code = current_user_can( 'unfiltered_html' );
		update_post_meta( $id, '_tree', wp_slash( wp_json_encode( $tree ) ) );
		update_post_meta( $id, '_global', $req['global'] ? 1 : 0 );
		update_post_meta( $id, '_html', wp_slash( $code ? (string) $req['html'] : wp_kses_post( (string) $req['html'] ) ) );
		update_post_meta( $id, '_css', wp_slash( wp_strip_all_tags( (string) $req['css'] ) ) );
		do_action( 'litespeed_purge_all' );
		return self::tpl_out( get_post( $id ) );
	}

	public static function tpl_delete( $req ) {
		$p = get_post( (int) $req['tid'] );
		if ( $p && self::TPL === $p->post_type ) {
			wp_trash_post( $p->ID );
		}
		return array( 'ok' => true );
	}

	public static function ver_list( $req ) {
		$v = get_post_meta( (int) $req['id'], '_ple_versions', true );
		return is_array( $v ) ? array_reverse( $v ) : array();
	}

	public static function ver_save( $req ) {
		$id = (int) $req['id'];
		$v  = get_post_meta( $id, '_ple_versions', true );
		$v  = is_array( $v ) ? $v : array();
		$v[] = array( 'id' => wp_generate_password( 8, false ), 'name' => sanitize_text_field( (string) $req['name'] ), 'at' => time(), 'by' => wp_get_current_user()->display_name, 'tree' => $req->get_param( 'tree' ) );
		$v  = array_slice( $v, -30 );
		update_post_meta( $id, '_ple_versions', wp_slash( $v ) );
		return array_reverse( $v );
	}

	public static function cm_list( $req ) {
		$c = get_post_meta( (int) $req['id'], '_ple_comments', true );
		return is_array( $c ) ? $c : array();
	}

	public static function cm_save( $req ) {
		$id = (int) $req['id'];
		$c  = get_post_meta( $id, '_ple_comments', true );
		$c  = is_array( $c ) ? $c : array();
		if ( $req['resolve'] ) {
			foreach ( $c as &$x ) {
				if ( $x['id'] === $req['resolve'] ) {
					$x['done'] = 1;
				}
			}
			unset( $x );
		} else {
			$text = sanitize_textarea_field( (string) $req['text'] );
			if ( '' === $text ) {
				return new WP_Error( 'ple_empty', __( 'Write a comment first.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
			}
			$c[] = array( 'id' => wp_generate_password( 8, false ), 'node' => preg_replace( '/[^a-z0-9]/i', '', (string) $req['node'] ), 'text' => $text, 'by' => wp_get_current_user()->display_name, 'at' => time(), 'done' => 0 );
		}
		update_post_meta( $id, '_ple_comments', wp_slash( $c ) );
		return $c;
	}

	/* Fetch a public web page so the builder can turn it into editable layers. */
	public static function import_url( $req ) {
		$url = esc_url_raw( (string) $req['url'] );
		if ( ! wp_http_validate_url( $url ) ) {
			return new WP_Error( 'ple_url', __( 'Enter a full web address starting with https://', 'pentarch-live-edit' ), array( 'status' => 400 ) );
		}
		$r = wp_safe_remote_get( $url, array( 'timeout' => 20, 'redirection' => 4, 'user-agent' => 'Mozilla/5.0 (PLE importer)' ) );
		if ( is_wp_error( $r ) || 200 !== wp_remote_retrieve_response_code( $r ) ) {
			return new WP_Error( 'ple_fetch', __( 'That page could not be loaded.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
		}
		return array( 'url' => $url, 'html' => substr( (string) wp_remote_retrieve_body( $r ), 0, 3000000 ) );
	}

	public static function types() {
		$out = array();
		foreach ( get_post_types( array( 'public' => true ), 'objects' ) as $t ) {
			if ( 'attachment' !== $t->name ) {
				$out[] = array( 'name' => $t->name, 'label' => $t->labels->name );
			}
		}
		return $out;
	}
}
