//a suggestion rule for a specific condition.  
//
//each rule specifies:
// condition predicate
// reason string
// target of the suggestion - product, URL, person, etc

var Suggestion = {

    id: function() { },

    // indicators involved
    involvedIndicators: function() { [] },

    //returns false if georesult doesn't satisfy the condition, or the reason as a HTML string if it does
    condition: function(georesult) { return false },
    
    //ex: product URL
    url: function() { "http://" },
    
    //title
    name: function() { return "" },
    
    //image url for thumbnail
    imageURL: function() { "http://" }
    
};