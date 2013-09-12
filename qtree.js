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
    var leafratio = 0.5;
    if( options ) {
	if( typeof options.maxchildren == 'number' )
	    if( options.maxchildren > 0 )
		maxchildren = options.maxchildren;
	if( typeof options.leafratio == 'number' )
	    if( options.leafratio >= 0 )
		leafratio = options.leafratio;
    }

    // validate an input object
    function validate(obj) {
	if( !obj )
	    return false;
	if( typeof obj.x != 'number' ||
	    typeof obj.y != 'number' ||
	    typeof obj.w != 'number' ||
	    typeof obj.h != 'number' )
	    return false;
	if( isNaN(obj.x) || isNaN(obj.y) ||
	    isNaN(obj.w) || isNaN(obj.h) )
	    return false;
	return true;
    }

    // test for deep equality for x,y,w,h
    function isequal(o1, o2) {
	if( o1.x == o2.x &&
	    o1.y == o2.y &&
	    o1.w == o2.w &&
	    o1.h == o2.h )
	    return true;
	return false;
    }

    // create a new quadtree node
    function createnode(x, y, w, h) {
	return {
	    x: x,
	    y: y,
	    w: w,
	    h: h,
	    children: [],
	    leafs: [],
	    nodes: []
	}
    }

    // root node used by this quadtree
    var root = createnode(x, y, w, h);

    // calculate distance between two points
    function distance(x1, y1, x2, y2) {
	return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
    }
    
    // calculate distance between a point and a line (segment)
    function distancePL(x, y, x1, y1, dx1, dy1, len1 ) {
	if( !len1 ) // in case length is not provided, assume a line 
	    len1 = -1;
	
	// x = x1 + s * dx1 + t * dy1
	// y = y1 + s * dy1 - t * dx1
	// x * dy1 - y * dx1 = x1 * dy1 - y1 * dx1 + 
        //                     t * ( dy1 * dy1 + dx1 * dx1 )
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
		    s: s,
		    dist: dist
		};
	    } else {
		var dist = distance(x, y,
				    x1 + len1*dx1, 
				    y1 + len1*dy1);
		return {
		    s: s,
		    dist: dist
		};
	    }
	}
    }
    
    // does a line and a rectangle overlap ?
    function overlap_line(o1, o2, buf) {
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

    // do two rectangles overlap ?
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

    function isleaf(node, obj) {

	var leaf = false;
	if( obj.w * obj.h > node.w * node.h * leafratio )
	    leaf = true;

	if( obj.x < node.x ||
	    obj.y < node.y ||
	    obj.x + obj.w > node.x + node.w ||
	    obj.y + obj.h > node.y + node.h )
	    leaf = true;

	var childnode = null;
	for( var ni = 0; ni < node.nodes.length; ni++ )
	    if( overlap_rect(obj, node.nodes[ni], 0) ) {
		if( childnode ) { // multiple hits
		    leaf = true;
		    break;
		} else
		    childnode = node.nodes[ni];
	    }
	
	return { leaf: leaf,
		 childnode: childnode };
    }

    // put an object to one of the child nodes of this node
    function put_to_nodes(node, obj) {
	var leaf = isleaf(node, obj);
	if( leaf )
	    node.leafs.push(obj);
	else if( leaf.childnode )
	    put(leaf.childnode, obj);
	else
	    return;
    }

    // remove an object from this node
    function remove(node, obj, attr) {
	if( !validate(obj) )
	    return 0;

	if( !attr )
	    attr = false;
	else if( typeof attr != 'string' )
	    attr = 'id';

	var count = 0;
	for( var ci = 0; ci < node.children.length; ci++ )
	    if( ( attr && node.children[ci][attr] == obj[attr] ) ||
		( !attr && isequal(node.children[ci], obj) ) ) {
		count++;
		node.children.splice(ci, 1);
		ci--;
	    }

	for( var ci = 0; ci < node.leafs.length; ci++ )
	    if( ( attr && node.leafs[ci][attr] == obj[attr] ) ||
		( !attr && isequal(node.leafs[ci], obj) ) ) {
		count++;
		node.leafs.splice(ci, 1);
		ci--;
	    }

	var leaf = isleaf(node, obj);
	if( !leaf.leaf && leaf.childnode )
	    return count + remove(leaf.childnode, obj, attr);
	return count;
    }

    // put an object to this node
    function put(node, obj, removeflag) {

	if( !validate(obj) )
	    return;

	if( node.nodes.length == 0 ) {
	    node.children.push(obj);
	    
	    // subdivide
	    if( node.children.length > maxchildren ) {
		var w2 = node.w / 2;
		var h2 = node.h / 2;
		node.nodes.push(createnode(node.x, node.y, w2, h2),
				createnode(node.x + w2, node.y, w2, h2),
				createnode(node.x, node.y + h2, w2, h2),
				createnode(node.x + w2, node.y + h2, w2, h2));
		for( var ci = 0; ci < node.children.length; ci++ ) 
		    put_to_nodes(node, node.children[ci]);
		node.children = [];
	    }
	} else 
	    put_to_nodes(node, obj);
    }

    // iterate through all objects in this node matching given overlap
    // function
    function getter(overlapfun, node, obj, buf, strict, callback) {
	for( var li = 0; li < node.leafs.length; li++ )
	    if( !strict || overlapfun(obj, node.leafs[li], buf) )
		if( !callback(node.leafs[li]) )
		    return false;
	for( var li = 0; li < node.children.length; li++ )
	    if( !strict || overlapfun(obj, node.children[li], buf) )
		if( !callback(node.children[li]) )
		    return false;
	for( var ni = 0; ni < node.nodes.length; ni++ ) {
	    if( overlapfun(obj, node.nodes[ni], buf) ) {
		if( !getter(overlapfun, node.nodes[ni], obj, buf, strict, callback) )
		    return false;
	    }
	}
	return true;
    }

    // iterate through all objects in this node matching the given rectangle
    function get_rect(node, obj, buf, callback) {
	return getter(overlap_rect, node, obj, buf, true, callback);
    }

    // iterate through all objects in this node matching the given
    // line (segment)
    function get_line(node, obj, buf, callback) {
	return getter(overlap_line, node, obj, buf, false, callback);
    }

    // iterate through all objects in this node matching given
    // geometry, either a rectangle or a line segment
    function get(node, obj, buf, callback) {

	if( typeof buf == 'function' && typeof callback == 'undefined' ) {
	    callback = buf;
	    buf = 0;
	}
	if( obj == null )
	    get_rect(node, obj, buf, callback);
	else if( typeof obj.x == 'number' &&
		 typeof obj.y == 'number' &&
	         !isNaN(obj.x) && !isNaN(obj.y) ) {
	    if( typeof obj.dx == 'number' &&
		typeof obj.dy == 'number' &&
	        !isNaN(obj.dx) && !isNaN(obj.dy) )
		get_line(node, obj, buf, callback);
	    else if( typeof obj.w == 'number' &&
		     typeof obj.h == 'number' &&
		     !isNaN(obj.w) && !isNaN(obj.h) )
		get_rect(node, obj, buf, callback);
	}
    }

    // return the object interface
    return {
	get: function(obj, buf, callback) {
	    get(root, obj, buf, callback);
	},
	put: function(obj) {
	    put(root, obj);
	},
	remove: function(obj, attr) {
	    return remove(root, obj, attr);
	}
    };
}

// for use within node.js
if( typeof module != 'undefined' )
    module.exports = QuadTree;
