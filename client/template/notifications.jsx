/** @jsx React.DOM */


var DropdownButton = ReactBootstrap.DropdownButton;
var MenuItem = ReactBootstrap.MenuItem;

//var noMessagesMessage = { id: 'noMessages', name: "No messages" };

var NotificationMenu = React.createClass({
  getInitialState: function() {

	var that = this;

	$N.on('change:messages', function() {
		that.updateMessages($N.messages);
	});

  	return {messages: $N.messages };
  },

  updateMessages: function(messages) {
  	this.setState({messages: messages});
  },

  handleClick: function(event) {
  	var target = event.target;
	$N.router.navigate($(target).attr('href'),{trigger:false});
  },

  handleShowMore: function() {
  	$N.router.navigate("#/us",{trigger:true});
  },


  
  render: function() {
  	var maxMessages = 4;

	var messages = this.state.messages||[];


	function getTitle() {
		return <i className="fa fa-envelope-o fa-fw fa-2x" title={"Messages (" + messages.length + ")"}></i>
	}

	var firstMessage = Math.max(0,messages.length - maxMessages);
	var lastMessage = messages.length;
	var displayedMessages = messages.slice(firstMessage, lastMessage).reverse();
	var showMore = messages.length - displayedMessages.length;
	var handleClick = this.handleClick;

	var items = displayedMessages.map(function(m) {
				return (
					<MenuItem key={m.id} href={'#/object/' + m.id} onClick={handleClick}>{m.name}</MenuItem>
				)
			});

	if (showMore > 0) {
		items.push(<MenuItem key="d1" divider></MenuItem>);
		items.push(<MenuItem key="showMore" onClick={this.handleShowMore}>{showMore} More...</MenuItem>);
	}
	else if (items.length == 0) {
		items.push(<MenuItem key="noMessage" disabled={true}>No messages.</MenuItem>);
	}

	//var STYLES = ['default', 'primary', 'success', 'info', 'warning', 'danger'];
	return (
	  <DropdownButton bsStyle="default" title={getTitle()}>
	  	{items}
	  </DropdownButton>
	);
  }
});

