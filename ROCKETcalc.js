'use strict';

const kMaxMortarRange = 2200;

function coords2kp(x, y, size) {
  x = Math.floor(x / size) % 3;
  y = Math.floor(y / size) % 3;
  return 1 + x + 3 * (2 - y);
}

function coords2grid(x, y) {
  const letter = String.fromCharCode('A'.charCodeAt(0) + Math.floor(x / 300));
  const number = Math.floor(y / 300) + 1;
  return [`${letter}${number}`, [1, 3, 9, 27].map(i => coords2kp(x, y, 100 / i))];
}

function coords2str(x, y) {
  const [square, subs] = coords2grid(x, y);
  const [kp1, kp2] = subs;
  return `${square} - ${kp1} - ${kp2}`;
}

function coords2str_short(x, y) {
  const [square, subs] = coords2grid(x, y);
  return square + ' ' + subs.join('');
}

function point(str) {
  const [_, x_letter, y_number, keypads_str] = str.toUpperCase().match(/([A-Z])(\d+)(.*)/);
  let grid = 300;
  let x = (x_letter.charCodeAt(0) - 'A'.charCodeAt(0) + 0.5) * grid;
  let y = (y_number - 0.5) * grid;

  for (let kp of keypads_str.replace(/[^0-9]+/g, '')) {
    grid /= 3;
    //    0  1  2  3  4  5  6  7  8  9
    x += [0, -1, 0, 1, -1, 0, 1, -1, 0, 1][kp] * grid;
    y += [0, 1, 1, 1, 0, 0, 0, -1, -1, -1][kp] * grid;
  }

  return [x, y];
}

function calc(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;

  const dist = Math.round(Math.hypot(dx, dy));
  const dir = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;	//gt

  return [dist, dir];
}

function linearEnvelope(i, array1, array2){	//assumes equal bounds
  const i_frac = array1.findIndex(h => h > i) -1;

  const [y1, y2] = array1.slice(i_frac);	//mill values
  const [x1, x2] = array2.slice(i_frac);	//range values
  return pSlope(i, y1, x1, y2, x2);		//
}

function pSlope(x, x1, y1, x2, y2) {	//Set up line via two points, no clamping. Input X, output Y
	//console.log(x +" "+ x1 +" "+ y1+" "+x2+" "+y2);	//debug
	var x, y, b, m;
	m = (y2 - y1) / (x2 - x1);
	b = y2 - m*x2;
	y = m*x+b;
	return y;
}

function formatDegrees(r){	//returns string
	var outdir = Math.round(r*10)/10;
	if (outdir == Math.round(outdir) ) {
		outdir = outdir + ".0";
	}	
	return outdir + `\u00B0`;	//+ degree symbol
}

// 1.0
// const kRangeTbl = [100,200,300,400,500,750,1000,1250,1492,1640,1748,1860,1950,2040,2100,2170,2183,2193,2190,2163];
// const kMilTable = [0.5,1.5,2.5,3,4,8,12,16,20,22.5,25,27.5,30,32.5,35,40,42.5,45,47.3,49.6];

//rocket tables 0 to 45 degrees	//keep bounds equal
const kRangeTbl =[165,470,662,800,906,1017,1150,1286,1400,1497,1598,1700,1796,1875,1955,2023,2070,2120,2157,2177,2198,2199,2205];
const kMilTable =[0.1,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,45,45.1];
//high range tables >45 degrees
const kRangeTblHr = [1250,1296,1383,1504,1630,1721,1811,1900,1961,2030,2146,2192];
const kMilTableHr = [73,72,70,67.6,65,63,61,59,57.6,55,50,45];


//rough tables for splash radius included in function
function splashX(r){
	if ($show_hr.checked) {
		if (r < kRangeTblHr[0]) {return 0} else {return 230};	
	}
	return linearEnvelope(r, [0, 1450, 1900, 2200], [30, 150, 150, 225]);
}
function splashY(r){
	if ($show_hr.checked) return 185;
	return linearEnvelope(r, [0, 1450, 1900, 2200], [200, 150, 150, 30]);
}

function r2mil(r) {	// converted to range to degrees using above tables

  var tr, tm
  if ($show_hr.checked) {
	if (r <= 1250 || r >= kMaxMortarRange+3) return 0;
	//console.log("HR checked!");
	tr = kRangeTblHr;
	tm = kMilTableHr;
  } else {
	if (r <= 50 || r >= kMaxMortarRange+3) return 0;
	//console.log("unchecked");
	tr = kRangeTbl;
	tm = kMilTable;	
  }
  
  const i_frac = tr.findIndex(h => h > r) -1;

  const [y1, y2] = tm.slice(i_frac);	//mill values
  const [x1, x2] = tr.slice(i_frac);	//range values
  
  const m = (y2-y1) / (x2-x1);		// linear interpolation between table points
  const b = y2- m*x2;
  return Math.round((m*r+b)*100)/100;	// y = mx + b
}


function r2clicks(r) {
  const dists = [30, 115, 200, 257.5, 292.5, 320, 365, 412.5, 462.5, 515, 550, 572.5, 607.5, 640, 665, 690, 720, 742.5, 760, 795, 9000];
  if (r <= 60 || r >= kMaxRocketRange) return 0;
  return dists.findIndex((d) => r < d);
}

function degreeToCardinal(deg) { //n nne ne ene e ese se sse s ssw sw wsw w wnw nw nnw
	const degrees = [11.25, 33.75, 56.25, 78.75, 101.25, 123.75, 146.25, 168.75, 191.25, 213.75, 236.25, 258.75, 281.25, 303.75, 326.25, 348.75, 371.25];
	const cardina = ['N  ', 'NNE',	'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'];
	return cardina[degrees.findIndex(d => deg < d )];
}


function printTable(){	//debug, print interpolated range tables in 50m increments
	var dist = 0;
	for (dist=0;dist<=2200;) {
	dist = dist + 50;
	//console.log(dist + ", " + r2mil(dist));
	console.log(r2mil(dist) + ", " + dist);
		
	}
}

function printTable2(){	//for HR
	var dist = 0;
	for (dist=1200;dist<=2200;) {
	dist = dist + 50;
	//console.log(dist + ", " + r2mil(dist));
	console.log(r2mil(dist) + ", " + dist);
		
	}
}
