<?php
/**
 * Printable PLE Studio certificate. Variables: $u (WP_User), $s (settings), $date, $key.
 *
 * @package Pentarch_Live_Edit
 */

defined( 'ABSPATH' ) || exit;
$ple_verify = PLE2::studio_url( 'cert/' . $key );
?><!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?php echo esc_html( sprintf( 'Certificate: %s', $u->display_name ) ); ?></title>
<style>
@page{size:A4 landscape;margin:0}
*{box-sizing:border-box}
body{margin:0;background:#e2e8f0;font-family:Georgia,"Times New Roman",serif;color:#0f172a}
.bar{display:flex;gap:10px;justify-content:center;padding:14px;font-family:system-ui,sans-serif}
.bar button,.bar a{background:#0f172a;color:#fff;border:0;border-radius:8px;padding:10px 16px;font:600 14px system-ui,sans-serif;text-decoration:none;cursor:pointer}
.cert{width:min(1100px,96vw);aspect-ratio:297/210;margin:0 auto 30px;background:#fff;position:relative;padding:5% 7%;box-shadow:0 20px 50px rgba(0,0,0,.15);display:flex;flex-direction:column;justify-content:center;text-align:center;overflow:hidden}
.cert:before{content:"";position:absolute;inset:2.2%;border:3px solid #0f172a;outline:1px solid #0f172a;outline-offset:6px;pointer-events:none}
.cert:after{content:"";position:absolute;width:46%;aspect-ratio:1;right:-14%;top:-24%;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.14),transparent 70%)}
.org{font:700 clamp(10px,1.4vw,15px)/1 system-ui,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#2563eb}
h1{font-size:clamp(24px,4.6vw,54px);margin:.35em 0 .2em;font-weight:400;letter-spacing:.02em}
.lead{font-style:italic;font-size:clamp(12px,1.6vw,19px);color:#475569}
.name{font-size:clamp(26px,5vw,58px);margin:.25em auto .2em;padding:0 .6em .1em;border-bottom:2px solid #f59e0b;display:inline-block}
.what{font-size:clamp(12px,1.6vw,19px);max-width:70%;margin:.4em auto 0;line-height:1.5}
.foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:5%;font:clamp(9px,1.1vw,13px)/1.4 system-ui,sans-serif;color:#475569;text-align:left}
.foot b{display:block;color:#0f172a;font-size:1.15em}
.seal{width:clamp(56px,9vw,104px);aspect-ratio:1;border-radius:50%;background:conic-gradient(#f59e0b,#fbbf24,#f59e0b,#d97706,#f59e0b);display:grid;place-items:center;color:#fff;font:800 clamp(9px,1.2vw,13px)/1.1 system-ui,sans-serif;text-align:center;box-shadow:inset 0 0 0 5px rgba(255,255,255,.55)}
@media print{body{background:#fff}.bar{display:none}.cert{width:100vw;height:100vh;box-shadow:none;margin:0}}
</style>
</head>
<body>
<div class="bar"><button onclick="print()">Print or save as PDF</button><a href="<?php echo esc_url( PLE2::studio_url() ); ?>">Open <?php echo esc_html( $s['name'] ); ?></a></div>
<main class="cert">
	<div class="org"><?php echo esc_html( $s['org'] ); ?></div>
	<h1>Certificate of Completion</h1>
	<div class="lead">This certifies that</div>
	<div><span class="name"><?php echo esc_html( $u->display_name ); ?></span></div>
	<div class="what">has completed the <strong>Practical Web Design</strong> course on <?php echo esc_html( $s['name'] ); ?>, covering HTML, CSS, responsive layout, visual page building and publishing a website.</div>
	<div class="foot">
		<div><b><?php echo esc_html( $date ); ?></b>Date issued</div>
		<div class="seal">WEB<br>DESIGN</div>
		<div style="text-align:right"><b><?php echo esc_html( strtoupper( $key ) ); ?></b>Verify at <?php echo esc_html( preg_replace( '#^https?://#', '', $ple_verify ) ); ?></div>
	</div>
</main>
</body>
</html>
