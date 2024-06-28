'use strict';

function drawLine(ctx, x0, y0, x1, y1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function drawCircle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.stroke();
}

function drawEllipse(ctx, x, y, rx, ry, ang) {	//degree input
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, ang*(Math.PI / 180), 0, 2 * Math.PI); //x, y, ScaleX, ScaleY, Orientation, draw,draw
  ctx.stroke();
}

function drawText(ctx, str, x, y, baseline) {
  ctx.textBaseline = baseline;
  ctx.lineWidth = 4;	//4
  ctx.strokeText(str, x, y);
  ctx.fillText(str, x, y);
}

class Draggable {
  constructor(x0, y0) {
    [this.x, this.y] = [x0, y0];
  }
  onBeginDrag(x, y) {
    [this.dragDX, this.dragDY] = [x - this.x, y - this.y];
  }
  onMoveDrag(x, y) {
    this.moveTo(x - this.dragDX, y - this.dragDY);
  }
  moveTo(x, y) { this.x = x; this.y = y; }
  moveBy(dx, dy) { this.x += dx; this.y += dy; }
}

class Map extends Draggable {
  constructor(img) {
    super(0, 0);
    this.scale = 0.5;
    this.img = img;
    [this.mapCX, this.mapCY] = [1, 1];
  }
  onBeginDrag(x, y) {
    [this.dragX0, this.dragY0] = [x, y];
  }
  onMoveDrag(x, y) {
    this.x -= x - this.dragX0;
    this.y -= y - this.dragY0;
  }
  map2canvas(x, y) {
    return [(x - this.x) * this.scale, (y - this.y) * this.scale];
  }
  canvas2map(x, y) {
    return [x / this.scale + this.x, y / this.scale + this.y];
  }
  resizeMap(mapCX, mapCY) {
    [this.mapCX, this.mapCY] = [mapCX, mapCY];
  }
  drawImg(ctx) {
    let [scx, scy] = [ctx.canvas.width, ctx.canvas.height];
    let [kx, ky] = [this.img.width / this.mapCX, this.img.height / this.mapCY];
    let [imgX, imgY] = [this.x * kx, this.y * ky];
    let [imgСX, imgСY] = [scx * kx / this.scale, scy * ky / this.scale];
    ctx.drawImage(this.img, imgX, imgY, imgСX, imgСY, 0, 0, scx, scy);
  }
  drawGrid(ctx) {
    let len = Math.max(ctx.canvas.width, ctx.canvas.height);
    let [gx, gy] = [Math.floor(this.x / 300) * 300, Math.floor(this.y / 300) * 300];
    for (; ;) {
      ctx.lineWidth = (gx % 3 == 0) ? 2 : 1;	//3 : 1
      let [x, y] = this.map2canvas(gx, gy);
      //ctx.strokeStyle = 'black';
      ctx.strokeStyle = (gx % 3 == 0) ? '#000' : '#222';
      drawLine(ctx, x, 0, x, len);	// lines running east/west
      drawLine(ctx, 0, y, len, y);	// lines running north/south
      if (this.scale > 2.5) {	//2.5
        ctx.lineWidth = 1;	//1
        ctx.strokeStyle = '#aaa';
       // ctx.strokeStyle = '#444';
        [x, y] = this.map2canvas(gx + 100 / 3, gy + 100 / 3);
        drawLine(ctx, x, 0, x, len);
        drawLine(ctx, 0, y, len, y);
        [x, y] = this.map2canvas(gx + 200 / 3, gy + 200 / 3);
        drawLine(ctx, x, 0, x, len);
        drawLine(ctx, 0, y, len, y);
      }
      gx += 100; gy += 100;
      if (x > len) break;
	  //console.log(ctx.lineWidth)
    }
  }
  drawScale(ctx) {
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#000';
    ctx.font = '25px sans-serif';
    let text = `${Math.round(this.scale * 100)}%`;
    drawText(ctx, text, 0, ctx.canvas.height, 'bottom');
  }
  draw(ctx) {
    ctx.fillStyle = '#aaa';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.drawImg(ctx);
    this.drawGrid(ctx);
    this.drawScale(ctx);
  }
  zoom(sx, sy, zoomOut) {
    let oldScale = this.scale;
    let delta = this.scale < 1 ? 0.1 : this.scale < 2 ? 0.2 : 0.5;
    if (zoomOut) {
      this.scale = Math.max(0.2, this.scale - delta);
    } else {
      this.scale = Math.min(4, this.scale + delta);
    }

    let k = 1 / oldScale - 1 / this.scale;
    this.moveBy(sx * k, sy * k);
  }
};

class MapObject extends Draggable {
  constructor(map, x0, y0, img, gridElem) {
    super(x0, y0);
    this.map = map;
    this.img = img;
    this.gridElem = gridElem;
    this.updateGridElem();
  }
  toScreen() {
    return this.map.map2canvas(this.x, this.y);
  }
  isMouseOver(ex, ey) {
    let [sx, sy] = this.toScreen();
    return Math.hypot(ex - sx, ey - sy) < 15;
  }
  onMoveDrag(x, y) {
    super.onMoveDrag(x, y);
    this.updateGridElem();
  }
  drawLast(ctx) {
    let [sx, sy] = this.toScreen();
    ctx.drawImage(this.img, sx - 10, sy - 10);
  }
  updateGridElem() {
    if (this.gridElem)
      this.gridElem.value = coords2str_short(this.x, this.y);
	 // $copy_grid.value = quickout;//g_target.quickout;
	  $copy_grid.innerText = "     " + quickout + " ... " + quickout2;//g_target.quickout;
  }
}

let mortarx, mortary;

class Mortar extends MapObject {
  constructor(map, x0, y0, img, gridElem) {
    super(map, x0, y0, img, gridElem);
  }

  drawFirst(ctx) {
  
    let [x, y] = this.toScreen();
	ctx.lineWidth = 1;
	if ($show_hr.checked) {
		ctx.strokeStyle = '#F30'; //high range distance
		drawCircle(ctx, x, y, 1250 * this.map.scale);	
		ctx.strokeStyle = '#F80';	//max range
	}	else {
		// //ctx.save();	//necessary for messing with alpha..? lags!	//setting grey "sweet spot" guides
		// ctx.strokeStyle = '#555';
		// ctx.lineWidth = 2;
		// //ctx.globalAlpha = 0.5;
		// drawCircle(ctx, x, y, 1425 * this.map.scale);	//todo
		// drawCircle(ctx, x, y, 1875 * this.map.scale);	// get rid of this in favor of better range ellipse
		// //ctx.restore();		
		ctx.strokeStyle = '#0f0';	// for max range was 709	
	}
	
	//ctx.strokeStyle = '#0f0';	//GREEN
	ctx.lineWidth = 2;
    drawCircle(ctx, x, y, kMaxMortarRange * this.map.scale);	// max range guide

	mortarx = x;
	mortary = y;
		
  }
};


class Target extends MapObject {
  constructor(map, mortar, x0, y0, img, gridElem) {
    super(map, x0, y0, img, gridElem);
    this.mortar = mortar;
    this.drawCircles = false;
  }

  drawFirst(ctx) {
    let [sx, sy] = this.toScreen();

    const [dist, dir] = calc(this.mortar.x, this.mortar.y, this.x, this.y);
    const mil = r2mil(dist);

    let [smx, smy] = this.mortar.toScreen();
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
	
	// 			grid is broken with rockets, here's an azimuth circle + rough range ellipse
    ctx.strokeStyle = '#696';	
 	if (dist < kMaxMortarRange && dist > 150 ) {
		drawCircle(ctx, mortarx, mortary, dist * this.map.scale);
		//draw range ellipse (ranging roughly set in functions splashX and splashY)
		ctx.strokeStyle = '#0f0';	//green  '#0f0'
		drawEllipse(ctx, sx, sy, splashX(dist)*this.map.scale/2, splashY(dist)*this.map.scale/2, dir);
	}	

	drawLine(ctx,mortarx,mortary,sx,sy);	//draw line from mortar to target

    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#f00';
    ctx.font = '18px sans-serif';	

	var formatdir = formatDegrees(dir);	//format the text so it looks a little nicer. Also round it. //gtg
	
    let textX = sx + 10;	//X position

   quickout = degreeToCardinal(dir) + " " + dist + "m ";	// Cardinal direction, then MILs, then degrees 
   quickout2 = formatdir + "   ^" + mil +"^ mils";

   drawText(ctx, quickout2, textX, sy, 'top');    
   ctx.fillStyle = '#099';  
   drawText(ctx, `${quickout}`, textX, sy, 'bottom');  
  }
};

class Fob extends MapObject {
  constructor(map, x0, y0, img) {
    super(map, x0, y0, img, null);
    this.visible = $show_fob.checked;
  }
  drawFirst(ctx) {
    if (!this.visible) return;
    let [x, y] = this.toScreen();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#f00';
    drawCircle(ctx, x, y, 30 * this.map.scale);		//v12 overrun
    ctx.lineWidth = 3;		
    ctx.strokeStyle = '#09f';
    drawCircle(ctx, x, y, 150 * this.map.scale);	//v12 build/supply radius
	ctx.strokeStyle = '#666';
    drawCircle(ctx, x, y, 300 * this.map.scale);	//v12 additional fob restriction
  }
  drawLast(ctx) {
    if (!this.visible) return;
    super.drawLast(ctx);
  }
}


class CopyMe{
	//
}



