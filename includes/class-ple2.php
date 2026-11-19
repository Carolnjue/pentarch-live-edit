<?php
/**
 * Pentarch Live Edit 2: visual page builder and PLE Studio.
 *
 * Adds to Live Edit 1.x (which keeps working unchanged):
 *  - "Edit with PLE": a Pagelayer-style builder for any page or post, with
 *    Layers, widgets, responsive styles and a code view.
 *  - PLE Studio: a mobile-first learning platform at /studio/ for teaching web
 *    design, with lessons, projects, classes, teacher review and certificates.
 *
 * @package Pentarch_Live_Edit
 */

defined( 'ABSPATH' ) || exit;

final class PLE2 {

	const VERSION  = '2.8.0';
	const NS       = 'ple/v2';
	const PROJECT  = 'ple_project';
	const KLASS    = 'ple_class';
	const SUB      = 'ple_sub';
	const OPT      = 'ple2_studio';

	/** @var string */
	private static $url;
	/** @var string */
	private static $dir;

	public static function init( $file ) {
		self::$url = plugin_dir_url( $file );
		self::$dir = plugin_dir_path( $file );

		add_action( 'init', array( __CLASS__, 'register' ), 5 );
		add_action( 'init', array( __CLASS__, 'rewrites' ) );
		add_filter( 'query_vars', array( __CLASS__, 'query_vars' ) );
		add_action( 'template_redirect', array( __CLASS__, 'studio_router' ), 1 );
		add_action( 'rest_api_init', array( __CLASS__, 'rest' ) );

		/* Builder */
		add_action( 'admin_action_ple_builder', array( __CLASS__, 'builder_screen' ) );
		add_filter( 'page_row_actions', array( __CLASS__, 'row_action' ), 10, 2 );
		add_filter( 'post_row_actions', array( __CLASS__, 'row_action' ), 10, 2 );
		add_action( 'admin_bar_menu', array( __CLASS__, 'admin_bar' ), 90 );
		add_filter( 'the_content', array( __CLASS__, 'the_content' ), 1000 );
		add_filter( 'the_content', array( __CLASS__, 'canvas_content' ), 99999 );
		add_action( 'template_redirect', array( __CLASS__, 'canvas_mode' ), 0 );
		add_action( 'wp_head', array( __CLASS__, 'page_css' ), 20 );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'front_assets' ), 20 );
		add_filter( 'template_include', array( __CLASS__, 'canvas_template' ), 99 );
		add_filter( 'display_post_states', array( __CLASS__, 'post_state' ), 10, 2 );
		add_action( 'edit_form_after_title', array( __CLASS__, 'edit_screen_button' ) );

		/* Admin */
		add_action( 'admin_menu', array( __CLASS__, 'admin_menu' ), 20 );
		add_action( 'admin_post_ple2_settings', array( __CLASS__, 'save_settings' ) );
		add_action( 'admin_post_ple2_new_page', array( __CLASS__, 'new_page' ) );
		add_filter( 'login_redirect', array( __CLASS__, 'login_redirect' ), 10, 3 );
		add_action( 'admin_init', array( __CLASS__, 'keep_students_out' ) );
		add_filter( 'show_admin_bar', array( __CLASS__, 'hide_bar_for_students' ) );
	}

	/* ===================================================================
	 * Setup
	 * ================================================================= */

	public static function register() {
		$hidden = array(
			'public'              => false,
			'show_ui'             => true,
			'show_in_menu'        => 'edit.php?post_type=ple_block',
			'show_in_rest'        => false,
			'exclude_from_search' => true,
			'supports'            => array( 'title', 'author' ),
			'capability_type'     => 'post',
			'capabilities'        => array( 'create_posts' => 'do_not_allow' ),
			'map_meta_cap'        => true,
		);
		register_post_type( self::PROJECT, array_merge( $hidden, array( 'labels' => array( 'name' => __( 'Studio projects', 'pentarch-live-edit' ), 'singular_name' => __( 'Studio project', 'pentarch-live-edit' ), 'menu_name' => __( 'Studio projects', 'pentarch-live-edit' ) ) ) ) );
		register_post_type( self::KLASS, array_merge( $hidden, array( 'labels' => array( 'name' => __( 'Studio classes', 'pentarch-live-edit' ), 'singular_name' => __( 'Studio class', 'pentarch-live-edit' ), 'menu_name' => __( 'Studio classes', 'pentarch-live-edit' ) ) ) ) );
		register_post_type( self::SUB, array_merge( $hidden, array( 'show_in_menu' => false, 'labels' => array( 'name' => __( 'Submissions', 'pentarch-live-edit' ) ) ) ) );
		register_post_type( 'ple_entry', array_merge( $hidden, array( 'supports' => array( 'title' ), 'labels' => array( 'name' => __( 'Form entries', 'pentarch-live-edit' ), 'singular_name' => __( 'Form entry', 'pentarch-live-edit' ), 'menu_name' => __( 'Form entries', 'pentarch-live-edit' ) ) ) ) );
		add_action( 'add_meta_boxes_ple_entry', function () {
			add_meta_box( 'ple_entry_fields', __( 'Answers', 'pentarch-live-edit' ), function ( $post ) {
				$f = json_decode( (string) get_post_meta( $post->ID, '_fields', true ), true );
				echo '<table class="widefat striped"><tbody>';
				foreach ( (array) $f as $k => $v ) {
					echo '<tr><th style="width:30%">' . esc_html( $k ) . '</th><td>' . nl2br( esc_html( $v ) ) . '</td></tr>';
				}
				echo '<tr><th>' . esc_html__( 'Page', 'pentarch-live-edit' ) . '</th><td><a href="' . esc_url( get_post_meta( $post->ID, '_page', true ) ) . '" target="_blank">' . esc_html( get_post_meta( $post->ID, '_page', true ) ) . '</a></td></tr></tbody></table>';
			}, 'ple_entry', 'normal', 'high' );
		} );

		if ( get_option( 'ple2_roles' ) !== self::VERSION ) {
			add_role( 'ple_student', __( 'PLE Student', 'pentarch-live-edit' ), array( 'read' => true ) );
			add_role( 'ple_teacher', __( 'PLE Teacher', 'pentarch-live-edit' ), array( 'read' => true ) );
			update_option( 'ple2_roles', self::VERSION );
		}
	}

	public static function settings() {
		$s = get_option( self::OPT, array() );
		return wp_parse_args(
			is_array( $s ) ? $s : array(),
			array(
				'slug'         => 'studio',
				'name'         => 'PLE Studio',
				'org'          => get_bloginfo( 'name' ),
				'register'     => 1,
				'teacher_code' => '',
				'color'        => '#2563eb',
				'logo'         => '',
				'support'      => '',
				'form_email'   => '',
			)
		);
	}

	private static function slug() {
		$s = sanitize_title( self::settings()['slug'] );
		return $s ? $s : 'studio';
	}

	public static function studio_url( $path = '' ) {
		return home_url( '/' . self::slug() . '/' . ltrim( $path, '/' ) );
	}

	public static function rewrites() {
		$s = preg_quote( self::slug(), '#' );
		add_rewrite_rule( '^' . $s . '/?$', 'index.php?ple_studio=app', 'top' );
		add_rewrite_rule( '^' . $s . '/p/([a-z0-9-]+)/?$', 'index.php?ple_studio=pub&ple_key=$matches[1]', 'top' );
		add_rewrite_rule( '^' . $s . '/cert/([a-z0-9]+)/?$', 'index.php?ple_studio=cert&ple_key=$matches[1]', 'top' );
		add_rewrite_rule( '^' . $s . '/sw\.js$', 'index.php?ple_studio=sw', 'top' );
		add_rewrite_rule( '^' . $s . '/manifest\.json$', 'index.php?ple_studio=manifest', 'top' );
		$sig = self::VERSION . '|' . self::slug();
		if ( get_option( 'ple2_rules' ) !== $sig ) {
			flush_rewrite_rules( false );
			update_option( 'ple2_rules', $sig );
		}
	}

	public static function query_vars( $v ) {
		$v[] = 'ple_studio';
		$v[] = 'ple_key';
		return $v;
	}

	private static function asset( $f ) {
		return self::$url . 'assets/' . $f . '?v=' . rawurlencode( self::VERSION . '-' . @filemtime( self::$dir . 'assets/' . $f ) );
	}

	/* ===================================================================
	 * Builder
	 * ================================================================= */

	private static function builder_link( $id ) {
		return admin_url( 'admin.php?action=ple_builder&post=' . (int) $id );
	}

	public static function row_action( $actions, $post ) {
		if ( in_array( $post->post_type, array( 'page', 'post' ), true ) && current_user_can( 'edit_post', $post->ID ) ) {
			$actions = array( 'ple' => '<a href="' . esc_url( self::builder_link( $post->ID ) ) . '" style="font-weight:600">' . esc_html__( 'Edit with PLE', 'pentarch-live-edit' ) . '</a>' ) + $actions;
		}
		return $actions;
	}

	public static function post_state( $states, $post ) {
		if ( get_post_meta( $post->ID, '_ple_on', true ) ) {
			$states['ple'] = 'PLE';
		}
		return $states;
	}

	public static function edit_screen_button( $post ) {
		if ( ! in_array( $post->post_type, array( 'page', 'post' ), true ) || ! current_user_can( 'edit_post', $post->ID ) || 'auto-draft' === $post->post_status && ! $post->ID ) {
			return;
		}
		echo '<p><a class="button button-primary button-hero" href="' . esc_url( self::builder_link( $post->ID ) ) . '">' . esc_html__( 'Edit with PLE builder', 'pentarch-live-edit' ) . '</a></p>';
	}

	public static function admin_bar( $bar ) {
		if ( is_admin() || ! is_singular( array( 'page', 'post' ) ) ) {
			return;
		}
		$id = get_queried_object_id();
		if ( ! current_user_can( 'edit_post', $id ) ) {
			return;
		}
		$bar->add_node( array( 'id' => 'ple-builder', 'title' => '<span class="ab-icon dashicons dashicons-layout" style="top:2px"></span>' . esc_html__( 'Edit with PLE', 'pentarch-live-edit' ), 'href' => self::builder_link( $id ) ) );
	}

	public static function builder_screen() {
		$id   = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;
		$post = $id ? get_post( $id ) : null;
		if ( ! $post || ! current_user_can( 'edit_post', $id ) ) {
			wp_die( esc_html__( 'You cannot edit this page.', 'pentarch-live-edit' ), 403 );
		}
		$built  = (bool) get_post_meta( $id, '_ple_on', true );
		$tree   = $built ? json_decode( (string) get_post_meta( $id, '_ple_tree', true ), true ) : null;
		$source = null;
		if ( ! is_array( $tree ) ) {
			$tree   = null;
			$source = self::native_source( $post );
		}
		wp_enqueue_media( array( 'post' => $id ) );
		wp_enqueue_style( 'ple-editor', self::asset( 'ple-editor.css' ), array(), null );
		wp_enqueue_script( 'ple-core', self::asset( 'ple-core.js' ), array(), null, true );
		wp_enqueue_script( 'ple-widgets', self::asset( 'ple-widgets.js' ), array( 'ple-core' ), null, true );
		wp_enqueue_script( 'ple-editor', self::asset( 'ple-editor.js' ), array( 'ple-widgets' ), null, true );
		wp_enqueue_script( 'ple-designs', self::asset( 'ple-academy-content.js' ), array( 'ple-widgets' ), null, true );
		wp_enqueue_script( 'ple-pro', self::asset( 'ple-pro.js' ), array( 'ple-editor', 'ple-designs' ), null, true );
		wp_enqueue_script( 'ple-builder', self::asset( 'ple-builder.js' ), array( 'ple-pro', 'media-editor' ), null, true );
		wp_localize_script(
			'ple-pro',
			'PLE_BUILDER',
			array(
				'id'      => $id,
				'title'   => get_the_title( $id ),
				'tree'    => $tree,
				'source'  => $source,
				'canvas'  => add_query_arg( array( 'ple_canvas' => wp_create_nonce( 'ple_canvas_' . $id ), 'preview' => 'publish' === $post->post_status ? false : 'true' ), get_permalink( $id ) ),
				'layout'  => get_post_meta( $id, '_ple_layout', true ) ? get_post_meta( $id, '_ple_layout', true ) : 'theme',
				'rest'    => esc_url_raw( rest_url( self::NS . '/page/' . $id ) ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
				'view'    => get_permalink( $id ),
				'exit'    => admin_url( 'page' === $post->post_type ? 'edit.php?post_type=page' : 'edit.php' ),
				'status'  => $post->post_status,
				'canCode' => current_user_can( 'unfiltered_html' ),
				'runtime' => self::runtime_urls(),
				'pro'     => class_exists( 'PLE_Pro' ) ? array(
					'rest'     => esc_url_raw( rest_url( self::NS . '/' ) ),
					'kit'      => PLE_Pro::kit(),
					'types'    => PLE_Pro::types(),
					'client'   => PLE_Pro::is_client(),
					'canTheme' => current_user_can( 'edit_theme_options' ),
					'studio'   => self::studio_url(),
				) : null,
			)
		);
		nocache_headers();
		header( 'Content-Type: text/html; charset=utf-8' );
		?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?php echo esc_html( sprintf( /* translators: %s page title */ __( 'PLE: %s', 'pentarch-live-edit' ), get_the_title( $id ) ) ); ?></title>
<?php
		wp_print_styles( array( 'common', 'buttons', 'media-views', 'imgareaselect', 'ple-editor' ) );
		wp_print_head_scripts();
		?>
</head>
<body class="wp-core-ui ple-builder-body" style="margin:0">
<div id="ple-app"></div>
<?php
		wp_print_media_templates();
		_wp_footer_scripts();
		?>
</body>
</html>
		<?php
		exit;
	}

	public static function the_content( $content ) {
		if ( is_admin() || ! in_the_loop() || ! is_main_query() ) {
			return $content;
		}
		$id = get_the_ID();
		if ( ! $id || ! get_post_meta( $id, '_ple_on', true ) || post_password_required( $id ) ) {
			return $content;
		}
		static $busy = false;
		if ( $busy ) {
			return $content;
		}
		$html = (string) get_post_meta( $id, '_ple_html', true );
		if ( false !== strpos( $html, '[ple' ) ) {
			$busy = true;
			$html = do_shortcode( $html );
			$busy = false;
		}
		return '' !== $html ? $html : $content;
	}

	public static function page_css() {
		if ( ! is_singular() ) {
			return;
		}
		$id = get_queried_object_id();
		if ( ! get_post_meta( $id, '_ple_on', true ) ) {
			return;
		}
		$css = (string) get_post_meta( $id, '_ple_css', true );
		/* Let the builder sections run edge to edge inside common themes. */
		$css .= "\n.ple-on .entry-content>.ple-page,.ple-on .ple-page{max-width:none}.ple-page .ple-section{width:100%}";
		echo "<style id=\"ple-page-css\">\n" . wp_strip_all_tags( $css ) . "\n</style>\n"; // phpcs:ignore WordPress.Security.EscapeOutput
	}

	public static function canvas_template( $template ) {
		if ( is_singular() && get_post_meta( get_queried_object_id(), '_ple_on', true ) && 'canvas' === get_post_meta( get_queried_object_id(), '_ple_layout', true ) ) {
			return self::$dir . 'includes/canvas.php';
		}
		return $template;
	}

	/**
	 * The page content and the Live Blocks it uses, so the builder can show
	 * hand-written HTML as sections, rows, columns and widgets.
	 */
	public static function native_source( $post ) {
		$content = (string) $post->post_content;
		$blocks  = array();
		if ( preg_match_all( '/\[ple\s[^\]]*\]/', $content, $m ) ) {
			foreach ( array_unique( $m[0] ) as $code ) {
				$b = self::block_from_shortcode( $code );
				if ( $b ) {
					$blocks[ $code ] = array( 'id' => $b->ID, 'title' => $b->post_title, 'content' => (string) $b->post_content );
				}
			}
		}
		return array( 'content' => $content, 'blocks' => (object) $blocks );
	}

	private static function block_from_shortcode( $code ) {
		$atts = shortcode_parse_atts( trim( substr( $code, 4, -1 ) ) );
		$id   = is_array( $atts ) && isset( $atts['id'] ) ? (string) $atts['id'] : '';
		if ( '' === $id ) {
			return null;
		}
		$b = is_numeric( $id ) ? get_post( (int) $id ) : get_page_by_path( sanitize_title( $id ), OBJECT, 'ple_block' );
		return ( $b && 'ple_block' === $b->post_type ) ? $b : null;
	}

	private static function is_canvas() {
		if ( empty( $_GET['ple_canvas'] ) || ! is_singular() ) { // phpcs:ignore
			return false;
		}
		$id = get_queried_object_id();
		return current_user_can( 'edit_post', $id ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['ple_canvas'] ) ), 'ple_canvas_' . $id ); // phpcs:ignore
	}

	/* The real page, with the editable content left for the builder to fill in. */
	public static function canvas_mode() {
		if ( ! self::is_canvas() ) {
			return;
		}
		if ( ! defined( 'DONOTCACHEPAGE' ) ) {
			define( 'DONOTCACHEPAGE', true );
		}
		do_action( 'litespeed_control_set_nocache', 'PLE builder canvas' );
		nocache_headers();
		add_filter( 'show_admin_bar', '__return_false', 999 );
		/* Keep the Live Edit 1.x inline editor out of the builder canvas. */
		$strip = function () {
			foreach ( array( wp_scripts(), wp_styles() ) as $reg ) {
				foreach ( (array) $reg->queue as $h ) {
					$src = isset( $reg->registered[ $h ] ) ? (string) $reg->registered[ $h ]->src : '';
					if ( false !== strpos( $src, 'pentarch-live-edit/assets/editor.' ) ) {
						$reg->dequeue( $h );
					}
				}
			}
		};
		add_action( 'wp_enqueue_scripts', $strip, 9999 );
		add_action( 'wp_print_footer_scripts', $strip, 1 );
	}

	public static function canvas_content( $content ) {
		static $done = false;
		if ( $done || ! did_action( 'wp_head' ) || ! self::is_canvas() || (int) get_the_ID() !== (int) get_queried_object_id() ) {
			return $content;
		}
		$done = true;
		return '<!--PLE-ROOT-->';
	}

	/* Motion effects and interactive widgets on the live site. */
	public static function front_assets() {
		wp_enqueue_style( 'ple-runtime', self::asset( 'ple-runtime.css' ), array(), null );
		wp_enqueue_script( 'ple-runtime', self::asset( 'ple-runtime.js' ), array(), null, true );
		wp_add_inline_script( 'ple-runtime', 'window.PLE_REST=' . wp_json_encode( esc_url_raw( rest_url( self::NS . '/' ) ) ) . ';', 'before' );
	}

	public static function runtime_urls() {
		return array( 'css' => self::asset( 'ple-runtime.css' ), 'js' => self::asset( 'ple-runtime.js' ) );
	}

	/* Form widget: keep every entry in WordPress and email it. */
	public static function rest_form( $req ) {
		$t = self::throttle( 'form', 10 );
		if ( is_wp_error( $t ) ) {
			return $t;
		}
		if ( '' !== (string) $req['hp'] ) {
			return array( 'ok' => true );
		}
		$fields = $req->get_param( 'fields' );
		if ( ! is_array( $fields ) || ! $fields ) {
			return new WP_Error( 'ple_empty', __( 'Please fill in the form.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
		}
		$clean = array();
		foreach ( array_slice( $fields, 0, 30, true ) as $k => $v ) {
			$clean[ sanitize_text_field( (string) $k ) ] = sanitize_textarea_field( substr( (string) $v, 0, 5000 ) );
		}
		$form  = sanitize_text_field( (string) $req['form'] ) ? sanitize_text_field( (string) $req['form'] ) : __( 'Website form', 'pentarch-live-edit' );
		$page  = esc_url_raw( (string) $req['page'] );
		$first = reset( $clean );
		$id    = wp_insert_post( array( 'post_type' => 'ple_entry', 'post_status' => 'private', 'post_title' => $form . ': ' . wp_trim_words( (string) $first, 8 ) ) );
		if ( $id && ! is_wp_error( $id ) ) {
			update_post_meta( $id, '_fields', wp_slash( wp_json_encode( $clean ) ) );
			update_post_meta( $id, '_page', $page );
		}
		$to   = self::settings()['form_email'] ? self::settings()['form_email'] : get_option( 'admin_email' );
		$body = '';
		foreach ( $clean as $k => $v ) {
			$body .= $k . ': ' . $v . "\n";
		}
		$body .= "\n" . __( 'Sent from', 'pentarch-live-edit' ) . ' ' . $page;
		$reply = array();
		foreach ( $clean as $v ) {
			if ( is_email( $v ) ) {
				$reply[] = 'Reply-To: ' . $v;
				break;
			}
		}
		wp_mail( $to, sprintf( '[%s] %s', get_bloginfo( 'name' ), $form ), $body, $reply );
		return array( 'ok' => true );
	}

	/* ===================================================================
	 * REST
	 * ================================================================= */

	public static function rest() {
		register_rest_route( self::NS, '/page/(?P<id>\d+)', array(
			array( 'methods' => 'GET', 'callback' => array( __CLASS__, 'rest_page_get' ), 'permission_callback' => array( __CLASS__, 'can_edit_page' ) ),
			array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'rest_page_save' ), 'permission_callback' => array( __CLASS__, 'can_edit_page' ) ),
		) );

		$open = '__return_true';
		register_rest_route( self::NS, '/form', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'rest_form' ), 'permission_callback' => '__return_true' ) );
		$user = array( __CLASS__, 'logged_in' );
		$teach = array( __CLASS__, 'is_teacher_perm' );
		$routes = array(
			array( '/studio/register', 'POST', 'st_register', $open ),
			array( '/studio/login', 'POST', 'st_login', $open ),
			array( '/studio/logout', 'POST', 'st_logout', $user ),
			array( '/studio/me', 'GET', 'st_me', $user ),
			array( '/studio/profile', 'POST', 'st_profile', $user ),
			array( '/studio/progress', 'POST', 'st_progress', $user ),
			array( '/studio/lab', 'POST', 'st_lab', $user ),
			array( '/studio/projects', 'GET', 'st_projects', $user ),
			array( '/studio/projects', 'POST', 'st_project_save', $user ),
			array( '/studio/projects/(?P<id>\d+)', 'GET', 'st_project_get', $user ),
			array( '/studio/projects/(?P<id>\d+)', 'DELETE', 'st_project_delete', $user ),
			array( '/studio/projects/(?P<id>\d+)/publish', 'POST', 'st_project_publish', $user ),
			array( '/studio/upload', 'POST', 'st_upload', $user ),
			array( '/studio/classes', 'GET', 'st_classes', $user ),
			array( '/studio/classes', 'POST', 'st_class_create', $teach ),
			array( '/studio/classes/join', 'POST', 'st_class_join', $user ),
			array( '/studio/classes/(?P<id>\d+)', 'GET', 'st_class_get', $user ),
			array( '/studio/classes/(?P<id>\d+)/assign', 'POST', 'st_class_assign', $teach ),
			array( '/studio/classes/(?P<id>\d+)/leave', 'POST', 'st_class_leave', $user ),
			array( '/studio/classes/(?P<id>\d+)/remove', 'POST', 'st_class_remove', $teach ),
			array( '/studio/submit', 'POST', 'st_submit', $user ),
			array( '/studio/review/(?P<id>\d+)', 'POST', 'st_review', $teach ),
		);
		foreach ( $routes as $r ) {
			register_rest_route( self::NS, $r[0], array( 'methods' => $r[1], 'callback' => array( __CLASS__, $r[2] ), 'permission_callback' => $r[3] ) );
		}
	}

	public static function can_edit_page( $req ) {
		return current_user_can( 'edit_post', (int) $req['id'] );
	}

	public static function logged_in() {
		return is_user_logged_in();
	}

	public static function is_teacher( $uid = 0 ) {
		$u = $uid ? get_userdata( $uid ) : wp_get_current_user();
		if ( ! $u || ! $u->exists() ) {
			return false;
		}
		return in_array( 'ple_teacher', (array) $u->roles, true ) || user_can( $u, 'manage_options' ) || user_can( $u, 'edit_others_pages' );
	}

	public static function is_teacher_perm() {
		return is_user_logged_in() && self::is_teacher();
	}

	/** Recursively sanitise a builder tree (strings only, bounded depth). */
	private static function clean_tree( $n, $depth = 0, $allow_code = true ) {
		if ( ! is_array( $n ) || $depth > 8 ) {
			return null;
		}
		$out = array(
			'id'       => preg_replace( '/[^a-z0-9]/i', '', (string) ( $n['id'] ?? '' ) ),
			'type'     => preg_replace( '/[^a-z0-9_]/', '', (string) ( $n['type'] ?? '' ) ),
			'props'    => array(),
			'style'    => array(),
			'children' => array(),
		);
		foreach ( array( 'props', 'style' ) as $k ) {
			if ( ! empty( $n[ $k ] ) && is_array( $n[ $k ] ) ) {
				foreach ( $n[ $k ] as $pk => $pv ) {
					$pk = preg_replace( '/[^a-zA-Z0-9_]/', '', (string) $pk );
					if ( is_array( $pv ) ) {
						$out[ $k ][ $pk ] = self::clean_value( $pv, 0, $allow_code );
					} elseif ( is_scalar( $pv ) ) {
						$v = (string) $pv;
						if ( ! $allow_code && in_array( $pk, array( 'code', 'html', 'customCss' ), true ) ) {
							$v = wp_kses_post( $v );
						}
						$out[ $k ][ $pk ] = $v;
					}
				}
			}
		}
		if ( ! empty( $n['children'] ) && is_array( $n['children'] ) ) {
			foreach ( array_slice( $n['children'], 0, 300 ) as $c ) {
				$cc = self::clean_tree( $c, $depth + 1, $allow_code );
				if ( $cc ) {
					$out['children'][] = $cc;
				}
			}
		}
		return $out;
	}

	private static function save_native( $id, $nat, $code, $req ) {
		if ( ! $code ) {
			return new WP_Error( 'ple_cap', __( 'Your account cannot save hand-written HTML. Ask an administrator.', 'pentarch-live-edit' ), array( 'status' => 403 ) );
		}
		$blocks = isset( $nat['blocks'] ) && is_array( $nat['blocks'] ) ? $nat['blocks'] : array();
		kses_remove_filters();
		foreach ( $blocks as $bid => $html ) {
			$b = get_post( (int) $bid );
			if ( ! $b || 'ple_block' !== $b->post_type || ! current_user_can( 'edit_post', $b->ID ) ) {
				continue;
			}
			if ( (string) $b->post_content !== (string) $html ) {
				wp_update_post( wp_slash( array( 'ID' => $b->ID, 'post_content' => (string) $html ) ) );
			}
		}
		$page = get_post( $id );
		$new  = isset( $nat['content'] ) ? (string) $nat['content'] : $page->post_content;
		$upd  = array( 'ID' => $id );
		if ( $new !== $page->post_content ) {
			$upd['post_content'] = $new;
		}
		$title = sanitize_text_field( (string) $req->get_param( 'title' ) );
		if ( '' !== $title && $title !== $page->post_title ) {
			$upd['post_title'] = $title;
		}
		if ( $req->get_param( 'publish' ) && current_user_can( 'publish_post', $id ) ) {
			$upd['post_status'] = 'publish';
		}
		if ( count( $upd ) > 1 ) {
			wp_update_post( wp_slash( $upd ) );
		}
		kses_init_filters();
		delete_post_meta( $id, '_ple_on' );
		do_action( 'litespeed_purge_all' );
		if ( function_exists( 'rocket_clean_domain' ) ) {
			rocket_clean_domain();
		}
		clean_post_cache( $id );
		return array( 'ok' => true, 'status' => get_post_status( $id ), 'view' => get_permalink( $id ) );
	}

	/* Nested settings such as slides, tabs and form fields. */
	private static function clean_value( $v, $depth, $allow_code ) {
		if ( $depth > 4 ) {
			return array();
		}
		$out = array();
		foreach ( array_slice( $v, 0, 300, true ) as $k => $x ) {
			$k = is_int( $k ) ? $k : preg_replace( '/[^a-zA-Z0-9_]/', '', (string) $k );
			if ( is_array( $x ) ) {
				$out[ $k ] = self::clean_value( $x, $depth + 1, $allow_code );
			} elseif ( is_scalar( $x ) ) {
				$out[ $k ] = $allow_code ? (string) $x : wp_kses_post( (string) $x );
			}
		}
		return $out;
	}

	public static function rest_page_get( $req ) {
		$id = (int) $req['id'];
		return array( 'tree' => json_decode( (string) get_post_meta( $id, '_ple_tree', true ), true ), 'layout' => get_post_meta( $id, '_ple_layout', true ) );
	}

	public static function rest_page_save( $req ) {
		$id   = (int) $req['id'];
		$code = current_user_can( 'unfiltered_html' );
		$nat  = $req->get_param( 'native' );
		if ( is_array( $nat ) ) {
			return self::save_native( $id, $nat, $code, $req );
		}
		$tree = self::clean_tree( $req->get_param( 'tree' ), 0, $code );
		if ( ! $tree ) {
			return new WP_Error( 'ple_bad', __( 'Nothing to save.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
		}
		$html = (string) $req->get_param( 'html' );
		$css  = wp_strip_all_tags( (string) $req->get_param( 'css' ) );
		if ( ! $code ) {
			$html = wp_kses_post( $html );
		}
		update_post_meta( $id, '_ple_tree', wp_slash( wp_json_encode( $tree ) ) );
		update_post_meta( $id, '_ple_html', wp_slash( $html ) );
		update_post_meta( $id, '_ple_css', wp_slash( $css ) );
		update_post_meta( $id, '_ple_on', 1 );
		$layout = in_array( $req->get_param( 'layout' ), array( 'theme', 'canvas' ), true ) ? $req->get_param( 'layout' ) : 'theme';
		update_post_meta( $id, '_ple_layout', $layout );

		/* Keep a readable copy in post_content for search, excerpts and revisions. */
		$update = array( 'ID' => $id, 'post_content' => "<!-- wp:html -->\n" . $html . "\n<!-- /wp:html -->" );
		$title  = sanitize_text_field( (string) $req->get_param( 'title' ) );
		if ( '' !== $title ) {
			$update['post_title'] = $title;
		}
		if ( $req->get_param( 'publish' ) && current_user_can( 'publish_post', $id ) ) {
			$update['post_status'] = 'publish';
		}
		if ( $code ) {
			kses_remove_filters();
		}
		$r = wp_update_post( wp_slash( $update ), true );
		if ( $code ) {
			kses_init_filters();
		}
		if ( is_wp_error( $r ) ) {
			return $r;
		}
		/* Clear common page caches so visitors see the change straight away. */
		if ( function_exists( 'litespeed_purge_single_post' ) ) {
			litespeed_purge_single_post( $id );
		}
		do_action( 'litespeed_purge_post', $id );
		clean_post_cache( $id );
		return array( 'ok' => true, 'status' => get_post_status( $id ), 'view' => get_permalink( $id ) );
	}

	/* ---------------------------------------------------------- Studio auth */

	private static function throttle( $key, $max = 10 ) {
		$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
		$k   = 'ple2_t_' . md5( $key . $ip );
		$n   = (int) get_transient( $k );
		if ( $n >= $max ) {
			return new WP_Error( 'ple_slow', __( 'Too many attempts. Please wait ten minutes and try again.', 'pentarch-live-edit' ), array( 'status' => 429 ) );
		}
		set_transient( $k, $n + 1, 10 * MINUTE_IN_SECONDS );
		return true;
	}

	public static function st_register( $req ) {
		$s = self::settings();
		if ( empty( $s['register'] ) ) {
			return new WP_Error( 'ple_closed', __( 'Sign-up is closed. Ask your teacher for an account.', 'pentarch-live-edit' ), array( 'status' => 403 ) );
		}
		$t = self::throttle( 'reg', 8 );
		if ( is_wp_error( $t ) ) {
			return $t;
		}
		$name  = sanitize_text_field( (string) $req['name'] );
		$email = sanitize_email( (string) $req['email'] );
		$pass  = (string) $req['password'];
		$phone = preg_replace( '/[^0-9+]/', '', (string) $req['phone'] );
		if ( strlen( $name ) < 2 ) {
			return new WP_Error( 'ple_name', __( 'Please enter your full name.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
		}
		if ( ! is_email( $email ) ) {
			return new WP_Error( 'ple_email', __( 'Please enter a valid email address.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
		}
		if ( email_exists( $email ) ) {
			return new WP_Error( 'ple_exists', __( 'An account with this email already exists. Sign in instead.', 'pentarch-live-edit' ), array( 'status' => 409 ) );
		}
		if ( strlen( $pass ) < 8 ) {
			return new WP_Error( 'ple_pass', __( 'Use a password of at least 8 characters.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
		}
		$role = 'ple_student';
		$code = trim( (string) $req['teacher_code'] );
		if ( '' !== $code ) {
			if ( '' === $s['teacher_code'] || ! hash_equals( (string) $s['teacher_code'], $code ) ) {
				return new WP_Error( 'ple_tcode', __( 'That teacher code is not correct.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
			}
			$role = 'ple_teacher';
		}
		$base  = sanitize_user( strtolower( current( explode( '@', $email ) ) ), true );
		$login = $base ? $base : 'student';
		$i     = 1;
		while ( username_exists( $login ) ) {
			$login = $base . $i++;
		}
		$parts = explode( ' ', $name, 2 );
		$uid   = wp_insert_user(
			array(
				'user_login'   => $login,
				'user_email'   => $email,
				'user_pass'    => $pass,
				'display_name' => $name,
				'first_name'   => $parts[0],
				'last_name'    => isset( $parts[1] ) ? $parts[1] : '',
				'role'         => $role,
			)
		);
		if ( is_wp_error( $uid ) ) {
			return $uid;
		}
		if ( $phone ) {
			update_user_meta( $uid, '_ple_phone', $phone );
		}
		wp_set_current_user( $uid );
		wp_set_auth_cookie( $uid, true, is_ssl() );
		return array( 'ok' => true );
	}

	public static function st_login( $req ) {
		$t = self::throttle( 'login', 12 );
		if ( is_wp_error( $t ) ) {
			return $t;
		}
		$login = sanitize_text_field( (string) $req['login'] );
		if ( is_email( $login ) ) {
			$u = get_user_by( 'email', $login );
			if ( $u ) {
				$login = $u->user_login;
			}
		}
		$user = wp_signon( array( 'user_login' => $login, 'user_password' => (string) $req['password'], 'remember' => true ), is_ssl() );
		if ( is_wp_error( $user ) ) {
			return new WP_Error( 'ple_login', __( 'Email or password is not correct.', 'pentarch-live-edit' ), array( 'status' => 401 ) );
		}
		return array( 'ok' => true );
	}

	public static function st_logout() {
		wp_logout();
		return array( 'ok' => true );
	}

	/* Design Lab progress: demos watched, tutorials and practice finished (with scores). */
	public static function lab( $uid ) {
		$p = json_decode( (string) get_user_meta( $uid, '_ple_lab', true ), true );
		return is_array( $p ) ? $p : array();
	}

	public static function st_lab( $req ) {
		$uid = get_current_user_id();
		$p   = self::lab( $uid );
		$id  = substr( preg_replace( '/[^a-z0-9-]/', '', (string) $req['id'] ), 0, 60 );
		if ( '' === $id ) {
			return new WP_Error( 'ple_bad', 'Missing id', array( 'status' => 400 ) );
		}
		$e = isset( $p[ $id ] ) && is_array( $p[ $id ] ) ? $p[ $id ] : array();
		foreach ( array( 'watched', 'guided', 'done' ) as $k ) {
			if ( $req[ $k ] ) {
				$e[ $k ] = 1;
			}
		}
		if ( null !== $req['score'] ) {
			$e['score'] = max( isset( $e['score'] ) ? (int) $e['score'] : 0, max( 0, min( 100, (int) $req['score'] ) ) );
		}
		$e['at']  = time();
		$p[ $id ] = $e;
		if ( count( $p ) > 400 ) {
			$p = array_slice( $p, -400, null, true );
		}
		update_user_meta( $uid, '_ple_lab', wp_slash( wp_json_encode( $p ) ) );
		return $p;
	}

	private static function progress( $uid ) {
		$p = json_decode( (string) get_user_meta( $uid, '_ple_progress', true ), true );
		return is_array( $p ) ? $p : array();
	}

	private static function lesson_ids() {
		$f = self::$dir . 'assets/ple-lessons-index.json';
		$j = file_exists( $f ) ? json_decode( (string) file_get_contents( $f ), true ) : array(); // phpcs:ignore
		return is_array( $j ) ? $j : array();
	}

	public static function user_payload( $uid ) {
		$u = get_userdata( $uid );
		return array(
			'id'      => $uid,
			'name'    => $u->display_name,
			'email'   => $u->user_email,
			'teacher' => self::is_teacher( $uid ),
			'admin'   => user_can( $u, 'manage_options' ),
			'avatar'  => get_avatar_url( $uid, array( 'size' => 96 ) ),
			'cert'    => get_user_meta( $uid, '_ple_cert', true ) ? self::studio_url( 'cert/' . get_user_meta( $uid, '_ple_cert', true ) ) : '',
		);
	}

	public static function st_me() {
		$uid = get_current_user_id();
		return array( 'user' => self::user_payload( $uid ), 'progress' => self::progress( $uid ) );
	}

	public static function st_profile( $req ) {
		$uid  = get_current_user_id();
		$name = sanitize_text_field( (string) $req['name'] );
		if ( strlen( $name ) >= 2 ) {
			wp_update_user( array( 'ID' => $uid, 'display_name' => $name ) );
		}
		return self::st_me();
	}

	public static function st_progress( $req ) {
		$uid    = get_current_user_id();
		$p      = self::progress( $uid );
		$lesson = preg_replace( '/[^a-z0-9-]/', '', (string) $req['lesson'] );
		$ids    = self::lesson_ids();
		if ( $lesson && in_array( $lesson, $ids, true ) ) {
			$entry = isset( $p[ $lesson ] ) && is_array( $p[ $lesson ] ) ? $p[ $lesson ] : array();
			if ( $req['done'] ) {
				$entry['done'] = 1;
				$entry['at']   = time();
			}
			if ( null !== $req['score'] ) {
				$entry['score'] = max( 0, min( 100, (int) $req['score'] ) );
			}
			if ( null !== $req['work'] ) {
				$work = $req['work'];
				if ( is_array( $work ) ) {
					$entry['work'] = array_map( function ( $v ) {
						return is_scalar( $v ) ? substr( (string) $v, 0, 60000 ) : ''; }, array_slice( $work, 0, 6, true ) );
				}
			}
			$p[ $lesson ] = $entry;
			update_user_meta( $uid, '_ple_progress', wp_slash( wp_json_encode( $p ) ) );
		}
		/* Certificate: issued once every lesson is complete. */
		$done = 0;
		foreach ( $ids as $id ) {
			if ( ! empty( $p[ $id ]['done'] ) ) {
				$done++;
			}
		}
		if ( $ids && $done >= count( $ids ) && ! get_user_meta( $uid, '_ple_cert', true ) ) {
			update_user_meta( $uid, '_ple_cert', strtolower( wp_generate_password( 10, false ) ) );
			update_user_meta( $uid, '_ple_cert_at', time() );
		}
		return self::st_me();
	}

	/* ---------------------------------------------------------- projects */

	private static function project_out( $p, $full = false ) {
		$pub = get_post_meta( $p->ID, '_ple_pub', true );
		$o   = array(
			'id'      => $p->ID,
			'title'   => $p->post_title,
			'mode'    => get_post_meta( $p->ID, '_ple_mode', true ) ? get_post_meta( $p->ID, '_ple_mode', true ) : 'builder',
			'updated' => get_post_modified_time( 'U', true, $p ),
			'pub'     => $pub ? self::studio_url( 'p/' . $pub ) : '',
			'lesson'  => get_post_meta( $p->ID, '_ple_lesson', true ),
			'owner'   => (int) $p->post_author,
		);
		if ( $full ) {
			$o['tree'] = json_decode( (string) get_post_meta( $p->ID, '_ple_tree', true ), true );
			foreach ( array( 'html', 'css', 'js' ) as $k ) {
				$o[ $k ] = (string) get_post_meta( $p->ID, '_ple_' . $k, true );
			}
		}
		return $o;
	}

	private static function own_project( $id ) {
		$p = get_post( (int) $id );
		if ( ! $p || self::PROJECT !== $p->post_type ) {
			return new WP_Error( 'ple_404', __( 'Project not found.', 'pentarch-live-edit' ), array( 'status' => 404 ) );
		}
		if ( (int) $p->post_author !== get_current_user_id() && ! current_user_can( 'manage_options' ) ) {
			return new WP_Error( 'ple_403', __( 'This is not your project.', 'pentarch-live-edit' ), array( 'status' => 403 ) );
		}
		return $p;
	}

	public static function st_projects() {
		$q = get_posts( array( 'post_type' => self::PROJECT, 'author' => get_current_user_id(), 'post_status' => 'private', 'numberposts' => 200, 'orderby' => 'modified' ) );
		return array_map( array( __CLASS__, 'project_out' ), $q );
	}

	public static function st_project_get( $req ) {
		$p = get_post( (int) $req['id'] );
		if ( ! $p || self::PROJECT !== $p->post_type ) {
			return new WP_Error( 'ple_404', __( 'Project not found.', 'pentarch-live-edit' ), array( 'status' => 404 ) );
		}
		$uid = get_current_user_id();
		$ok  = (int) $p->post_author === $uid || current_user_can( 'manage_options' );
		if ( ! $ok && self::is_teacher() ) {
			/* Teachers may open projects that were submitted to their classes. */
			$subs = get_posts( array( 'post_type' => self::SUB, 'post_status' => 'private', 'numberposts' => 1, 'meta_key' => '_project', 'meta_value' => $p->ID, 'fields' => 'ids' ) );
			if ( $subs ) {
				$cls = get_post( wp_get_post_parent_id( $subs[0] ) );
				$ok  = $cls && (int) $cls->post_author === $uid;
			}
		}
		if ( ! $ok ) {
			return new WP_Error( 'ple_403', __( 'This is not your project.', 'pentarch-live-edit' ), array( 'status' => 403 ) );
		}
		return self::project_out( $p, true );
	}

	public static function st_project_save( $req ) {
		$uid  = get_current_user_id();
		$id   = (int) $req['id'];
		$mode = 'code' === $req['mode'] ? 'code' : 'builder';
		if ( $id ) {
			$p = self::own_project( $id );
			if ( is_wp_error( $p ) ) {
				return $p;
			}
		} else {
			$count = count( get_posts( array( 'post_type' => self::PROJECT, 'author' => $uid, 'post_status' => 'private', 'numberposts' => 501, 'fields' => 'ids' ) ) );
			if ( $count >= 500 ) {
				return new WP_Error( 'ple_many', __( 'You have reached the limit of 500 projects. Delete some old ones first.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
			}
		}
		$title = sanitize_text_field( (string) $req['title'] );
		$data  = array( 'post_type' => self::PROJECT, 'post_status' => 'private', 'post_title' => $title ? $title : __( 'Untitled project', 'pentarch-live-edit' ), 'post_author' => $uid );
		if ( $id ) {
			$data['ID'] = $id;
			unset( $data['post_author'] );
		}
		$id = $id ? wp_update_post( wp_slash( $data ), true ) : wp_insert_post( wp_slash( $data ), true );
		if ( is_wp_error( $id ) ) {
			return $id;
		}
		update_post_meta( $id, '_ple_mode', $mode );
		if ( null !== $req['tree'] ) {
			$tree = self::clean_tree( $req['tree'] );
			update_post_meta( $id, '_ple_tree', wp_slash( wp_json_encode( $tree ) ) );
		}
		foreach ( array( 'html', 'css', 'js' ) as $k ) {
			if ( null !== $req[ $k ] ) {
				update_post_meta( $id, '_ple_' . $k, wp_slash( substr( (string) $req[ $k ], 0, 400000 ) ) );
			}
		}
		if ( $req['lesson'] ) {
			update_post_meta( $id, '_ple_lesson', preg_replace( '/[^a-z0-9-]/', '', (string) $req['lesson'] ) );
		}
		return self::project_out( get_post( $id ), true );
	}

	public static function st_project_delete( $req ) {
		$p = self::own_project( $req['id'] );
		if ( is_wp_error( $p ) ) {
			return $p;
		}
		wp_trash_post( $p->ID );
		return array( 'ok' => true );
	}

	public static function st_project_publish( $req ) {
		$p = self::own_project( $req['id'] );
		if ( is_wp_error( $p ) ) {
			return $p;
		}
		if ( $req['on'] ) {
			$key = get_post_meta( $p->ID, '_ple_pub', true );
			if ( ! $key ) {
				$key = trim( substr( sanitize_title( $p->post_title ), 0, 40 ), '-' );
				$key = ( $key ? $key . '-' : '' ) . strtolower( wp_generate_password( 5, false ) );
				update_post_meta( $p->ID, '_ple_pub', $key );
			}
		} else {
			delete_post_meta( $p->ID, '_ple_pub' );
		}
		return self::project_out( get_post( $p->ID ) );
	}

	public static function st_upload( $req ) {
		$files = $req->get_file_params();
		if ( empty( $files['file'] ) ) {
			return new WP_Error( 'ple_nofile', __( 'Choose a picture first.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
		}
		$f = $files['file'];
		if ( $f['size'] > 3 * MB_IN_BYTES ) {
			return new WP_Error( 'ple_big', __( 'That picture is over 3 MB. Please use a smaller one.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
		}
		$check = wp_check_filetype_and_ext( $f['tmp_name'], $f['name'], array( 'jpg|jpeg|jpe' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif', 'webp' => 'image/webp' ) );
		if ( empty( $check['type'] ) ) {
			return new WP_Error( 'ple_type', __( 'Only JPG, PNG, GIF and WebP pictures are allowed.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
		}
		$uid  = get_current_user_id();
		$mine = (int) get_user_meta( $uid, '_ple_uploads', true );
		if ( $mine >= 300 && ! current_user_can( 'upload_files' ) ) {
			return new WP_Error( 'ple_quota', __( 'You have reached your limit of 300 pictures.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
		}
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		$up = wp_handle_upload( $f, array( 'test_form' => false, 'mimes' => array( 'jpg|jpeg|jpe' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif', 'webp' => 'image/webp' ) ) );
		if ( isset( $up['error'] ) ) {
			return new WP_Error( 'ple_up', $up['error'], array( 'status' => 400 ) );
		}
		$att = wp_insert_attachment( array( 'post_mime_type' => $up['type'], 'post_title' => sanitize_file_name( pathinfo( $f['name'], PATHINFO_FILENAME ) ), 'post_status' => 'inherit', 'post_author' => $uid ), $up['file'] );
		if ( ! is_wp_error( $att ) ) {
			wp_update_attachment_metadata( $att, wp_generate_attachment_metadata( $att, $up['file'] ) );
			update_post_meta( $att, '_ple_student_upload', 1 );
		}
		update_user_meta( $uid, '_ple_uploads', $mine + 1 );
		$large = $att && ! is_wp_error( $att ) ? wp_get_attachment_image_url( $att, 'large' ) : '';
		return array( 'url' => $large ? $large : $up['url'] );
	}

	/* ---------------------------------------------------------- classes */

	private static function my_class_ids( $uid ) {
		return array_map( 'intval', (array) get_user_meta( $uid, '_ple_class', false ) );
	}

	private static function class_out( $c, $uid ) {
		$members = get_users( array( 'meta_key' => '_ple_class', 'meta_value' => $c->ID, 'fields' => 'ID' ) );
		$assign  = json_decode( (string) get_post_meta( $c->ID, '_assign', true ), true );
		return array(
			'id'       => $c->ID,
			'name'     => $c->post_title,
			'code'     => (int) $c->post_author === $uid || current_user_can( 'manage_options' ) ? get_post_meta( $c->ID, '_code', true ) : '',
			'teacher'  => get_the_author_meta( 'display_name', $c->post_author ),
			'mine'     => (int) $c->post_author === $uid,
			'students' => count( $members ),
			'assign'   => is_array( $assign ) ? $assign : array(),
		);
	}

	public static function st_classes() {
		$uid = get_current_user_id();
		$out = array();
		$ids = self::my_class_ids( $uid );
		if ( self::is_teacher() ) {
			$taught = get_posts( array( 'post_type' => self::KLASS, 'author' => $uid, 'post_status' => 'private', 'numberposts' => 100, 'fields' => 'ids' ) );
			$ids    = array_unique( array_merge( $ids, $taught ) );
		}
		foreach ( $ids as $id ) {
			$c = get_post( $id );
			if ( $c && self::KLASS === $c->post_type && 'trash' !== $c->post_status ) {
				$out[] = self::class_out( $c, $uid );
			}
		}
		return $out;
	}

	public static function st_class_create( $req ) {
		$name = sanitize_text_field( (string) $req['name'] );
		if ( strlen( $name ) < 2 ) {
			return new WP_Error( 'ple_name', __( 'Give the class a name.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
		}
		$id = wp_insert_post( array( 'post_type' => self::KLASS, 'post_status' => 'private', 'post_title' => $name, 'post_author' => get_current_user_id() ), true );
		if ( is_wp_error( $id ) ) {
			return $id;
		}
		do {
			$code = strtoupper( wp_generate_password( 6, false ) );
			$code = strtr( $code, array( 'O' => 'P', '0' => '9', 'I' => 'K', 'L' => 'M', '1' => '7' ) );
		} while ( get_posts( array( 'post_type' => self::KLASS, 'post_status' => 'any', 'meta_key' => '_code', 'meta_value' => $code, 'fields' => 'ids', 'numberposts' => 1 ) ) );
		update_post_meta( $id, '_code', $code );
		update_post_meta( $id, '_assign', '[]' );
		return self::class_out( get_post( $id ), get_current_user_id() );
	}

	public static function st_class_join( $req ) {
		$code = strtoupper( preg_replace( '/[^a-z0-9]/i', '', (string) $req['code'] ) );
		$t    = self::throttle( 'join' . get_current_user_id(), 15 );
		if ( is_wp_error( $t ) ) {
			return $t;
		}
		$c = $code ? get_posts( array( 'post_type' => self::KLASS, 'post_status' => 'private', 'meta_key' => '_code', 'meta_value' => $code, 'numberposts' => 1 ) ) : array();
		if ( ! $c ) {
			return new WP_Error( 'ple_code', __( 'No class has that code. Check it with your teacher.', 'pentarch-live-edit' ), array( 'status' => 404 ) );
		}
		$uid = get_current_user_id();
		if ( ! in_array( $c[0]->ID, self::my_class_ids( $uid ), true ) ) {
			add_user_meta( $uid, '_ple_class', $c[0]->ID );
		}
		return self::class_out( $c[0], $uid );
	}

	public static function st_class_leave( $req ) {
		delete_user_meta( get_current_user_id(), '_ple_class', (int) $req['id'] );
		return array( 'ok' => true );
	}

	private static function teacher_class( $id ) {
		$c = get_post( (int) $id );
		if ( ! $c || self::KLASS !== $c->post_type ) {
			return new WP_Error( 'ple_404', __( 'Class not found.', 'pentarch-live-edit' ), array( 'status' => 404 ) );
		}
		if ( (int) $c->post_author !== get_current_user_id() && ! current_user_can( 'manage_options' ) ) {
			return new WP_Error( 'ple_403', __( 'Only the class teacher can do that.', 'pentarch-live-edit' ), array( 'status' => 403 ) );
		}
		return $c;
	}

	private static function sub_out( $s ) {
		$pid = (int) get_post_meta( $s->ID, '_project', true );
		$p   = get_post( $pid );
		$pub = $p ? get_post_meta( $pid, '_ple_pub', true ) : '';
		return array(
			'id'       => $s->ID,
			'assign'   => get_post_meta( $s->ID, '_assign', true ),
			'project'  => $pid,
			'title'    => $p ? $p->post_title : __( '(deleted project)', 'pentarch-live-edit' ),
			'pub'      => $pub ? self::studio_url( 'p/' . $pub ) : '',
			'student'  => get_the_author_meta( 'display_name', $s->post_author ),
			'uid'      => (int) $s->post_author,
			'status'   => get_post_meta( $s->ID, '_status', true ),
			'feedback' => get_post_meta( $s->ID, '_feedback', true ),
			'grade'    => get_post_meta( $s->ID, '_grade', true ),
			'at'       => get_post_time( 'U', true, $s ),
		);
	}

	public static function st_class_get( $req ) {
		$c   = get_post( (int) $req['id'] );
		$uid = get_current_user_id();
		if ( ! $c || self::KLASS !== $c->post_type ) {
			return new WP_Error( 'ple_404', __( 'Class not found.', 'pentarch-live-edit' ), array( 'status' => 404 ) );
		}
		$teach = (int) $c->post_author === $uid || current_user_can( 'manage_options' );
		if ( ! $teach && ! in_array( $c->ID, self::my_class_ids( $uid ), true ) ) {
			return new WP_Error( 'ple_403', __( 'You are not in this class.', 'pentarch-live-edit' ), array( 'status' => 403 ) );
		}
		$out  = self::class_out( $c, $uid );
		$args = array( 'post_type' => self::SUB, 'post_status' => 'private', 'post_parent' => $c->ID, 'numberposts' => 500 );
		if ( ! $teach ) {
			$args['author'] = $uid;
		}
		$out['subs'] = array_map( array( __CLASS__, 'sub_out' ), get_posts( $args ) );
		if ( $teach ) {
			$ids   = self::lesson_ids();
			$total = max( 1, count( $ids ) );
			$out['members'] = array();
			foreach ( get_users( array( 'meta_key' => '_ple_class', 'meta_value' => $c->ID ) ) as $m ) {
				$p    = self::progress( $m->ID );
				$done = 0;
				$last = 0;
				foreach ( $ids as $id ) {
					if ( ! empty( $p[ $id ]['done'] ) ) {
						$done++;
						$last = max( $last, (int) $p[ $id ]['at'] );
					}
				}
				$lab   = 0;
				$items = array();
				foreach ( self::lab( $m->ID ) as $lk => $le ) {
					$lk = (string) $lk;
					if ( empty( $le['done'] ) && empty( $le['guided'] ) && empty( $le['watched'] ) ) {
						continue;
					}
					$items[ $lk ] = array( 'g' => empty( $le['guided'] ) ? 0 : 1, 'd' => empty( $le['done'] ) ? 0 : 1, 'w' => empty( $le['watched'] ) ? 0 : 1, 's' => isset( $le['score'] ) ? (int) $le['score'] : null );
					if ( ! preg_match( '/^(start|makeover|quiz-|brief-)/', $lk ) && ( ! empty( $le['done'] ) || ! empty( $le['guided'] ) ) ) {
						$lab++;
					}
				}
				$out['members'][] = array( 'id' => $m->ID, 'name' => $m->display_name, 'email' => $m->user_email, 'done' => $done, 'pct' => round( 100 * $done / $total ), 'last' => $last, 'lab' => $lab, 'labItems' => (object) $items, 'cert' => (bool) get_user_meta( $m->ID, '_ple_cert', true ) );
			}
		}
		return $out;
	}

	public static function st_class_assign( $req ) {
		$c = self::teacher_class( $req['id'] );
		if ( is_wp_error( $c ) ) {
			return $c;
		}
		$list = json_decode( (string) get_post_meta( $c->ID, '_assign', true ), true );
		$list = is_array( $list ) ? $list : array();
		if ( $req['delete'] ) {
			$del  = sanitize_key( (string) $req['delete'] );
			$list = array_values( array_filter( $list, function ( $a ) use ( $del ) {
				return $a['id'] !== $del; } ) );
		} else {
			$title = sanitize_text_field( (string) $req['title'] );
			if ( strlen( $title ) < 2 ) {
				return new WP_Error( 'ple_title', __( 'Give the assignment a title.', 'pentarch-live-edit' ), array( 'status' => 400 ) );
			}
			$list[] = array(
				'id'     => strtolower( wp_generate_password( 8, false ) ),
				'title'  => $title,
				'brief'  => sanitize_textarea_field( (string) $req['brief'] ),
				'due'    => preg_match( '/^\d{4}-\d{2}-\d{2}$/', (string) $req['due'] ) ? (string) $req['due'] : '',
				'lesson' => preg_replace( '/[^a-z0-9-]/', '', (string) $req['lesson'] ),
				'at'     => time(),
			);
		}
		update_post_meta( $c->ID, '_assign', wp_slash( wp_json_encode( $list ) ) );
		return self::class_out( $c, get_current_user_id() );
	}

	public static function st_class_remove( $req ) {
		$c = self::teacher_class( $req['id'] );
		if ( is_wp_error( $c ) ) {
			return $c;
		}
		if ( $req['student'] ) {
			delete_user_meta( (int) $req['student'], '_ple_class', $c->ID );
		} elseif ( $req['archive'] ) {
			wp_trash_post( $c->ID );
		}
		return array( 'ok' => true );
	}

	public static function st_submit( $req ) {
		$uid = get_current_user_id();
		$cid = (int) $req['class'];
		$p   = self::own_project( $req['project'] );
		if ( is_wp_error( $p ) ) {
			return $p;
		}
		if ( ! in_array( $cid, self::my_class_ids( $uid ), true ) ) {
			return new WP_Error( 'ple_403', __( 'Join the class first.', 'pentarch-live-edit' ), array( 'status' => 403 ) );
		}
		$aid = sanitize_key( (string) $req['assign'] );
		/* Publish automatically so the teacher can open it on any device. */
		if ( ! get_post_meta( $p->ID, '_ple_pub', true ) ) {
			$r = new WP_REST_Request();
			$r->set_param( 'id', $p->ID );
			$r->set_param( 'on', 1 );
			self::st_project_publish( $r );
		}
		$existing = get_posts( array( 'post_type' => self::SUB, 'post_status' => 'private', 'post_parent' => $cid, 'author' => $uid, 'meta_key' => '_assign', 'meta_value' => $aid, 'numberposts' => 1 ) );
		if ( $existing ) {
			$sid = $existing[0]->ID;
			wp_update_post( array( 'ID' => $sid, 'post_date' => current_time( 'mysql' ), 'post_date_gmt' => current_time( 'mysql', true ) ) );
		} else {
			$sid = wp_insert_post( array( 'post_type' => self::SUB, 'post_status' => 'private', 'post_parent' => $cid, 'post_author' => $uid, 'post_title' => $p->post_title ) );
		}
		update_post_meta( $sid, '_assign', $aid );
		update_post_meta( $sid, '_project', $p->ID );
		update_post_meta( $sid, '_status', 'submitted' );
		return self::sub_out( get_post( $sid ) );
	}

	public static function st_review( $req ) {
		$s = get_post( (int) $req['id'] );
		if ( ! $s || self::SUB !== $s->post_type ) {
			return new WP_Error( 'ple_404', __( 'Submission not found.', 'pentarch-live-edit' ), array( 'status' => 404 ) );
		}
		$c = self::teacher_class( $s->post_parent );
		if ( is_wp_error( $c ) ) {
			return $c;
		}
		$status = in_array( $req['status'], array( 'approved', 'redo', 'submitted' ), true ) ? $req['status'] : 'submitted';
		update_post_meta( $s->ID, '_status', $status );
		update_post_meta( $s->ID, '_feedback', sanitize_textarea_field( (string) $req['feedback'] ) );
		update_post_meta( $s->ID, '_grade', sanitize_text_field( (string) $req['grade'] ) );
		return self::sub_out( $s );
	}

	/* ===================================================================
	 * Studio front end
	 * ================================================================= */

	public static function studio_router() {
		$v = get_query_var( 'ple_studio' );
		if ( ! $v ) {
			return;
		}
		switch ( $v ) {
			case 'app':
				self::render_app();
				break;
			case 'pub':
				self::render_pub( get_query_var( 'ple_key' ) );
				break;
			case 'cert':
				self::render_cert( get_query_var( 'ple_key' ) );
				break;
			case 'sw':
				header( 'Content-Type: application/javascript; charset=utf-8' );
				header( 'Service-Worker-Allowed: /' . self::slug() . '/' );
				header( 'Cache-Control: no-cache' );
				$sw = (string) file_get_contents( self::$dir . 'assets/ple-sw.js' ); // phpcs:ignore
				echo str_replace( array( '__VERSION__', '__ASSETS__' ), array( self::VERSION . '-' . @filemtime( self::$dir . 'assets/ple-studio.js' ), self::$url . 'assets/' ), $sw ); // phpcs:ignore
				exit;
			case 'manifest':
				$s = self::settings();
				wp_send_json(
					array(
						'name'             => $s['name'],
						'short_name'       => 'PLE Studio',
						'start_url'        => self::studio_url(),
						'scope'            => self::studio_url(),
						'display'          => 'standalone',
						'background_color' => '#0b1220',
						'theme_color'      => '#0b1220',
						'description'      => __( 'Learn web design by building real pages, right on your phone.', 'pentarch-live-edit' ),
						'icons'            => array(
							array( 'src' => self::$url . 'assets/icon-192.png', 'sizes' => '192x192', 'type' => 'image/png' ),
							array( 'src' => self::$url . 'assets/icon-512.png', 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any maskable' ),
						),
					)
				);
		}
		exit;
	}

	private static function render_app() {
		$s   = self::settings();
		$uid = get_current_user_id();
		nocache_headers();
		header( 'Content-Type: text/html; charset=utf-8' );
		$cfg = array(
			'rest'     => esc_url_raw( rest_url( self::NS . '/studio/' ) ),
			'nonce'    => $uid ? wp_create_nonce( 'wp_rest' ) : '',
			'base'     => self::studio_url(),
			'name'     => $s['name'],
			'org'      => $s['org'],
			'logo'     => $s['logo'],
			'color'    => $s['color'],
			'support'  => $s['support'],
			'register' => (bool) $s['register'],
			'teacherSignup' => '' !== $s['teacher_code'],
			'me'       => $uid ? self::user_payload( $uid ) : null,
			'progress' => $uid ? self::progress( $uid ) : new stdClass(),
			'lab'      => $uid ? (object) self::lab( $uid ) : new stdClass(),
			'lostPass' => wp_lostpassword_url( self::studio_url() ),
			'wpAdmin'  => $uid && current_user_can( 'edit_pages' ) ? admin_url( 'edit.php?post_type=page' ) : '',
			'runtime'  => self::runtime_urls(),
		);
		?><!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b1220">
<meta name="description" content="<?php echo esc_attr__( 'Learn web design by building real pages, right on your phone.', 'pentarch-live-edit' ); ?>">
<title><?php echo esc_html( $s['name'] ); ?></title>
<link rel="manifest" href="<?php echo esc_url( self::studio_url( 'manifest.json' ) ); ?>">
<link rel="icon" href="<?php echo esc_url( self::$url . 'assets/icon.svg' ); ?>" type="image/svg+xml">
<link rel="apple-touch-icon" href="<?php echo esc_url( self::$url . 'assets/icon-192.png' ); ?>">
<link rel="stylesheet" href="<?php echo esc_url( self::asset( 'ple-editor.css' ) ); ?>">
<link rel="stylesheet" href="<?php echo esc_url( self::asset( 'ple-studio.css' ) ); ?>">
<link rel="stylesheet" href="<?php echo esc_url( self::asset( 'ple-academy.css' ) ); ?>">
<style>:root{--brand:<?php echo esc_html( sanitize_hex_color( $s['color'] ) ? $s['color'] : '#2563eb' ); ?>}</style>
</head>
<body>
<div id="st-app"><div class="st-boot"><div class="st-spin"></div></div></div>
<noscript><p style="padding:24px;font-family:sans-serif">PLE Studio needs JavaScript switched on.</p></noscript>
<script>window.PLE_STUDIO=<?php echo wp_json_encode( $cfg ); ?>;</script>
<script src="<?php echo esc_url( self::asset( 'ple-core.js' ) ); ?>"></script>
<script src="<?php echo esc_url( self::asset( 'ple-widgets.js' ) ); ?>"></script>
<script src="<?php echo esc_url( self::asset( 'ple-editor.js' ) ); ?>"></script>
<script src="<?php echo esc_url( self::asset( 'ple-lessons.js' ) ); ?>"></script>
<script src="<?php echo esc_url( self::asset( 'ple-academy-content.js' ) ); ?>"></script>
<script src="<?php echo esc_url( self::asset( 'ple-academy.js' ) ); ?>"></script>
<script src="<?php echo esc_url( self::asset( 'ple-studio.js' ) ); ?>"></script>
<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register(<?php echo wp_json_encode( self::studio_url( 'sw.js' ) ); ?>,{scope:<?php echo wp_json_encode( wp_parse_url( self::studio_url(), PHP_URL_PATH ) ); ?>}).catch(function(){});});}</script>
</body>
</html>
		<?php
	}

	private static function render_pub( $key ) {
		$key = preg_replace( '/[^a-z0-9-]/', '', (string) $key );
		$p   = $key ? get_posts( array( 'post_type' => self::PROJECT, 'post_status' => 'private', 'meta_key' => '_ple_pub', 'meta_value' => $key, 'numberposts' => 1 ) ) : array();
		if ( ! $p ) {
			status_header( 404 );
			header( 'Content-Type: text/html; charset=utf-8' );
			echo '<!DOCTYPE html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found</title><div style="font-family:system-ui;padding:40px;text-align:center"><h1>Page not found</h1><p>This project is not published, or the link is wrong.</p><p><a href="' . esc_url( self::studio_url() ) . '">Open ' . esc_html( self::settings()['name'] ) . '</a></p></div>';
			exit;
		}
		$p    = $p[0];
		$mode = get_post_meta( $p->ID, '_ple_mode', true );
		$html = (string) get_post_meta( $p->ID, '_ple_html', true );
		$css  = (string) get_post_meta( $p->ID, '_ple_css', true );
		$js   = (string) get_post_meta( $p->ID, '_ple_js', true );
		/* Student code runs in a sandbox with its own origin, so it can never touch this site. */
		header( "Content-Security-Policy: sandbox allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox; frame-ancestors 'self'" );
		header( 'X-Robots-Tag: noindex' );
		header( 'Content-Type: text/html; charset=utf-8' );
		$author = get_the_author_meta( 'display_name', $p->post_author );
		$badge  = '<a href="' . esc_url( self::studio_url() ) . '" target="_blank" rel="noopener" style="position:fixed;right:12px;bottom:12px;z-index:2147483647;background:#0b1220;color:#fff;font:600 12px/1 system-ui,sans-serif;padding:8px 12px;border-radius:999px;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.3);opacity:.92">Made by ' . esc_html( $author ) . ' with ' . esc_html( self::settings()['name'] ) . '</a>';
		if ( 'code' === $mode && preg_match( '/<html[\s>]/i', $html ) ) {
			/* A full document written by the student. */
			$doc = $html;
			if ( $css ) {
				$doc = preg_replace( '/<\/head>/i', '<style>' . $css . '</style></head>', $doc, 1 );
			}
			if ( $js ) {
				$doc = preg_replace( '/<\/body>/i', '<script>' . $js . '</script></body>', $doc, 1 );
			}
			echo preg_replace( '/<\/body>/i', $badge . '</body>', $doc, 1 ); // phpcs:ignore
			exit;
		}
		$rt = self::runtime_urls();
		echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . esc_html( $p->post_title ) . '</title><link rel="stylesheet" href="' . esc_url( $rt['css'] ) . '"><style>body{margin:0}' . $css . '</style></head><body>' . $html . ( $js ? '<script>' . $js . '</script>' : '' ) . $badge . '<script src="' . esc_url( $rt['js'] ) . '"></script></body></html>'; // phpcs:ignore
		exit;
	}

	private static function render_cert( $key ) {
		$key = preg_replace( '/[^a-z0-9]/', '', (string) $key );
		$u   = $key ? get_users( array( 'meta_key' => '_ple_cert', 'meta_value' => $key, 'number' => 1 ) ) : array();
		$s   = self::settings();
		header( 'Content-Type: text/html; charset=utf-8' );
		if ( ! $u ) {
			status_header( 404 );
			echo '<!DOCTYPE html><meta name="viewport" content="width=device-width,initial-scale=1"><div style="font-family:system-ui;padding:40px;text-align:center"><h1>Certificate not found</h1><p>This certificate code is not valid.</p></div>';
			exit;
		}
		$u    = $u[0];
		$date = wp_date( 'j F Y', (int) get_user_meta( $u->ID, '_ple_cert_at', true ) );
		include self::$dir . 'includes/certificate.php';
		exit;
	}

	/* ===================================================================
	 * Admin
	 * ================================================================= */

	public static function admin_menu() {
		$parent = 'edit.php?post_type=ple_block';
		add_submenu_page( $parent, __( 'Page Builder', 'pentarch-live-edit' ), __( 'Page Builder', 'pentarch-live-edit' ), 'edit_pages', 'ple-pages', array( __CLASS__, 'pages_screen' ) );
		add_submenu_page( $parent, __( 'PLE Studio', 'pentarch-live-edit' ), __( 'PLE Studio', 'pentarch-live-edit' ), 'manage_options', 'ple-studio', array( __CLASS__, 'studio_screen' ) );
		/* Direct link to the Design Lab inside Studio. */
		global $submenu;
		if ( current_user_can( 'edit_pages' ) && isset( $submenu[ $parent ] ) ) {
			$submenu[ $parent ][] = array( __( 'Design Lab', 'pentarch-live-edit' ), 'edit_pages', self::studio_url() . '#/lab' ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride
		}
	}

	public static function pages_screen() {
		$pages = get_posts( array( 'post_type' => 'page', 'post_status' => array( 'publish', 'draft', 'private', 'pending' ), 'numberposts' => 300, 'orderby' => 'title', 'order' => 'ASC' ) );
		echo '<div class="wrap"><h1 class="wp-heading-inline">' . esc_html__( 'PLE Page Builder', 'pentarch-live-edit' ) . '</h1>';
		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" style="display:inline-flex;gap:6px;margin-left:12px">';
		wp_nonce_field( 'ple2_new_page' );
		echo '<input type="hidden" name="action" value="ple2_new_page"><input type="text" name="title" placeholder="' . esc_attr__( 'New page title', 'pentarch-live-edit' ) . '" required> <button class="button button-primary">' . esc_html__( 'Create and edit', 'pentarch-live-edit' ) . '</button></form>';
		echo '<p>' . esc_html__( 'Build pages visually with sections, rows, columns and widgets. Pages built here work with your theme, or as a blank canvas.', 'pentarch-live-edit' ) . '</p>';
		echo '<table class="widefat striped"><thead><tr><th>' . esc_html__( 'Page', 'pentarch-live-edit' ) . '</th><th>' . esc_html__( 'Status', 'pentarch-live-edit' ) . '</th><th>' . esc_html__( 'Built with PLE', 'pentarch-live-edit' ) . '</th><th></th></tr></thead><tbody>';
		foreach ( $pages as $p ) {
			echo '<tr><td><strong>' . esc_html( $p->post_title ? $p->post_title : __( '(no title)', 'pentarch-live-edit' ) ) . '</strong></td><td>' . esc_html( $p->post_status ) . '</td><td>' . ( get_post_meta( $p->ID, '_ple_on', true ) ? '&#10003;' : '' ) . '</td><td><a class="button button-primary" href="' . esc_url( self::builder_link( $p->ID ) ) . '">' . esc_html__( 'Edit with PLE', 'pentarch-live-edit' ) . '</a> <a class="button" href="' . esc_url( get_permalink( $p->ID ) ) . '" target="_blank">' . esc_html__( 'View', 'pentarch-live-edit' ) . '</a></td></tr>';
		}
		echo '</tbody></table></div>';
	}

	public static function new_page() {
		check_admin_referer( 'ple2_new_page' );
		if ( ! current_user_can( 'edit_pages' ) ) {
			wp_die( 'No.' );
		}
		$id = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'draft', 'post_title' => sanitize_text_field( wp_unslash( $_POST['title'] ?? '' ) ) ) );
		wp_safe_redirect( self::builder_link( $id ) );
		exit;
	}

	public static function studio_screen() {
		$s        = self::settings();
		$students = count( get_users( array( 'role' => 'ple_student', 'fields' => 'ID' ) ) );
		$teachers = count( get_users( array( 'role' => 'ple_teacher', 'fields' => 'ID' ) ) );
		$projects = (int) wp_count_posts( self::PROJECT )->private;
		$classes  = (int) wp_count_posts( self::KLASS )->private;
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'PLE Studio', 'pentarch-live-edit' ); ?> <a class="page-title-action" href="<?php echo esc_url( self::studio_url() ); ?>" target="_blank"><?php esc_html_e( 'Open Studio', 'pentarch-live-edit' ); ?></a></h1>
			<?php if ( isset( $_GET['saved'] ) ) : // phpcs:ignore ?>
				<div class="notice notice-success"><p><?php esc_html_e( 'Settings saved.', 'pentarch-live-edit' ); ?></p></div>
			<?php endif; ?>
			<p><?php esc_html_e( 'A mobile-first learning platform for web design. Students learn with short lessons, build real pages on any phone, join classes, submit work and earn a certificate.', 'pentarch-live-edit' ); ?></p>
			<div style="display:flex;gap:12px;flex-wrap:wrap;margin:16px 0">
				<?php foreach ( array( array( $students, __( 'Students', 'pentarch-live-edit' ) ), array( $teachers, __( 'Teachers', 'pentarch-live-edit' ) ), array( $classes, __( 'Classes', 'pentarch-live-edit' ) ), array( $projects, __( 'Projects', 'pentarch-live-edit' ) ) ) as $k ) : ?>
					<div style="background:#fff;border:1px solid #dcdcde;border-radius:10px;padding:14px 20px;min-width:130px"><div style="font-size:26px;font-weight:700"><?php echo (int) $k[0]; ?></div><div style="color:#646970"><?php echo esc_html( $k[1] ); ?></div></div>
				<?php endforeach; ?>
			</div>
			<p><?php echo esc_html( sprintf( 'Pentarch Live Edit %s. Updates install automatically from GitHub.', self::VERSION ) ); ?> <a class="button button-small" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=ple2_check_updates' ), 'ple2_check_updates' ) ); ?>"><?php esc_html_e( 'Check for updates now', 'pentarch-live-edit' ); ?></a></p>
			<p><strong><?php esc_html_e( 'Studio address:', 'pentarch-live-edit' ); ?></strong> <a href="<?php echo esc_url( self::studio_url() ); ?>" target="_blank"><?php echo esc_html( self::studio_url() ); ?></a></p>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'ple2_settings' ); ?>
				<input type="hidden" name="action" value="ple2_settings">
				<table class="form-table" role="presentation">
					<tr><th><label for="ple-name"><?php esc_html_e( 'Platform name', 'pentarch-live-edit' ); ?></label></th><td><input id="ple-name" class="regular-text" name="name" value="<?php echo esc_attr( $s['name'] ); ?>"></td></tr>
					<tr><th><label for="ple-org"><?php esc_html_e( 'Organisation (on certificates)', 'pentarch-live-edit' ); ?></label></th><td><input id="ple-org" class="regular-text" name="org" value="<?php echo esc_attr( $s['org'] ); ?>"></td></tr>
					<tr><th><label for="ple-slug"><?php esc_html_e( 'Address', 'pentarch-live-edit' ); ?></label></th><td><code><?php echo esc_html( home_url( '/' ) ); ?></code><input id="ple-slug" name="slug" value="<?php echo esc_attr( $s['slug'] ); ?>" style="width:140px">/</td></tr>
					<tr><th><label for="ple-logo"><?php esc_html_e( 'Logo URL', 'pentarch-live-edit' ); ?></label></th><td><input id="ple-logo" class="regular-text" name="logo" value="<?php echo esc_attr( $s['logo'] ); ?>" placeholder="https://"><p class="description"><?php esc_html_e( 'Copy a logo link from the Media Library. Leave empty to show the platform name.', 'pentarch-live-edit' ); ?></p></td></tr>
					<tr><th><label for="ple-color"><?php esc_html_e( 'Brand colour', 'pentarch-live-edit' ); ?></label></th><td><input id="ple-color" type="color" name="color" value="<?php echo esc_attr( $s['color'] ); ?>"></td></tr>
					<tr><th><?php esc_html_e( 'Student sign-up', 'pentarch-live-edit' ); ?></th><td><label><input type="checkbox" name="register" value="1" <?php checked( $s['register'] ); ?>> <?php esc_html_e( 'Anyone can create a free student account', 'pentarch-live-edit' ); ?></label></td></tr>
					<tr><th><label for="ple-tc"><?php esc_html_e( 'Teacher sign-up code', 'pentarch-live-edit' ); ?></label></th><td><input id="ple-tc" name="teacher_code" value="<?php echo esc_attr( $s['teacher_code'] ); ?>" autocomplete="off"><p class="description"><?php esc_html_e( 'Trainers who enter this code when signing up become teachers. Leave empty to add teachers yourself under Users (role: PLE Teacher).', 'pentarch-live-edit' ); ?></p></td></tr>
					<tr><th><label for="ple-fe"><?php esc_html_e( 'Send form entries to', 'pentarch-live-edit' ); ?></label></th><td><input id="ple-fe" class="regular-text" type="email" name="form_email" value="<?php echo esc_attr( $s['form_email'] ); ?>" placeholder="<?php echo esc_attr( get_option( 'admin_email' ) ); ?>"><p class="description"><?php esc_html_e( 'Every form entry is also saved under Live Edit > Form entries.', 'pentarch-live-edit' ); ?></p></td></tr>
					<tr><th><label for="ple-sup"><?php esc_html_e( 'Help contact (WhatsApp or email)', 'pentarch-live-edit' ); ?></label></th><td><input id="ple-sup" class="regular-text" name="support" value="<?php echo esc_attr( $s['support'] ); ?>"></td></tr>
				</table>
				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}

	public static function save_settings() {
		check_admin_referer( 'ple2_settings' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'No.' );
		}
		$in = wp_unslash( $_POST );
		update_option(
			self::OPT,
			array(
				'name'         => sanitize_text_field( $in['name'] ?? 'PLE Studio' ),
				'org'          => sanitize_text_field( $in['org'] ?? '' ),
				'slug'         => sanitize_title( $in['slug'] ?? 'studio' ),
				'logo'         => esc_url_raw( $in['logo'] ?? '' ),
				'color'        => sanitize_hex_color( $in['color'] ?? '' ) ? sanitize_hex_color( $in['color'] ) : '#2563eb',
				'register'     => empty( $in['register'] ) ? 0 : 1,
				'teacher_code' => sanitize_text_field( $in['teacher_code'] ?? '' ),
				'support'      => sanitize_text_field( $in['support'] ?? '' ),
				'form_email'   => sanitize_email( $in['form_email'] ?? '' ),
			)
		);
		wp_safe_redirect( admin_url( 'edit.php?post_type=ple_block&page=ple-studio&saved=1' ) );
		exit;
	}

	/* Students and teachers belong in the Studio, not wp-admin. */
	private static function studio_only( $user ) {
		$roles = (array) $user->roles;
		return $roles && ! array_diff( $roles, array( 'ple_student', 'ple_teacher' ) );
	}

	public static function login_redirect( $to, $requested, $user ) {
		return ( $user instanceof WP_User && self::studio_only( $user ) ) ? self::studio_url() : $to;
	}

	public static function keep_students_out() {
		if ( wp_doing_ajax() || ( defined( 'DOING_CRON' ) && DOING_CRON ) || ! is_user_logged_in() ) {
			return;
		}
		global $pagenow;
		if ( in_array( $pagenow, array( 'admin-post.php', 'async-upload.php' ), true ) ) {
			return;
		}
		if ( self::studio_only( wp_get_current_user() ) && 'profile.php' !== $pagenow ) {
			wp_safe_redirect( self::studio_url() );
			exit;
		}
	}

	public static function hide_bar_for_students( $show ) {
		return is_user_logged_in() && self::studio_only( wp_get_current_user() ) ? false : $show;
	}
}
