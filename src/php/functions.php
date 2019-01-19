<!-- <div>functions.php</div> -->
<?php
_require("php", "const.php");

function add_woocommerce_support() {
	add_theme_support( 'woocommerce' );
}
add_action( 'after_setup_theme', 'add_woocommerce_support' );

function console_log($o) { // only for development & debug >> DBG == true
	if (DBG == true) {
		echo '<script>!function(){console.log("' . implode(",", $o) . '");}()</script>';
	}
	//function debug_log( $object=null, $label=null ){ $message = json_encode($object, JSON_PRETTY_PRINT); $label = "Debug" . ($label ? " ($label): " : ': '); echo "<script>console.log(\"$label\", $message);</script>"; }
}

function _require($type = "php", $file, $dbg = true, $alt = "") {
	$file = "/" . basename($file);
	$err = NULL;
	switch ($type) {
		case "fonts":
		break;
		case "img":
			echo '<img src="' . dist_dir("img") . $file . '" alt="' . $alt . '">';
		break;
		case "css":
			echo '<link rel="stylesheet" type="text/css" href="' . dit_dir("css") . $file . '"/>';
		break;
		case "js":
			echo '<script src="' . dist_dir("js") . $file . '"></script>';
		break;
		case "php":
		case "html":
			require_once(dist_dir("php") . $file);
		break;
		default:
			$e = "Failed to load: " . substr($file, 1);
		break;
	}
	console_log($e ? [$e] : ["Loaded successfully: " . substr($file, 1)]);
	/*
	todo: search for files recursively and by format in dist/$type
	to allow subdirectory hierarchy. i.e:
	$it = new RecursiveDirectoryIterator("L:\folder\folder\folder");
	$display = Array ( 'jpeg', 'jpg' );
	foreach(new RecursiveIteratorIterator($it) as $file)
	{
	    if (in_array(strtolower(array_pop(explode('.', $file))), $display))
	        echo $file . "<br/> \n";
	}
	*/
}

function dist_dir($type = "all") {
	$t = "";
	switch ($type) {
		case "assets": $t = "/assets"; break;
		case "fonts": $t = "/assets/fonts"; break;
		case "img": $t = "/assets/img"; break;
		case "css": $t = "/css"; break;
		case "js": $t = "/js"; break;
		case "php":
		case "html": $t = "/php"; break;
		case "all":
		default: break;
	}
	// return (str_replace('\\', '/', implode("|", glob(get_template_directory()) . "/dist" . $e)));
	return (implode("", str_replace('\\', '/', glob(get_template_directory() . "/dist" . $t))));
}

function mass_require($path = "", $ext = "php") {
	$ext = $ext[0] == "." ? substr($ext, 1) : $ext;
	$l = substr($path, -1);
	$f = $path[0];
	$p = ($f == "/" || $f == "\\") ? $path : "/" . $p;
	$p = ($l == "/" || $l == "\\") ? $p : $p . "/";
	foreach(dist_dir($path . "*." . $ext) as $file){
		require $file;
	}
}

console_log(["Loaded successfully: " . FILE_NAME]); // FILE_NAME should be loaded from const.php

?>