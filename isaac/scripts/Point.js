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