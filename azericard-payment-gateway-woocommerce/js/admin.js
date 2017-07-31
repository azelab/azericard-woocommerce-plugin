jQuery(document).ready(function(){
    function change_action(type){
        if (type == "test") {
            jQuery(".production-mode").closest("tr").hide();
            jQuery(".test-mode").closest("tr").show();
        }else{
            jQuery(".test-mode").closest("tr").hide();
            jQuery(".production-mode").closest("tr").show();
        }
    }
    jQuery("#woocommerce_azericard_select_mode").on("change", function() {
        change_action(jQuery(this).val());
    });
    change_action(jQuery("#woocommerce_azericard_select_mode").val());
});