<?php
/*
Plugin Name: Extra feeds
Plugin URI: http://www.osclass.org/
Description: Extra feeds.
Version: 2.1.4
Author: OSClass
Author URI: http://www.osclass.org/
Short Name: extra_feeds
Plugin update URI: extra-feeds
*/

function feed_indeed() {
    require_once osc_plugins_path() . osc_plugin_folder(__FILE__) . "indeed.php";
    indeed();
}

function feed_trovit_houses() {
    require_once osc_plugins_path() . osc_plugin_folder(__FILE__) . "trovit.php";
    trovit_houses();
}

function feed_trovit_jobs() {
    require_once osc_plugins_path() . osc_plugin_folder(__FILE__) . "trovit.php";
    trovit_jobs();
}

function feed_trovit_products() {
    require_once osc_plugins_path() . osc_plugin_folder(__FILE__) . "trovit.php";
    trovit_products();
}

function feed_trovit_cars() {
    require_once osc_plugins_path() . osc_plugin_folder(__FILE__) . "trovit.php";
    trovit_cars();
}

function feed_google_jobs() {
    require_once osc_plugins_path() . osc_plugin_folder(__FILE__) . "google.php";
    google_jobs();
}

function feed_google_cars() {
    require_once osc_plugins_path() . osc_plugin_folder(__FILE__) . "google.php";
    google_cars();
}

function feed_oodle_jobs() {
    require_once osc_plugins_path() . osc_plugin_folder(__FILE__) . "oodle.php";
    oodle_jobs();
}

function feed_oodle_cars() {
    require_once osc_plugins_path() . osc_plugin_folder(__FILE__) . "oodle.php";
    oodle_cars();
}

function feed_oodle_realstate() {
    require_once osc_plugins_path() . osc_plugin_folder(__FILE__) . "oodle.php";
    oodle_realstate();
}

function feed_get_house_data($item) {
    $conn = getConnection() ;
    $detail = $conn->osc_dbFetchResult("SELECT * FROM %st_item_house_attr WHERE fk_i_item_id = %d ", DB_TABLE_PREFIX, $item['pk_i_id']);
    if(count($detail)>0) {
        foreach($detail as $k => $v) {
            $item[$k] = $v;
        }
        $detail = $conn->osc_dbFetchResult("SELECT s_name as property_type FROM %st_item_house_property_type_attr WHERE pk_i_id = %d AND fk_c_locale_code = '%s'", DB_TABLE_PREFIX, $item['fk_i_property_type_id'], osc_language());
        if(count($detail)==0) {
            $detail = $conn->osc_dbFetchResult("SELECT s_name as property_type FROM %st_item_house_property_type_attr WHERE pk_i_id = %d ", DB_TABLE_PREFIX, $item['fk_i_property_type_id']);
        }
        $item['property_type'] = $detail['property_type'];
    }
    return $item;
}

function feed_get_car_data($item) {
    $conn = getConnection() ;
    $detail = $conn->osc_dbFetchResult("SELECT make.s_name as s_make, model.s_name as s_model, car.*, car_type.s_name as s_car_type FROM %st_item_car_attr as car, %st_item_car_make_attr as make, %st_item_car_vehicle_type_attr as car_type, %st_item_car_model_attr as model WHERE car.fk_i_item_id = %d AND make.pk_i_id = car.fk_i_make_id AND model.pk_i_id = car.fk_i_model_id ", DB_TABLE_PREFIX, DB_TABLE_PREFIX, DB_TABLE_PREFIX, DB_TABLE_PREFIX, $item['pk_i_id']);
    if(count($detail)>0) {
        foreach($detail as $k => $v) {
            $item[$k] = $v;
        }
    }
    return $item;        
}

function feed_get_job_data($item) {
    $conn = getConnection() ;
    $detail = $conn->osc_dbFetchResult("SELECT * FROM %st_item_job_attr WHERE fk_i_item_id = %d", DB_TABLE_PREFIX, $item['pk_i_id']);
    if(count($detail)>0) {
        foreach($detail as $k => $v) {
            $item[$k] = $v;
        }
    }

    $detail = $conn->osc_dbFetchResult("SELECT * FROM %st_item_job_description_attr WHERE fk_i_item_id = %d AND fk_c_locale_code = '%s'", DB_TABLE_PREFIX, osc_item_id(), osc_language());
    if(count($detail)==0) {
        $detail = $conn->osc_dbFetchResult("SELECT * FROM %st_item_job_description_attr WHERE fk_i_item_id = %d", DB_TABLE_PREFIX, osc_item_id());
    }

    if(count($detail)>0) {
        foreach($detail as $k => $v) {
            $item[$k] = $v;
        }
    }
    return $item;        
}

function feed_get_product_data($item) {
    $conn = getConnection() ;
    $detail = $conn->osc_dbFetchResult("SELECT * FROM %st_item_products_attr WHERE fk_i_item_id = %d", DB_TABLE_PREFIX, $item['pk_i_id']);
    $item['s_make'] = $detail['s_make'];
    $item['s_model'] = $detail['s_model'];

    return $item;        
}

function feed_admin_menu() {
    echo '<h3><a href="#">Extra Feeds help</a></h3>
    <ul> 
        <li><a href="' . osc_admin_render_plugin_url(osc_plugin_folder(__FILE__) . 'conf.php') . '">&raquo; ' . __('Help', 'extra_feeds') . '</a></li>
    </ul>';
}

// This is needed in order to be able to activate the plugin
osc_register_plugin(osc_plugin_path(__FILE__), '');
// This is a hack to show a Uninstall link at plugins table (you could also use some other hook to show a custom option panel)
osc_add_hook(osc_plugin_path(__FILE__)."_uninstall", '');

osc_add_filter('admin_menu', 'feed_admin_menu');

osc_add_filter('feed_indeed', 'feed_indeed');
osc_add_filter('feed_trovit_houses', 'feed_trovit_houses');
osc_add_filter('feed_trovit_jobs', 'feed_trovit_jobs');
osc_add_filter('feed_trovit_products', 'feed_trovit_products');
osc_add_filter('feed_trovit_cars', 'feed_trovit_cars');
osc_add_filter('feed_google_jobs', 'feed_google_jobs');
osc_add_filter('feed_google_cars', 'feed_google_cars');
osc_add_filter('feed_oodle_jobs', 'feed_oodle_jobs');
osc_add_filter('feed_oodle_cars', 'feed_oodle_cars');
osc_add_filter('feed_oodle_realstate', 'feed_oodle_realstate');

?>
