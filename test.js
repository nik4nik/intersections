/*	I don't know how to write tests for module which have
	to place in global area only one function - intersect().
	So all tested functions have been coped in this file.
	Run the tests using the mocha command.
*/
 
var assert = require("assert")

function testArray(a, f) {
	a.forEach(function (e) {
		f(e)
	})
}

var arrPoint = [
 [
  [
    { x: 30, y: 240 },
    { x: 131, y: 240 },
    { x: 90, y: 90  },
    { x: 30, y: 210 }
  ],
  {x:90, y:240},
  true
 ]
]

//============================== tested functions beginning

function isLeft(a, b, c) { // is it left vectors triple?
	return (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y) > 0
}
function getPointHash(e) { // for diapason 0-399 max value: (399 * 2^7 = 51072) < (2^16-1 = 65535)
	return e.x * 128 | e.y * 128 << 16
}
function distanceSquare(a,b) {
	return Math.pow((a.x-b.x),2) + Math.pow((a.y-b.y),2);
}
function arePointsEq(a, b) {
	return a.x == b.x && a.y == b.y
}
function isPointInsidePolygon(p, point) { //for convex polygon
var i1, i2, n, S, S1, S2, S3, flag,
	N = p.length,
	x = point.x,
	y = point.y;
for (n = 0; n < N; n++) {
	flag = 0;
	i1 = n < N - 1 ? n + 1 : 0;
	while (flag == 0) {
		i2 = i1 + 1;
		if (i2 >= N)
			i2 = 0;
		if (i2 == (n < N - 1 ? n + 1 : 0))
			break;
		S = Math.abs(p[i1].x * (p[i2].y - p[n].y) +	p[i2].x * (p[n].y - p[i1].y) +	p[n].x * (p[i1].y - p[i2].y));
		S1 = Math.abs(p[i1].x * (p[i2].y - y) + p[i2].x * (y - p[i1].y) + x * (p[i1].y - p[i2].y));
		S2 = Math.abs(p[n].x * (p[i2].y - y) + p[i2].x * (y - p[n].y) + x * (p[n].y - p[i2].y));
		S3 = Math.abs(p[i1].x * (p[n].y - y) + p[n].x * (y - p[i1].y) + x * (p[i1].y - p[n].y));
		if (S.toFixed(10) == (S1 + S2 + S3).toFixed(10)) {
			flag = 1;
			break;
		}
		i1 = ++i1 < N? i1: 0;
	}
	if (flag == 0)
		break;
}
return !!flag;
}
function isPointInsidePolygonWithoutBorders(p, point) {
	for (var c = 0, i = 0, j = p.length - 1, x = point.x, y = point.y; i < p.length; j = i++)
		c ^= (p[i].y <= y && y < p[j].y || p[j].y <= y && y < p[i].y) &&
		(x > (p[j].x - p[i].x) * (y - p[i].y) / (p[j].y - p[i].y) + p[i].x);
	return !!c;
}
function windingNumber_PnPoly(P, V) {
/*	winding number test for a point in a polygon
	Input:	P - a point,
			V[] - vertexes of a polygon V[n+1] with V[n]=V[0]
	Return:	wn - the winding number (=0 only when P is outside)
*/
	var	wn = 0,	// the  winding number counter
		n = V.length -1;
	// loop through all edges of the polygon
	for (var i=0; i<n; i++) {		// edge from V[i] to  V[i+1]
		if (V[i].y <= P.y) {		// start y <= P.y
			if (V[i+1].y  > P.y)	// an upward crossing
				 if (isLeft( V[i], V[i+1], P) > 0)	// P left of  edge
					 ++wn;			// have a valid up intersect
		}
		else {						// start y > P.y (no test needed)
			if (V[i+1].y  <= P.y)	// a downward crossing
				 if (isLeft( V[i], V[i+1], P) < 0)	// P right of  edge
					 --wn;			// have  a valid down intersect
		}
	}
	return wn;
 }
function getContactPoint(a, b, c, d) {
	var e = (a.x - b.x) * (d.y - c.y) - (a.y - b.y) * (d.x - c.x),
	ta = ((a.x - c.x) * (d.y - c.y) - (a.y - c.y) * (d.x - c.x)) / e,
	tb = ((a.x - b.x) * (a.y - c.y) - (a.y - b.y) * (a.x - c.x)) / e;

	if (ta >= 0 && ta <= 1 && tb >= 0 && tb <= 1)
		return {
			x : a.x + ta * (b.x - a.x),
			y : a.y + ta * (b.y - a.y)
		};
}
function getPolygonSquare(p) {
	var minY = p.reduce(function (a, b) {			// - берём горизонтальную прямую, не пересекающую ни одну сторону многоугольника
			return a < b.y ? a : b.y				//	(например, y=Ymin, где Ymin - наименьшая ордината вершин многоугольника)
		}, NaN);									// - обходим все рёбра и площадь каждой получившейся прямоугольной трапеции
	return Math.abs(p.reduce(function (square, e) { //	вычисляем по формуле S[i] = (a[i] + b[i]) * h[i] /2, где
			var next = (p.indexOf(e) + 1) % p.length,
			a = e.y - minY,							// a[i] = y[i] - Ymin;
			b = p[next].y - minY,					// b[i] = y[i+1] - Ymin;
			h = p[next].x - e.x;					// h[i] = x[i+1] - x[i];
			square += (a + b) * h / 2;				// - суммируем найденные площади
			return square;							// - если порядок обхода вершин был против часовой стрелки, то в итоге получим
		}, 0));										//	отрицательную сумму - тогда найдём её абсолютную величину
}

//============================== tested functions end
 
describe("isLeft", function () {

	var arr = [
		[{x : 0,y : 0},	{x : 10,y : 10}, {x : 20,y : 10},	false],
		[{x : 0,y : 0},	{x : 20,y : 10}, {x : 10,y : 10},	true],
		[{x : 0,y : 0},	{x : 10,y : 10}, {x : 10,y : 10},	false],
		[{x : 0,y : 0},	{x : 10,y : 10}, {x : 20,y : 20},	false],
		[{x : 0,y : 0},	{x :  0,y : 10}, {x :  0,y : 20},	false],
		[{x : 0,y :20}, {x :  0,y : 10}, {x :  0,y :  0},	false],
		[{x :20,y :10}, {x : 10,y : 10}, {x :  0,y :  0},	true],
	];

	function makeTest(e) {
		
		it("", function () {
			assert.equal(isLeft(e[0], e[1], e[2]), e[3]);
			console.log(e);
		});
	}

	testArray(arr, makeTest)
});

describe("getPointHash", function () {

	var arr = [
		[{x : 0,y : 0}, 0],
		[{x : 300,y : 60}, 503354880],
		[{x : 400,y : 400}, -939472896],
	];

	function makeTest(e) {
		it("", function () {
			assert.equal(getPointHash(e[0]),e[1]);
			console.log(e)
		});
	}

	testArray(arr, makeTest)
});

describe("distanceSquare", function () {

	var arr = [
		[{x : 0,y : 0}, {x : 1,y : 1}, 2],
		[{x : 300,y : 300}, {x : 300,y : 240}, 3600],
		[{x : 60,y : 300}, {x : 90,y : 240}, 4500],
	];

	function makeTest(e) {
		it("", function () {
			assert.equal(distanceSquare(e[0],e[1]),e[2]);
			console.log(e)
		});
	}

	testArray(arr, makeTest)
});

describe("arePointsEq", function () {

	var arr = [
		[{x : 0,y : 0}, {x : 1,y : 1}, false],
		[{x : 0,y : 0}, {x : 0,y : 0}, true],
		[{x : 60,y : 300}, {x : 90,y : 240}, false],
	];

	function makeTest(e) {
		it("", function () {
			assert.equal(arePointsEq(e[0],e[1]),e[2]);
			console.log(e)
		});
	}

	testArray(arr, makeTest)
});

describe("isPointInsidePolygon", function () {

	function makeTest(e) {
		it("", function () {
			assert.equal(isPointInsidePolygon(e[0],e[1]),e[2]);
			console.log(e)
		});
	}

	testArray(arrPoint, makeTest)
});

describe("isPointInsidePolygonWithoutBorders", function () {

	function makeTest(e) {
		it("", function () {
			assert.equal(isPointInsidePolygonWithoutBorders(e[0],e[1]),false);
			console.log(e)
		});
	}

	testArray(arrPoint, makeTest)
});

describe("windingNumber_PnPoly", function () {

	function makeTest(e) {
		it("", function () {
			assert.equal(windingNumber_PnPoly(e[1],e[0]),0); //reversed params: first - point, second - polygon array
			console.log(e)
		});
	}

	testArray(arrPoint, makeTest)
});

describe("getContactPoint", function () {

	var arr = [
		[{x : 30,y : 240},	{x : 330,y : 240}, {x : 330,y : 240}, {x : 330,y : 210}, {x : 330,y : 240}],
		[{x : 270,y : 80},	{x : 210,y : 270}, {x : 210,y : 270}, {x : 210,y : 90},  {x : 210,y : 270}],
	];

	function makeTest(e) {
		it("", function () {
			var tmp = getContactPoint(e[0],e[1],e[2],e[3]);
			assert.equal(true,arePointsEq(e[4], tmp));
			console.log(e)
		});
	}

	testArray(arr, makeTest)
});

describe("getPolygonSquare", function () {

	function makeTest(e) {
		it("", function () {
			assert.equal(getPolygonSquare(e[0]),8475);
			console.log(e)
		});
	}

	testArray(arrPoint, makeTest)
});