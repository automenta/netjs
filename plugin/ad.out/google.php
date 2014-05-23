<?php
/* Plugin Extra feeds - http://www.osclass.org/ */

function google_jobs() {
 
    echo '<rss version ="2.0" xmlns:g="http://base.google.com/ns/1.0"> 
     
    <channel> 
	    <title>'.osc_page_title().'</title> 
	    <description>'.osc_page_description().'</description> 
	    <link>'.osc_base_url().'</link>';

    if(osc_count_items()) {
        while(osc_has_items()) {
            $item = feed_get_job_data(osc_item());

            $date = date('d/m/Y');
            $time = date('H:i');

            if(preg_match('|([0-9]{4})-([0-9]{2})-([0-9]{2})|', osc_item_pub_date(), $tmp)) {
                $date = $tmp[3]."/".$tmp[2]."/".$tmp[1];
            }

           


            echo '<item> 
            <title>'.osc_item_title().'</title> 
            <description>'.osc_item_description().'</description> 
            <g:education>'.((isset($item['s_studies']))?$item['s_studies']:'').'</g:education> 
            <g:employer>'.((isset($item['s_company_name']))?$item['s_company_name']:'').'</g:employer> 
            <g:id>'.osc_item_id().'</g:id> 
            <g:job_industry>'.((osc_item_category()!='')?osc_item_category():'').'</g:job_industry> 
            <g:job_type>'.((isset($item['s_contract']))?$item['s_contract']:'').'</g:job_type> 
            <link>'.osc_item_url().'</link> 
            <g:location>'.((osc_item_address()!='')?osc_item_address():'').', '.((osc_item_city()!='')?osc_item_city():'').', '.((osc_item_region()!='')?osc_item_region():'').', '.((osc_item_zip()!='')?osc_item_zip():'').' '.((osc_item_country()!='')?osc_item_country():'').'</g:location> 
            <g:publish_date>'.$date.'</g:publish_date> 
            <g:salary>'.((isset($item['i_salary_min']) && isset($item['i_salary_max']))?$item['i_salary_min'].' - '.$item['i_salary_max']:'').'</g:salary> 
            </item>';
        }
    }
    echo '</channel> 
    </rss>';

}


function google_cars() {

    echo '<rss version ="2.0" xmlns:g="http://base.google.com/ns/1.0"> 
     
    <channel> 
	    <title>'.osc_page_title().'</title> 
	    <description>'.osc_page_description().'</description> 
	    <link>'.osc_base_url().'</link>';

    if(osc_count_items()) {
        while(osc_has_items()) {
            $item = feed_get_car_data(osc_item());

            $date = date('d/m/Y');
            $time = date('H:i');

            if(preg_match('|([0-9]{4})-([0-9]{2})-([0-9]{2})|', osc_item_pub_date(), $tmp)) {
                $date = $tmp[3]."/".$tmp[2]."/".$tmp[1];
            }

           


            echo '<item> 
            <title>'.osc_item_title().'</title> 
            <description>'.osc_item_description().'</description> 
            <g:id>'.osc_item_id().'</g:id> 
            <link>'.osc_item_url().'</link> 
            <g:location>'.((osc_item_address()!='')?osc_item_address():'').', '.((osc_item_city()!='')?osc_item_city():'').', '.((osc_item_region()!='')?osc_item_region():'').', '.((osc_item_zip()!='')?osc_item_zip():'').' '.((osc_item_country()!='')?osc_item_country():'').'</g:location> 
            <g:publish_date>'.$date.'</g:publish_date> 
            <g:color>'.((isset($item['s_color']))?$item['s_color']:'').'</g:color> 
            <g:condition>'.((isset($item['b_new']) && $item['b_new']==1)?'new':'used').'</g:condition>';
            if(osc_count_item_resources()>0) {
                while(osc_has_item_resources()) {
                    if(strpos(osc_resource_type(), 'image')!==FALSE) {
                        echo '<g:image_link>'.osc_resource_path().'</g:image_link>';
                    };
                };
            };
            echo '<g:make>'.((isset($item['s_make']))?$item['s_make']:'').'</g:make> 
            <g:mileage>'.((isset($item['i_mileage']))?$item['i_mileage']:'').'</g:mileage> 
            <g:model>'.((isset($item['s_model']))?$item['s_model']:'').'</g:model> 
            <g:price>'.((osc_item_price()!='')?osc_item_price():'').'</g:price> 
            <g:vehicle_type>'.((isset($item['s_name']))?$item['s_name']:'').'</g:vehicle_type> 
            <g:year>'.((isset($item['i_year']))?$item['i_year']:'').'</g:year>
            </item>';

        }
    }
    echo '</channel> 
    </rss>';

}

?>
