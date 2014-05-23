<?php if (!defined('OC_ADMIN') || OC_ADMIN!==true) exit('Access is not allowed.');
    /*
     *      OSCLass – software for creating and publishing online classified
     *                           advertising platforms
     *
     *                        Copyright (C) 2010 OSCLASS
     *
     *       This program is free software: you can redistribute it and/or
     *     modify it under the terms of the GNU Affero General Public License
     *     as published by the Free Software Foundation, either version 3 of
     *            the License, or (at your option) any later version.
     *
     *     This program is distributed in the hope that it will be useful, but
     *         WITHOUT ANY WARRANTY; without even the implied warranty of
     *        MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     *             GNU Affero General Public License for more details.
     *
     *      You should have received a copy of the GNU Affero General Public
     * License along with this program.  If not, see <http://www.gnu.org/licenses/>.
     */
?>
<div id="settings_form" style="border: 1px solid #ccc; background: #eee; ">
    <div style="padding: 20px;">
        <div style="float: left; width: 100%;">
            <fieldset>
                <legend><?php _e('Help', 'extra_feeds'); ?></legend>
                <p>
                    <?php _e('Extra feeds plugin exports your ads in the feed format of several well-known search engines and ads agregator as Google Base, Indeed, Trovit...','extra_feeds'); ?>
                </p>
                <p>
                    <?php _e('It just works as the normal feed of your OSClass site. Perform any search and add the param &sFeed={name_of_the_feed} at the end of the URL, for example http://www.example.com/index.php?page=search&sCategory=1&sFeed=indeed to export the ads of category 1 in indeed\'s format','extra_feeds'); ?>
                </p>
                <p>
                    <?php _e('Current list of supported feed:','extra_feeds'); ?>
                </p>
                <ul>
                    <li>indeed</li>
                    <li>google_cars</li>
                    <li>google_jobs</li>
                    <li>trovit_cars</li>
                    <li>trovit_houses</li>
                    <li>trovit_jobs</li>
                    <li>trovit_products</li>
                    <li>oodle_cars</li>
                    <li>oodle_jobs</li>
                    <li>oodle_realstate</li>
                </ul>
            </fieldset>
        </div>
        <div style="clear: both;"></div>										
    </div>
</div>
