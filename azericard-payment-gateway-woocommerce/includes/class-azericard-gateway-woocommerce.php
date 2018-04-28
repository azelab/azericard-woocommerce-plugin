<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
/**
 * WC_Gateway_Azericard class.
 *
 * @since 1.0.0
 * @extends WC_Payment_Gateway
 */
class WC_Gateway_Azericard extends WC_Payment_Gateway {

    /**
     * Constructor
     */
    public function __construct() {
        // Register plugin information

        $this->id = 'azericard';
        $this->medthod_title = 'Azericard';
        $this->has_fields = false;

        $this->init_form_fields();
        $this->init_settings();

        $this->title = $this->settings['title'];
        $this->description = $this->settings['description'];
        $this->select_mode = $this->settings['select_mode'];
        $this->redirect_page_id = $this->settings['redirect_page_id'];
        $this->icon = WC_AZERICARD_PLUGIN_URL. '/images/logo.png';

        $this->merch_name = get_bloginfo('name');
        $this->merch_url = ($this->redirect_page_id=="" || $this->redirect_page_id==0)?get_site_url() . "/":get_permalink($this->redirect_page_id);
        $this->email = get_bloginfo('admin_email');
        $this->backref = WC_AZERICARD_PLUGIN_URL. '/azericard-gateway-woocommerce.php';

        $this->msg['message'] = "";
        $this->msg['class'] = "";

        if ( version_compare( WOOCOMMERCE_VERSION, '2.0.0', '>=' ) ) {
            add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( &$this, 'process_admin_options' ) );
        } else {
            add_action( 'woocommerce_update_options_payment_gateways', array( &$this, 'process_admin_options' ) );
        }
        // add_action('woocommerce_receipt_azericard', array(&$this, 'receipt_page'));
        add_action( 'woocommerce_thankyou_azericard', array(&$this, 'receipt_page'), 1);
        add_action( 'woocommerce_view_order_azericard', array(&$this, 'receipt_page'), 8 );

    }

    /**
     * Initialize Gateway Settings Form Fields.
     */
    public function init_form_fields() {

        $this->form_fields = array(
            'enabled' => array(
                'title' => __('Enable/Disable', 'azericard'),
                'type' => 'checkbox',
                'label' => __('Enable Azericard Payment Module.', 'azericard'),
                'default' => 'no'),
            'title' => array(
                'title' => __('Title:', 'azericard'),
                'type'=> 'text',
                'description' => __('This controls the title which the user sees during checkout.', 'azericard'),
                'default' => __('Azericard', 'azericard')),
            'description' => array(
                'title' => __('Description:', 'azericard'),
                'type' => 'textarea',
                'description' => __('This controls the description which the user sees during checkout.', 'azericard'),
                'default' => __('Pay securely by Credit or Debit card or internet banking through Azericard Secure Servers.', 'azericard')),

            'select_mode'  => array(
                'title'       => __( 'Sale mode', 'azericard' ),
                'type'        => 'select',
                'description' => __( 'Select which mode do you want to use.', 'azericard' ),
                'options'     => array(
                    'test' => 'Test mode',
                    'production' => 'Production mode'
                ),
                'default'     => 'Authorize &amp; Capture'
            ),

            'url_test' => array(
                'title' => __('Azericard url (Test mode):', 'azericard'),
                'type' => 'text',
                'class' => 'test-mode',
                'description' => __('Azericard url.', 'azericard'),
                'default' => __('https://213.172.75.248/cgi-bin/cgi_link', 'azericard')),
            'terminal_test' => array(
                'title' => __('Terminal (Test mode)', 'azericard'),
                'type' => 'text',
                'class' => 'test-mode',
                'description' => __('This terminal id use at Azericard.'),
                'default' => __('77777777', 'azericard')),
            'key_for_sign_test' => array(
                'title' => __('Key for sign (Test mode)', 'azericard'),
                'type' => 'text',
                'class' => 'test-mode',
                'description' =>  __('Given to key by Azericard', 'azericard'),
                'default' => __('00112233445566778899AABBCCDDEEFF', 'azericard')),

            'url_production' => array(
                'title' => __('Azericard url (Production mode):', 'azericard'),
                'type'=> 'text',
                'class' => 'production-mode',
                'description' => __('Azericard url.', 'azericard'),
                'default' => __('https://213.172.75.248/cgi-bin/cgi_link', 'azericard')),
            'terminal_production' => array(
                'title' => __('Terminal (Production mode)', 'azericard'),
                'type' => 'text',
                'class' => 'production-mode',
                'description' => __('This terminal id use at Azericard.'),
                'default' => __('77777777', 'azericard')),
            'key_for_sign_production' => array(
                'title' => __('Key for sign (Production mode)', 'azericard'),
                'type' => 'text',
                'class' => 'production-mode',
                'description' =>  __('Given to key by Azericard', 'azericard'),
                'default' => __('00112233445566778899AABBCCDDEEFF', 'azericard')),

            'redirect_page_id' => array(
                'title' => __('Return Page'),
                'type' => 'select',
                'options' => $this -> get_pages_az('Select Page'),
                'description' => "URL of success page"
            )
        );
    }

    public function admin_options(){
        echo '<h3>'.__('Azericard Payment Gateway', 'azericard').'</h3>';
        echo '<table class="form-table">';
        // Generate the HTML For the settings form.
        $this -> generate_settings_html();
        echo '</table>';
    }

    /**
     *  There are no payment fields for azericard, but we want to show the description if set.
     **/
    public function payment_fields(){
        if($this->description) echo wpautop(wptexturize($this->description));
    }
    /**
     * Receipt Page
     **/
    public function receipt_page($order){
        echo '<p>'.__('Thank you for your order, please click the button below to pay with Azericard.', 'azericard').'</p>';
        echo $this -> generate_azericard_form($order);
    }

    public function hex2bin_az($hexdata) {
        $bindata="";

        for ($i=0;$i<strlen($hexdata);$i+=2) {
            $bindata.=chr(hexdec(substr($hexdata,$i,2)));
        }

        return $bindata;
    }

    public function genOrderID_az($str) {
        $len = strlen($str);

        if ($len < 6) {
            for ($i=0; $i<6-$len; $i++) {
                $str = '0' . $str;
            }
        }
        return $str;
    }

    public function get_admin_settings(){
        $admin_settings = array();
        if ($this->select_mode == 'production') {
            $admin_settings['url'] = $this->settings['url_production'];
            $admin_settings['terminal'] = $this->settings['terminal_production'];
            $admin_settings['key_for_sign'] = $this->settings['key_for_sign_production'];            
        }else{
            $admin_settings['url'] = $this->settings['url_test'];
            $admin_settings['terminal'] = $this->settings['terminal_test'];
            $admin_settings['key_for_sign'] = $this->settings['key_for_sign_test'];
        }
        return $admin_settings;
    }

    public function showMessage($content){
        return '<div class="box '.$this->msg['class'].'-box">'.$this->msg['message'].'</div>'.$content;
    }
    
     // get all pages
    public function get_pages_az($title = false, $indent = true) {
        $wp_pages = get_pages('sort_column=menu_order');
        $page_list = array();
        if ($title) $page_list[] = $title;
        foreach ($wp_pages as $page) {
            $prefix = '';
            // show indented child pages?
            if ($indent) {
                $has_parent = $page->post_parent;
                while($has_parent) {
                    $prefix .=  ' - ';
                    $next_page = get_page($has_parent);
                    $has_parent = $next_page->post_parent;
                }
            }
            // add to page list array array
            $page_list[$page->ID] = $prefix . $page->post_title;
        }
        return $page_list;
    }
    /**
     * Generate azericard button link
     **/
    public function generate_azericard_form($order_id){

        $admin_settings = $this->get_admin_settings();

        $order = new WC_Order( $order_id );
        $amount = $order->total;
        $currency = $order->currency;
        $description = 'Order #'.$order_id;

        $db_row['AMOUNT'] = $amount; // 2.5
        $db_row['CURRENCY'] = $currency;
        $db_row['ORDER'] = $this->genOrderID_az($order_id);

        // These fields will be always static
        $db_row['DESC'] = $description;
        $db_row['MERCH_NAME'] = $this->merch_name;
        $db_row['MERCH_URL'] = $this->merch_url;
        $db_row['TERMINAL'] = $admin_settings['terminal'];          // That is your personal ID in payment system
        $db_row['EMAIL'] = $this->email;
        $db_row['TRTYPE'] = '1';                    // That is the type of operation, 0 - Authorization
        $db_row['COUNTRY'] = 'AZ';
        $db_row['MERCH_GMT'] = '+4';
        $db_row['BACKREF'] = $this->backref;

        // These fields are generated automatically every request
        $oper_time = gmdate("YmdHis");          // Date and time UTC
        $nonce = substr(md5(rand()),0,16);      // Random data

        // Creating form hidden fields

        $form .=  "
            <input name=\"AMOUNT\" value=\"{$db_row['AMOUNT']}\" type=\"hidden\">
            <input name=\"CURRENCY\" value=\"{$db_row['CURRENCY']}\" type=\"hidden\">
            <input name=\"ORDER\" value=\"{$db_row['ORDER']}\" type=\"hidden\">
            <input name=\"DESC\" value=\"{$db_row['DESC']}\" type=\"hidden\">
            <input name=\"MERCH_NAME\" value=\"{$db_row['MERCH_NAME']}\" type=\"hidden\">
            <input name=\"MERCH_URL\" value=\"{$db_row['MERCH_URL']}\" type=\"hidden\">
            <input name=\"TERMINAL\" value=\"{$db_row['TERMINAL']}\" type=\"hidden\">
            <input name=\"EMAIL\" value=\"{$db_row['EMAIL']}\" type=\"hidden\">
            <input name=\"TRTYPE\" value=\"{$db_row['TRTYPE']}\" type=\"hidden\">
            <input name=\"COUNTRY\" value=\"{$db_row['COUNTRY']}\" type=\"hidden\">
            <input name=\"MERCH_GMT\" value=\"{$db_row['MERCH_GMT']}\" type=\"hidden\">
            <input name=\"TIMESTAMP\" value=\"{$oper_time}\" type=\"hidden\">
            <input name=\"NONCE\" value=\"{$nonce}\" type=\"hidden\">
            <input name=\"BACKREF\" value=\"{$db_row['BACKREF']}\" type=\"hidden\">
            ";

        // ------------------------------------------------

        // Making P_SIGN (MAC)  -         Checksum of request
        // All following fields must be equal with hidden fields above

        $to_sign = "".strlen($db_row['AMOUNT']).$db_row['AMOUNT']
            .strlen($db_row['CURRENCY']).$db_row['CURRENCY']
            .strlen($db_row['ORDER']).$db_row['ORDER']
            .strlen($db_row['DESC']).$db_row['DESC']
            .strlen($db_row['MERCH_NAME']).$db_row['MERCH_NAME']
            .strlen($db_row['MERCH_URL']).$db_row['MERCH_URL']."-"
            .strlen($db_row['TERMINAL']).$db_row['TERMINAL']
            .strlen($db_row['EMAIL']).$db_row['EMAIL']
            .strlen($db_row['TRTYPE']).$db_row['TRTYPE']
            .strlen($db_row['COUNTRY']).$db_row['COUNTRY']
            .strlen($db_row['MERCH_GMT']).$db_row['MERCH_GMT']
            .strlen($oper_time).$oper_time
            .strlen($nonce).$nonce
            .strlen($db_row['BACKREF']).$db_row['BACKREF'];

        $p_sign = hash_hmac('sha1', $to_sign, $this->hex2bin_az($admin_settings['key_for_sign']));

        $form .= "<input name=\"P_SIGN\" value=\"$p_sign\" type=\"hidden\">".PHP_EOL;

        return '<style type="text/css"> #page{display:none;} </style>
                <form action="'.$admin_settings['url'].'" method="POST" id="azericard_payment_form">
                    ' . $form . '
                    <input type="submit" class="button-alt" id="submit_azericard_payment_form" value="'.__('Pay via Azericard', 'azericard').'" />
                    <script type="text/javascript">
                        jQuery("#submit_azericard_payment_form").click();
                    </script>
                </form>';
    }
    /**
     * Process the payment and return the result
     **/
    public function process_payment($order_id){

        $order = wc_get_order( $order_id );
        // Mark as on-hold (we're awaiting the cheque)
        $order->update_status( 'on-hold', _x( 'Awaiting check payment', 'Check payment method', 'azericard' ) );

        // Reduce stock levels
        wc_reduce_stock_levels( $order_id );

        // Remove cart
        WC()->cart->empty_cart();

        // Return thankyou redirect
        return array(
          'result'   => 'success',
          'redirect'  => $this->get_return_url( $order ),
        );

    }

    public function checkCallbackData($data) {
        $admin_settings = $this->get_admin_settings();
        $p_sign_post = $data['P_SIGN'];

        $to_sign =
            strlen($data['TERMINAL']).$data['TERMINAL']
            .strlen($data['TRTYPE']).$data['TRTYPE']
            .strlen($data['ORDER']).$data['ORDER']
            .strlen($data['AMOUNT']).$data['AMOUNT']
            .strlen($data['CURRENCY']).$data['CURRENCY']
            .strlen($data['ACTION']).$data['ACTION']
            .strlen($data['RC']).$data['RC']
            .strlen($data['APPROVAL']).$data['APPROVAL']
            .strlen($data['RRN']).$data['RRN']
            .strlen($data['INT_REF']).$data['INT_REF']
            .strlen($data['TIMESTAMP']).$data['TIMESTAMP']
            .strlen($data['NONCE']).$data['NONCE'];

        $p_sign = hash_hmac('sha1', $to_sign, $this->hex2bin_az($admin_settings['key_for_sign']));

        return (strtoupper($p_sign) == $p_sign_post);
    }

    /**
     * Check for valid azericard server callback
     **/
    public function check_azericard_response($request_status) {

        global $woocommerce;

        if ($_POST["ORDER"]) {

            $order_id = ltrim($_POST["ORDER"], "0");

            if($order_id !== ''){
                try{
                    $order = new WC_Order( $order_id );
                    $hash = $checkhash = true;
                    $transauthorised = false;
                    if($order->status !== 'completed'){
                        if($this->checkCallbackData($_POST)){
                            $status = strtolower($status);

                            if($request_status == '0' || $request_status == '1'){
                                $transauthorised = true;
                                $this->msg['message'] = __('Thank you for shopping with us. Your account has been charged and your transaction is successful. We will be shipping your order to you soon.', 'azericard');
                                $this->msg['class'] = 'woocommerce_message';
                                if($order->status !== 'processing'){
                                    update_post_meta( $order_id, 'order_rrn', $_POST['RRN']);
                                    update_post_meta( $order_id, 'order_int_ref', $_POST['INT_REF']);
                                    $order -> payment_complete();
                                    $order -> add_order_note( __('Azericard payment successful<br/>Unnique Id from Azericard: '.$_POST["ORDER"], 'azericard'));
                                    $order -> add_order_note($this->msg['message']);
                                    $woocommerce->cart->empty_cart();
                                }
                            }else{
                                $this->msg['class'] = 'woocommerce_error';
                                $this->msg['message'] = __('Thank you for shopping with us. However, the transaction has been declined.', 'azericard');
                                $order->add_order_note(__('Transaction Declined: ', 'azericard').$_REQUEST['Error']);
                            }
                        }else{
                            $this->msg['class'] = 'error';
                            $this->msg['message'] = __('Security Error. Illegal access detected', 'azericard');
                        }
                        if(!$transauthorised){
                            $order->update_status('failed');
                            $order->add_order_note('Failed');
                            $order->add_order_note($this->msg['message']);
                        }
                        add_action('the_content', array(&$this, 'showMessage'));
                    }
                }catch(Exception $e){
                    $msg = "Error";
                }
            }
        }
    }

    //CURL query
    public function get_web_page( $url, $data_in ){
        $options = array(
            CURLOPT_RETURNTRANSFER => true,     // return web page
            CURLOPT_HEADER         => false,    // don't return headers
            CURLOPT_FOLLOWLOCATION => true,     // follow redirects
            CURLOPT_ENCODING       => "",       // handle all encodings
            CURLOPT_AUTOREFERER    => true,     // set referer on redirect
            CURLOPT_CONNECTTIMEOUT => 120,      // timeout on connect
            CURLOPT_TIMEOUT        => 120,      // timeout on response
            CURLOPT_MAXREDIRS      => 10,       // stop after 10 redirects
            //-------to post-------------
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $data_in, //$data,
            CURLOPT_SSL_VERIFYPEER => false,    // DONT VERIFY      
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_CAINFO         => "a.cer",
        );

        $ch      = curl_init( $url );
        curl_setopt_array( $ch, $options );
            $content = curl_exec( $ch );
            $err     = curl_errno( $ch );
            $errmsg  = curl_error( $ch );
            $header  = curl_getinfo( $ch );
        curl_close( $ch );
            $header['errno']   = $err;
            $header['errmsg']  = $errmsg;
            $header['content'] = $content;
        
        return $header;
    }
}

