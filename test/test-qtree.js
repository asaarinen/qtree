var QuadTree = require('../qtree.js');
var assert = require('assert');

var qts = [
    QuadTree(-100, -100, 200, 200),
    QuadTree(),
    QuadTree('adslfjsad'),
    QuadTree(undefined),
    QuadTree(null, null, 10, 10),
    QuadTree(-10, -10, 100, 0),
    QuadTree(0, 0, 100, 100, { maxchildren: 10 }),
    QuadTree(0, 0, 100, 100, { maxchildren: 0 }),
    QuadTree(0, 0, 100, 100, { maxchildren: 100 })
];

for( var qti = 0; qti < qts.length; qti++ ) {
    process.stderr.write('testing qtree ' + (qti+1) + '\n');
    var qt = qts[qti];
    assert(qt != null, 'constructor failed');

    var pts = [];
    for( var pi = 0; pi < 10000; pi++ ) {
	var pt = {
	    x: ( Math.random() - 0.5 ) * 100,
	    y: ( Math.random() - 0.25 ) * 100,
	    w: Math.pow(Math.random(), 3) * 100,
	    h: Math.pow(Math.random(), 3) * 100,
	    i: pi
	}
	pts.push(pt);
	qt.put(pt);
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
    
    var areas = [];
    for( var ai = 0; ai < 100; ai++ ) {
	//process.stderr.write('testing area ' + ai + '\n');
	var area = {
	    x: ( Math.random() - 0.5 ) * 100,
	    y: ( Math.random() - 0.25 ) * 100,
	    w: Math.pow(Math.random(), 3) * 100,
	    h: Math.pow(Math.random(), 3) * 100
	};
	var buf = Math.max(0, Math.random() - 0.25);
	var result1 = {};
	qt.get(area, function(obj) {
	    assert(!result1[obj.i + ''], 'duplicate get return');
	    result1[obj.i + ''] = true;
	    return true;
	});
	var result2 = {};
	qt.get(area, 0, function(obj) {
	    assert(!result2[obj.i + ''], 'duplicate get return');
	    result2[obj.i + ''] = true;
	    return true;
	});

	assert.deepEqual(result1, result2, 'passing buffer fails');

	var result3 = {};
	qt.get(area, buf, function(obj) {
	    assert(!result3[obj.i + ''], 'duplicate get return');
	    result3[obj.i + ''] = true;
	    return true;
	});
	for( var pi = 0; pi < pts.length; pi++ ) {
	    var pt = pts[pi];
	    if( overlap_rect(area, pt, buf) )
		assert(result3[pt.i+''], 'invalid result: ' + 
		       JSON.stringify(area) + ' ' + JSON.stringify(pt) + ' ' + 
		       buf + ' ' + qti + ' ' + result3[pt.i+'']);
	}
    }
}
process.stdout.write('tests ok\n');
