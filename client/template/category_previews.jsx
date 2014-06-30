/** @jsx React.DOM */

var CategoryPreviews = React.createClass({
  render: function() {
	  
	var tags = this.props.tag;
	  
	  
    return (
		<ul className="CategoryPreviews">
		{
			tags.map(function(tag) {
			  return(
				<div>
					<h3>{tag.name}</h3>
				  	<ul>
						{
 						    tag.object.map(function(o) {
							  return <li>{o.name}</li>;
						    })
 						}			
	  				</ul>
			  	</div>
			  )
			})
		}
		</ul>
	);
										 
  }
});