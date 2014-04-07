<?php

$url = 'http://' . $_GET["url"];
//$url = $_GET["url"];


//http://stackoverflow.com/questions/11733876/how-to-get-content-ot-remote-html-page
$curl = curl_init($url);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true);
$output = curl_exec($curl);
curl_close($curl);

libxml_use_internal_errors(true);

$doc = new DOMDocument;
$doc->loadHTML( $output );

$removed_elements = array(
    'head',
    'script',
    'style'
);

$xpath = new DOMXPath($doc);

foreach ($removed_elements as $r) {
	foreach ($xpath->query('//' . $r) as $node) {
	   $node->parentNode->removeChild($node);
	}
}

//remove comments
foreach ($xpath->query('//comment()') as $comment) {
    $comment->parentNode->removeChild($comment);
}

//remove empty div's and span's
/*
$emptyable_elements = array(
    'span',
    'div',
	'a'
);
foreach ($emptyable_elements as $r) {
	foreach ($xpath->query('//' . $r) as $node) {
		if (!$node->hasChildNodes())
		   $node->parentNode->removeChild($node);
	}
}
*/

header("Access-Control-Allow-Origin: *");
echo $doc->saveHTML();

?>

