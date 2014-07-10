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
		<div className="CategoryPreviews col-xs-6 col-md-4">
		{				
			tags.map(function(tag) {
			  return(
					<Panel header={(<h3><TagButton tagID={tag.id}></TagButton>&nbsp;<a title={"New " + tag.id + "..."} href={"#/tag/" + tag.id + "/new"}>+</a></h3>)}>
					{
						tag.object.length > 0 ?
							tag.object.map(function(o) {
								return <ObjectMedia id={o}></ObjectMedia>
							})
							:
							"None yet."
					}
					{
						tag.more ? <div className="MoreLink"><a href={"#browse/tag/" + tag.id}>More...</a></div> : <div></div>
					}
					</Panel>
			  )
			})
		}
		</div>		
	);
										 
  }
});
