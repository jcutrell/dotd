
function KinectListener(skeletonBoxId){
	
	var jointIndexByName= {pelvis:0, waist:1, neck:2, head:3, left_shoulder:4, left_elbow:5, left_wrist:6, left_hand:7, right_shoulder:8, right_elbow:9, right_wrist:10, right_hand:11, left_hip:12, left_knee:13, left_ankle:14, left_foot:15, right_hip:16, right_knee:17, right_ankle:18, right_foot:19};
	
	var skeletonBoxDiv;
	
	//lost tracking
	var lostTrackingMaskDiv;
	var lostTrackingAlertDiv;
	var peekabooDiv;
	var failureDiv;
	
	var skeletons = [];
	var skeletonGroups = {};
	var skeletonTrackingIDs = [];
	
	var joinDivArray = new Array(20); //html div elements for each joint
	var userIsVisibleToKinect = false; //true when user is standing infront of the kinect, false otherwise
	var showSkeletonBox = false;
	
	var leftCircleListener;
	var rightCircleListener;

	var mainVideo;
	var videoTime = 0;

	var openedDoor = false;
	var tookHand = false;

	var zHitLeft = 0;
	var zHitRight = 0;

	var hitboxDim = {
		xMin: 450,
		xMax: 700,
		yMin: 100,
		yMax: 350
	};
	
	var peekabooObj = {
		headRatioX: 0,
		headRatioY: 0,
		headRatioZ: 0,
		leftHandDistance: 1000,
		rightHandDistance: 1000,
		maxDistance: 0.4, //kinect ratio distance
		peekabooState: "not started",
		holdTime: 500, //milliseconds
		timer: null,
		videoTimeStart: 40,
		videoTimeEnd: 50
	};
	
	
	var leftHand;
	var rightHand;


	function SkeletonObject(){ //skeleton joint storing object (used for keeping track of skeleton join positions from the previous kinect push)
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
	
	var previousSkeleton = new SkeletonObject();
	
	

	
	function initializeKinectListener()
	{ 
		skeletonBoxDiv = document.getElementById(skeletonBoxId);
		mainVideo = document.getElementById("mainVideo");
		leftHand = document.getElementById("leftHand");
		rightHand = document.getElementById("rightHand");

		lostTrackingMaskDiv = document.getElementById("lostTrackingMaskDiv");
		lostTrackingAlertDiv = document.getElementById("lostTrackingAlertDiv");
		peekabooDiv = document.getElementById("peekabooDiv");
		failureDiv = document.getElementById("failureDiv");
		
		//generate the joint divs
		for(var i=0; i<20; i++){
			newNode = document.createElement("div");
			newNode.id = "jointDiv_" + i;
			newNode.className = "bodyClass";
			joinDivArray[i] = newNode;
			skeletonBoxDiv.appendChild(newNode);		
		}
		
		leftCircleListener =  new  CircleListener("Left Hand");
		rightCircleListener =  new  CircleListener("Right Hand");
		
		mainVideo.addEventListener("timeupdate", updateVideoTime, false);
		mainVideo.play();
		//mainVideo.currentTime = 24; //jump to take hand (shortcut for testing)
	}
	
	function updateVideoTime(event){
		//output(mainVideo.currentTime);
		videoTime = mainVideo.currentTime
		if(videoTime > 14 && videoTime < 51 && !openedDoor){ //time to open door has expired
			failureDiv.innerHTML = "Failed to open door!";
			failureDiv.style.opacity = 1;
			setTimeout(function(){failureDiv.style.opacity = 0;}, 2000);
			mainVideo.currentTime = 51; //jump to ghost attack
		}
		
		if(videoTime > 35 && videoTime < 51 && !tookHand){ //time to open door has expired
			failureDiv.innerHTML = "Failed to take hand!";
			failureDiv.style.opacity = 1;
			setTimeout(function(){failureDiv.style.opacity = 0;}, 2000);
			mainVideo.currentTime = 51; //jump to ghost attack
		}
	}
	
	
	this.animate = function(data)
	{
		skeletons = data;
		
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
		
		
		if(skeletons.length == 0 && userIsVisibleToKinect){
		   setUserVisibility(false);
		}
		else if(skeletons.length > 0 && !userIsVisibleToKinect){
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
						node = joinDivArray[j];
						
						//x,y,z values in their original kinect ratios (approx range: -1 through +1)
						xRatio = skeleton.joints[j].x;
						yRatio = skeleton.joints[j].y;
						zRatio = skeleton.joints[j].z;
						
						xRatio_prev =  previousSkeleton.joint[j].x;
						yRatio_prev =  previousSkeleton.joint[j].y;
						zRatio_prev =  previousSkeleton.joint[j].z;
					
						//x,y,z values in pixels
						xPixel = xRatio*100 + 100;
						yPixel = yRatio*-100 + 100;
						zPixel = zRatio*100 + 100;
						
						leftRight_diff 		= xRatio - xRatio_prev;
						upDown_diff 		= yRatio - yRatio_prev;
						fowardbackwards_diff = zRatio - zRatio_prev;
						
						zRatioWaist = skeleton.joints[1].z;
						var waistZ = Math.floor(zRatioWaist*-250) + 600;
						
						node.style.webkitTransform = "translate3d(" + xPixel + "px, " + yPixel + "px, " + zPixel + "px)"; //move joint dots around to reflect kinect data


						if(j==7){ //left hand draw circle					
							if		(leftRight_diff > leftCircleListener.circleSpeed){leftCircleListener.beginTimeout("right", xRatio, yRatio, zRatio);}
							else if	(leftRight_diff < -leftCircleListener.circleSpeed){leftCircleListener.beginTimeout("left", xRatio, yRatio, zRatio);}
							
							if		(upDown_diff > leftCircleListener.circleSpeed){leftCircleListener.beginTimeout("up", xRatio, yRatio, zRatio);}
							else if	(upDown_diff < -leftCircleListener.circleSpeed){leftCircleListener.beginTimeout("down", xRatio, yRatio, zRatio);}
							
							if		(fowardbackwards_diff > leftCircleListener.circleSpeed){leftCircleListener.beginTimeout("forwards", xRatio, yRatio, zRatio);}
							else if	(fowardbackwards_diff < -leftCircleListener.circleSpeed){leftCircleListener.beginTimeout("backwards", xRatio, yRatio, zRatio);}
						}
						
						if(j==11){ //right hand draw circle
							if		(leftRight_diff > rightCircleListener.circleSpeed){rightCircleListener.beginTimeout("right", xRatio, yRatio, zRatio);}
							else if	(leftRight_diff < -rightCircleListener.circleSpeed){rightCircleListener.beginTimeout("left", xRatio, yRatio, zRatio);}
							
							if		(upDown_diff > rightCircleListener.circleSpeed){rightCircleListener.beginTimeout("up", xRatio, yRatio, zRatio);}
							else if	(upDown_diff < -rightCircleListener.circleSpeed){rightCircleListener.beginTimeout("down", xRatio, yRatio, zRatio);}
							
							if		(fowardbackwards_diff > rightCircleListener.circleSpeed){rightCircleListener.beginTimeout("forwards", xRatio, yRatio, zRatio);}
							else if	(fowardbackwards_diff < -rightCircleListener.circleSpeed){rightCircleListener.beginTimeout("backwards", xRatio, yRatio, zRatio);}
						}
								
						if(j==3){ //head(tracking
							//output("HEAD X: " + xRatio + "<br/>HEAD Y: " + yRatio); 
							
							background_x = constrain(xRatio*background_range_x*-1 + background_offset_x, -300, 300);
							background_y = constrain((yRatio + headTracking_yRatio_offset)*background_range_y*-1 + background_offset_y, -200, 300);
							
							
							backgroundDiv.style.left = background_x + "px";
							backgroundDiv.style.top = background_y + "px";
							
							
							scaryGirl_x = constrain(xRatio*scaryGirl_range_x*-1 - 200 + scaryGirl_offset_x, -600, 600);
							scaryGirl_y = constrain((yRatio + headTracking_yRatio_offset)*scaryGirl_range_y + scaryGirl_offset_y, 100, 500);
							
							scaryGirlDiv.style.left = scaryGirl_x + "px";
							scaryGirlDiv.style.top = scaryGirl_y + "px";
						}



						// bubbles for hands and stuff!
						/*
						if(j==7){ //left hand bubble
							var handX = xRatio*600;
							var handY = yRatio*-600 - 500;
							$("#lefthandwhite, #lefthandblack").css({
						        "-webkit-mask-position-x" : Math.floor(handX),
						        "-webkit-mask-position-y" : Math.floor(handY)
						    });
						}
						
						if(j==11){ //right hand bubble
							var handX = xRatio*600;
							var handY = yRatio*-600 - 500;
							$("#righthandwhite, #righthandblack").css({
						        "-webkit-mask-position-x" : Math.floor(handX),
						        "-webkit-mask-position-y" : Math.floor(handY)
						    });
						}
						
						*/
						
						//Hand Bubbles
						if(j==7){ //left hand bubble
							var handX = xRatio*600 + 600;
							var handY = yRatio*-600 + 300;
						
							leftHand.style.left = handX + "px";
							leftHand.style.top = handY + "px";
						
							//output(handX + ", " + handY);
						}
						
						if(j==11){ //right hand bubble
							var handX = xRatio*600 + 600;
							var handY = yRatio*-600 + 300;
						
							rightHand.style.left = handX + "px";
							rightHand.style.top = handY + "px";
						}
						
						if(j==3){ //head bubble
							var headX = xRatio*600 + 600;
							var headY = yRatio*-600 + 300;
						
							head.style.left = headX + "px";
							head.style.top = headY + "px";
						}
						
						

						//Open Door
						if(j==7){ //left hand - open door					
							//var handXLeft = Math.floor(xRatio*250) + 250;
							//var handYLeft = Math.floor(yRatio*-250) + 250;
							var handZLeft = Math.floor(zRatio*-250) + 600;
							
							if(videoTime > 0 && videoTime < 12){
								if(zHitLeft == 0){
									if(handZLeft >= waistZ + 75){
										//output("HIT<br/>X: " + handXLeft + "<br/>Y: " + handYLeft + "<br/>Z: " + (handZLeft - waistZ));
										zHitLeft = handZLeft;
										//output("Z at" + zHitLeft + "when hit");
									}
									else{
										//output("No hit<br/>X: " + handXLeft + "<br/>Y: " + handYLeft + "<br/>Z: " + (handZLeft - waistZ));
									}
								}
								else{
									if(handZLeft < zHitLeft - 30){
										//output("THE DOOR IS OPEN!!!!!!!");
										openedDoor = true;
										mainVideo.currentTime = 17;
									}
								}
							}
								
						}
						
						
						
						if(j==11){ //right hand - open door
							//var handXRight = Math.floor(xRatio*250) + 250;
							//var handYRight = Math.floor(yRatio*-250) + 250;
							var handZRight = Math.floor(zRatio*-250) + 600;
							
							if(videoTime > 0 && videoTime < 12){
								if(zHitRight == 0){
									if(handZRight >= waistZ + 75){
										//outputRight("HIT<br/>X: " + handXRight + "<br/>Y: " + handYRight + "<br/>Z: " + (handZRight - waistZ));
										zHitRight = handZRight;
										//outputRight("Z at" + zHitRight + "when hit");
									}
									else{
										//outputRight("No hit<br/>X: " + handXRight + "<br/>Y: " + handYRight + "<br/>Z: " + (handZRight - waistZ));
									}
								}
								else{
									if(handZRight < zHitRight - 30){
										//outputRight("THE DOOR IS OPEN!!!!!!!");
										openedDoor = true;
										mainVideo.currentTime = 17;
									}
								}
							}
						}
						
						
						
						
						//Take Hand
						if(j==7){ //left hand - take hand					
							var handXLeft = Math.floor(xRatio*600) + 600;
							var handYLeft = Math.floor(yRatio*-600) + 300;
							var handZLeft = Math.floor(zRatio*-250) + 600;
							//output("TOOK HAND<br/>X: " + handXLeft + "<br/>Y: " + handYLeft + "<br/>Z: " + (handZLeft - waistZ));

							if(handXLeft >= hitboxDim.xMin && handXLeft <= hitboxDim.xMax && handYLeft >= hitboxDim.yMin && handYLeft <= hitboxDim.yMax && handZLeft >= waistZ + 75 && videoTime > 28 && videoTime < 34){
								//output("TOOK HAND LEFT");
								tookHand = true;
								mainVideo.currentTime = 35;
								//output("TOOK HAND<br/>X: " + handXLeft + "<br/>Y: " + handYLeft + "<br/>Z: " + (handZLeft - waistZ));
							}
							else{
								//output("Still in circle<br/>X: " + handXLeft + "<br/>Y: " + handYLeft + "<br/>Z: " + (handZLeft - waistZ));
							}
								
						}
						
						if(j==11){ //right hand - take hand
							var handXRight = Math.floor(xRatio*600) + 600;
							var handYRight = Math.floor(yRatio*-600) + 300;
							var handZRight = Math.floor(zRatio*-250) + 600;
							
							if(handXRight >= hitboxDim.xMin && handXRight <= hitboxDim.xMax && handYRight >= hitboxDim.yMin && handYRight <= hitboxDim.yMax && handZRight >= waistZ + 75 && videoTime > 28 && videoTime < 34){
								//output("TOOK HAND RIGHT");
								tookHand = true;
								mainVideo.currentTime = 35;
								//outputRight("TOOK HAND<br/>X: " + handXRight + "<br/>Y: " + handYRight + "<br/>Z: " + (handZRight - waistZ));
							}
							else{
								//outputRight("Still in circle<br/>X: " + handXRight + "<br/>Y: " + handYRight + "<br/>Z: " + (handZRight - waistZ));
							}
							
						}
						
						
						
						//PEEK-A-BOO
						if(j==3){ //head - peek-a-boo
							peekabooObj.headRatioX = xRatio;
							peekabooObj.headRatioY = yRatio;
							peekabooObj.headRatioZ = zRatio;
						}
						
						if(j==7){ //left hand - peek-a-boo				
							peekabooObj.leftHandDistance = Math.sqrt(Math.pow(xRatio - peekabooObj.headRatioX, 2) + Math.pow(yRatio - peekabooObj.headRatioY, 2) + Math.pow(zRatio - peekabooObj.headRatioZ, 2));
						}
						
						if(j==11){ //right hand - take hand
							peekabooObj.rightHandDistance = Math.sqrt(Math.pow(xRatio - peekabooObj.headRatioX, 2) + Math.pow(yRatio - peekabooObj.headRatioY, 2) + Math.pow(zRatio - peekabooObj.headRatioZ, 2));
							
							if(mainVideo.currentTime > 40 && mainVideo.currentTime < 50){
								if(peekabooObj.leftHandDistance < peekabooObj.maxDistance && peekabooObj.rightHandDistance < peekabooObj.maxDistance){
									
									if(peekabooObj.peekabooState == "not started"){
										peekabooObj.timer = setTimeout(function(){peekabooObj.peekabooState = "timer complete";}, peekabooObj.holdTime);
										peekabooObj.peekabooState = "holding";
									}
								}
								else{
									if(peekabooObj.peekabooState == "timer complete"){
										peekabooDiv.style.opacity = 1;
										peekabooObj.peekabooState = "not started";
										setTimeout(function(){peekabooDiv.style.opacity = 0;}, 2000);
									}
									else if(peekabooObj.peekabooState == "holding"){
										clearTimeout(peekabooObj.timer);
										peekabooObj.peekabooState = "not started";
									}
								}
							}
						}
					}
				}
				
				previousSkeleton.updateJoints(skeleton);
			}
		}
	}
	
	
	//head tracking globals
	var headTracking_yRatio_offset = -0.75;
	
	var background_range_x = 200;
	var background_range_y = 200;
	var background_offset_x = -100;
	var background_offset_y = -150;
	
	var scaryGirl_range_x = 400;
	var scaryGirl_range_y = 200;
	var scaryGirl_offset_x = 400;
	var scaryGirl_offset_y = 150;
	
	
	function constrain(value, minVal, maxVal){
		return Math.min(Math.max(value, minVal), maxVal);
	}
	
	
	function setUserVisibility(value){
		
		userIsVisibleToKinect = value;
		
		if(showSkeletonBox){
			if(userIsVisibleToKinect){skeletonBoxDiv.style.visibility = "inherit";}
			else{skeletonBoxDiv.style.visibility = "hidden";}
		}
		
		if(userIsVisibleToKinect){
			lostTrackingAlertDiv.style.opacity = "0";
			lostTrackingMaskDiv.style.opacity = "0";
			setTimeout(function(){
				lostTrackingMaskDiv.style.visibility = "hidden";
				lostTrackingAlertDiv.style.visibility = "hidden";				
			}, 2000);
		}
		else{
			lostTrackingMaskDiv.style.visibility = "inherit";
			lostTrackingMaskDiv.style.opacity = "1";
			setTimeout(function(){
				lostTrackingAlertDiv.style.visibility = "inherit";
				lostTrackingAlertDiv.style.opacity = "1";
			}, 1000);
		}
	}
	
	
	initializeKinectListener(); //initializes self
}

