<?php
/**
 * Keeps Pentarch Live Edit up to date from its GitHub repository.
 * Updates appear on the normal Plugins and Updates screens and install automatically.
 *
 * @package Pentarch_Live_Edit
 */

defined( 'ABSPATH' ) || exit;

final class PLE_Updater {

	const REPO   = 'Carolnjue/pentarch-live-edit';
	const BRANCH = 'main';
	const SLUG   = 'pentarch-live-edit';
	const KEY    = 'ple_remote_version';
	/* Files from Live Edit 1.x that each site keeps across updates. */
	const KEEP   = array( 'includes/class-ple-legacy.php', 'assets/editor.css', 'assets/editor.js' );
	const MARK   = 'restored automatically during the upgrade';

	/** @var string */
	private static $file;

	public static function init( $file ) {
		self::$file = plugin_basename( $file );
		add_filter( 'pre_set_site_transient_update_plugins', array( __CLASS__, 'check' ) );
		add_filter( 'plugins_api', array( __CLASS__, 'info' ), 20, 3 );
		add_filter( 'upgrader_source_selection', array( __CLASS__, 'fix_source' ), 10, 4 );
		add_filter( 'auto_update_plugin', array( __CLASS__, 'auto' ), 20, 2 );
		add_action( 'admin_post_ple2_check_updates', array( __CLASS__, 'check_now' ) );
		add_action( 'upgrader_process_complete', array( __CLASS__, 'done' ), 10, 2 );
	}

	private static function current() {
		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$d = get_plugin_data( WP_PLUGIN_DIR . '/' . self::$file, false, false );
		return $d['Version'];
	}

	public static function remote( $force = false ) {
		$v = get_site_transient( self::KEY );
		if ( false !== $v && ! $force ) {
			return $v;
		}
		$r = wp_remote_get( 'https://raw.githubusercontent.com/' . self::REPO . '/' . self::BRANCH . '/pentarch-live-edit.php?' . time(), array( 'timeout' => 12 ) );
		$v = '';
		if ( ! is_wp_error( $r ) && 200 === wp_remote_retrieve_response_code( $r ) && preg_match( '/^\s*\*\s*Version:\s*([0-9.]+)/mi', wp_remote_retrieve_body( $r ), $m ) ) {
			$v = $m[1];
		}
		set_site_transient( self::KEY, $v, $v ? 3 * HOUR_IN_SECONDS : 30 * MINUTE_IN_SECONDS );
		return $v;
	}

	public static function check( $t ) {
		if ( ! is_object( $t ) ) {
			$t = new stdClass();
		}
		$remote = self::remote();
		$item   = (object) array(
			'id'          => 'github.com/' . self::REPO,
			'slug'        => self::SLUG,
			'plugin'      => self::$file,
			'new_version' => $remote ? $remote : self::current(),
			'url'         => 'https://github.com/' . self::REPO,
			'package'     => 'https://codeload.github.com/' . self::REPO . '/zip/refs/heads/' . self::BRANCH,
			'icons'       => array( 'svg' => plugins_url( 'assets/icon.svg', WP_PLUGIN_DIR . '/' . self::$file ) ),
		);
		if ( $remote && version_compare( $remote, self::current(), '>' ) ) {
			$t->response[ self::$file ] = $item;
		} else {
			$t->no_update[ self::$file ] = $item;
		}
		return $t;
	}

	public static function info( $res, $action, $args ) {
		if ( 'plugin_information' !== $action || empty( $args->slug ) || self::SLUG !== $args->slug ) {
			return $res;
		}
		return (object) array(
			'name'          => 'Pentarch Live Edit',
			'slug'          => self::SLUG,
			'version'       => self::remote(),
			'author'        => 'Pentarch Systems Solutions',
			'homepage'      => 'https://github.com/' . self::REPO,
			'download_link' => 'https://codeload.github.com/' . self::REPO . '/zip/refs/heads/' . self::BRANCH,
			'sections'      => array( 'description' => 'Live editing, the PLE page builder and PLE Studio.' ),
		);
	}

	/**
	 * GitHub zips unpack to "pentarch-live-edit-main". Rename it, and carry over
	 * this site's Live Edit 1.x files so an update never removes them.
	 */
	public static function fix_source( $source, $remote_source, $upgrader, $extra = array() ) {
		global $wp_filesystem;
		$ours = ( isset( $extra['plugin'] ) && self::$file === $extra['plugin'] ) || false !== strpos( basename( $source ), self::SLUG );
		if ( ! $ours || ! $wp_filesystem ) {
			return $source;
		}
		$target = trailingslashit( $remote_source ) . self::SLUG . '/';
		if ( untrailingslashit( $source ) !== untrailingslashit( $target ) ) {
			if ( ! $wp_filesystem->move( $source, $target, true ) ) {
				return new WP_Error( 'ple_rename', 'Could not prepare the Pentarch Live Edit update.' );
			}
			$source = $target;
		}
		$live = trailingslashit( WP_PLUGIN_DIR ) . self::SLUG . '/';
		foreach ( self::KEEP as $f ) {
			$new = $source . $f;
			$old = $live . $f;
			if ( file_exists( $old ) && ( ! file_exists( $new ) || false !== strpos( (string) file_get_contents( $new ), self::MARK ) ) && false === strpos( (string) file_get_contents( $old ), self::MARK ) ) { // phpcs:ignore
				$wp_filesystem->copy( $old, $new, true );
			}
		}
		return $source;
	}

	public static function auto( $update, $item ) {
		return ( isset( $item->plugin ) && self::$file === $item->plugin ) ? true : $update;
	}

	public static function check_now() {
		check_admin_referer( 'ple2_check_updates' );
		if ( ! current_user_can( 'update_plugins' ) ) {
			wp_die( 'No.' );
		}
		self::remote( true );
		delete_site_transient( 'update_plugins' );
		wp_update_plugins();
		wp_safe_redirect( admin_url( 'plugins.php?plugin_status=upgrade' ) );
		exit;
	}

	public static function done() {
		delete_site_transient( self::KEY );
		delete_option( 'ple2_rules' );
	}
}
