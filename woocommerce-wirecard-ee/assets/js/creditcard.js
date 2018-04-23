var token              = null;
var checkout_form      = jQuery( 'form.checkout' );
var processing         = false;
$                      = jQuery;
var saved_credit_cards = $( '#wc_payment_method_wirecard_creditcard_vault' );
var new_credit_card    = $( '#wc_payment_method_wirecard_new_credit_card' );

/**
 * Add token to submit form
 *
 * @since 1.0.0
 */
function setToken() {
	token = $( "input[name='token']:checked" ).data( 'token' );
	jQuery( '<input>' ).attr(
		{
			type: 'hidden',
			name: 'tokenId',
			id: 'tokenId',
			value: token
		}
	).appendTo( checkout_form );
}

/**
 * Get stored cc from Vault
 *
 * @since 1.1.0
 */
function getVaultData() {
	$.ajax(
		{
			type: 'GET',
			url: vault_get_url,
			data: { 'action' : 'get_cc_from_vault' },
			dataType: 'json',
			success: function ( data ) {
				addVaultData( data.data );
			},
			error: function (data) {
				console.log( data );
			}
		}
	);
}

/**
 * Append cc to frontend
 *
 * @param array data
 * @since 1.1.0
 */
function addVaultData( data ) {
	saved_credit_cards.html( data );
}

/**
 * Delete cc from Vault
 *
 * @param int id
 * @since 1.1.0
 */
function deleteCard( id ) {
	token = null;
	$.ajax(
		{
			type: 'POST',
			url: vault_delete_url,
			data: { 'action' : 'remove_cc_from_vault', 'vault_id': id },
			dataType: 'json',
			success: function () {
				getVaultData();
			},
			error: function (data) {
				console.log( data );
			}
		}
	);
}

$( document ).ready(
	function() {
		saved_credit_cards.hide();
		$( '.show-spinner' ).show();

		if ( $( "#wc_payment_method_wirecard_creditcard_form" ).is( ":visible" ) ) {
			getRequestData();
			getVaultData();
		}

		$( "input[name=payment_method]" ).change(
			function() {
				if ( $( this ).val() === 'wirecard_ee_creditcard' ) {
					getRequestData();
					getVaultData();
					return false;
				}
			}
		);

        /**
         * Click on stored credit card
         *
         * @since 1.1.0
         */
		$( '#open-vault-popup' ).on(
			'click', function () {
				saved_credit_cards.slideToggle();
				new_credit_card.slideUp();
				$( '#open-new-card' ).find( 'span' ).removeClass( 'dashicons-arrow-up' ).addClass( 'dashicons-arrow-down' );
				$( this ).find( 'span' ).toggleClass( 'dashicons-arrow-down' ).toggleClass( 'dashicons-arrow-up' );
			}
		);

        /**
		 * Click on new credit card
		 *
		 * @since 1.1.0
         */
		$( '#open-new-card' ).on(
			'click', function () {
				token = null;
				new_credit_card.slideToggle();
				saved_credit_cards.slideUp();
				saved_credit_cards.find( 'input' ).prop( 'checked', false );
				$( '#open-vault-popup' ).find( 'span' ).removeClass( 'dashicons-arrow-up' ).addClass( 'dashicons-arrow-down' );
				$( this ).find( 'span' ).toggleClass( 'dashicons-arrow-down' ).toggleClass( 'dashicons-arrow-up' );
			}
		);

		/**
		* Submit the seamless form before order is placed
		*
		* @since 1.0.0
		*/
		checkout_form.on(
			'checkout_place_order', function() {
				if ( $( '#payment_method_wirecard_ee_creditcard' )[0].checked === true && processing === false ) {
					processing = true;
					if ( token !== null ) {
						return true;
					} else {
						WirecardPaymentPage.seamlessSubmitForm(
							{
								onSuccess: formSubmitSuccessHandler,
								onError: logCallback,
								wrappingDivId: "wc_payment_method_wirecard_creditcard_form"
							}
						);
						return false;
					}
				}
				processing = false;
			}
		);

		/**
		* Display error massages
		*
		* @since 1.0.0
		*/
		function logCallback( response ) {
			console.error( response );
		}

		/**
		* Add the tokenId to the submited form
		*
		* @since 1.0.0
		*/
		function formSubmitSuccessHandler( response ) {
			token = response.token_id;
			if ( $( "#wirecard-store-card" ).is( ":checked" ) && response.transaction_state == 'success' ) {
				$.ajax(
					{
						type: 'POST',
						url: vault_url,
						data: { 'action' : 'save_cc_to_vault', 'token' : response.token_id, 'mask_pan' : response.masked_account_number },
						dataType: 'json',
						success: function (data) {
							console.log( data );
						},
						error: function (data) {
							console.log( data );
						}
					}
				);
			}
			jQuery( '<input>' ).attr(
				{
					type: 'hidden',
					name: 'tokenId',
					id: 'tokenId',
					value: token
				}
			).appendTo( checkout_form );

			checkout_form.submit();
		}

		/**
		 * Get data rquired to render the form
		 *
		 * @since 1.0.0
		 */
		function getRequestData() {
			$( '.show-spinner' ).show();
			$.ajax(
				{
					type: 'POST',
					url: ajax_url,
					data: { 'action' : 'get_credit_card_request_data' },
					dataType: 'json',
					success: function (data) {
						renderForm( JSON.parse( data.data ) );
					},
					error: function (data) {
						console.log( data );
					}
				}
			);
		}

		/**
	 * Render the credit card form
	 *
	 * @since 1.0.0
	 */
		function renderForm( request_data ) {
			WirecardPaymentPage.seamlessRenderForm(
				{
					requestData: request_data,
					wrappingDivId: "wc_payment_method_wirecard_creditcard_form",
					onSuccess: resizeIframe,
					onError: logCallback
				}
			);
		}

		/**
	 * Resize the credit card form when loaded
	 *
	 * @since 1.0.0
	 */
		function resizeIframe() {
			$( '.show-spinner' ).hide();
			$( '.save-later' ).show();
			$( "#wc_payment_method_wirecard_creditcard_form > iframe" ).height( 550 );
		}
	}
);
