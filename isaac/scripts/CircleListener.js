function CircleListener(title){
	this.title = title;
	this.minPointDistance = 0.4;
	this.listenerTimeLimit = 2000;
	this.circleSpeed = 0.125;
	
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
		this.points[index].setCoordinates(x,y,z);
		this.detections[index] = true;
		clearTimeout(this.timeouts[index]);
		this.timeouts[index] = setTimeout(function(circleListener, clIndex){circleListener.handleTimeout(clIndex);}, 2000, this, index);
		
		if(this.allDetectionsAreTrue() && this.pointsAreDistant()){
			this.resetSelf();
			
			
			document.getElementById("circleDiv").style.opacity = 1;
			setTimeout(function(){
				document.getElementById("circleDiv").style.opacity = 0;
			},6000);
			
			
			output(this.title);
			setTimeout(function(){
				output("");
			},1000);
			
		}
	}
	
	this.handleTimeout = function(index){
		this.detections[index] = false;
		clearTimeout(this.timeouts[index]);
		this.timeouts[index] = null;
	}
	
	this.allDetectionsAreTrue = function(){
		return(this.detections.left && this.detections.right && ((this.detections.up && this.detections.down) || (this.detections.forwards && this.detections.backwards)));
	}
	
	this.pointsAreDistant = function(){
		distance1 = 0;
		distance2 = 0;
		distance3 = 0;
		distance4 = 0;
		distance5 = 0;
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
	
	
	