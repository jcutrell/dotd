
function KinectListener(interfaceIdentifier, leftHandDivId, rightHandDivId, skeletonBoxId, connectDivId){
	
	var jointIndexByName= {pelvis:0, waist:1, neck:2, head:3, left_shoulder:4, left_elbow:5, left_wrist:6, left_hand:7, right_shoulder:8, right_elbow:9, right_wrist:10, right_hand:11, left_hip:12, left_knee:13, left_ankle:14, left_foot:15, right_hip:16, right_knee:17, right_ankle:18, right_foot:19},
		interface,
		leftHandDiv,
		rightHandDiv,
		skeletonBoxDiv,
		connectDiv,
		showHandPositions = true,
		showBody = true;

	
	function CircleListener(title){
		this.title = title;
		this.minPointDistance = 0.4;
		this.listenerTimeLimit = 2000;
		
		this.timeouts = {
			left: null,
			right: null,
			up: null,
			down: null,
			forwards: null,
			backwards: null
		};
		
		this.detections = {
			left: false,
			right: false,
			up: false,
			down: false,
			forwards: false,
			backwards: false
		};
		
		this.points = {
			left: new Point(0,0,0),
			right: new Point(0,0,0),
			up: new Point(0,0,0),
			down: new Point(0,0,0),
			forwards: new Point(0,0,0),
			backwards:  new Point(0,0,0)
		};
				
		this.beginTimeout = function(index, x, y, z){
			//if(this.timeouts[index] == null){ //only begin a timeout if it hasn't already been started
				//output("started watching: " + index);
				this.points[index].setCoordinates(x,y,z);
				this.detections[index] = true;
				clearTimeout(this.timeouts[index]);
				this.timeouts[index] = setTimeout(function(circleListener, clIndex){circleListener.handleTimeout(clIndex);}, 2000, this, index);
				
				if(this.allDetectionsAreTrue() && this.pointsAreDistant()){
					this.resetSelf();
					//console.log(this.title + " Circle");
					//output(this.title + " Circle");
					
					/*
					if(this.title == "Left Hand"){
						document.getElementById("circleDiv").style.backgroundImage = "url('images/circle_gold.png')";
					}
					else if(this.title == "Right Hand"){
						document.getElementById("circleDiv").style.backgroundImage = "url('images/circle_cyan.png')";	
					}*/
					
					document.getElementById("circleDiv").style.opacity = 1;
					setTimeout(function(){
						//output("");
						document.getElementById("circleDiv").style.opacity = 0;
					},1000);
				}
			//}
		}
		
		this.handleTimeout = function(index){
			this.detections[index] = false;
			clearTimeout(this.timeouts[index]);
			this.timeouts[index] = null;
			//output("finished watching: " + index);
		}
		
		this.allDetectionsAreTrue = function(){
			return(this.detections.left && this.detections.right && ((this.detections.up && this.detections.down) || (this.detections.forwards && this.detections.backwards)));
		}
		
		this.pointsAreDistant = function(){
			var distance1 = 0,
				distance2 = 0,
				distance3 = 0,
				distance4 = 0,
				distance5 = 0,
				distance6 = 0;
			
			if(this.detections.up && this.detections.down){ // potential circle detected around z-axis
				distance1 = this.calculatePointDistance(this.points["left"], this.points["right"]);
				distance2 = this.calculatePointDistance(this.points["left"], this.points["up"]);
				distance3 = this.calculatePointDistance(this.points["left"], this.points["down"]);
				distance4 = this.calculatePointDistance(this.points["right"], this.points["up"]);
				distance5 = this.calculatePointDistance(this.points["right"], this.points["down"]);
				distance6 = this.calculatePointDistance(this.points["up"], this.points["down"]);	
			}
			else if(this.detections.forwards && this.detections.backwards){ //potential circle detected around y-axis
				distance1 = this.calculatePointDistance(this.points["left"], this.points["right"]);
				distance2 = this.calculatePointDistance(this.points["left"], this.points["forwards"]);
				distance3 = this.calculatePointDistance(this.points["left"], this.points["backwards"]);
				distance4 = this.calculatePointDistance(this.points["right"], this.points["forwards"]);
				distance5 = this.calculatePointDistance(this.points["right"], this.points["backwards"]);
				distance6 = this.calculatePointDistance(this.points["forwards"], this.points["backwards"]);
			}
			
			return (distance1 > this.minPointDistance && distance2 > this.minPointDistance && distance3 > this.minPointDistance && distance4 > this.minPointDistance && distance5 > this.minPointDistance && distance6 > this.minPointDistance);
		}
		
		
		this.calculatePointDistance = function(p0, p1){
			return(Math.sqrt(Math.pow(p1.x-p0.x,2) + Math.pow(p1.y-p0.y,2) + Math.pow(p1.z-p0.z,2)));	
		}
		
		this.resetSelf = function(){
			for(timeoutIndex in this.timeouts){
				clearTimeout(this.timeouts[timeoutIndex]);
				this.timeouts[timeoutIndex] = null;
			}
			
			for(detectionIndex in this.detections){
				this.detections[detectionIndex] = false;
			}
		}
	}
	
	
	
	this.leftCircleListener;
	this.rightCircleListener;
	
	function outputStuff(){		
		var outputString = "LEFT<br/>";
		if(this.leftCircleListener.detections.left){outputString += "left: " + this.leftCircleListener.detections.left + "<br/>";}
		else{outputString += "left: absent<br/>"}
		if(this.leftCircleListener.detections.right){outputString += "right: " + this.leftCircleListener.detections.right + "<br/>";}
		else{outputString += "right: absent<br/>"}
		if(this.leftCircleListener.detections.up){outputString += "up: " + this.leftCircleListener.detections.up + "<br/>";}
		else{outputString += "up: absent<br/>"}
		if(this.leftCircleListener.detections.down){outputString += "down: " + this.leftCircleListener.detections.down + "<br/>";}
		else{outputString += "down: absent<br/>"}
		
		outputString += "<br/>RIGHT<br/>";
		if(this.rightCircleListener.detections.left){outputString += "left: " + this.rightCircleListener.detections.left + "<br/>";}
		else{outputString += "left: absent<br/>"}
		if(this.rightCircleListener.detections.right){outputString += "right: " + this.rightCircleListener.detections.right + "<br/>";}
		else{outputString += "right: absent<br/>"}
		if(this.rightCircleListener.detections.up){outputString += "up: " + this.rightCircleListener.detections.up + "<br/>";}
		else{outputString += "up: absent<br/>"}
		if(this.rightCircleListener.detections.down){outputString += "down: " + this.rightCircleListener.detections.down + "<br/>";}
		else{outputString += "down: absent<br/>"}
		
		output(outputString);
	}
	
	var socket,
		stats,
		camera, scene, renderer, group, particle,
		mouseX = 0, mouseY = 0,
		skeletons = [],
		skeletonGroups = {},
		skeletonTrackingIDs = [],
		WIDTH = 640,
		HEIGHT = 480,	
		PI2 = Math.PI * 2,
		program = function ( context ) {
			context.beginPath();
			context.arc( 0, 0, 1, 0, PI2, true );
			context.closePath();
			context.fill();
		};
	
	
	
	function Point(x,y,z){
		this.x = x;
		this.y = y;
		this.z = z;
		
		this.setCoordinates = function(x,y,z){
			this.x = x;
			this.y = y;
			this.z = z;
		}
	}
	
	function SkeletonObject(){
		this.joint = new Array(20);
		
		for(i=0; i<20; i++){
			this.joint[i] = new Point(0,0,0);	
		}
		
		this.updateJoints = function(skeleton){
			for(i=0; i<20; i++){
				this.joint[i].setCoordinates(skeleton.joints[i].x, skeleton.joints[i].y, skeleton.joints[i].z);
			}
		}
	}
	
	var previousSkeleton = new SkeletonObject(),
		divArray = new Array(20),
		userVisibleToKinect = false;

	initialize();
	
	
	
	function initialize()
	{
		skeletonBoxDiv = document.getElementById(skeletonBoxId);
		leftHandDiv = document.getElementById(leftHandDivId);
		rightHandDiv = document.getElementById(rightHandDivId);
		connectDiv = document.getElementById(connectDivId);
		
		interface = interfaceIdentifier;
		
		this.leftCircleListener =  new  CircleListener("Left Hand");
		this.rightCircleListener =  new  CircleListener("Right Hand");
		//setInterval(function(){outputStuff();},250);
		//connectHandler();
		
		//$("#connect").show();
		$("#connectDiv input[type=submit]").click(connectHandler);
		
		for(var i=0; i<20; i++){
			newNode = document.createElement("div");
			newNode.id = "bodyDiv_" + i;
			newNode.className = "bodyClass";
			divArray[i] = newNode;
			skeletonBoxDiv.appendChild(newNode);		
		}
		
	}
	
	function connectHandler()
	{
		try
		{
			socket = new WebSocket("ws://" + $("#ip").val() + ":" + $("#port").val());
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
		connectDiv.style.visibility = "hidden";
		//$("#connect").hide();
	}
	

	function socketMessageHandler(msg)
	{
		//alert(msg.data);
		var decoded = JSON.parse(msg.data.replace(/[\u0000\u00ff]/g, ''));
		
		switch(decoded.command)
		{
			case "SKELETON_UPDATE":
				skeletons = decoded.data;
				animate();
				
				break;
		}
	}
	
	function socketCloseHandler()
	{
		alert("close");
		//$("#connect").show();
		connectDiv.style.visibility = "inherit";
	}
	
	
	var circleSpeed = 0.125;
	function animate()
	{
		
		var i, j, skeleton;
		//remove the skeletons which are no longer there
		for(i = 0; i < skeletonTrackingIDs.length; i++)
		{			
			var trackingID = skeletonTrackingIDs[i];
			var index = -1;
			for(j = 0; j < skeletons.length; j++)
			{
				if(skeletons[j].trackingID == trackingID)
				{
					index = j;
					break;
				}
			}
			if(index == -1)
			{
				skeletonGroups[trackingID] = null;
			}
		}
		//reset the tracking IDs
		skeletonTrackingIDs = [];
		
		
		if(skeletons.length == 0 && userVisibleToKinect){
		   setUserVisibility(false);
		}
		else if(skeletons.length > 0 && !userVisibleToKinect){
			 setUserVisibility(true);	
		}
		
		for(i = 0; i < skeletons.length; i++)
		{
			if(i == 0){ //only track the first player
				skeleton = skeletons[i];
				skeletonTrackingIDs.push(skeleton.trackingID);
				//get the skeleton group by it's tracking id
				if(skeletonGroups[skeleton.trackingID] == null)
				{
					joints = skeleton.joints.length;
					for(j = 0; j < joints; j++)
					{
						node = divArray[j];
						
						xRatio = skeleton.joints[j].x;
						yRatio = skeleton.joints[j].y;
						zRatio = skeleton.joints[j].z;
						
						xRatio_prev =  previousSkeleton.joint[j].x;
						yRatio_prev =  previousSkeleton.joint[j].y;
						zRatio_prev =  previousSkeleton.joint[j].z;
						
						xVal = xRatio*100 + 100;
						yVal = yRatio*100*-1 + 100;
						zVal = zRatio*100 + 100;
						
						leftRight_diff 		= xRatio - xRatio_prev;
						upDown_diff 		= yRatio - yRatio_prev;
						fowardbackwards_diff = zRatio - zRatio_prev;
						
						if(showBody){
							node.style.webkitTransform = "translate3d(" + xVal + "px, " + yVal + "px, 0px)"; 
						}
						
						
						if(j==7){ //left hand						
							if		(leftRight_diff > circleSpeed){this.leftCircleListener.beginTimeout("right", xRatio, yRatio, zRatio);}
							else if	(leftRight_diff < -circleSpeed){this.leftCircleListener.beginTimeout("left", xRatio, yRatio, zRatio);}
							
							if		(upDown_diff > circleSpeed){this.leftCircleListener.beginTimeout("up", xRatio, yRatio, zRatio);}
							else if	(upDown_diff < -circleSpeed){this.leftCircleListener.beginTimeout("down", xRatio, yRatio, zRatio);}
							
							if		(fowardbackwards_diff > circleSpeed){this.leftCircleListener.beginTimeout("forwards", xRatio, yRatio, zRatio);}
							else if	(fowardbackwards_diff < -circleSpeed){this.leftCircleListener.beginTimeout("backwards", xRatio, yRatio, zRatio);}
						}
						
						if(j==11){ //right hand
							if		(leftRight_diff > circleSpeed){this.rightCircleListener.beginTimeout("right", xRatio, yRatio, zRatio);}
							else if	(leftRight_diff < -circleSpeed){this.rightCircleListener.beginTimeout("left", xRatio, yRatio, zRatio);}
							
							if		(upDown_diff > circleSpeed){this.rightCircleListener.beginTimeout("up", xRatio, yRatio, zRatio);}
							else if	(upDown_diff < -circleSpeed){this.rightCircleListener.beginTimeout("down", xRatio, yRatio, zRatio);}
							
							if		(fowardbackwards_diff > circleSpeed){this.rightCircleListener.beginTimeout("forwards", xRatio, yRatio, zRatio);}
							else if	(fowardbackwards_diff < -circleSpeed){this.rightCircleListener.beginTimeout("backwards", xRatio, yRatio, zRatio);}
						}
						
								
						if(j==3){ //head
					
						}
					}
				}
				
				previousSkeleton.updateJoints(skeleton);
			}
		}
	}
	
	
	
	this.setShowHandPositions = function(value){
		showHandPositions = value;
	
		if(showHandPositions){
			leftHandDiv.style.visibility = "inherit";
			rightHandDiv.style.visibility = "inherit";
		}
		else{
			leftHandDiv.style.visibility = "hidden";
			rightHandDiv.style.visibility = "hidden";
		}
	}
	
	this.setShowBody = function(value){
		showBody = value;
		
		if(showBody){
			skeletonBoxDiv.style.visibility = "inherit";
		}
		else{
			skeletonBoxDiv.style.visibility = "hidden";
		}
	}
	
	
	function setUserVisibility(value){
		/*
		userVisibleToKinect = value;
		
		if(userVisibleToKinect){
			if(showBody){
				skeletonBoxDiv.style.visibility = "inherit";
			}
			if(showHandPositions){
				leftHandDiv.style.visibility = "inherit";
				rightHandDiv.style.visibility = "inherit";
			}
		}
		else{
			if(showBody){
				skeletonBoxDiv.style.visibility = "hidden";
			}
			if(showHandPositions){
				leftHandDiv.style.visibility = "hidden";
				rightHandDiv.style.visibility = "hidden";
			}
		}
		*/
	}
}

