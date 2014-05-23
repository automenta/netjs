<?php
/* Plugin Extra feeds - http://www.osclass.org/ */

function trovit_houses() {

    echo '<?xml version="1.0" encoding="utf-8"?>
            <trovit>';

    if(osc_count_items()) {
        while(osc_has_items()) {
            $item = feed_get_house_data(osc_item());

            $date = date('d/m/Y');
            $time = date('H:i');

            if(preg_match('|([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2})|', osc_item_pub_date(), $tmp)) {
                $date = $tmp[3]."/".$tmp[2]."/".$tmp[1];
                $time = $tmp[4].":".$tmp[5];
            }

            echo '<ad>
                <id><![CDATA['.osc_item_id().']]></id>
                <url><![CDATA['.osc_item_url().']]></url>
                <title><![CDATA['.osc_item_title().']]></title>
                <type><![CDATA['.((isset($item['e_type']))?$item['e_type']:'').']]></type>

                <agency><![CDATA['.((isset($item['s_agency']))?$item['s_agency']:'').']]></agency>
                <content><![CDATA['.osc_item_description().']]></content>

                <price><![CDATA['.osc_item_price().']]></price>
                <property_type><![CDATA['.((isset($item['property_type']))?$item['property_type']:'').']]></property_type>
                <floor_area unit="meters"><![CDATA['.((isset($item['s_square_meters']))?$item['s_square_meters']:'').']]></floor_area>
                <rooms><![CDATA['.((isset($item['i_num_rooms']))?$item['i_num_rooms']:'').']]></rooms>

                <bathrooms><![CDATA['.((isset($item['i_num_bathrooms']))?$item['i_num_bathrooms']:'').']]></bathrooms>
                <parking><![CDATA['.((isset($item['b_parking']))?$item['b_parking']:'0').']]></parking>

                <address><![CDATA['.((osc_item_address()!='')?osc_item_address():'').']]></address>
                <city><![CDATA['.((osc_item_city()!='')?osc_item_city():'').']]></city>

                <city_area><![CDATA['.((osc_item_city_area()!='')?osc_item_city_area():'').']]></city_area>
                <postcode><![CDATA['.((osc_item_zip()!='')?osc_item_zip():'').']]></postcode>
                <region><![CDATA['.((osc_item_region()!='')?osc_item_region():'').']]></region>

                <latitude><![CDATA['.((osc_item_latitude()!='')?osc_item_latitude():'').']]></latitude>
                <longitude><![CDATA['.((osc_item_longitude()!='')?osc_item_longitude():'').']]></longitude>

                <floor_number><![CDATA['.((isset($item['i_floor_number']))?$item['i_floor_number']:'').']]></floor_number>
                <plot_area><![CDATA['.((isset($item['i_plot_area']))?$item['i_plot_area']:'').']]></plot_area>
                <is_furnished><![CDATA['.((isset($item['b_furnished']))?$item['b_furnished']:'0').']]></is_furnished>
                <is_new><![CDATA['.((isset($item['b_new']))?$item['b_new']:'0').']]></is_new>
                <condition><![CDATA['.((isset($item['s_condition']))?$item['s_condition']:'').']]></condition>
                <year><![CDATA['.((isset($item['i_year']))?$item['i_year']:'').']]></year>
                <by_owner><![CDATA['.((isset($item['b_by_owner']))?$item['b_by_owner']:'0').']]></by_owner>';

            $res_string = '';
            if(osc_count_item_resources()>0) {
                while(osc_has_item_resources()) {
                    if(strpos(osc_resource_type(), 'image')!==FALSE) {
                        $res_string .= '<picture>
                                            <picture_url><![CDATA['.osc_resource_path().']]></picture_url>
                                            <picture_title><![CDATA['.osc_resource_name().']]></picture_title>
                                        </picture>';
                    }
                }
            }

            if($res_string!='') {
                echo '<pictures>'.$res_string.'</pictures>';
            }
                
            echo '
                <date><![CDATA['.$date.']]></date>
                <time><![CDATA['.$time.']]></time>
            </ad>';
        }
    }
    echo '</trovit>';
}

function trovit_products() {

    echo '<?xml version="1.0" encoding="utf-8"?>
            <trovit>';

    if(osc_count_items()) {
        while(osc_has_items()) {

            $item = feed_get_product_data(osc_item());

            $date = date('d/m/Y');
            $time = date('H:i');

            if(preg_match('|([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2})|', osc_item_pub_date(), $tmp)) {
                $date = $tmp[3]."/".$tmp[2]."/".$tmp[1];
                $time = $tmp[4].":".$tmp[5];
            }

            echo '<ad>
                    <id><![CDATA['.osc_item_id().']]></id>
                    <url><![CDATA['.osc_item_url().']]></url>
                    <title><![CDATA['.osc_item_title().']]></title>

                    <content><![CDATA['.osc_item_description().']]></content>

                    <price><![CDATA['.osc_item_price().']]></price>

                    <make><![CDATA['.((isset($item['s_make']))?$item['s_make']:'').']]></make>
                    <model><![CDATA['.((isset($item['s_model']))?$item['s_model']:'').']]></model>
                    <category><![CDATA['.((osc_item_category()!='')?osc_item_category():'').']]></category>

                    <address><![CDATA['.((osc_item_address()!='')?osc_item_address():'').']]></address>
                    <city><![CDATA['.((osc_item_city()!='')?osc_item_city():'').']]></city>

                    <city_area><![CDATA['.((osc_item_city_area()!='')?osc_item_city_area():'').']]></city_area>
                    <postcode><![CDATA['.((osc_item_zip()!='')?osc_item_zip():'').']]></postcode>
                    <region><![CDATA['.((osc_item_region()!='')?osc_item_region():'').']]></region>

                    <latitude><![CDATA['.((osc_item_latitude()!='')?osc_item_latitude():'').']]></latitude>
                    <longitude><![CDATA['.((osc_item_longitude()!='')?osc_item_longitude():'').']]></longitude>';


            $res_string = '';
            if(osc_count_item_resources()>0) {
                while(osc_has_item_resources()) {
                    if(strpos(osc_resource_type(), 'image')!==FALSE) {
                        $res_string .= '<picture>
                                            <picture_url><![CDATA['.osc_resource_path().']]></picture_url>
                                            <picture_title><![CDATA['.osc_resource_name().']]></picture_title>
                                        </picture>';
                    }
                }
            }

            if($res_string!='') {
                echo '<pictures>'.$res_string.'</pictures>';
            }
                
            echo '
                <date><![CDATA['.$date.']]></date>
                <time><![CDATA['.$time.']]></time>
            </ad>';
        }
    }
    echo '</trovit>';
}

function trovit_jobs() {

    echo '<?xml version="1.0" encoding="utf-8"?>
            <trovit>';

    if(osc_count_items()) {
        while(osc_has_items()) {
            $item = feed_get_job_data(osc_item());

            $date = date('d/m/Y');
            $time = date('H:i');

            if(preg_match('|([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2})|', osc_item_pub_date(), $tmp)) {
                $date = $tmp[3]."/".$tmp[2]."/".$tmp[1];
                $time = $tmp[4].":".$tmp[5];
            }

            echo '<ad>
                    <id><![CDATA['.osc_item_id().']]></id>
                    <url><![CDATA['.osc_item_url().']]></url>
                    <title><![CDATA['.osc_item_title().']]></title>

                    <content><![CDATA['.osc_item_description().']]></content>

                    <address><![CDATA['.((osc_item_address()!='')?osc_item_address():'').']]></address>
                    <city><![CDATA['.((osc_item_city()!='')?osc_item_city():'').']]></city>

                    <city_area><![CDATA['.((osc_item_city_area()!='')?osc_item_city_area():'').']]></city_area>
                    <postcode><![CDATA['.((osc_item_zip()!='')?osc_item_zip():'').']]></postcode>
                    <region><![CDATA['.((osc_item_region()!='')?osc_item_region():'').']]></region>

                    <latitude><![CDATA['.((osc_item_latitude()!='')?osc_item_latitude():'').']]></latitude>
                    <longitude><![CDATA['.((osc_item_longitude()!='')?osc_item_longitude():'').']]></longitude>

                    <salary><![CDATA['.((isset($item['i_salary_min']) && isset($item['i_salary_max']))?$item['i_salary_min'].' - '.$item['i_salary_max']:'').']]></salary>
                    <company><![CDATA['.((isset($item['s_company_name']))?$item['s_company_name']:'').']]></company>
                    <experience><![CDATA['.((isset($item['s_experience']))?$item['s_experience']:'').']]></experience>
                    <requirements><![CDATA['.((isset($item['s_requirements']))?$item['s_requirements']:'').']]></requirements>
                    <contract><![CDATA['.((isset($item['s_contract']))?$item['s_contract']:'').']]></contract>
                    <category><![CDATA['.((osc_item_category()!='')?osc_item_category():'').']]></category>';
            echo '
                <date><![CDATA['.$date.']]></date>
                <time><![CDATA['.$time.']]></time>
            </ad>';
        }
    }
    echo '</trovit>';
}


function trovit_cars() {

    echo '<?xml version="1.0" encoding="utf-8"?>
            <trovit>';

    if(osc_count_items()) {
        while(osc_has_items()) {
            $item = feed_get_car_data(osc_item());

            $date = date('d/m/Y');
            $time = date('H:i');

            if(preg_match('|([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2})|', osc_item_pub_date(), $tmp)) {
                $date = $tmp[3]."/".$tmp[2]."/".$tmp[1];
                $time = $tmp[4].":".$tmp[5];
            }

            echo '<ad>
                    <id><![CDATA['.osc_item_id().']]></id>
                    <url><![CDATA['.osc_item_url().']]></url>
                    <title><![CDATA['.osc_item_title().']]></title>

                    <content><![CDATA['.osc_item_description().']]></content>

                    <price><![CDATA['.osc_item_price().']]></price>

                    <make><![CDATA['.((isset($item['s_make']))?$item['s_make']:'').']]></make>
                    <model><![CDATA['.((isset($item['s_model']))?$item['s_model']:'').']]></model>
                    <color><![CDATA['.((isset($item['s_color']))?$item['s_color']:'').']]></color>

                    <mileage><![CDATA['.((isset($item['i_mileage']))?$item['i_mileage']:'').']]></mileage>
                    <doors><![CDATA['.((isset($item['i_doors']))?$item['i_doors']:'').']]></doors>
                    <fuel><![CDATA['.((isset($item['e_fuel']))?$item['e_fuel']:'').']]></fuel>
                    <transmission><![CDATA['.((isset($item['e_transmission']))?$item['e_transmission']:'').']]></transmission>
                    <engine_size><![CDATA['.((isset($item['i_engine_size']))?$item['i_engine_size']:'').']]></engine_size>
                    <cylinders><![CDATA['.((isset($item['i_cylinders']))?$item['i_cylinders']:'').']]></cylinders>
                    <power unit="'.((isset($item['e_power_unit']))?$item['e_power_unit']:'').'"><![CDATA['.((isset($item['i_power']))?$item['i_power']:'').']]></power>
                    <seats><![CDATA['.((isset($item['i_seats']))?$item['i_seats']:'').']]></seats>
                    <gears><![CDATA['.((isset($item['i_gears']))?$item['i_gears']:'').']]></gears>

                    <address><![CDATA['.((osc_item_address()!='')?osc_item_address():'').']]></address>
                    <city><![CDATA['.((osc_item_city()!='')?osc_item_city():'').']]></city>

                    <city_area><![CDATA['.((osc_item_city_area()!='')?osc_item_city_area():'').']]></city_area>
                    <postcode><![CDATA['.((osc_item_zip()!='')?osc_item_zip():'').']]></postcode>
                    <region><![CDATA['.((osc_item_region()!='')?osc_item_region():'').']]></region>

                    <latitude><![CDATA['.((osc_item_latitude()!='')?osc_item_latitude():'').']]></latitude>
                    <longitude><![CDATA['.((osc_item_longitude()!='')?osc_item_longitude():'').']]></longitude>';


            $res_string = '';
            if(osc_count_item_resources()>0) {
                while(osc_has_item_resources()) {
                    if(strpos(osc_resource_type(), 'image')!==FALSE) {
                        $res_string .= '<picture>
                                            <picture_url><![CDATA['.osc_resource_path().']]></picture_url>
                                            <picture_title><![CDATA['.osc_resource_name().']]></picture_title>
                                        </picture>';
                    }
                }
            }

            if($res_string!='') {
                echo '<pictures>'.$res_string.'</pictures>';
            }
                
            echo '
                <date><![CDATA['.$date.']]></date>
                <time><![CDATA['.$time.']]></time>
            </ad>';
        }
    }    
    echo '</trovit>';
}

?>
