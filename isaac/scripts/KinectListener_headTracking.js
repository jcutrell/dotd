
function KinectListener(skeletonBoxId){
	
	var jointIndexByName= {pelvis:0, waist:1, neck:2, head:3, left_shoulder:4, left_elbow:5, left_wrist:6, left_hand:7, right_shoulder:8, right_elbow:9, right_wrist:10, right_hand:11, left_hip:12, left_knee:13, left_ankle:14, left_foot:15, right_hip:16, right_knee:17, right_ankle:18, right_foot:19};
	
	var skeletonBoxDiv;
		
	var skeletons = [];
	var skeletonGroups = {};
	var skeletonTrackingIDs = [];
	
	var joinDivArray = new Array(20); //html div elements for each joint
	var userIsVisibleToKinect = false; //true when user is standing infront of the kinect, false otherwise
	var showSkeletonBox = false;
	
	var leftCircleListener;
	var rightCircleListener;

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
		
		leftCircleListener =  new  CircleListener("Left Hand");
		rightCircleListener =  new  CircleListener("Right Hand");
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
						
						node.style.webkitTransform = "translate3d(" + xPixel + "px, " + yPixel + "px, " + zPixel + "px)"; //move joint dots around to reflect kinect data


						if(j==7){ //left hand						
							if		(leftRight_diff > leftCircleListener.circleSpeed){leftCircleListener.beginTimeout("right", xRatio, yRatio, zRatio);}
							else if	(leftRight_diff < -leftCircleListener.circleSpeed){leftCircleListener.beginTimeout("left", xRatio, yRatio, zRatio);}
							
							if		(upDown_diff > leftCircleListener.circleSpeed){leftCircleListener.beginTimeout("up", xRatio, yRatio, zRatio);}
							else if	(upDown_diff < -leftCircleListener.circleSpeed){leftCircleListener.beginTimeout("down", xRatio, yRatio, zRatio);}
							
							if		(fowardbackwards_diff > leftCircleListener.circleSpeed){leftCircleListener.beginTimeout("forwards", xRatio, yRatio, zRatio);}
							else if	(fowardbackwards_diff < -leftCircleListener.circleSpeed){leftCircleListener.beginTimeout("backwards", xRatio, yRatio, zRatio);}
						}
						
						if(j==11){ //right hand
							if		(leftRight_diff > rightCircleListener.circleSpeed){rightCircleListener.beginTimeout("right", xRatio, yRatio, zRatio);}
							else if	(leftRight_diff < -rightCircleListener.circleSpeed){rightCircleListener.beginTimeout("left", xRatio, yRatio, zRatio);}
							
							if		(upDown_diff > rightCircleListener.circleSpeed){rightCircleListener.beginTimeout("up", xRatio, yRatio, zRatio);}
							else if	(upDown_diff < -rightCircleListener.circleSpeed){rightCircleListener.beginTimeout("down", xRatio, yRatio, zRatio);}
							
							if		(fowardbackwards_diff > rightCircleListener.circleSpeed){rightCircleListener.beginTimeout("forwards", xRatio, yRatio, zRatio);}
							else if	(fowardbackwards_diff < -rightCircleListener.circleSpeed){rightCircleListener.beginTimeout("backwards", xRatio, yRatio, zRatio);}
						}
								
						if(j==3){ //head
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
	}
	
	
	initializeKinectListener(); //initializes self
}

