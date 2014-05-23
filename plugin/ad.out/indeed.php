<?php
/* Plugin Extra feeds - http://www.osclass.org/ */

function indeed() {

    echo '<?xml version="1.0" encoding="utf-8"?>
    <source>
    <publisher>'.osc_page_title().'</publisher>
    <publisherurl>'.osc_base_url().'</publisherurl>
    <lastBuildDate>'.date("D, j M Y G:i:s T").'</lastBuildDate>';

    if(osc_count_items()) {
        while(osc_has_items()) {
            $item = feed_get_job_data(osc_item());

            $salary = "";
            if(isset($item['i_salary_min']) && $item['i_salary_min']!='') {
                $salary = $item['i_salary_min'];
            }
            if(isset($item['i_salary_max']) && $item['i_salary_max']!='') {
                if($salary!="") { $salary .= ' - '; };
                $salary .= $item['i_salary_max'];
            }
            if(isset($item['e_salary_period']) && $item['e_slary_period']!='') {
                if($salary!="") {
                    $salary .= ' ';
                    $salary .= $item['e_salary_period'];
                }
            }

            $locale = current($item['locale']);
            if(isset($locale['s_desired_exp']) && $locale['s_desired_exp']!='') {
                $experience = $locale['s_desired_exp'];
            } else {
                $experience = '';
            }
            if(isset($locale['s_studies']) && $locale['s_studies']!='') {
                $education = $locale['s_studies'];
            } else {
                $education = '';
            }

            echo '<job>
            <title><![CDATA['.osc_item_title().']]></title>
            <date><![CDATA['.osc_item_pub_date().']]></date>
            <referencenumber><![CDATA['.osc_item_id().']]></referencenumber>
            <url><![CDATA['.osc_item_url().']]></url>
            <company><![CDATA['.((isset($item['s_company_name']) && $item['s_company_name']!=NULL)?$item['s_company_name']:'').']]></company>
            <city><![CDATA['.((osc_item_city()!=NULL)?osc_item_city():'').']]></city>
            <state><![CDATA['.((osc_item_region()!=NULL)?osc_item_region():'').']]></state>
            <country><![CDATA['.((osc_item_country()!=NULL)?osc_item_country():'').']]></country>
            <postalcode><![CDATA['.((osc_item_zip()!=NULL)?osc_item_zip():'').']]></postalcode>
            <description><![CDATA['.((osc_item_description()!=NULL)?osc_item_description():'').']]></description>
            <salary><![CDATA['.$salary.']]></salary>
            <education><![CDATA['.$education.']]></education>
            <jobtype><![CDATA['.((isset($item['e_position_type']) && $item['e_position_type']!=NULL)?$item['e_position_type']:'').']]></jobtype>
            <category><![CDATA[]]></category>
            <experience><![CDATA['.$experience.']]></experience>
            </job>';
        }
    }
    echo '</source>';

}

?>
