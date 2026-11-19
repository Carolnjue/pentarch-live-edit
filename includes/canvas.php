<?php
/**
 * Blank canvas template for pages built with PLE.
 * Site-wide Live Edit zones (head, body open, footer) still load through the WordPress hooks.
 *
 * @package Pentarch_Live_Edit
 */

defined( 'ABSPATH' ) || exit;
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
<style>body.ple-canvas{margin:0}body.ple-canvas .ple-page{max-width:none}</style>
</head>
<body <?php body_class( 'ple-canvas ple-on' ); ?>>
<?php
wp_body_open();
while ( have_posts() ) {
	the_post();
	the_content();
}
wp_footer();
?>
</body>
</html>
