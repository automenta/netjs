/* version 1.1 - 05-26-2013 */


function renderOptions(s, o, v) {

    $('#Options').show();


    //v.append('<h1>Theme</h1>');
    //v.append(themeSelect);

    v.append('<h1>Plugins</h1>');

    var plugins = newDiv();

    updatePlugins(plugins);
    v.append(plugins);

    /*
                        <!--
                        <li class="dropdown-submenu">
                            <a tabindex="-1" href="#"><img alt="options" src="icon/manage.png"/>Options</a>
                            <ul class="dropdown-menu">
                                <li><a href="#">Listen to all Channels</a></li>
                                <li><a href="#">Silence</a></li>
                                <li><a href="javascript:confirmClear()">Clear Local Memory</a></li>
                            </ul>
                        </li>
                        -->
                      <hr>
                        <a href="/plugins.html" target="_blank"><img alt="plugins" src="icon/workflow.png"/>Plugins</a>
                        <!-- <li><a href="/tests.html"><img alt="system tests" src="icon/vote.png"/>System Tests</a></li> -->
                        <!-- <li><a href="/#/team"><img alt="team" src="icon/user-group.png"/>Team</a></li> -->
                        <!--<li><a href="/#/new">New</a></li><br/>-->
                        <!-- <li><a href="/#/tags"><img alt="tags: src="icon/back-to-ou.png"/>Tags</a></li> -->
                        <a href="/#/help">Help</a>

                        <br/>
                        <div id="ViewOptions"></div>
                        <div id="ViewSelect" class="ViewSelectNormal"></div>

                    <!-- <a class="btn" href="#">Location</a> -->
                </div>
    */

}

            function updatePlugins(p) {
                $N.getPlugins(function(pl) {

                    p.empty();
                    for (var kk in pl) {
                        (function() {
                            var k = kk;
                            var pu = pl[k];

                            var pd = $('<div class="PluginID ui-widget-header"></div>');
                            pd.append('<h3><a target="_blank" href="/plugin/' + pu.filename + '">' + k + '</a></h3>');

                            if (pu.description)
                                pd.append('<span>' + pu.description + '</span>');

                            if (!(pu.valid == false)) {
                                pd.append('<br/>');
                                if (pu.enabled) {
                                    pd.addClass('PluginEnabled');

                                    var b = $('<button>Disable</button>');
                                    b.click(function() {
                                       $N.setPlugin(k, false, function(err) {
                                            if (!err) {
                                                updatePlugins(p);
                                                //notify
                                            }
                                            else {
                                                notify({
                                                    title: 'Unable to configure plugin',
                                                    text: err
                                                });
                                            }
                                       });
                                    });
                                    pd.append('<span>Currently enabled.</span>&nbsp;');
                                    pd.append(b);
                                }
                                else {
                                    pd.addClass('PluginDisabled');

                                    var b = $('<button>Enable</button>');
                                    b.click(function() {
                                       $N.setPlugin(k, true, function(err) {
                                            if (!err) {
                                                updatePlugins(p);
                                                //notify
                                            }
                                            else {
                                                notify({
                                                    title: 'Unable to configure plugin',
                                                    text: err
                                                });
                                            }
                                       });
                                    });
                                    pd.append('<span>Currently disabled.</span>&nbsp;');
                                    pd.append(b);
                                }
                            }
                            else {
                                pd.addClass('PluginInvalid');
                            }
        //                    var ps = $('<div class="PluginSettings"></div>');
        //                    if (pu.valid) {
        //
        //
        //                        //ps.append(px);
        //                    }
        //                    else {
        //                        ps.html('' + JSON.stringify(pu) + '</div>');
        //                    }
        //                    pd.append(ps);

                            p.append(pd);
                        })();

                    }
                });
            }

            /*$(document).ready(function(){
                netention(function(self) {

                    $('#PluginList').html('Loading...');
                    $N.on('change:plugins', updatePlugins);
                    $N.getPlugins();


                });
            });*/
