
function KinectListener(skeletonBoxId){
	
	var jointIndexByName= {pelvis:0, waist:1, neck:2, head:3, left_shoulder:4, left_elbow:5, left_wrist:6, left_hand:7, right_shoulder:8, right_elbow:9, right_wrist:10, right_hand:11, left_hip:12, left_knee:13, left_ankle:14, left_foot:15, right_hip:16, right_knee:17, right_ankle:18, right_foot:19};
	
	var skeletonBoxDiv;
		
	var skeletons = [];
	var skeletonGroups = {};
	var skeletonTrackingIDs = [];
	
	var joinDivArray = new Array(20); //html div elements for each joint
	var userIsVisibleToKinect = false; //true when user is standing infront of the kinect, false otherwise
	
	var zHitLeft = 0;
	var zHitRight = 0;
	
	var hitboxDim = {
		xMin: 250,
		xMax: 325,
		yMin: 250,
		yMax: 325,
		zMin: 100,
		zMax: 150
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
						

						if(j==7){ //left hand						
							var handXLeft = Math.floor(xRatio*250) + 250;
							var handYLeft = Math.floor(yRatio*-250) + 250;
							var handZLeft = Math.floor(zRatio*-250) + 600;
							
							if(zHitLeft == 0){
								if(handZLeft >= waistZ + 75){
									output("HIT<br/>X: " + handXLeft + "<br/>Y: " + handYLeft + "<br/>Z: " + (handZLeft - waistZ));
									zHitLeft = handZLeft;
									output("Z at" + zHitLeft + "when hit");
								}
								else{
									output("No hit<br/>X: " + handXLeft + "<br/>Y: " + handYLeft + "<br/>Z: " + (handZLeft - waistZ));
								}
							}
							else{
								if(handZLeft < zHitLeft - 30){
									output("THE DOOR IS OPEN!!!!!!!");
								}
							}
								
						}
						
						if(j==11){ //right hand
							var handXRight = Math.floor(xRatio*250) + 250;
							var handYRight = Math.floor(yRatio*-250) + 250;
							var handZRight = Math.floor(zRatio*-250) + 600;
							
							if(zHitRight == 0){
								if(handZRight >= waistZ + 75){
									outputRight("HIT<br/>X: " + handXRight + "<br/>Y: " + handYRight + "<br/>Z: " + (handZRight - waistZ));
									zHitRight = handZRight;
									outputRight("Z at" + zHitRight + "when hit");
								}
								else{
									outputRight("No hit<br/>X: " + handXRight + "<br/>Y: " + handYRight + "<br/>Z: " + (handZRight - waistZ));
								}
							}
							else{
								if(handZRight < zHitRight - 30){
									outputRight("THE DOOR IS OPEN!!!!!!!");
								}
							}
						}
								
						if(j==3){ //head
					
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

