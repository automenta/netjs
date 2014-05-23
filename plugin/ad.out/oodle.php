<?php
/* Plugin Extra feeds - http://www.osclass.org/ */

function oodle_jobs() {
    

    echo '<?xml version="1.0" encoding="utf-8"?><listings>';

    if(osc_count_items()) {
        while(osc_has_items()) {
            $item = feed_get_job_data(osc_item());

            $time = explode(" ", osc_item_pub_date());
            
            
            if(isset($item['e_position_type']) && $item['e_position_type']=='FULL') {
                $position_type = __('Full time', 'extra_feeds');
            } else if(isset($item['e_position_type']) && $item['e_position_type']=='PART') {
                $position_type = __('Part time', 'extra_feeds');
            } else {
                $position_type = __('Undefined', 'extra_feeds');
            }
            
            if(isset($item['e_salary_period']) && $item['e_salary_period']=='HOUR') {
                $salary_type = 'hourly';
            } else if(isset($item['e_salary_period']) && $item['e_salary_period']=='DAY') {
                $salary_type = 'hourly';
                $item['i_salary_min'] = round($item['i_salary_min']/24);
                $item['i_salary_max'] = round($item['i_salary_max']/24);
            } else if(isset($item['e_salary_period']) && $item['e_salary_period']=='WEEK') {
                $salary_type = 'bi-weekly';
            } else if(isset($item['e_salary_period']) && $item['e_salary_period']=='MONTH') {
                $salary_type = 'monthly';
            } else if(isset($item['e_salary_period']) && $item['e_salary_period']=='YEAR') {
                $salary_type = 'yearly';
            } else {
                $salary_type = '';
            }
            
            echo '<listing>
                <category>'.osc_item_category().'</category> 
                <description><![CDATA['.osc_item_description().']]></description> 
                <id>'.osc_item_id().'</id> 
                <title><![CDATA['.osc_item_title().']]></title> 
                <url>'.osc_item_url().'</url> 
                <address>'.osc_item_address().'</address> 
                <city>'.  osc_item_city().'</city> 
                <country>'.osc_item_country_code().'</country> 
                <neighborhood>'.osc_item_city_area().'</neighborhood> 
                <state>'.osc_item_region().'</state> 
                <zip_code>'.osc_item_zip().'</zip_code> 
                <longitude>'.osc_item_longitude().'</longitude>
                <latitude>'.osc_item_latitude().'</latitude>
                <company><![CDATA['.@$item['s_company_name'].']]></company> 
                <create_time>'.$time[0].'</create_time> 
                <currency>'.osc_item_currency().'</currency> 
                <employee_type>'.$position_type.'</employee_type> 
                <industry>'.osc_item_category().'</industry> 
                <required_education><![CDATA['.@$item['s_studies'].']]></required_education> 
                <salary>'.@$item['i_salary_min'].'-'.@$item['i_salary_max'].'</salary> 
                <salary_type>'.$salary_type.'</salary_type> 
                <seller_email>'.osc_item_contact_email().'</seller_email> 
                <seller_name><![CDATA['.osc_item_contact_name().']]></seller_name> 
        </listing>';
        }
    }
    echo '</listings>';


}

function oodle_cars() {
    

    echo '<?xml version="1.0" encoding="utf-8"?><listings>';

    if(osc_count_items()) {
        while(osc_has_items()) {
            $item = feed_get_car_data(osc_item());

            $time = explode(" ", osc_item_pub_date());
            
            echo '<listing>
                <category>'.osc_item_category().'</category> 
                <description><![CDATA['.osc_item_description().']]></description> 
                <id>'.osc_item_id().'</id> 
                <title><![CDATA['.osc_item_title().']]></title> 
                <url>'.osc_item_url().'</url> 
                <address>'.osc_item_address().'</address> 
                <city>'.  osc_item_city().'</city> 
                <country>'.osc_item_country_code().'</country> 
                <neighborhood>'.osc_item_city_area().'</neighborhood> 
                <state>'.osc_item_region().'</state> 
                <zip_code>'.osc_item_zip().'</zip_code> 
                <longitude>'.osc_item_longitude().'</longitude>
                <latitude>'.osc_item_latitude().'</latitude>
                <body_type>'.@$item['s_car_type'].'</body_type>
                <condition>'.((isset($item['b_new']) && $item['b_new'])?__('New','extra_feeds'):__('Used','extra_feds')).'</condition>
                <create_time>'.$time.'</create_time>
                <currency>'.  osc_item_currency().'</currency>';

                if(osc_count_item_resources()>0) {
                    if(strpos(osc_resource_type(), 'image')!==FALSE) {
                        echo '<image_url><![CDATA['.osc_resource_path().']]></image_url>';
                    }
                }

                echo '<make>'.@$item['s_make'].'</make>
                <mileage>'.@$item['i_mileage'].'</mileage>
                <mileage_units>miles</mileage_units>
                <model>'.@$item['s_model'].'</model>
                <price>'.  osc_item_price().'</price>
                <transmission>'.((isset($item['e_transmission']) && $item['e_transmission']=='MANUAL')?__('manual','extra_feeds'):__('automatic','extra_feds')).'</transmission>
                <seller_email>'.osc_item_contact_email().'</seller_email> 
                <seller_name><![CDATA['.osc_item_contact_name().']]></seller_name> 
                <year>'.@$item['i_year'].'</year>
        </listing>';
        }
    }
    echo '</listings>';


}

function oodle_realstate() {
    

    echo '<?xml version="1.0" encoding="utf-8"?><listings>';

    if(osc_count_items()) {
        while(osc_has_items()) {
            $item = feed_get_house_data(osc_item());

            $time = explode(" ", osc_item_pub_date());
            
            if(isset($item['s_square_meters'])) {
                $lot_size = $item['s_square_meters']*10.7639104;
            } else {
                $lot_size = 0;
            }
            
            $amenities = array();
            if(isset($item['b_heating']) && $item['b_heating']) {
                $amenities[] = __('Heating', 'extra_feeds');
            }
            if(isset($item['b_air_condition']) && $item['b_air_condition']) {
                $amenities[] = __('Air condition', 'extra_feeds');
            }
            if(isset($item['b_elevator']) && $item['b_elevator']) {
                $amenities[] = __('Elevator', 'extra_feeds');
            }
            if(isset($item['b_terrace']) && $item['b_terrace']) {
                $amenities[] = __('Terrace', 'extra_feeds');
            }
            if(isset($item['b_parking']) && $item['b_parking']) {
                $amenities[] = __('Parking', 'extra_feeds');
            }
                    
            
                        
            echo '<listing>
                <category>'.osc_item_category().'</category> 
                <description><![CDATA['.osc_item_description().']]></description> 
                <id>'.osc_item_id().'</id> 
                <title><![CDATA['.osc_item_title().']]></title> 
                <url>'.osc_item_url().'</url> 
                <address>'.osc_item_address().'</address> 
                <city>'.  osc_item_city().'</city> 
                <country>'.osc_item_country_code().'</country> 
                <neighborhood>'.osc_item_city_area().'</neighborhood> 
                <state>'.osc_item_region().'</state> 
                <zip_code>'.osc_item_zip().'</zip_code> 
                <longitude>'.osc_item_longitude().'</longitude>
                <latitude>'.osc_item_latitude().'</latitude>
                <amenities>'.implode(", ", $amenities).'</amenities>
                <bathrooms>'.@$item['i_num_bathrooms'].'</bathrooms>
                <bedrooms>'.@$item['i_num_rooms'].'</bedrooms>
                <condition>'.@$item['e_status'].'</condition>
                <create_time>'.$time[0].'</create_time>
                <currency>'.osc_item_currency().'</currency>
                <furnished>'.((@$item['b_furnished'])?'Furnished':'').'</furnished>';
            
               if(osc_count_item_resources()>0) {
                    if(strpos(osc_resource_type(), 'image')!==FALSE) {
                        echo '<image_url><![CDATA['.osc_resource_path().']]></image_url>';
                    }
                }

                echo '<lot_size>'.$lot_size.'</lot_size>
                <lot_size_units>square feet</lot_size_units>
                <price>'.osc_item_price().'</price>
                <seller_email>'.osc_item_contact_email().'</seller_email> 
                <seller_name><![CDATA['.osc_item_contact_name().']]></seller_name> 
                <year>'.@$item['i_year'].'</year>
        </listing>';
        }
    }
    echo '</listings>';


}

?>
