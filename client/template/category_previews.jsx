/** @jsx React.DOM */

var Panel = ReactBootstrap.Panel;

var TagButton = React.createClass({
  render: function() {
  		var tagID = this.props.tagID;
		var tag = $N.class[tagID];
		var tagName = tag ? tag.name : tagID;
		var tagIcon = tag ? getTagIcon(tagID) : null;

		var style = {
  			backgroundImage: "url(" + tagIcon + ")"
		};

		return (<a href={'#object/' + tagID} style={style} className="tagLink">{tagName}</a>);
  }
});

var CategoryPreviews = React.createClass({
  render: function() {
	  
	var tags = this.props.tag;

	  
    return (
		<div className="CategoryPreviews container-fluid">
		<div className="row">
		{
			tags.map(function(tag) {
			  return(
				<div className="col-xs-6 col-md-4 tiled">
					<Panel header={(<h3><TagButton tagID={tag.id}></TagButton></h3>)}>
					{
						tag.object.map(function(o) {
							return <ObjectMedia id={o}></ObjectMedia>
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
