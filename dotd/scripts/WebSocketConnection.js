
function WebSocketConnect(){
	
	var server_ipAddress;
	var server_port;
	var socket;


	this.initializeWebSocketConnect = function(ipAddress, port)
	{
		server_ipAddress = ipAddress
		server_port = port
		connectToWebSocketServer(ipAddress, port);
	}


	function connectToWebSocketServer(ipAddress, port)
	{
		try
		{
			socket = new WebSocket("ws://" + ipAddress + ":" + port);
			socket.onopen = socketOpenHandler;
			socket.onmessage = socketMessageHandler;
			socket.onclose = socketCloseHandler;
		}
		catch(exception)
		{
			//output("Error: " + exception);
		}
		return false;
	}
	
	
	function socketOpenHandler()
	{
		//output("Kinected!");
		setTimeout(function(){output("");}, 1000);
	}
	

	function socketMessageHandler(msg)
	{
		var decoded = JSON.parse(msg.data.replace(/[\u0000\u00ff]/g, ''));
		
		switch(decoded.command)
		{
			case "SKELETON_UPDATE":
				myKinectListener.animate(decoded.data);
				break;
		}
	}
	
	function socketCloseHandler()
	{
		//output("Kinecting...");
		setTimeout(function(){openWebSocket();}, 500);
	}
}

