function KinectListener(){
	var jointIndexByName= {pelvis:0, waist:1, neck:2, head:3, left_shoulder:4, left_elbow:5, left_wrist:6, left_hand:7, right_shoulder:8, right_elbow:9, right_wrist:10, right_hand:11, left_hip:12, left_knee:13, left_ankle:14, left_foot:15, right_hip:16, right_knee:17, right_ankle:18, right_foot:19};

	
	var startPoint = 0;
	var openedTitleDoor = false;
	
	var sceneContainer;
	var lostTrackingMaskDiv;
	var lostTrackingAlertDiv;
	var peekabooDiv;
	var failureDiv;
	var fadeBlackDiv;
	var leftHandDiv;
	var rightHandDiv;
	var headDiv;
	var redHitDiv;
	var thudSound;
	var backgroundDiv;
	var headTrackDiv;
	//var circleDiv;
	
	var skeletons = [];
	var skeletonGroups = {};
	var skeletonTrackingIDs = [];
	
	var userIsVisibleToKinect = false; //true when user is standing infront of the kinect, false otherwise
	
	//var leftCircleListener;
	//var rightCircleListener;

	var mainVideo;
	var videoTime = 0;
	var videoPlaying = false;
	
	var zHitLeft = 0;
	var zHitRight = 0;
	
	var zRatio_extendedToOpenDoor_left = 0;
	var zRatio_extendedToOpenDoor_right = 0;
	var zOpenDoorDistance = 0.50;
	
	var dodgeDistanceMin = 0.20;

	var windowWidth = 0;
	var windowHeight = 0;
	var videoHeight = 0;
	var videoWidth = 0;
	var videoLeft = 0;
	var sceneHeight = 0;
	var sceneWidth = 0;
	var sceneLeft = 0;
	var videoLeftMin = 0;
	var videoLeftMax = 0;
	var videoLeftRange = 0;
	var videoLeftShift = 0;

	var experienceHasBegun = false;
	var beginExperienceTimer = null;
	var animationInterval = null;
	var animationRatio = 1;

	var takeHandHitbox = {
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
	
	var leftHandColor = "white";
	var rightHandColor = "white";
	var headColor = "white";
	
	
	var headPreDodgeX = 0;
	var headPreDodgeY = 0;

	
	var introDoorHitBox = {
		xRatioMin: -0.16,
		xRatioMax: 0.27,
		yRatioMin: -0.15,
		yRatioMax: 0.55,
		zWaistRatioOffsetMin: -1.00,
		zWaistRatioOffsetMax: -0.40,
		state: "out",
	};
	
	var ghostDoorHitBox = {
		xRatioMin: -0.50,
		xRatioMax: 0.50,
		yRatioMin: -0.15,
		yRatioMax: 0.55,
		zWaistRatioOffsetMin: -1.00,
		zWaistRatioOffsetMax: -0.40,
		state: "out",
	};
	
	

	function SkeletonObject(){ //skeleton joint storing object (used for keeping track of skeleton join positions from the previous kinect push)
		this.joint = new Array(20);
		
		for(var i=0; i<20; i++){
			this.joint[i] = new Point(0,0,0);	
		}
		
		this.updateJoints = function(skeleton){
			for(var i=0; i<20; i++){
				this.joint[i].setCoordinates(skeleton.joints[i].x, skeleton.joints[i].y, skeleton.joints[i].z);
			}
		}
	}
	
	var previousSkeleton = new SkeletonObject();
	
	
	var interactionRanges = new Array(
		{start:0, end:9.5}, 
		{start:22.0, end:24.3},
		{start:53.4, end:69},
		{start:102, end:127},
		{start:150, end:173},
		{start:191.3, end:198.6}
	);
	
	bodyIsVisible = false;
	
	
	
	function BodyDotObject(divElement){
		this.divElement = divElement;
		this.colorName = "white";
	}
	
	
	var leftHandBodyDot;
	var rightHandBodyDot;
	var headBodyDot;
	
	
	
	var firstPersonRanges = new Array(
		{start:0, end:12}, 
		{start:22.0, end:24.3},
		{start:28, end:37},
		{start:53.4, end:69},
		{start:72, end:82},
		{start:89.5, end:127},
		{start:144.5, end:173},
		{start:191.3, end:198.6}
	);
	
	var inFirstPersonRange = false;
	
	var transitionStep = 20;
	var transitionStepMax = 20;
	var transitionStart_x = -140;
	var transitionStart_y = -60;
	var inTransition = false;
	var currentTransitionIndex = -1;
	
	
	
	var tp = { //time points
		titleLoopStart: 0,
		titleLoopEnd: 8.2,
		titleOpenDoor: 9.5,
		titleOpenDoorEnd: 12,
		//drawSalt: 23.6,
		goodJob: 24.3,
		badJob: 25.5,
		findBones: 29.8,
		openDoorStart: 53.4,
		openDoorEnd: 69, //ghost breaks in
		takeHandStart_angry: 102,
		takeHandEnd_angry: 109, //ghost begins throwing objects
		dodgeScene: 110,
		dodge1_start: 113,
		dodge1_end: 115,
		dodge2_start: 119,
		dodge2_end:121,
		dodgeEnding: 138.3, //restart
		doorOpening: 140.5,
		takeHandStart_happy: 150, 
		takeHandEnd_happy: 155, //hold scene for a second or two
		handTaken: 155.4,
		peekabooScene: 160.9,
		peekabooStart: 162,
		peekabooEnd: 172, //failed peek-a-boo, ghost attacks
		peekabooSwitch: 172.9,
		knockedOver: 175.2, //fades to black
		knockedOverEnding: 186.7, //restart
		peekabooRestart: 191.3,
		peekabooRestartSwitch: 198.6,
		peekabooSuccessStart: 201.65,
		peekabooSuccessEnd: 203.5,
		peekabooFullSuccess: 204,
		peekabooEnding: 221.5, //restart
	}
	
	
	
	
	//var drawnSalt = false;
	//var hasStartedDrawSalt = false;
	//var hasFinishedDrawSalt = false;
	var openedGhostDoor = false;
	var tookHandSuccess = false;
	var peekabooSuccessCount = 0;
	var dodge1_success = false;
	var dodge1_failure = false;
	var dodge2_success = false;
	
	
	function updateVideoTime(event){
		videoTime = mainVideo.currentTime;
		
		if(videoTime > tp.titleLoopEnd && !openedTitleDoor){
			mainVideo.currentTime = tp.titleLoopStart;
		}
		
		
		if(videoTime > tp.titleOpenDoorEnd && videoTime < tp.titleOpenDoorEnd+1){
			mainVideo.currentTime = tp.openDoorStart;
		}
		
		if(videoTime > tp.takeHandEnd_happy && videoTime < tp.takeHandEnd_happy+1 && !tookHandSuccess){
			mainVideo.currentTime = tp.dodgeScene;
		}
		
		if(videoTime > tp.peekabooEnding && videoTime < tp.peekabooEnding+1){ //reset after successful peek-a-boo ending
			mainVideo.pause();
			setFadeBlack("out");
		}
		
		if(videoTime > tp.dodgeEnding && videoTime < tp.dodgeEnding+1){ //reset after successful dodge ending
			mainVideo.pause();
			setFadeBlack("out");
		}
		
		if(videoTime > tp.knockedOverEnding && videoTime < tp.knockedOverEnding+1){ //reset after unsuccessful peek-a-boo ending
			mainVideo.pause();
			setFadeBlack("out");
		}
		
		if(videoTime > tp.peekabooRestartSwitch && videoTime < tp.peekabooRestartSwitch+1){ //reset after unsuccessful peek-a-boo ending
			mainVideo.currentTime = tp.peekabooSwitch;
		}
		
		
		
		var withinInteractionRange = false;
		
		for(index in interactionRanges){
			if(videoTime > interactionRanges[index].start && videoTime < interactionRanges[index].end){
				withinInteractionRange = true;
				
				if(!bodyIsVisible){
					setBodyOpacity(0.8);
					bodyIsVisible = true;
				}
				
				break;
			}
		}
		
		if(!withinInteractionRange && bodyIsVisible){
			setBodyOpacity(0);
			bodyIsVisible = false;
		}
		
		
		
		var foundToBeInRange = false;
		
		for(index in interactionRanges){
			if(videoTime > interactionRanges[index].start && videoTime < interactionRanges[index].end){
				foundToBeInRange = true;
				break;
			}
		}
		
		if(foundToBeInRange){
			if(!inFirstPersonRange){
				inFirstPersonRange = true;				
				headTrackDiv.style.webkitTransform = "scale(1)";
				sceneContainer.style.backgroundColor = "#000000";
				animationRatio = 0;
				clearInterval(animationInterval);
				animationInterval = null;
				animationInterval = setInterval(function(){animationRatio+=0.05; if(animationRatio >=1){clearInterval(animationInterval); animationRatio = 1;}}, 50);
			}
		}
		else{
			if(inFirstPersonRange){
				inFirstPersonRange = false;	
				headTrackDiv.style.webkitTransform = "scale(0.85)";
				sceneContainer.style.backgroundColor = "#444444";
				animationRatio = 1;
				clearInterval(animationInterval);
				animationInterval = null;
				animationInterval = setInterval(function(){animationRatio-=0.05; if(animationRatio <=0.0){clearInterval(animationInterval); animationRatio=0.0}}, 50);
			}
		}
		
	}
	
	
	
	function initializeKinectListener()
	{ 
		sceneContainer = document.getElementById("sceneContainer");
		
		mainVideo = document.getElementById("mainVideo");
		leftHandDiv = document.getElementById("leftHandDiv");
		rightHandDiv = document.getElementById("rightHandDiv");
		headDiv = document.getElementById("headDiv");

		lostTrackingMaskDiv = document.getElementById("lostTrackingMaskDiv");
		lostTrackingAlertDiv = document.getElementById("lostTrackingAlertDiv");
		peekabooDiv = document.getElementById("peekabooDiv");
		failureDiv = document.getElementById("failureDiv");
		playButton = document.getElementById("playButton");
		fadeBlackDiv = document.getElementById("fadeBlackDiv");
		redHitDiv = document.getElementById("redHitDiv");
		thudSound = document.getElementById("thudSound");
		backgroundDiv = document.getElementById("backgroundDiv");
		headTrackDiv = document.getElementById("headTrackDiv");
		
		leftHandBodyDot = new BodyDotObject(leftHandDiv);
		rightHandBodyDot = new BodyDotObject(rightHandDiv);
		headBodyDot = new BodyDotObject(headDiv);
		
		resizeVideo();
		
		window.addEventListener("resize", function(){resizeVideo();}, false);
		
		mainVideo.addEventListener("timeupdate", updateVideoTime, false);
		
		setFadeBlack("in");
		
		mainVideo.currentTime = startPoint;
	}
	
	
	
	function resizeVideo(){
		windowWidth = window.innerWidth;
		windowHeight = window.innerHeight;
		
		videoHeight = windowHeight;
		videoWidth = Math.floor(videoHeight/0.5625);
		
		sceneHeight = videoHeight;
		sceneWidth = Math.floor(videoWidth*0.80);
		sceneLeft = Math.floor((windowWidth - sceneWidth)/2);
		videoLeft = Math.floor((videoWidth - sceneWidth)/2)*-1;
		
		
		videoLeftMin = videoLeft - Math.floor((videoWidth-sceneWidth)/2);
		videoLeftMax = videoLeft + Math.floor((videoWidth-sceneWidth)/2);
		videoLeftRange = videoLeftMax - videoLeftMin;
		
		sceneContainer.style.height = sceneHeight + "px";
		sceneContainer.style.width = sceneWidth + "px";
		sceneContainer.style.left = sceneLeft + "px";
		
		mainVideo.setAttribute("height", videoHeight);
		mainVideo.setAttribute("width", videoWidth);
		mainVideo.style.height = videoHeight + "px";
		mainVideo.style.width = videoWidth + "px";
		mainVideo.style.left = "0px";
		
		headTrackDiv.style.height = videoHeight + "px";
		headTrackDiv.style.width = videoWidth + "px";
		headTrackDiv.style.left = videoLeft + "px";
	}
	
	
	function setFadeBlack(direction){
		if(direction == "out"){
			fadeBlackDiv.style.visibility = "inherit";
			fadeBlackDiv.style.opacity = 1;
			setTimeout(function(){resetExperience();}, 2000);
		}
		else if(direction == "in"){
			fadeBlackDiv.style.opacity = 0;	
			setTimeout(function(){fadeBlackDiv.style.visibility = "hidden";}, 2000);
		}
	}
	
	
	function resetExperience(){
		zRatio_extendedToOpenDoor_left = 0;
		zRatio_extendedToOpenDoor_right = 0;
		
		headPreDodgeX = 0;
		headPreDodgeY = 0;
		
		//leftCircleListener =  new  CircleListener("Left Hand");
		//rightCircleListener =  new  CircleListener("Right Hand");
		
		
		peekabooObj = {
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
		
		introDoorHitBox.state = "out";
		ghostDoorHitBox.state = "out";
		
		openedTitleDoor = false;
		//drawnSalt = false;
		//hasStartedDrawSalt = false;
		//hasFinishedDrawSalt = false;
		openedGhostDoor = false;
		tookHandSuccess = false;
		peekabooSuccessCount = 0;
		dodge1_success = false;
		dodge1_failure = false;
		dodge2_success = false;
	
		
		mainVideo.currentTime = startPoint;
		setFadeBlack("in");
		
		
		//userIsVisibleToKinect = false;
		videoPlaying = true;
		experienceHasBegun = true;
		
		mainVideo.play();
	}
	
	
	
	
	
	function handleDoorOpening(bodyDotObj, doorHitBox, xRatio, yRatio, zWaistRatioOffset){
		
		//entered hitbox
		if(doorHitBox.state == "out" && xRatio > doorHitBox.xRatioMin && xRatio < doorHitBox.xRatioMax && yRatio > doorHitBox.yRatioMin && yRatio < doorHitBox.yRatioMax && zWaistRatioOffset > doorHitBox.zWaistRatioOffsetMin && zWaistRatioOffset < doorHitBox.zWaistRatioOffsetMax){
			//if(bodyDotObj.colorName == "white"){
				bodyDotObj.colorName = "magenta";
				bodyDotObj.divElement.style.backgroundImage = "url('images/bodyDot_magenta.png')";
				doorHitBox.state = "in";
				return false;
			//}
		}
		
		//completed hitbox
		else if(doorHitBox.state == "in" && zWaistRatioOffset < doorHitBox.zWaistRatioOffsetMax){
			doorHitBox.state = "complete";
			return true;
		}
		
		/*
		//left hitbox
		else if(doorHitBox.state == "in" && (xRatio < doorHitBox.xRatioMin || xRatio > doorHitBox.xRatioMax || yRatio < doorHitBox.yRatioMin || yRatio > doorHitBox.yRatioMax && zWaistRatioOffset > doorHitBox.zWaistRatioOffsetMin && zWaistRatioOffset < doorHitBox.zWaistRatioOffsetMax)){
			//if(bodyDotObj.colorName == "magenta"){
				bodyDotObj.colorName = "white";
				bodyDotObj.divElement.style.backgroundImage = "url('images/bodyDot_white.png')";
				doorHitBox.state = "out";
			//}
		}
		*/
		return false;
	}
	
	
	
	
	function setBodyOpacity(opacity){
		leftHandDiv.style.opacity = opacity;
		rightHandDiv.style.opacity = opacity;
		headDiv.style.opacity = opacity;
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
						//node = joinDivArray[j];
						
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
						
						
						
						
						if(j==3){ //head tracking for camera movement
							bgx = ((xRatio*animationRatio+1)/2)*videoLeftRange + videoLeftMin;
							videoLeftShift = Math.min(Math.max(bgx, videoLeftMin), videoLeftMax);
							headTrackDiv.style.left = videoLeftShift + "px";
						}



						
						
						//Hand Bubbles
						if(j==7){ //left hand bubble
							//output(zRatio - zRatioWaist);
							var handX = xRatio*600 + 400;
							var handY = yRatio*-600 + 400;
						
							leftHandDiv.style.left = handX + "px";
							leftHandDiv.style.top = handY + "px";
						}
						
						if(j==11){ //right hand bubble
							var handX = xRatio*600 + 400;
							var handY = yRatio*-600 + 400;
						
							rightHandDiv.style.left = handX + "px";
							rightHandDiv.style.top = handY + "px";
						}
						
						if(j==3){ //head bubble
							var headX = xRatio*600 + 400;
							var headY = yRatio*-600 + 400;
						
							headDiv.style.left = headX + "px";
							headDiv.style.top = headY + "px";
						}
						
						

						
						
						

						if(j==7){ //OPEN DOOR - left hand				
							
							//Intro Door - left hand
							if(videoTime > tp.titleLoopStart && videoTime < tp.titleLoopEnd){
								if(handleDoorOpening(leftHandBodyDot, introDoorHitBox, xRatio, yRatio, (zRatio-zRatioWaist))){
									openedTitleDoor = true;
									mainVideo.currentTime = tp.titleOpenDoor;
									setTimeout(function(){resetBodyDotColor();}, 1500);
								}
							}
							
							//Ghost Door - left hand
							if(videoTime > tp.openDoorStart && videoTime < tp.openDoorEnd){
								if(handleDoorOpening(leftHandBodyDot, ghostDoorHitBox, xRatio, yRatio, (zRatio-zRatioWaist))){
									openedGhostDoor = true;
									mainVideo.currentTime = tp.doorOpening;
									setTimeout(function(){resetBodyDotColor();}, 1500);	
								}
							}
								
						}

						if(j==11){ //OPEN DOOR - right hand
							//Intro Door - right hand
							if(videoTime > tp.titleLoopStart && videoTime < tp.titleLoopEnd){
								if(handleDoorOpening(rightHandBodyDot, introDoorHitBox, xRatio, yRatio, (zRatio-zRatioWaist))){
									openedTitleDoor = true;
									mainVideo.currentTime = tp.titleOpenDoor;
									setTimeout(function(){resetBodyDotColor();}, 1500);
								}
							}
							
							//Ghost Door - right hand
							if(videoTime > tp.openDoorStart && videoTime < tp.openDoorEnd){
								if(handleDoorOpening(rightHandBodyDot, ghostDoorHitBox, xRatio, yRatio, (zRatio-zRatioWaist))){
									openedGhostDoor = true;
									mainVideo.currentTime = tp.doorOpening;
									setTimeout(function(){resetBodyDotColor();}, 1500);	
								}
							}
						}
						
						
						
						
						
						if(j==7){ //TAKE HAND - left hand					
							var handXLeft = Math.floor(xRatio*600) + 400;
							var handYLeft = Math.floor(yRatio*-600) + 400;
							//var handZLeft = Math.floor(zRatio*-250) + 600;
							
							if((videoTime > tp.takeHandStart_angry && videoTime < tp.takeHandEnd_angry) || (videoTime > tp.takeHandStart_happy && videoTime < tp.takeHandEnd_happy)){ //take hand happy and take hand angry ranges
								if(handXLeft > takeHandHitbox.xMin && handXLeft < takeHandHitbox.xMax && handYLeft > takeHandHitbox.yMin && handYLeft < takeHandHitbox.yMax && zRatio < (zRatioWaist - zOpenDoorDistance) && !tookHandSuccess){
									tookHandSuccess = true;
									setTimeout(function(){
										mainVideo.currentTime = tp.handTaken;				
									}, 1000);
								}
							}
						}
						
						if(j==11){ //TAKE HAND - right hand					
							var handXRight = Math.floor(xRatio*600) + 400;
							var handYRight = Math.floor(yRatio*-600) + 400;
							//var handZRight = Math.floor(zRatio*-250) + 600;
							
							if((videoTime > tp.takeHandStart_angry && videoTime < tp.takeHandEnd_angry) || (videoTime > tp.takeHandStart_happy && videoTime < tp.takeHandEnd_happy)){ //take hand happy and take hand angry ranges
								if(handXRight > takeHandHitbox.xMin && handXRight < takeHandHitbox.xMax && handYRight > takeHandHitbox.yMin && handYRight < takeHandHitbox.yMax && zRatio < (zRatioWaist - zOpenDoorDistance) && !tookHandSuccess){
									tookHandSuccess = true;
									setTimeout(function(){
										mainVideo.currentTime = tp.handTaken;				
									}, 1000);
								}
							}
						}
						
						
						
						//DODGING
						if(j == 3){ //DODGE - head
							
							//output("time: " + mainVideo.currentTime + "<br/><br/>pre X: " + headPreDodgeX + "<br/>Pre Y: " + headPreDodgeY + "<br/><br/>now X: " + xRatio + "<br/>now Y: " + yRatio);

							
							//dodge 1
							if(mainVideo.currentTime > tp.dodge1_start+1 && mainVideo.currentTime < tp.dodge1_end){ //establish initial head position for before dodge 1
								if(headPreDodgeX == 0){
									headPreDodgeX = xRatio;	
									headPreDodgeY = yRatio;	
								}
							}
							
							if(mainVideo.currentTime > tp.dodge1_end && mainVideo.currentTime < tp.dodge1_end + 1){ //compare current head position with where head was before object 1 was thrown
								headDistance = (Math.sqrt(Math.pow(xRatio-headPreDodgeX,2) + Math.pow(yRatio-headPreDodgeY,2)));
								
								if(headDistance > dodgeDistanceMin){ //successfully dodged object 1
									headPreDodgeX = 0;
									headPreDodgeY = 0;
									dodge1_success = true;
									//no need to change video playback position, scene naturally flows into next interaction
								}
								else if(!dodge1_failure){ //failed to dodge
									thudSound.play();
									setTimeout(function(){redHitDiv.style.visibility = "inherit";}, 0);
									setTimeout(function(){redHitDiv.style.visibility = "hidden";}, 400);
									dodge1_failure = true;
								}
							}
							
							
							//dodge 2
							if(mainVideo.currentTime > tp.dodge2_start+1 && mainVideo.currentTime < tp.dodge2_end){ //establish initial head position for before dodge 1
								if(headPreDodgeX == 0){
									headPreDodgeX = xRatio;	
									headPreDodgeY = yRatio;	
								}
							}
							
							if(mainVideo.currentTime > tp.dodge2_end && mainVideo.currentTime < tp.dodge2_end + 1){ //compare current head position with where head was before object 1 was thrown
								headDistance = (Math.sqrt(Math.pow(xRatio-headPreDodgeX,2) + Math.pow(yRatio-headPreDodgeY,2)));
								
								if(headDistance > dodgeDistanceMin){ //successfully dodged object 1
									dodge2_success = true;
								}
								
								if(!dodge2_success){ //failed to dodge
									thudSound.play();
									setTimeout(function(){redHitDiv.style.visibility = "inherit";}, 0);
									setTimeout(function(){redHitDiv.style.visibility = "hidden";}, 400);
									mainVideo.currentTime = tp.knockedOver;
								}
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
							
							if((mainVideo.currentTime > tp.peekabooStart && mainVideo.currentTime < tp.peekabooEnd) || (mainVideo.currentTime > tp.peekabooRestart && mainVideo.currentTime < tp.peekabooRestartSwitch)){
								if(peekabooObj.leftHandDistance < peekabooObj.maxDistance && peekabooObj.rightHandDistance < peekabooObj.maxDistance){
									
									if(peekabooObj.peekabooState == "not started"){
										peekabooObj.timer = setTimeout(function(){peekabooObj.peekabooState = "timer complete";}, peekabooObj.holdTime);
										peekabooObj.peekabooState = "holding";
									}
								}
								else{
									if(peekabooObj.peekabooState == "timer complete"){
										peekabooObj.peekabooState = "not started";
										peekabooSuccessCount++;
										
										if(peekabooSuccessCount == 1){
											mainVideo.currentTime = tp.peekabooSuccessStart;
											setTimeout(function(){mainVideo.currentTime = tp.peekabooRestart;}, 600);
										}
										else if(peekabooSuccessCount == 2){
											mainVideo.currentTime = tp.peekabooFullSuccess;
										}
										
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
	
	var background_range_x = 280;
	var background_range_y = 120;
	var background_offset_x = -140;
	var background_offset_y = -60;
	
	
	function constrain(value, minVal, maxVal){
		return Math.min(Math.max(value, minVal), maxVal);
	}
	
	
	function setUserVisibility(value){
		
		userIsVisibleToKinect = value;
		
		if(userIsVisibleToKinect){
			lostTrackingAlertDiv.style.opacity = "0";
			lostTrackingMaskDiv.style.opacity = "0";
			setTimeout(function(){
				lostTrackingMaskDiv.style.visibility = "hidden";
				lostTrackingAlertDiv.style.visibility = "hidden";				
			}, 2000);
			
			if(!experienceHasBegun){
				beginExperienceTimer = setTimeout(function(){experienceHasBegun = true; mainVideo.play();}, 3000);
			}
		}
		else{
			lostTrackingMaskDiv.style.visibility = "inherit";
			lostTrackingMaskDiv.style.opacity = "1";
			setTimeout(function(){
				lostTrackingAlertDiv.style.visibility = "inherit";
				lostTrackingAlertDiv.style.opacity = "1";
			}, 1000);
			
			if(!experienceHasBegun){
				clearTimeout(beginExperienceTimer);
			}
		}
	}
	
	
	function output(txt){
		document.getElementById("outputDiv").innerHTML = txt;	
	}
	
	
	function resetBodyDotColor(){
		leftHandDiv.style.backgroundImage = "url('images/bodyDot_white.png')"
		rightHandDiv.style.backgroundImage = "url('images/bodyDot_white.png')"
		headDiv.style.backgroundImage = "url('images/bodyDot_white.png')"
		
		leftHandColor = "white";	
		rightHandColor = "white";
		headColor = "white";
	}
	
	
	
	initializeKinectListener(); //initializes self
}

