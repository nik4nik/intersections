'use strict';
function intersects(fig1, fig2) {
function isLeft(a, b, c) { // is it left vectors triple?
	return (b.x - a.x) * (c.y - a.y) - (c.x -  a.x) * (b.y - a.y) > 0
}
function getPointHash(e) { // for diapason 0-399 max value: (399 * 2^7 = 51072) < (2^16-1 = 65535)
	return e.x * 128 | e.y * 128 << 16
}
function getPointsHash(p) {
	return p.map(function (e) {
		return getPointHash(e)
	});
}
function addCrossPoints(p1, p2, p1Hash, p2Hash) {
	var p2Original = [].concat(p2),
		k = p1.length,
		crossesHash = [];
	while (k--) {
		var p1Add = [],
			a = p1[k],
			b = p1[k ? k - 1 : p1.length - 1],
			l = p2Original.length;
		while (l--) {
			var p2Add = [],
				c = p2Original[l],
				d = p2Original[l ? l - 1 : p2Original.length - 1],
				e = p1[k - 1 > 0 ? k - 2 : p1.length - 2],
				z = getContactPoint(a, b, c, d);
			if (z) {
				var contact = {x:Math.round(z.x * 1e9) / 1e9, y:Math.round(z.y * 1e9) / 1e9};
				var AnyVertexIsNotContact = !(arePointsEq(a, contact) || arePointsEq(b, contact) ||
					arePointsEq(c, contact) || arePointsEq(d, contact)),
					isInside = isPointInsidePolygon(p2Original, a);
				if (AnyVertexIsNotContact ||
					( !(arePointsEq(a, contact) && arePointsEq(d, contact)) //???
						&& (isLeft(a, contact, c)^isLeft(e, contact, c)) &&
						!((crossesHash.length%2 == 0) && isInside) && // if entry point then previous one is outside
						!((crossesHash.length%2) && !isInside)//???	 // if exit point then previous one is inside
					)) {
					e = getPointHash(contact);
					switch(-1) {
						case p1Hash.indexOf(e):
							if (p1Add.indexOf(e) == -1)
								p1Add.push(contact);
						case p2Hash.indexOf(e):
							var segmentEnd = p2Hash.indexOf(getPointHash(c)),
								segmentStart = p2Hash.indexOf(getPointHash(d));
							if (segmentEnd == 0) segmentEnd = p2.length;
							for (var i = segmentStart; i < segmentEnd; i++) {
								if (getContactPoint(a, b, p2[i], p2[(i+1) % p2.length])) {
									p2.splice(i+1, 0, contact);
									p2Hash.splice(i+1, 0, e);
									break;
								}
							}
						case crossesHash.indexOf(e):
							crossesHash.push(e);
					}
				}
			}
		}
		if (p1Add.length > 1) {
			p1Add.sort(function (e1, e2) {
				var tmp = p1.indexOf(a) > p1.indexOf(b)? a: b;
				return distanceSquare(tmp,e2) - distanceSquare(tmp,e1)
			});
		}
		for (var i = p1Add.length; i--;) {
			var idx = k? k: p1.length;
			p1.splice(idx, 0, p1Add[i]);
			p1Hash.splice(idx, 0, getPointHash(p1Add[i]));
		}
	}
	return crossesHash.sort(function (a, b) {
		return p1Hash.indexOf(a) - p1Hash.indexOf(b)
	});
}
function distanceSquare(a,b) {
	return Math.pow((a.x-b.x),2) + Math.pow((a.y-b.y),2);
}
function addSelfIntersectionPoints(p) {
	var original = [].concat(p),
		selfIntersections = [];
	for (var i = 0, l = p.length; i < l - 1; i++) {
		var a = original[i],
			b = original[i < l - 1 ? i + 1 : 0];
		for (var j = i + 1; j < l; j++) {
			var c = original[j],
				d = original[j < l - 1 ? j + 1 : 0],
				contact = getContactPoint(a, b, c, d);
			if (contact && !(arePointsEq(a, contact) || arePointsEq(b, contact))) {
				p.splice(i + 1, 0, contact);
				selfIntersections.push([contact, d]);
			}
		}
	}
	return selfIntersections.map(function (e) {
		return [p.indexOf(e[0]), p.indexOf(e[1])]
	});
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
function WeilerAthertonExtAlgorithm(p1, p2) {
	var fig1 = [].concat(p1), fig1Hash = getPointsHash(fig1),
		fig2 = [].concat(p2), fig2Hash = getPointsHash(fig2),
		p2Hash = getPointsHash(p2),
		crossPointsHash = addCrossPoints(fig1, fig2, fig1Hash, fig2Hash),
		i, k, l, tmp;
	if (crossPointsHash.length && !crossPointsHash.every(function (x) {
			return ~p2Hash.indexOf(x)? true: false;
			})
		) {
		if (isPointInsidePolygonWithoutBorders(p2, fig1[0])) {
			fig2.reverse();
			fig2Hash.reverse();
		}
		// if first point of polygon coincides with cross point or is inside of second polygon take next cross point
		for (k = 0; isPointInsidePolygon(p2, fig1[k]); k++);
		while ((i = crossPointsHash.indexOf(fig1Hash[++k])) == -1);
		var	intersection = [],
			productSpace = [],
			entryHash = [],
			crossPoint = fig1[k];
		// select all entry points even run through index 0
		var firstEntryPointIndex = i;
		do {
			entryHash.push(crossPointsHash[i]);
			i = (i+2) % crossPointsHash.length;
		}while(i != firstEntryPointIndex);
		productSpace.push(crossPoint);
		fig1[k] = 0;
		crossPointsHash.splice(crossPointsHash.indexOf(
			entryHash.splice(entryHash.indexOf(fig1Hash[k]), 1)[0]), 1);
	l1 : while (true) { // walk by first polygon
			k++;
			if (k == fig1.length) {
				if (isPointInsidePolygonWithoutBorders(p2, fig1[0])) {
					k = 0;
				}else{
					l = fig2Hash.indexOf(fig1Hash[--k]); // on second cross point go to second polygon
					do { // walk by second polygon
						l = (l ? l : fig2.length) - 1;
						crossPoint = fig2Hash[l];
						if (arePointsEq(productSpace[0], fig2[l])) {
							if (getPolygonSquare(productSpace) >= 0.0001)
								intersection.push(productSpace);
							productSpace = [];
							break l1;
						}
						productSpace.push(fig2[l]);
					} while (true);
				}
			}
			if (!fig1[k])
				continue;
			if (k == 1) {
				tmp = fig2.some(function (e) {
					return arePointsEq(e, fig1[1])
				});
				if (arePointsEq(fig1[0],entryHash[0]) && !(isPointInsidePolygon(p2, fig1[1]) || tmp)) {
					tmp = fig2Hash.indexOf(fig1Hash[0]) -1; //find next in fig2
					productSpace.push(fig2[tmp]);
					if (~(tmp = crossPointsHash.indexOf(fig2Hash[tmp])) ) {
						k = fig1Hash.indexOf(crossPointsHash[tmp]);
						fig1[k] = 0;
						crossPointsHash.splice(tmp, 1);
					} // else???
					continue;
				}
			}
			crossPoint = crossPointsHash.indexOf(fig1Hash[k]);
			if ((~crossPoint) || productSpace.length) {
				productSpace.push(fig1[k]),
				fig1[k] = 0;
			}
			if (crossPoint == -1)
				continue;
			crossPointsHash.splice(crossPoint, 1);
			if (productSpace.length == 1)
				continue;

			var l = fig2Hash.indexOf(fig1Hash[k]); // on second cross point go to second polygon
			do { // walk by second polygon
				do {
					l = (l ? l : fig2.length) - 1;
					crossPoint = fig2Hash[l];
				} while(~crossPointsHash.indexOf(crossPoint) && entryHash.indexOf(crossPoint) == -1); // while exit point
				if (arePointsEq(productSpace[0], fig2[l])) {
					if (getPolygonSquare(productSpace) >= 0.0001)
						intersection.push(productSpace);
					productSpace = [];
					if (!crossPointsHash.length)
						break l1;
					for (k = 0; ~crossPointsHash.indexOf(fig1Hash[k]); k++);
					for (; crossPointsHash.indexOf(fig1Hash[k + 1]) == -1; k++);
					continue l1;
				}
				productSpace.push(fig2[l]);
			} while ((crossPoint = crossPointsHash.indexOf(fig2Hash[l])) == -1 || crossPointsHash.length == 1);
			k = fig1Hash.indexOf(crossPointsHash.splice(crossPoint, 1)[0]);
		}
		return intersection;
	}

	var fig2tmp = [].concat(fig2);
	fig2tmp.push(fig2[0]);
	if (fig1.every(function (x) {
			return windingNumber_PnPoly(fig2tmp, x)
		})) {
		return [fig1];
	}else{
		var fig1tmp = [].concat(fig1);
		fig1tmp.push(fig1[0]);
		return fig2.every(function (x) {
				return windingNumber_PnPoly(fig1tmp, x)
			}) ?
			[fig2]: [];
	}
}

var selfIntersections = addSelfIntersectionPoints(fig2);
if (!selfIntersections.length)
	return WeilerAthertonExtAlgorithm(fig1, fig2);
var i, k,
	polygonsStack = [],
	idxArray = fig2.map(function (e) {
		return fig2.indexOf(e)
	});
for (k = selfIntersections.length; k--;)
	idxArray.splice(selfIntersections[k][1], 0, selfIntersections[k][0]);
for (k = i = 0; k < idxArray.length; k++) {
	if (idxArray[k] < idxArray[k - 1]) {
		var wantedNum = idxArray[k];
		polygonsStack[i] = [];
		do {
			polygonsStack[i].push(idxArray.splice(k, 1)[0]);
		} while (idxArray[--k] != wantedNum);
		if (i%2 == 0)
			polygonsStack[i].reverse();
		i++;
	}
}
if (idxArray.length)
	polygonsStack[i] = idxArray;
if (polygonsStack.length) {
	polygonsStack = polygonsStack.map(function (e) {
		return e.map(function (e) {
			return fig2[e]
		})
	});
	var result = [];
	polygonsStack.map(function (e) {
		WeilerAthertonExtAlgorithm(fig1, e).map(function (e) {
			result.push(e);
		})
	});
	return result;
}
}