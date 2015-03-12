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

    var obj1 = { x: 5, y: 5, w: 0, h: 0, string: 'test', id: 4233 };
    var obj2 = { x: 5, y: 5, w: 0, h: 0, string: 'test', id: 4234 };
    
    qt.put(obj1);
    qt.put(obj2);
    
    assert(qt.remove(obj1, 'id') == 1); // only obj1 removed
    assert(qt.remove(obj1) == 1); // obj2 removed

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

    // make some updates
    for( var pi = 0; pi < pts.length; pi++ ) {
        var newc = {};

        if( Math.random() < 0.2 )
            newc.x = pts[pi].x + (Math.random() - 0.5) * 60;
        if( Math.random() < 0.2 )
            newc.y = pts[pi].y + (Math.random() - 0.5) * 60;
        if( Math.random() < 0.2 )
            newc.w = pts[pi].w * 2 * Math.random();
        if( Math.random() < 0.2 )
            newc.h = pts[pi].h * 2 * Math.random();
        for( var c in newc ) {
            assert(qt.update(pts[pi], 'i', newc));
            for( var c2 in newc ) 
                assert(pts[pi][c2] == newc[c2]);
            break;
        }
    }
    
    var removed3 = {};
    for( var pi = 0; pi < pts.length; pi++ ) {
        if( Math.random() < 0.1 ) {
            if( Math.random() < 0.5 ) {
                assert(qt.remove(pts[pi]) == 1); // remove without attr 
                assert(qt.remove(pts[pi], 'i') == 0); // remove with attr
            } else {
                assert(qt.remove(pts[pi], 'i') == 1); // remove with attr
                assert(qt.remove(pts[pi]) == 0); // remove without attr 
            }
            removed3[pts[pi].i + ''] = true;
        }
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

    // get all objects
    for( var pi = 0; pi < pts.length; pi++ ) {
        var area = {
            x: pts[pi].x - 0.5,
            y: pts[pi].y - 0.5,
            w: 1, h: 1
        };
        var res = [];
        qt.get(area, res);

        for( var ri = 0; ri < res.length; ri++ ) {
            if( res[ri].i == pts[pi].i )
                break;
        }

        assert((removed3[pts[pi].i+''] && ri == res.length) ||
               (!removed3[pts[pi].i+''] && ri < res.length));
    }
    
    var areas = [];
    for( var ai = 0; ai < 100; ai++ ) {
        //process.stderr.write('testing area ' + ai + '\n');
        var area = {
            x: ( Math.random() - 0.5 ) * 100,
            y: ( Math.random() - 0.5 ) * 100,
            w: Math.pow(Math.random(), 3) * 100,
            h: Math.pow(Math.random(), 3) * 100
        };
        
        var buf = Math.max(0, Math.random() - 0.25);
        var result1 = {};
        qt.get(area, function(obj) {
            assert(!result1[obj.i + ''], 'duplicate get return');
            assert(!removed3[obj.i + ''], 'deleted object returned');
            result1[obj.i + ''] = true;
            return true;
        });
        var result2 = {};
        qt.get(area, 0, function(obj) {
            assert(!result2[obj.i + ''], 'duplicate get return');
            assert(!removed3[obj.i + ''], 'deleted object returned');
            result2[obj.i + ''] = true;
            return true;
        });
        
        assert.deepEqual(result1, result2, 'passing buffer fails');
        
        var result3 = {};
        qt.get(area, buf, function(obj) {
            assert(!result3[obj.i + ''], 'duplicate get return');
            assert(!removed3[obj.i + ''], 'deleted object returned');
            result3[obj.i + ''] = true;
            return true;
        });
        for( var pi = 0; pi < pts.length; pi++ ) {
            var pt = pts[pi];
            if( removed3[pt.i+''] )
                continue;
            if( overlap_rect(area, pt, buf) ) {
                assert(result3[pt.i+''], 
                       'invalid result: ' + 
                       JSON.stringify(area) + ' ' + JSON.stringify(pt) + ' ' + 
                       buf + ' ' + qti + ' ' + result3[pt.i+'']);
                delete result3[pt.i+'']; 
            }
        }
    }
}
process.stdout.write('tests ok\n');
