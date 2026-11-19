<?php
/**
 * Plugin Name:       Pentarch Live Edit
 * Description:       Edit hand-built pages on screen, build pages visually with the PLE builder (sections, rows, columns, widgets and Layers), and run PLE Studio, a mobile-first platform for teaching web design.
 * Version:           2.4.9
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Pentarch Systems Solutions
 * Text Domain:       pentarch-live-edit
 *
 * @package Pentarch_Live_Edit
 */

defined( 'ABSPATH' ) || exit;

/* Live Edit 1.x: inline editing, Live Blocks and site-wide zones. */
if ( ! class_exists( 'Pentarch_Live_Edit' ) && file_exists( __DIR__ . '/includes/class-ple-legacy.php' ) ) {
	require_once __DIR__ . '/includes/class-ple-legacy.php';
}

/* Live Edit 2: visual page builder and PLE Studio. */
require_once __DIR__ . '/includes/class-ple2.php';
PLE2::init( __FILE__ );

/* Pro features: site kit, library, global components, versions, notes, lists and conditions. */
require_once __DIR__ . '/includes/class-ple-pro.php';
PLE_Pro::init();

/* Automatic updates from GitHub. */
require_once __DIR__ . '/includes/class-ple-updater.php';
PLE_Updater::init( __FILE__ );
