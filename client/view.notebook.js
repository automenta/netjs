function newNotebookView(v) {
        //http://terminal.jcubic.pl/

        var d = newDiv().appendTo(v).terminal(function(command, term) {
            if (command !== '') {
                var result = window.eval(command);
                if (result != undefined) {
                    term.echo(String(result));
                }
            }
        }, {  //http://terminal.jcubic.pl/api_reference.php#
            greetings: '',
            name: 'Notebook',
            height: "100%",
            width: "100%",
            prompt: '> ',
            completion: function(term, string, callback) {
                console.log('completion:', term, string);
                //callback(['foo', 'bar', 'baz']);
                callback([]);
            },
        });

        d.onChange = function() {
                
        };
        
	return d;
}
