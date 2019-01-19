<!-- <div>loaded const.php</div> -->
<?php
// options
define("DBG", true); // enables console_log() (makes _require() verbose)

// filesystem
define("CWD", getcwd());
define("FILE_NAME", basename(__FILE__));
define("DIR_NAME", dirname(__FILE__));
define("ROOT_DIR", $_SERVER["DOCUMENT_ROOT"]);
?>
