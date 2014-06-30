/** @jsx React.DOM */

var Panel = ReactBootstrap.Panel;

var CategoryPreviews = React.createClass({
  render: function() {
	  
	var tags = this.props.tag;
	  
	  
    return (
		<div className="CategoryPreviews container-fluid">
		<div className="row">
		{
			tags.map(function(tag) {
			  return(
				<div className="col-xs-6 col-md-4">
					<Panel header={(<h3>{tag.name}</h3>)}>
					{
						tag.object.map(function(o) {

						  return <div className="media">
							  <a className="pull-left" href="#">
								<img className="media-object" src={o.icon} alt="..."></img>
							  </a>
							  <div className="media-body">
								<h4 className="media-heading">{o.name}</h4>
								{o.content}
							  </div>
							</div>;

						})
					}			
					</Panel>
			  	</div>
			  )
			})
		}
		</div></div>
	);
										 
  }
});