/** @jsx React.DOM */

var Panel = ReactBootstrap.Panel;

var ObjectMedia = React.createClass({
  render: function() {

		var id = this.props.id;
		var object = typeof id === "string" ? $N.object[id] : id;
		if (typeof id !== "string")
			id = id.id;

		var name = object ? $N.label(object,'?') : id;
		var author = object ? $N.label(object.author,'?') : '?';
		var icon = object ? objIcon(object) : getTagIcon(null);
		var desc = object ? objDescription(object,64) : '';
		var when = object ? $.timeago(objWhen(object)) : '';

	  	return <div className="media">
			  <a className="pull-left" href="#">
				<img className="media-object" src={icon} alt="..."></img>
			  </a>
			  <div className="media-body">
				<h4 className="media-heading"><a href={"#/object/"+id}>{name}</a></h4>
				by {author} {when}<br/>
				{desc}
			  </div>
			</div>;
	}
});
