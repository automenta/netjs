<?php

$rpcurl = 'http://wordpresssite.com';
$username = 'username';
$password = 'password';


function wpPostXMLRPC($title,$body,$category,$keywords='',$encoding='UTF-8') {
	global $rpcurl, $username, $password;

    //$title = htmlentities($title,ENT_NOQUOTES,$encoding);
    //$keywords = htmlentities($keywords,ENT_NOQUOTES,$encoding);


	//http://stackoverflow.com/questions/7034496/wordpress-new-post-via-xmlrpc
	$request = '';
	$request .= '<?xml version="1.0"?>';
	$request .= '<methodCall>';
	$request .= '  <methodName>metaWeblog.newPost</methodName>';
	$request .= '  <params>';
	$request .= '    <param>';
	$request .= '      <value>';
	$request .= '        <int>1</int>';
	$request .= '      </value>';
	$request .= '    </param>';
	$request .= '    <param>';
	$request .= '      <value>';
	$request .= '        <string>' . $username . '</string>';
	$request .= '      </value>';
	$request .= '    </param>';
	$request .= '    <param>';
	$request .= '      <value>';
	$request .= '        <string>' . $password . '</string>';
	$request .= '      </value>';
	$request .= '    </param>';
	$request .= '    <struct>';
	$request .= '      <member>';
	$request .= '        <name>post_type</name>';
	$request .= '        <value><string>post</string></value>';
	$request .= '      </member>';
/*	$request .= '      <member>';
	$request .= '        <name>wp_slug</name>';
	$request .= '        <value><string></string></value>';
	$request .= '      </member>';
	$request .= '      <member>';
	$request .= '        <name>wp_password</name>';
	$request .= '        <value><string></string></value>';
	$request .= '      </member>';
	$request .= '      <member>';
	$request .= '        <name>wp_page_parent_id</name>';
	$request .= '        <value><int></int></value>';
	$request .= '      </member>';
	$request .= '      <member>';
	$request .= '        <name>wp_page_order</name>';
	$request .= '        <value><int></int></value>';
	$request .= '      </member>';
	$request .= '      <member>';
	$request .= '        <name>wp_author_id</name>';
	$request .= '        <value><int>1</int></value>';
	$request .= '      </member>    ';*/
/*	$request .= '      <member>';
	$request .= '        <name>category</name>';
	$request .= '        <value><string>' . $category . '</string></value>';
	$request .= '      </member>';*/
	$request .= '      <member>';
	$request .= '        <name>title</name>';
	$request .= '        <value><string>' . $title . '</string></value>';
	$request .= '      </member>';
	$request .= '      <member>';
	$request .= '        <name>description</name>';
	$request .= '        <value><string>' . $body . '</string></value>';
	$request .= '      </member>';
/*	$request .= '      <member>';
	$request .= '        <name>mt_excerpt</name>';
	$request .= '        <value><string></string></value>';
	$request .= '      </member>';
	$request .= '      <member>';
	$request .= '        <name>mt_text_more</name>';
	$request .= '        <value><string></string></value>';
	$request .= '      </member>    ';*/
	$request .= '      <member>';
	$request .= '        <name>post_status</name>';
	$request .= '        <value><string>publish</string></value>';
	$request .= '      </member>  ';
	$request .= '      <member>';
	$request .= '        <name>mt_allow_comments</name>';
	$request .= '        <value><int>0</int></value>';
	$request .= '      </member>  ';
	$request .= '      <member>';
	$request .= '        <name>mt_allow_pings</name>';
	$request .= '        <value><int>0</int></value>';
	$request .= '      </member>';
/*	$request .= '      <member>';
	$request .= '        <name>mt_allow_pings</name>';
	$request .= '        <value><datetime></datetime></value>';
	$request .= '      </member>';*/
	$request .= '    </struct>  ';
	$request .= '    <param>';
	$request .= '      <value>';
	$request .= '        <bool>true</bool>';
	$request .= '      </value>';
	$request .= '    </param>    ';
	$request .= '  </params>  ';
	$request .= '</methodCall>';

	echo $request;

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_POSTFIELDS, $request);
    curl_setopt($ch, CURLOPT_URL, $rpcurl . '/xmlrpc.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 1);
    $results = curl_exec($ch);
    curl_close($ch);
    return $results;
}

$title = $_POST["title"];
$body = $_POST["body"];

if ((!empty($title)) && (!empty(body))) {
	$result = wpPostXMLRPC($title, $body, "", "");
	echo $result;
}

?>
