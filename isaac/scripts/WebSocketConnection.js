
function WebSocketConnect(connectDivId, externalKinectListener){
	
	var connectDiv;
	
	var server_ipAddress;
	var server_port;
	var socket;
	
	var kinectListener = externalKinectListener;


	this.initializeWebSocketConnect = function(ipAddress, port)
	{
		connectDiv = document.getElementById(connectDivId);

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
			alert("Error: " + exception);
		}
		return false;
	}
	
	
	function socketOpenHandler()
	{
		output("Kinected!");
		setTimeout(function(){output("");}, 1000);
		connectDiv.style.visibility = "hidden";
	}
	

	function socketMessageHandler(msg)
	{
		var decoded = JSON.parse(msg.data.replace(/[\u0000\u00ff]/g, ''));
		
		switch(decoded.command)
		{
			case "SKELETON_UPDATE":
				kinectListener.animate(decoded.data);
				break;
		}
	}
	
	function socketCloseHandler()
	{
		output("Kinecting...");
		setTimeout(function(){openWebSocket();}, 500);
		//connectDiv.style.visibility = "inherit";
	}
}

