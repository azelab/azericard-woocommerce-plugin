<?php

// sending POST-request from script

if( $_POST["TRTYPE"] == "1" && $_POST["ACTION"] == "0" ){
	$location = explode('wp-content', $_SERVER['SCRIPT_FILENAME']);
	include ($location[0] . 'wp-load.php');

	$azricard_class = new WC_Gateway_Azericard();
	
	if ($azricard_class->checkCallbackData($_POST)) {

		$order = $_POST['ORDER'];
		$amount = $_POST['AMOUNT'];
		$currency = $_POST['CURRENCY'];
		$rrn = $_POST['RRN'];
		$intref = $_POST['INT_REF'];
		$trtype = '21';
		$terminal = $_POST['TERMINAL'];
		$oper_time = gmdate("YmdHis");		
		$nonce=substr(md5(rand()),0,16);
		$admin_settings = $azricard_class->get_admin_settings();
		$key_for_sign = $admin_settings['key_for_sign'];
		$url = $admin_settings['url'];

		$to_sign = "".strlen($order).$order
	        .strlen($amount).$amount
	        .strlen($currency).$currency
	        .strlen($rrn).$rrn
	        .strlen($intref).$intref
	        .strlen($trtype).$trtype
	        .strlen($terminal).$terminal
	        .strlen($oper_time).$oper_time
	        .strlen($nonce).$nonce;

	    $postFields = array(
	        'AMOUNT' => $amount,
	        'CURRENCY' => $currency,
	        'ORDER' => $order,
	        'RRN' => $rrn,
	        'INT_REF' => $intref,
	        'TERMINAL' => $terminal,
	        'TRTYPE' => $trtype,
	        'TIMESTAMP' => $oper_time,
	        'NONCE' => $nonce
	    );

		$p_sign = hash_hmac('sha1', $to_sign, $azricard_class->hex2bin_az($key_for_sign));
		
		$postFields["P_SIGN"] = $p_sign;
		
		foreach($postFields as $key => $value){
			$Post[] = "$key=$value";
		}
		$Post = implode("&", $Post);

		// Sending request to our system using CURL-based function
		$result = $azricard_class->get_web_page($url, $Post);

		$azricard_class->check_azericard_response($result['content']);

	}
}						