
function distancePL(x, y, x1, y1, dx1, dy1, len1 ) {
    // x = x1 + s * dx1 + t * dy1
    // y = y1 + s * dy1 - t * dx1
    // x * dy1 - y * dx1 = x1 * dy1 - y1 * dx1 + t * ( dy1 * dy1 + dx1 * dx1 )
    var t = dx1 * dx1 + dy1 * dy1;
    if( t == 0 )
	return null;
    else {
	t = ( x * dy1 - y * dx1 - x1 * dy1 + y1 * dx1 ) / t;
	if( Math.abs(dx1) > Math.abs(dy1) )
	    var s = ( x - x1 - t * dy1 ) / dx1;
	else
	    var s = ( y - y1 + t * dx1 ) / dy1;
	if( ( s >= 0 && s <= len1 ) || len1 < 0 )
	    return {
		s: s,
		t: t,
		x: x1 + s * dx1,
		y: y1 + s * dy1,
		dist: Math.abs(t)
	    };
	else if( s < 0 ) {
	    var dist = distance(x, y, x1, y1);
	    return {
		s: s,//-1,
		dist: dist
	    };
	} else {
	    var dist = distance(x, y,
				x1 + len1*dx1, 
				y1 + len1*dy1);
	    return {
		s: s,//len1 + 1,
		dist: dist
	    };
	}
    }
}

function overlap_ray(o1, o2, buf) {
    if( !o1 || !o2 )
	return true;
    var dist = distancePL(o2.x + 0.5 * o2.w,
			  o2.y + 0.5 * o2.h,
			  o1.x, o1.y, o1.dx, o1.dy, o1.dist);
    if( dist ) {
	dist.dist -= buf;
	if( dist.dist < 0 )
	    return true;
	if( dist.dist * dist.dist <= o2.w * o2.w + o2.h * o2.h )
	    return true;
    }
    return false;
}

function overlap_rect(o1, o2, buf) {
    if( !o1 || !o2 )
	return true;
    if( o1.x + o1.w < o2.x - buf ||
	o1.y + o1.h < o2.y - buf ||
	o1.x - buf > o2.x + o2.w ||
	o1.y - buf > o2.y + o2.h )
	return false;
    return true;
}

function QuadTree(x, y, w, h, options) {

    if( typeof x != 'number' || isNaN(x) )
	x = 0;
    if( typeof y != 'number' || isNaN(y) )
	y = 0;
    if( typeof w != 'number' || isNaN(w) )
	w = 10;
    if( typeof h != 'number' || isNaN(h) )
	h = 10;
    
    var maxchildren = 25;
    if( options )
	if( typeof options.maxchildren == 'number' )
	    if( options.maxchildren > 0 )
		maxchildren = options.maxchildren;

    var children = [];
    var leafs = [];
    var nodes = [];

    function put_to_nodes(obj) {
	var leaf = false;
	if( obj.x < x ||
	    obj.y < y ||
	    obj.x + obj.w > x + w ||
	    obj.y + obj.h > y + h )
	    leaf = true;
	var found = false;
	for( var ni = 0; ni < nodes.length; ni++ )
	    if( overlap_rect(obj, nodes[ni], 0) ) {
		nodes[ni].put(obj);
		found = true;
	    }
	if( !found || leaf )
	    leafs.push(obj);
    }

    function put(obj) {
	if( obj.w * obj.h >= w * h ) {
	    leafs.push(obj);
	    return;
	}
	if( nodes.length == 0 ) {
	    children.push(obj);
	    
	    // subdivide
	    if( children.length > maxchildren ) {
		nodes.push(QuadTree(x, y, w/2, h/2),
			   QuadTree(x+w/2, y, w/2, h/2),
			   QuadTree(x, y+h/2, w/2, h/2),
			   QuadTree(x+w/2, y+h/2, w/2, h/2));
		for( var ci = 0; ci < children.length; ci++ ) 
		    put_to_nodes(children[ci]);
		children = [];
	    }
	} else 
	    put_to_nodes(obj);
    }

    function get_rect(obj, buf, callback) {
	for( var li = 0; li < leafs.length; li++ )
	    if( !callback(leafs[li]) )
		return false;
	for( var li = 0; li < children.length; li++ )
	    if( !callback(children[li]) )
		return false;
	for( var ni = 0; ni < nodes.length; ni++ ) {
	    if( overlap_rect(obj, nodes[ni], buf) ) {
		if( !nodes[ni].get_rect(obj, buf, callback) )
		    return false;
	    }
	}
	return true;
    }

    function get_ray(obj, buf, callback) {
	for( var li = 0; li < leafs.length; li++ )
	    if( !callback(leafs[li]) )
		return false;
	for( var li = 0; li < children.length; li++ )
	    if( !callback(children[li]) )
		return false;
	for( var ni = 0; ni < nodes.length; ni++ )
	    if( overlap_ray(obj, nodes[ni], buf) )
		if( !nodes[ni].get_ray(obj, buf, callback) )
		    return false;
	return true;
    }

    function get(obj, buf, callback) {
	if( typeof buf == 'function' && typeof callback == 'undefined' ) {
	    callback = buf;
	    buf = 0;
	}
	if( obj == null )
	    get_rect(obj, buf, callback);
	else if( typeof obj.x == 'number' &&
		 typeof obj.y == 'number' ) {
	    if( typeof obj.dx == 'number' &&
		typeof obj.dy == 'number' )
		get_ray(obj, buf, callback);
	    else if( typeof obj.w == 'number' &&
		     typeof obj.h == 'number' )
		get_rect(obj, buf, callback);
	}
    }

    return {
	x: x,
	y: y, 
	w: w,
	h: h,
	get: get,
	put: put,
	get_rect: get_rect,
	get_ray: get_ray
    };
}

if( typeof module != 'undefined' )
    module.exports = QuadTree;
