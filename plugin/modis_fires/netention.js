exports.sensor = {
    
    //parent "folder" in the taxonomy, separated by slashes, like "Society/Crime"
    id: function() { return 'MODISFires'; },
    
    //list of named variables, their types, initial values, and limits, to generate UI controls for adjusting those variables
    options: function() { 
        return {        };
    },
    
    //SERVER to refresh the data in this cache, should be called at least once at the beginning
    refresh: function(sensor, onFinished, onError) { 
        onFinished();
    }
};
