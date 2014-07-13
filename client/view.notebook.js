function newNotebookView(v) {
    var d = newDiv().appendTo(v);

    loadCSS('lib/jquery.terminal/jquery.terminal.css');
    $LAB
        .script('lib/jquery.terminal/jquery.terminal-0.9.0.min.js')
        .wait(function() {
            //<script src="lib/jquery.terminal/jquery.terminal-0.9.0.min.js"></script>

            //http://terminal.jcubic.pl/

            d.terminal(function(command, term) {
                if (command !== '') {
                    try {
                        var result = window.eval(command);
                        if (result != undefined) {
                            var s = result.toString();
                            if (s === '[object Object]') {
                                s = JSON.stringify(result, null, 4);
                            }
                            term.echo(s);
                        }
                    }
                    catch (e) {
                        term.error('Error: ', e);
                    }
                }
            }, {  //http://terminal.jcubic.pl/api_reference.php#
                greetings: '',
                name: 'Notebook',
                height: '100%',
                width: '100%',
                prompt: '> ',
                completion: function(term, string, callback) {
                    var fields = string.split('.');
                    if ((fields.length <= 2) && (fields.length >= 1)) {
                        console.log(fields);
                        if (fields[0].indexOf('(') != -1) {
                            //hack to avoid calling functions
                            callback([]);
                        }
                        else {
                            var ev = eval(fields[0]);
                            if (ev) {
                                var functions = _.keys(ev);
                                if (ev.__proto__)
                                    functions = _.union(functions, _.keys(ev.__proto__));
                                callback(
                                    _.map(functions, function(t) { return fields[0] + '.' + t; })
                                );
                            }
                            else {
                            }
                        }
                        callback([]);
                        return;
                    }
                }
            });
            window.terminal = d;
            d.resize('100%', '100%');

            d.onChange = function() {

            };

        });


	return d;
}
