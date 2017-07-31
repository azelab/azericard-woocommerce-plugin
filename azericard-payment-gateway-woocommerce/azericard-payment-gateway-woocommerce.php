<?php
/*
Plugin Name: WooCommerce Azericard Payment Gateway
Plugin URI: https://azelab.com/
Description: Azericard Payment Gateway for Woocommerce
Version: 1.0.0
Author: Azelab
Author URI: https://azelab.com/
*/

class WC_Azericard {

	/**
	 * Constructor
	 */
	public function __construct(){
		define( 'WC_AZERICARD_VERSION', '1.0.0' );
		define( 'WC_AZERICARD_PLUGIN_URL', untrailingslashit( plugins_url( basename( plugin_dir_path( __FILE__ ) ), basename( __FILE__ ) ) ) );
		define( 'WC_AZERICARD_PLUGIN_DIR', plugins_url( basename( plugin_dir_path( __FILE__ ) ), basename( __FILE__ ) ) . '/' );
		define( 'WC_AZERICARD_MAIN_FILE', __FILE__ );

		// Actions
		add_action( 'plugins_loaded', array( $this, 'init' ), 0 );
		add_filter( 'woocommerce_payment_gateways', array( $this, 'register_gateway' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'add_azericard_scripts' ) );
	}

	/**
	 * Init localisations and files
	 */
	public function init() {

		if ( ! class_exists( 'WC_Payment_Gateway' ) ) {
			return;
		}

		// Includes
		include_once( 'includes/class-azericard-gateway-woocommerce.php' );
		include_once( 'azericard-gateway-woocommerce.php' );
		include_once( 'reversal.php' );

	}

	/**
	 * Register the gateway for use
	 */
	public function register_gateway( $methods ) {

		$methods[] = 'WC_Gateway_Azericard';
		return $methods;

	}

	/**
	 * Include jQuery and our scripts
	 */
	public function add_azericard_scripts() {

		wp_enqueue_script( 'edit_billing_details', WC_AZERICARD_PLUGIN_URL . '/js/admin.js', array( 'jquery' ) );

	}
}

new WC_Azericard();