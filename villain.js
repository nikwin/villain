var canvas = document.getElementById('canvas');

var width = canvas.height;
var height = canvas.height;

var ctx = canvas.getContext('2d');

var max = function(a, b){return (a > b) ? a : b;};
var min = function(a, b){return (a < b) ? a : b;};

var randomChoice = function(array){
    return array[Math.floor(Math.random() * array.length)];
}

var randomKeyFromWeightedDict = function(dict){
    var sum = 0;
    var keys = [];
    for (var key in dict){
        sum += dict[key];
        keys.push(key);
    }
    var choice = Math.floor(Math.random() * sum);
    console.log("" + sum + " " + choice)
    for (var i = 0; i < keys.length; i++){
        var key = keys[i];
        if (dict[key] > choice){
            return key;
        }
        else{
            choice -= dict[key];
        }
    }
}

stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;

var html = document.body.parentNode;
htmlTop = html.offsetTop;
htmlLeft = html.offsetLeft;

var getPos = function(e) {
    var element = canvas, offsetX = 0, offsetY = 0, mx, my;
    if (element.offsetParent !== undefined) {
	do {
	    offsetX += element.offsetLeft;
	    offsetY += element.offsetTop;
	} while ((element = element.offsetParent));
    }
    offsetX += stylePaddingLeft + styleBorderLeft + htmlLeft;
    offsetY += stylePaddingTop + styleBorderTop + htmlTop;
    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;
    return [mx, my];
}

var equalArray = function(arr1, arr2){
    if (arr1 == arr2){
        return true;
    }
    if (arr2.length != arr1.length){
        return false;
    }
    for (var i = 0; i < arr1.length; i++){
        if (arr1[i] != arr2[i]){
            return false;
        }
    }
    return true;
}

var containsPos = function(rect, pos){
    return (rect[0] < pos[0] &&
           rect[1] < pos[1] &&
           rect[0] + rect[2] > pos[0] &&
           rect[1] + rect[3] > pos[1]);
}

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame   || 
	window.webkitRequestAnimationFrame || 
	window.mozRequestAnimationFrame    || 
	window.oRequestAnimationFrame      || 
	window.msRequestAnimationFrame     || 
	function(callback, element){
	    window.setTimeout(callback, 1000 / 60);
	};
})();


var bindHandler = (function(){
    var FunctionGroup = function(){
	this.clear();
    };
    FunctionGroup.prototype.clear = function(){
	var oldSet = {
	    functions: this.functions,
	    flipped: this.flipped
	};
	this.functions = {'down': [],
			  'up': [],
			  'move': []};
	this.flipped = {'down': [],
			'up': [],
			'move': []};
	return oldSet;
    };
    FunctionGroup.prototype.reset = function(oldSet){
	this.functions = oldSet.functions;
	this.flipped = oldSet.flipped;
    };
    FunctionGroup.prototype.run = function(key, e){
	var anyTrue = false;
	for (var i = 0; i < this.functions[key].length; i++){
	    if (this.functions[key][i](e)){
		anyTrue = true;
	    }
	}
	return anyTrue;
    }
    FunctionGroup.prototype.flip = function(functionDict){
	if (functionDict === undefined){
	    this.functions = this.flipped;
	}
	else{
	    this.flipped = this.functions;
	    this.functions = functionDict;
	}
    };
    FunctionGroup.prototype.addFunction = function(func, event){
	this.functions[event].push(func);
	var that = this;
	return function(){
	    for (var i = 0; i < that.functions[event].length; i++){
		if (that.functions[event][i] === func){
		    that.functions[event].splice(i, 1);
		    return;
		}
	    }
	};
    };

    var alwaysFunctions = new FunctionGroup();
    var ifNothingFunctions = new FunctionGroup();

    var functionGroups = [alwaysFunctions, ifNothingFunctions];
    
    var getBindFunction = function(key){
	return function(e){
	    e.preventDefault();
	    var runNothingFunctions = !alwaysFunctions.run(key, e);
	    if (runNothingFunctions){
		ifNothingFunctions.run(key, e);
	    }
	};
    };

    canvas.addEventListener('mousedown', getBindFunction('down'), false);
    canvas.addEventListener('mouseup', getBindFunction('up'), false);
    canvas.addEventListener('mousemove', getBindFunction('move'), false);
    canvas.addEventListener('touchstart', getBindFunction('down'), false);
    canvas.addEventListener('touchend', getBindFunction('up'), false);
    canvas.addEventListener('touchmove', getBindFunction('move'), false);

    return {
	flip: function(functionDicts){
	    for (var i = 0; i < functionGroups.length; i++){
		if (functionDicts === undefined){
		    functionGroups[i].flip();
		}
		else{
		    if (functionDicts[i] === undefined){
			console.log('Warning: undefined function flip');
		    }
		    functionGroups[i].flip(functionDicts[i]);
		}
	    }
	},
	bindFunction: function(func, event, group){
	    if (!event){
		event = 'down';
	    }

	    if (group === undefined || group == 'always'){
		return alwaysFunctions.addFunction(func, event);
	    }
	    else if (group == 'ifnothing'){
		return ifNothingFunctions.addFunction(func, event);
	    }
	    else{
		console.log('Warning: wrong bind group' + func);
	    }
	},
	clear: function(){
	    var oldSets = [];
	    for (var i = 0; i < functionGroups.length; i++){
		oldSets.push(functionGroups[i].clear());
	    }
	    return oldSets;
	},
	reset: function(oldSets){
	    /*Resets the bindings to those passed,
	      Meant to be used with the result of a clear*/
	    for (var i = 0; i < oldSets.length; i++){
		functionGroups[i].reset(oldSets[i]);
	    }
	}
    };
})();

var timeFeed = (function(){
    var lastTime = new Date();
    var baseTimeFactor = 1.0;
    var timeFactor = baseTimeFactor;
    var getInterval = function(){
	var nowTime = new Date();
	var interval = (nowTime.getTime() - lastTime.getTime()) / 1000;
	interval *= timeFactor;
	lastTime = nowTime;
	return min(interval, 1);
    };
    var setPaused = function(pause){
	timeFactor = pause ? 0 : baseTimeFactor;
    };
    var setFactor = function(factor){
	baseTimeFactor = factor;
	timeFactor = (timeFactor === 0) ? 0 : baseTimeFactor;
    };
    return {getInterval: getInterval,
	    setPaused: setPaused,
	    setFactor: setFactor};
})();

var collideRect = function(rct1, rct2){
    return (max(rct1[0], rct2[0]) < min(rct1[0] + rct1[2], rct2[0] + rct2[2]) &&
	    max(rct1[1], rct2[1]) < min(rct1[1] + rct1[3], rct2[1] + rct2[3]));
}

var overlapArea = function(rct1, rct2){
    var left = max(rct1[0], rct2[0]);
    var top = max(rct1[1], rct2[1]);
    var right = min(rct1[0] + rct1[2], rct2[0] + rct2[2]);
    var bottom = min(rct1[1] + rct1[3], rct2[1] + rct2[3]);
    if (left > right || top > bottom){
        return 0;
    }
    return (right - left) * (bottom - top);
};

var squareSize = 60;

var game;

var Currencies = function() {
    this.money = 0;
    this.minions = 0;
    this.tech = 0;
}

var currencies = new Currencies();

var BaseDraw = function(x, y, color, image){
    this.x = x;
    this.y = y;
    this.color = color;
    this.image = image;
    if (this.image != undefined){
        this.image = new Image();
        this.image.src = image;
    }
}

BaseDraw.prototype.size = squareSize;

BaseDraw.prototype.draw = function(fill, stroke){
    if (this.image != undefined){
        ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    }
    else{
        ctx.fillStyle = typeof fill !== 'undefined' ? fill : this.color;
        ctx.strokeStyle = typeof stroke !== 'undefined' ? stroke : "#FF0000";
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.size);
        ctx.lineTo(this.x + this.size, this.y + this.size);
        ctx.lineTo(this.x + this.size, this.y);
        ctx.closePath();
        ctx.stroke();
    }
};

BaseDraw.prototype.getRect = function(){
    return [this.x, this.y, this.size, this.size];
}


var Square = function(x, y){
    this.basedraw = new BaseDraw(x, y, '#333333');
    this.walkable = true;
};

var bgImage = new Image();
bgImage.src = 'images/tileBG.png';

Square.prototype.draw = function() {
    this.basedraw.draw(ctx.createPattern(bgImage, "repeat"), "#CCCCCC");
    if (this.hasBeenWalkedUpon){
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.basedraw.x, this.basedraw.y, this.basedraw.size, this.basedraw.size);
        ctx.globalAlpha = 1;
    }
}

var Shot = function(x, y, damage){
    this.basedraw = new BaseDraw(x, y, '#ffffff');
    this.basedraw.size = 10;
}

Shot.prototype.speed = 300;

var getSquareDist = function(p1, p2){
    var x = p1[0] - p2[0];
    var y = p1[1] - p2[1];
    return x*x + y*y;
}

Shot.prototype.update = function(interval, hero){
    var dist = this.speed * interval;
    var xRatio = (hero.x - this.basedraw.x) * (hero.x - this.basedraw.x);
    var yRatio = (hero.y - this.basedraw.y) * (hero.y - this.basedraw.y);
    var sum = xRatio + yRatio;
    this.basedraw.x += (xRatio * dist / sum) * ((hero.x  > this.basedraw.x) ? 1 : -1);
    this.basedraw.y += (yRatio * dist / sum) * ((hero.y  > this.basedraw.y) ? 1 : -1);
    if (getSquareDist([this.basedraw.x, this.basedraw.y], [hero.x, hero.y]) < 100){
        hero.health -= this.damage;
        hero.wasShot = .3;
        return true;
    }
    return false;
}

var Trap = function(x, y, props){
    this.basedraw = new BaseDraw(x, y, props['color'], props['image']);
    this.name = props['name'];
    this.range = props['range'];
    this.damage = props['damage'];
    this.fireRate = props['fireRate'];
    if (game.hasModifier('reload')) {
	this.fireRate *= 1.5;
    }
    this.walkable = props['walkable'];
    this.nextFire = 0;
    this.cost = props['cost'];
    this.shots = [];
};

Trap.prototype.isInRange = function(x, y) {
    var distanceSq = (x - this.basedraw.x) * (x - this.basedraw.x) + (y - this.basedraw.y) * (y - this.basedraw.y);
    return distanceSq < this.range * this.range;
}

Trap.prototype.fire = function(hero, time) {
    this.nextFire = max(this.nextFire - time, 0);
    if (this.nextFire > 0 || !this.isInRange(hero.x, hero.y)) {
	return;
    }
    this.nextFire = 1 / this.fireRate;
    this.shots.push(new Shot(this.basedraw.x, this.basedraw.y, this.damage));
}

Trap.prototype.update = function(interval, hero) {
    this.fire(hero, interval);
    for (var i = this.shots.length - 1; i >= 0; i--){
        if (this.shots[i].update(interval, hero)){
            this.shots.splice(i, 1);
        }
    }
}

Trap.prototype.draw = function() {
    this.basedraw.draw();
    for (var i = 0; i < this.shots.length; i++){
        this.shots[i].basedraw.draw();
    }
}

var Punch = function(x, y, damage){
    this.basedraw = new BaseDraw(x, y, '#ff0000');
    this.basedraw.size = 20;
    this.damage = damage;
};

Punch.prototype.speed = 400;

Punch.prototype.update = function(interval, hero){
    var dist = this.speed * interval;
    var xRatio = (hero.x - this.basedraw.x) * (hero.x - this.basedraw.x);
    var yRatio = (hero.y - this.basedraw.y) * (hero.y - this.basedraw.y);
    var sum = xRatio + yRatio;
    var vel = [(xRatio * dist / sum) * ((hero.x  > this.basedraw.x) ? 1 : -1),
               (yRatio * dist / sum) * ((hero.y  > this.basedraw.y) ? 1 : -1)];
    this.basedraw.x += vel[0];
    this.basedraw.y += vel[1];
    if (getSquareDist([this.basedraw.x, this.basedraw.y], [hero.x, hero.y]) < 100){
        hero.health -= this.damage;
        hero.forcedVelocity = [vel[0] / interval, vel[1] / interval];
        return true;
    }
    return false;
};


var PunchTrap = function(x, y, props){
    this.basedraw = new BaseDraw(x, y, props['color'], props['image']);
    for (var key in props){
        this[key] = props[key];
    }
    this.nextFire = 0;
    this.animating = 0;
    this.punch = null;
}

PunchTrap.prototype.isInRange = Trap.prototype.isInRange;

PunchTrap.prototype.update = function(interval, hero){
    this.nextFire = max(this.nextFire - interval, 0);
    if (this.nextFire <= 0 && this.isInRange(hero.x, hero.y)) {
	if (!this.punch){
            this.punch = new Punch(this.basedraw.x, this.basedraw.y, this.damage);
        }
    }
    if (this.punch && this.punch.update(interval, hero)){
        this.punch = null;
    }
};

PunchTrap.prototype.draw = function() {
    this.basedraw.draw();
    if (this.punch){
        this.punch.basedraw.draw();
    }
};

var makeTrap = function(x, y, props){
    return new props.fn(x, y, props);
}

var Villain = function(x, y){
    this.basedraw = new BaseDraw(x, y, '#00ff00');
    this.walkable = true;
};

var HeroStart = function(x, y){
    this.basedraw = new BaseDraw(x, y, '#ffffff');
    this.walkable = true;
};

var EmptySpace = function(x, y){
    this.basedraw = new BaseDraw(x, y, '#000000');
};

var clearScreen = function(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

var updateHud = function(hero, selectedTrap) {
    var moneyAmount = document.getElementById('moneyAmount'); moneyAmount.innerHTML = currencies.money;
    var minionsAmount = document.getElementById('minionsAmount'); minionsAmount.innerHTML = currencies.minions;
    var techAmount = document.getElementById('techAmount'); techAmount.innerHTML = currencies.tech;
    if (typeof hero !== 'undefined' && hero !== null) {
	var heroString = document.getElementById('hero'); heroString.innerHTML = 'health: ' + hero.health;
    } else {	
	var heroString = document.getElementById('hero'); heroString.innerHTML = '';
    }
    var selectedString = document.getElementById('selected');
    if (typeof selectedTrap !== 'undefined' && selectedTrap !== null) {
	selectedString.innerHTML = selectedTrap.name + ', range: ' + selectedTrap.range + ', damage: ' + selectedTrap.damage + ', fire rate: ' + selectedTrap.fireRate;
    } else {
	selectedString.innerHTML = '';
    }
    var levelNumber = document.getElementById('levelNumber'); levelNumber.innerHTML = game.currentLevel + 1;
}

var Map = function(){
    this.squares = [];
    this.traps = [];
    this.selectedTrap = null;

    for (var x = 0; x < 540; x += squareSize){
        this.traps.push(new Trap(x, 0, allTraps['lava pit']));
        this.traps.push(new Trap(x, 540 - squareSize, allTraps['lava pit']));
        this.traps.push(new Trap(0, x, allTraps['lava pit']));
        this.traps.push(new Trap(540 - squareSize, x, allTraps['lava pit']));
    }
    
    for (var x = squareSize; x < 540 - squareSize; x += squareSize){
        for (var y = squareSize; y < 540 - squareSize; y += squareSize){
            if ((x != 420 || y != 420) && (x != 0 || y != 0)){
                this.squares.push(new Square(x, y));
            }
        }
    }
    this.traps.push(new HeroStart(squareSize, squareSize));
    this.villain = new Villain(540 - 2 * squareSize, 540 - 2 * squareSize);
    this.traps.push(this.villain);
    bindHandler.bindFunction(this.getTouchFunction());
};

Map.prototype.draw = function(){
    clearScreen();
    for (var i = 0; i < this.squares.length; i++){
        this.squares[i].draw();
    }
    for (var j = 0; j < this.traps.length; j++){
        this.traps[j].basedraw.draw();
    }
    var selectedTrap = this.selectedTrap;
    if (selectedTrap !== null) {
	ctx.fillStyle = "#ff0000";
	ctx.fillRect(selectedTrap.basedraw.x, selectedTrap.basedraw.y, selectedTrap.basedraw.size, selectedTrap.basedraw.size);
    }
};

Map.prototype.getTouchFunction = function(){
    var that = this;
    return function(e){
        var pos = getPos(e);
	if (typeof game.currentMode.hero !== 'undefined') {
	    var hero = game.currentMode.hero;
	    for (var i = 0; i < hero.blocksTouching.length; i++) {
		if (containsPos(hero.blocksTouching[i].basedraw.getRect(), pos)) {
		    return;
		}
	    }
	}

	var selectedTrap = that.selectedTrap;
	var discount = game.hasModifier('cheap') ? .8 : 1;
	if (selectedTrap !== null) {
	    if (containsPos(selectedTrap.basedraw.getRect(), pos)) {
		for (var currency in selectedTrap.cost) {
		    currencies[currency] += Math.floor(discount * selectedTrap.cost[currency]);
		}
		var i;
		for (i = 0; i < that.traps.length; i++) {
		    if (that.traps[i] === selectedTrap) {
			break;
		    }
		}
		that.traps.splice(i, 1);
		that.squares.push(new Square(selectedTrap.basedraw.x, selectedTrap.basedraw.y));
		that.selectedTrap = null;
		return;
	    }
	}
        for (var i = 0; i < that.squares.length; i++){
            if (containsPos(that.squares[i].basedraw.getRect(), pos)){
		var trap = getTrap();
		for (var currency in trap['cost']) {
		    if (currencies[currency] < Math.floor(discount * trap['cost'][currency])) {
			alert('you are too poor. get more ' + currency);
			return;
		    }
		}
		for (var currency in trap['cost']) {
		    currencies[currency] -= Math.floor(discount * trap['cost'][currency]);
		}
                var square = that.squares[i];
                that.squares.splice(i, 1);
                that.traps.push(makeTrap(square.basedraw.x, square.basedraw.y, getTrap()));
		that.selectedTrap = that.traps[that.traps.length - 1];
		return;
            }
        }
        for (var i = 0; i < that.traps.length; i++){
            if (containsPos(that.traps[i].basedraw.getRect(), pos)){
		that.selectedTrap = that.traps[i];
		return;
	    }
	}
    };
};

Map.prototype.allThings = function(){
    var allThings = [];
    for (var i = 0; i < this.squares.length; i++){
        allThings.push(this.squares[i]);
    }
    for (var i = 0; i < this.traps.length; i++){
        allThings.push(this.traps[i]);
    }
    return allThings;
}

var allTraps = {
    'lava pit': {
	'name': 'Wall',
        'color': '#ffff00',
        'image': 'images/lava.png',
	'cost': {
	    'money': 10,
	    'minions': 0
	},
	'range': 0,
	'damage': 0,
	'fireRate': 0,
	'walkable': false,
        'fn': Trap
    },
    'turret': {
	'name': 'Turret',
        'color': '#cccccc',
	'cost': {
	    'money': 10,
	    'minions': 1
	},
	'range': 3 * squareSize,
	'damage': 5,
	'fireRate': 2,
	'walkable': false,
        'fn': Trap
    },
    'punch': {
        'name': 'Punchy',
        'color': '#aaaaaa',
        'cost': {
            'money': 10,
            'minions': 1
        },
        'range': 2 * squareSize,
        'damage': 2,
        'fireRate': 2,
        'walkable': false,
        'fn': PunchTrap
    }
};

var getTrap = function() {
    var traps = document.getElementById("traps").traps;
    var length = traps.length;
    for (var i = 0; i < length; i++) {
	if (traps[i].checked) {
	    return allTraps[traps[i].value];
	}
    }
};

var waveButtonPress = function(){};

var SetupLevel = function() {
    currencies.minions = personManager.people().length;
    this.map = new Map();
    this.active = true;
    waveButtonPress = this.makePressFunction();
};

SetupLevel.prototype.draw = function(){
    this.map.draw();
    updateHud(null, this.map.selectedTrap);
};

SetupLevel.prototype.update = function(interval) {
}

SetupLevel.prototype.makePressFunction = function() {
    var that = this;
    return function(){
	game.currentMode = new GameLevel(that.map);
	waveButtonPress = function(){};
    }
};

var Hero = function(x, y){
    this.x = x;
    this.y = y;
    this.health = 100;
    this.currentDirection = 0;
    this.directions = [[1,0],
                       [0,1],
                       [-1, 0],
                       [0, -1]];
    this.walkingBlock = undefined;
    this.blocksTouching = [];
    this.wasShot = false;
    this.forcedVelocity = [0, 0];
};

Hero.prototype.speed = 400;

Hero.prototype.update = function(interval, allThings){
    this.wasShot -= interval;
    var newX = this.x + this.directions[this.currentDirection][0] * this.speed * interval + this.forcedVelocity[0] * interval;
    var newY = this.y + this.directions[this.currentDirection][1] * this.speed * interval + this.forcedVelocity[1] * interval;
    var canMove = true;

    if (newX > 540 || newY > 540 || newX < 0 || newY < 0){
        canMove = false;
    }

    var blocksTouching = []
    for (var i = 0; i < allThings.length; i++){
        if (collideRect(allThings[i].basedraw.getRect(), this.getRect([newX, newY]))){
            blocksTouching.push(allThings[i]);
            if (!allThings[i].walkable){
                canMove = false;
                break;
            }
            else{
                var shouldSkip = false;
                for (var j = 0; j < this.blocksTouching.length; j++){
                    if (allThings[i] == this.blocksTouching[j]){
                        shouldSkip = true;
                        break;
                    }
                }

                if (shouldSkip){
                    continue;
                }
                
                if (allThings[i].hasBeenWalkedUpon){
                    canMove = false;
                }
                else{
                    this.walkingBlock = allThings[i];
                    this.walkingBlock.hasBeenWalkedUpon = true;
                    this.walkingBlock.basedraw.color = '#aa0000'
                }
            }
        }
    }
    
    if (canMove){
        this.x = newX;
        this.y = newY;
        this.blocksTouching = blocksTouching;
        this.forcedVelocity = [this.forcedVelocity[0] / 2, this.forcedVelocity[1] / 2];
        if (this.forcedVelocity[0] < 4 && this.forcedVelocity[1] < 4){
            this.forcedVelocity = [0, 0];
        }
    }
    else{
        this.forcedVelocity = [0, 0];
        this.currentDirection = undefined;
        for (var i = 0; i < this.directions.length && this.currentDirection == undefined; i++){
            var blockPos = this.snapSquare(this.directions[i]);
            for (var j = 0; j < allThings.length; j++){
                if (containsPos(allThings[j].basedraw.getRect(), blockPos)){
                    if (allThings[j].walkable && ! allThings[j].hasBeenWalkedUpon){
                        this.currentDirection = i;
                        break;
                    }
                }
            }
        }
        for (var i = 0; i < this.directions.length && this.currentDirection == undefined; i++){
            var blockPos = this.snapSquare(this.directions[i]);
            for (var j = 0; j < allThings.length; j++){
                if (containsPos(allThings[j].basedraw.getRect(), blockPos)){
                    if (!allThings[j].hasBeenWalkedUpon){
                        this.currentDirection = i;
                        allThings[j].walkable = true;
                        break;
                    }
                }
            }
        }
        for (var i = 0; i < this.directions.length && this.currentDirection == undefined; i++){
            var blockPos = this.snapSquare(this.directions[i]);
            for (var j = 0; j < allThings.length; j++){
                allThings[j].hasBeenWalkedUpon = false;
                if (containsPos(allThings[j].basedraw.getRect(), blockPos)){
                    this.currentDirection = i;
                    allThings[j].walkable = true;
                }
            }
        }
    }
};

Hero.prototype.snapSquare = function(direction){
    var basex = Math.floor(this.x / squareSize) * squareSize + squareSize / 2;
    var basey = Math.floor(this.y / squareSize) * squareSize + squareSize / 2;
    return [basex + direction[0] * squareSize,
            basey + direction[1] * squareSize];
};

Hero.prototype.getRect = function(pos){
    return [pos[0], pos[1], 20, 20];
};

var heroImage = new Image();
heroImage.src = 'images/hero.png';

Hero.prototype.draw = function(){
    ctx.drawImage(heroImage,this.x,this.y,20,20);
    if (this.wasShot > 0){
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 7, this.y + 7, 6, 6);
    }
};

var getPersonSalary = function(person) {
    return game.hasModifier('minionSalaryIncrease') ? person.salary + parseInt(game.getModifier('minionSalaryIncrease')[1]) : person.salary;
}

var personManager = (function(){
    var people = [];

    var getRandomPerson = function(){
        return {
            'name': 'a',
            'salary': 10
        };
    }

    for (var i = 0; i < 10; i++){
        people.push(getRandomPerson());
    }
    
    return {
        'getRandomPerson': getRandomPerson,
        'generatePotentialPeople': function(n){
            var potentials = [];
            for (var i =0; i < n; i++){
                potentials.push(getRandomPerson());
            }
            return potentials;
        },
        'hire': function(person){
            if (currencies.money >= getPersonSalary(person)){
                people.push(person);
                currencies.money -= getPersonSalary(person);
                return true;
            }
            return false;
        },
        'people': function(){
            return people;
        },
        'salary': function(){
            var total = 0;
            for (var i = 0; i < people.length; i++){
                total += getPersonSalary(people[i]);
            }
            return total;
        }
    }
})();

var hireButtonPress = function(){};

var fireButtonPress = function(){
    alert("They're unionized.");
};

var expensesButtonPress = function(){
    document.getElementById('manager').style.display = 'none';
    document.getElementById('hireList').style.display = 'block';
    var people = personManager.people();
    var html = 'People: ' + people.length + ' Money: ' + currencies.money + ' Cost: ' + personManager.salary();
    html += '<table><tr><th>Name</th><th>Salary</th></tr>';
    for (var i = 0; i < people.length; i++){
        html += '<tr><td>' + people[i].name + '</td><td>' + getPersonSalary(people[i]) + '</td></tr>';
    }
    html += '</table>';
    html += '<input onclick=\"homeButtonPress()\" type=\"button\" value=\"Home\" />'
    document.getElementById('hireList').innerHTML = html;
};

var schemeButtonPress = function(){
};

var hirePerson = function(){};

var homeButtonPress = function(){
    document.getElementById('game').style.display = 'none';
    document.getElementById('manager').style.display = 'block';
    document.getElementById('hireList').style.display = 'none';
};

var ManagerLevel = function(){
    homeButtonPress();
    this.running = true;
    this.potentials = personManager.generatePotentialPeople(5);
    
    this.hiredPeople = [];
    var that = this;
    schemeButtonPress = function(){
        that.running = false;
    }
    
    hireButtonPress = function(){
        document.getElementById('manager').style.display = 'none';
        document.getElementById('hireList').style.display = 'block';
        var html = 'People: ' + personManager.people().length + ' Money: ' + currencies.money;
        html += '<table><tr><th>Name</th><th>Salary</th><th>Actions</th></tr>';
        for (var i = 0; i < that.potentials.length; i++){
            var props = that.potentials[i]
            html += '<tr><td>'+props.name+'</td><td>'+getPersonSalary(props)+'</td><td><input onclick=\"hirePerson(' + i + ')\" type=\"button\" value=\"Hire\" /></td></tr>';
        }
        html += '</table>';
        html += '<input onclick=\"homeButtonPress()\" type=\"button\" value=\"Home\" />'
        document.getElementById('hireList').innerHTML = html;
    };
    hirePerson = function(i){
        var person = that.potentials[i];
        personManager.hire(person);
        that.potentials.splice(i, 1);
        hireButtonPress();
    };
    schemeButtonPress = function(){
        that.running = false;
    }
};

ManagerLevel.prototype.draw = function(){
};

ManagerLevel.prototype.update = function(){
    if (!this.running){
        document.getElementById('game').style.display = 'block';
        document.getElementById('manager').style.display = 'none';
        document.getElementById('hireList').style.display = 'none'
        game.currentMode = new SetupLevel();
    }
};

var GameLevel = function(map) {
    this.map = map;
    this.hero = new Hero(squareSize + 10, squareSize + 10);
    this.villain = map.villain;
};

GameLevel.prototype.changeModeForLevelEnd = function(victory) {
    bindHandler.clear();
    game.currentMode = new ResultsMode(victory);
}

GameLevel.prototype.checkLevelEnded = function() {
    if (containsPos(this.villain.basedraw.getRect(), [this.hero.x + 10, this.hero.y + 10])) {
	this.changeModeForLevelEnd(true);
    }
    if (this.hero.health <= 0) {
	this.changeModeForLevelEnd(false);
    }
}

GameLevel.prototype.draw = function(){
    this.map.draw();
    this.hero.draw();
};

GameLevel.prototype.update = function(interval){
    var allThings = this.map.allThings();
    this.hero.update(interval, allThings);
    for (var i = 0; i < allThings.length; i++){
	if (typeof allThings[i].update !== 'undefined') {
	    allThings[i].update(interval, this.hero);
	}
    }
    updateHud(this.hero, this.map.selectedTrap);
    this.checkLevelEnded();
};

var ResultsMode = function(victory) {
    game.incrementLevel();
    this.drawScreen(victory);
    // waveButtonPress = this.makePressFunction();
    this.isFinished = false;
    bindHandler.clear();
    bindHandler.bindFunction(this.makeFinishScreen());
};

ResultsMode.prototype.makeFinishScreen = function(){
    var that = this;
    return function(){
        that.isFinished = true;
    }
}

ResultsMode.prototype.drawScreen = function(victory) {
    var heroString = document.getElementById('hero');
    heroString.innerHTML = '';
    clearScreen();
    ctx.font = '20pt Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    var text;
    if (victory) {
	text = 'The hero got to you but you escaped! Huzzah!';
    } else {
	text = 'You killed the hero. Your life is now meaningless.';
    }
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

ResultsMode.prototype.update = function(interval) {
    if (this.isFinished){
        game.currentMode = new ManagerLevel();
    }
}

ResultsMode.prototype.draw = function() {
    updateHud();
}

ResultsMode.prototype.makePressFunction = function() {
    var that = this;
    return function() {
	game.currentMode = new TechMode();
    }
}

var TechElement = function(x, y, tech) {
    this.basedraw = new BaseDraw(x, y, '#ffffff');
    this.tech = tech;
    this.children = [];
}

TechElement.prototype.draw = function() {
    if (game.hasModifier(this.tech['id'])) {
	this.basedraw.draw('#aaaaaa');
    } else {
	this.basedraw.draw();
    }
    ctx.font = '10pt Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    ctx.fillText(this.tech['description'], this.basedraw.x + squareSize / 2, this.basedraw.y + squareSize / 2);

    ctx.strokeStyle = 'black';
    for (var i = 0; i < this.children.length; i++) {
	ctx.beginPath();
	ctx.moveTo(this.connectPoint()[0], this.connectPoint()[1]);
	ctx.lineTo(this.children[i].connectPoint()[0], this.children[i].connectPoint()[1]);
	ctx.stroke();
    }
}

TechElement.prototype.connectPoint = function() {
    return [this.basedraw.x + squareSize / 2, this.basedraw.y + squareSize / 2];
}

var TechMode = function() {
    clearScreen();
    waveButtonPress = this.makePressFunction();
    this.techElements = [];
    this.generateTechElements();
    bindHandler.bindFunction(this.getTouchFunction());
}

TechMode.prototype.generateTechElements = function() {
    var initial = squareSize;
    var x = initial;
    var y = initial;
    for (var i = 0; i < villainTechTree.length; i++) {
	this.techElements.push(new TechElement(x, y, villainTechTree[i]));
	x += 2 * squareSize;
	if (x >= 480) {
	    x = initial;
	    y += 2 * squareSize;
	}
    }
    for (var i = 0; i < this.techElements.length; i++) {
	var techElement = this.techElements[i];
	var children = techElement.tech['children'];
	for (var j = 0; j < children.length; j++) {
	    for (var k = 0; k < this.techElements.length; k++) {
		var potentialChild = this.techElements[k];
		if (potentialChild.tech['id'] === children[j]) {
		    techElement.children.push(potentialChild);
		    break;
		}
	    }
	}
    }
}

TechMode.prototype.update = function(interval) {
}

TechMode.prototype.draw = function() {
    clearScreen();
    updateHud();
    for (var i = 0; i < this.techElements.length; i++) {
	this.techElements[i].draw();
    }
}

TechMode.prototype.makePressFunction = function() {
    var that = this;
    return function() {
	bindHandler.clear();
	game.currentMode = new SetupLevel();
    }
}

TechMode.prototype.getTouchFunction = function() {
    var that = this;
    return function(e){
        var pos = getPos(e);
        for (var i = 0; i < that.techElements.length; i++){
            if (containsPos(that.techElements[i].basedraw.getRect(), pos)){
		var techElement = that.techElements[i];
		if (currencies['tech'] < techElement.tech['cost']) {
		    alert('you are too poor. get more tech');
		    return;
		}
		var canResearch = true;
		for (var j = 0; j < villainTechTree.length; j++) {
		    for (var k = 0; k < villainTechTree[j]['children'].length; k++) {
			if (villainTechTree[j]['children'][k] === techElement['tech']['id']) {
			    if (!game.hasModifier(villainTechTree[j]['id'])) {
				canResearch = false;
				break;
			    }
			}
		    }
		    if (!canResearch) {
			break;
		    }
		}
		if (!canResearch) {
		    alert('you need to research the prerequisite first');
		    return;
		}
		if (!game.hasModifier(techElement.tech['id'])) {
		    currencies['tech'] -= techElement.tech['cost'];
		    game.addModifier([techElement.tech['id']]);
		}
            }
        }
    };
}

var levelSetup = [{'currencies': {'money': 200, 'tech': 0, 'minions': 10}},
                  {'currencies': {'money': 300, 'tech': 3, 'minions': 10}}];

var button1Callback = function(){};

var button2Callback = function(){};

var okButtonCallback = function(){};

var hidePopup = function() {
    document.getElementById('popupBlocker').style.visible = 'hidden';
    document.getElementById('popupMessage').style.visible = 'hidden';
}

var showPopup = function(title, text, okCallback, okText, oneCallback, oneText, twoCallback, twoText) {
    // document.getElementById('popupBlocker').style.visible = 'visible';
    // document.getElementById('popupMessage').style.visible = 'visible';
    // document.getElementById('popupTitle').innerHTML = title;
    // document.getElementById('popupText').innerHTML = text;
    // var okButton = document.getElementById('okButton');
    // var button1 = document.getElementById('button1');
    // if (typeof okCallback !== 'undefined' && okCallback != null) {
    // 	okButton.style.visible = 'visible';
    // 	okButtonCallback = okCallback;
    // 	okButton.value = okText;
    // } else {
    // 	okButton.style.visible = 'hidden';
    // }
    // WIP
}

var button1Press = function() {
    hidePopup();
    button1Callback();
}

var button2Press = function() {
    hidePopup();
    button2Callback();
}

var okButtonPress = function() {
    hidePopup();
    okButtonCallback();
}

var parseEventEffect = function(effect) {
    var array = effect.split('|');
    return array;
}

var Game = function() {
    this.currentLevel = 0;
    this.modifiers = [];
}

Game.prototype.getModifier = function(modifier) {
    for (var i = 0; i < this.modifiers.length; i++) {
	if (this.modifiers[i][0] === modifier) {
	    return this.modifiers[i];
	}
    }
    return null;
}

Game.prototype.hasModifier = function(modifier) {
    return this.getModifier(modifier) != null;
}

Game.prototype.addModifier = function(modifier) {
    if (modifier[0] === 'tempReduceCurrency') {
	var change = modifier[1].split(':');
	currencies[change[0]] = max(currencies[change[0]] - parseInt(currencies[change[1]]), 0);
    }
    this.modifiers.push(modifier);
}

Game.prototype.initialize = function() {
    this.updateForLevel();
    this.currentMode = new SetupLevel();
}

Game.prototype.updateForLevel = function() {
    var level = levelSetup[this.currentLevel];
    currencies.money += level['currencies']['money'];
    if (this.hasModifier('research')) {
	currencies.tech += Math.ceil(level['currencies']['tech'] * 1.5);
    } else {
	currencies.tech += level['currencies']['tech'];
    }	
    updateHud();
}

Game.prototype.removeTemporaryModifiers = function() {
    var removed = 0;
    var length = this.modifiers.length;
    for (var i = 0; i < length; i++) {
	var modifierID = this.modifiers[i - removed][0];
	for (var j = 0; j < temporaryModifiers.length; j++) {
	    if (modifierID === temporaryModifiers[j]) {
		this.modifiers.splice(i - removed, 1);
		removed++;
		break;
	    }
	}
    }
}

Game.prototype.incrementLevel = function() {
    this.currentLevel = min(levelSetup.length - 1, this.currentLevel + 1);
    this.removeTemporaryModifiers();
    this.updateForLevel();
}

Game.prototype.update = function(interval) {
    this.currentMode.update(interval);
}

Game.prototype.draw = function(draw) {
    this.currentMode.draw();
};

var getFrameFunctions = function(){
    game = new Game();
    game.initialize();
    return {
        'update': function(){
            var interval = timeFeed.getInterval();
            game.update(interval);
        },
        'draw': function(){
            game.draw();
        }
    }
};

var main = function(){
    var functions = getFrameFunctions();
    var tickFun = function(){
        functions.update();
        functions.draw();
        requestAnimFrame(tickFun, canvas);
    };
    tickFun();
}

window.onload = main;
