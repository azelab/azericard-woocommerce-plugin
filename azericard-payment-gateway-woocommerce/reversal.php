<?php
// sending POST-request from script
if ($_POST['refund_amount'] && is_user_logged_in()) {
	$order_id = $_POST['order_id'];
	$azricard_class = new WC_Gateway_Azericard();
	$order = $azricard_class->genOrderID_az($order_id);
	$admin_settings = $azricard_class->get_admin_settings();
	$order_meta = get_post_meta($order_id); 

	$amount = round($_POST['refund_amount']);
	$currency = $order_meta['_order_currency'][0];
	$rrn = $order_meta['order_rrn'][0];
	$intref = $order_meta['order_int_ref'][0];
	$trtype = '22';
	$terminal = $admin_settings['terminal'];
	$oper_time = gmdate("YmdHis");
	$nonce = substr(md5(rand()),0,16);
	$key_for_sign = $admin_settings['key_for_sign'];
	$url = $admin_settings['url'];

	if (!empty($rrn) && !empty($intref)) {

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

		// Adding order note.
		if ($result['content'] == '0' || $result['content'] == '1') {
			$note = __('Success! The payment was refunded.', 'chelebi');
		}else{
			$note = __('Something wrong. The payment wasn\'t refunded. Please, try later.', 'chelebi');
		}

		$commentdata = apply_filters( 'woocommerce_new_order_note_data', array(
	      'comment_post_ID'      => $order_id,
	      'comment_content'      => $note,
	      'comment_agent'        => 'WooCommerce',
	      'comment_type'         => 'order_note',
	      'comment_parent'       => 0,
	      'comment_approved'     => 1,
	    ), array( 'order_id' => $order_id, 'is_customer_note' => 0 ) );

	    $comment_id = wp_insert_comment( $commentdata );

	    if ($result['content'] !== '0' && $result['content'] !== '1') {
			exit();
		}
	}
}