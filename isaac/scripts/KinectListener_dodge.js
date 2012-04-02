
function KinectListener(skeletonBoxId){
	
	var jointIndexByName= {pelvis:0, waist:1, neck:2, head:3, left_shoulder:4, left_elbow:5, left_wrist:6, left_hand:7, right_shoulder:8, right_elbow:9, right_wrist:10, right_hand:11, left_hip:12, left_knee:13, left_ankle:14, left_foot:15, right_hip:16, right_knee:17, right_ankle:18, right_foot:19};
	
	var skeletonBoxDiv;
		
	var skeletons = [];
	var skeletonGroups = {};
	var skeletonTrackingIDs = [];
	
	var joinDivArray = new Array(20); //html div elements for each joint
	var userIsVisibleToKinect = false; //true when user is standing infront of the kinect, false otherwise
	
	var dodgeSuccess = true;
	var zHitRight = 0;
	
	var hitboxDim = {
		xMin: 250,
		xMax: 325,
		yMin: 250,
		yMax: 325
	};


	function Point(x,y,z){ //simple (x,y,z) point object
		this.x = x;
		this.y = y;
		this.z = z;
		
		this.setCoordinates = function(x,y,z){
			this.x = x;
			this.y = y;
			this.z = z;
		}
	}


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

		//generate the joint divs
		for(var i=0; i<20; i++){
			newNode = document.createElement("div");
			newNode.id = "jointDiv_" + i;
			newNode.className = "bodyClass";
			joinDivArray[i] = newNode;
			skeletonBoxDiv.appendChild(newNode);		
		}
	}
	
	var dodgeTimer = null;
	var thrownObject = false;
	var headCoord = {
		headX: 0,
		headY: 0,
		headZ: 0
	};
	
	
	this.setObjectInbound = function()
	{
		hitboxDim = {
			xMin: headCoord.headX - 100,
			xMax: headCoord.headX + 100,
			yMin: headCoord.headY - 100,
			yMax: headCoord.headY + 100000
		};
		
		setTimeout(function(){checkForHit()}, 2000);
		thrownObject = true;
	}
	
	function checkForHit(){
		if(headCoord.headX >= hitboxDim.xMin && headCoord.headX <= hitboxDim.xMax && headCoord.headY >= hitboxDim.yMin && headCoord.headY <= hitboxDim.yMax){
			//output("DEAD.<br/>Hitbox X: " + hitboxDim.xMin " - " + hitboxDim.xMax + "<br/>Hitbox Y: " + hitboxDim.yMin + " - " + hitboxDim.yMax + "<br/>Your X: " + headX + "<br/>Your Y: " + headY);
			//dodgeSuccess = false;
			output("HIT");
		}
		else{
			//output("Still Alive.<br/>Hitbox X: " + hitboxDim.xMin " - " + hitboxDim.xMax + "<br/>Hitbox Y: " + hitboxDim.yMin + " - " + hitboxDim.yMax + "<br/>Your X: " + headX + "<br/>Your Y: " + headY);
			output("You dodged");
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
						
						zRatioWaist = skeleton.joints[1].z;
						var waistZ = Math.floor(zRatioWaist*-250) + 600;
						
						xRatio_prev =  previousSkeleton.joint[j].x;
						yRatio_prev =  previousSkeleton.joint[j].y;
						zRatio_prev =  previousSkeleton.joint[j].z;
					
						//x,y,z values in pixels
						xPixel = xRatio*100 + 100;
						yPixel = yRatio*-100 + 100;
						zPixel = zRatio*100 + 100;
						
						
						
						//origin is upper left
						
						node.style.webkitTransform = "translate3d(" + xPixel + "px, " + yPixel + "px, " + zPixel + "px)"; //move joint dots around to reflect kinect data
						

						if(j==3){ //head					
							var headX = Math.floor(xRatio*250) + 250;
							var headY = Math.floor(yRatio*-250) + 250;

							headCoord.headX = headX;
							headCoord.headY = headY;
						}
					}
				}

				previousSkeleton.updateJoints(skeleton);
			}
		}
	}
	
	
	
	function setUserVisibility(value){
		
		userIsVisibleToKinect = value;
		
		if(userIsVisibleToKinect){skeletonBoxDiv.style.visibility = "inherit";}
		else{skeletonBoxDiv.style.visibility = "hidden";}
	}
	
	
	initializeKinectListener(); //initializes self
}

