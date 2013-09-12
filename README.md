simple-quadtree
=====

`simple-quadtree` is a minimal quadtree implementation that supports simple `put`, `get` and `remove` operations on objects having a `x, y` position and `w, h` dimension. 

Installation
---

```
npm install simple-quadtree
```

Should also work in all browsers as is. `simple-quadtree` has no dependencies.

Usage
---

Create a quadtree by giving it some bounds, e.g. x, y, width and height

```javascript
var QuadTree = require('simple-quadtree');
var qt = QuadTree(0, 0, 100, 100);
```

You can also give `QuadTree` some options; currently, the only option is the maximum number of children in a quadtree node until it is subdivided:

```javascript
var qt = QuadTree(0, 0, 100, 100, { maxchildren: 25 }); // defaults to 25
```

### Putting objects

Put objects into the quadtree by using `put`. The objects can be anything as long as they have `x, y, w, h` properties as numbers indicating the bounding area of that object:

```javascript
qt.put({x: 5, y: 5, w: 0, h: 0, string: 'test'});
```

### Getting objects

Iterate over the objects by giving an area and a callback. Please note that `get` guarantees that all objects in the given region are given to the callback, but other nearby objects may also be included:

```javascript
qt.get({x:0, y: 0, w: 10, h: 10}, function(obj) {
    // obj == {x: 5, y: 5, w: 0, h: 0, string: 'test'}
});	     
```

Iterating over objects continues as long as there are remaining objects and the callback function returns `true`. If the callback does not return `true`, the iteration is interrupted.

You can also give a buffer threshold, indicating that you want to iterate over all objects in the area expanded by the threshold to all directions:

```javascript
qt.get({x:0, y: 0, w: 4, h: 4}, 2, function(obj) {
    // obj == {x: 5, y: 5, w: 0, h: 0, string: 'test'}
});	     
```

Alternatively, you can also iterate over all objects that are close to a line segment. The line segment is defined by having `x, y, dx, dy, dist` properties:

```javascript
qt.get({x: 0, y: 0, dx: 1, dy: 1}, 1, function(obj) {
    // obj == {x: 5, y: 5, w: 0, h: 0, string: 'test'}
});
```

Please note it is assumed that `dx, dy` are a 2-d vector normalized to the length of 1. The `dist` property of the object tells the length of the line segment to this direction. If `dist` is undefined or negative, it is assumed to be an infinite line instead of a line segment.

You can also use a buffer threshold when iterating based on a line segment.

### Removing objects

To remove objects, call `remove` with the original object that was passed to `put`:

```javascript
var obj = { x: 5, y: 5, w: 0, h: 0, string: 'test', id: 4233 };
qt.put(obj);
qt.remove(obj); // removed
```

In fact, `remove` removes all objects with `x, y, w, h` identical to the passed object. If you want to remove only a specific object, you can pass the name of the uniquely identifying property to `remove`:

```javascript
var obj1 = { x: 5, y: 5, w: 0, h: 0, string: 'test', id: 4233 };
var obj2 = { x: 5, y: 5, w: 0, h: 0, string: 'test', id: 4234 };

qt.put(obj1);
qt.put(obj2);

qt.remove(obj1, 'id'); // only obj1 removed
qt.remove(obj1); // obj2 removed
```

Please note that despite passing `'id'` as the identifying attribute, the object passed to `put` must still have the same `x, y, w, h` properties as the object to be removed. `remove` traverses the tree similarly as `put`, so if these properties are not the same, it is possible that the object to be removed is not found.

License
---

(The MIT License)

Copyright (c) 2013 Antti Saarinen &lt;antti.p.saarinen@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.