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

Square.prototype.draw = function() {
    this.basedraw.draw(ctx.createPattern(bgImage, "repeat"), "#CCCCCC");
}

bgImage.src = 'images/tileBG.png';


var Trap = function(x, y, props){
    this.basedraw = new BaseDraw(x, y, props['color'], props['image']);
    this.name = props['name'];
    this.range = props['range'];
    this.damage = props['damage'];
    this.fireRate = props['fireRate'];
    this.walkable = props['walkable'];
    this.nextFire = 0;
    this.cost = props['cost'];
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
    hero.health -= this.damage;
    this.nextFire = 1 / this.fireRate;
}

Trap.prototype.update = function(interval, hero) {
    this.fire(hero, interval);
}

Trap.prototype.draw = function() {
    this.basedraw.draw();
    ctx.fillText(this.nextFire, this.basedraw.x, this.basedraw.y);
}

var Villain = function(x, y){
    this.basedraw = new BaseDraw(x, y, '#00ff00');
};

var HeroStart = function(x, y){
    this.basedraw = new BaseDraw(x, y, '#ffffff');
    this.walkable = true;
};

var EmptySpace = function(x, y){
    this.basedraw = new BaseDraw(x, y, '#000000');
};

var clearScreen = function(){
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 1000, 1000);
}

var Map = function(){
    this.squares = [];
    this.traps = [];
    this.selectedTrap = null;
    for (var x = 0; x < 480; x += squareSize){
        for (var y = 0; y < 480; y += squareSize){
            if ((x != 420 || y != 420) && (x != 0 || y != 0)){
                this.squares.push(new Square(x, y));
            }
        }
    }
    this.traps.push(new HeroStart(0, 0));
    this.villain = new Villain(420, 420);
    this.traps.push(this.villain);
    bindHandler.bindFunction(this.getTouchFunction())
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
	var selectedTrap = that.selectedTrap;
	if (selectedTrap !== null) {
	    if (containsPos(selectedTrap.basedraw.getRect(), pos)) {
		for (var currency in selectedTrap.cost) {
		    currencies[currency] += selectedTrap.cost[currency];
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
		    if (currencies[currency] < trap['cost'][currency]) {
			alert('you are too poor. get more ' + currency);
			return;
		    }
		}
		for (var currency in trap['cost']) {
		    currencies[currency] -= trap['cost'][currency];
		}
                var square = that.squares[i];
                that.squares.splice(i, 1);
                that.traps.push(new Trap(square.basedraw.x, square.basedraw.y, getTrap()));
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
	'walkable': false
    },
    'two': {
	'name': 'Two',
        'color': '#cccc00',
	'cost': {
	    'money': 10,
	    'minions': 1
	},
	'range': 3 * squareSize,
	'damage': 1,
	'fireRate': 2,
	'walkable': false
    }
}

var getTrap = function() {
    var traps = document.getElementById("traps").traps;
    var length = traps.length;
    for (var i = 0; i < length; i++) {
	if (traps[i].checked) {
	    return allTraps[traps[i].value];
	}
    }
};

var buttonPress = function(){};

var SetupLevel = function(game) {
    this.game = game;
    this.map = new Map();
    currencies.money = 1000;
    currencies.tech = 0;
    currencies.minions = 10;
    this.active = true;
    buttonPress = this.makePressFunction();
};

SetupLevel.prototype.draw = function(){
    this.map.draw();
};

SetupLevel.prototype.update = function(interval) {
    var moneyAmount = document.getElementById('moneyAmount'); moneyAmount.innerHTML = currencies.money;
    var minionsAmount = document.getElementById('minionsAmount'); minionsAmount.innerHTML = currencies.minions;
    var techAmount = document.getElementById('techAmount'); techAmount.innerHTML = currencies.tech;
    var selectedString = document.getElementById('selected');
    var selectedTrap = this.map.selectedTrap;
    if (selectedTrap !== null) {
	selectedString.innerHTML = selectedTrap.name + ', range: ' + selectedTrap.range + ', damage: ' + selectedTrap.damage + ', fire rate: ' + selectedTrap.fireRate;
    } else {
	selectedString.innerHTML = '';
    }
}

SetupLevel.prototype.makePressFunction = function() {
    var that = this;
    return function(){
	that.game.currentMode = new GameLevel(that.game, that.map);
    }
};

var Hero = function(x, y){
    this.x = x;
    this.y = y;
    this.health = 1000;
    this.currentDirection = 0;
    this.directions = [[1,0],
                       [0,1],
                       [-1, 0],
                       [0, -1]];
    this.walkingBlock = undefined;
    this.blocksNotWalked = [];
};

Hero.prototype.speed = 60;

Hero.prototype.update = function(interval, allThings){
    var newX = this.x + this.directions[this.currentDirection][0] * this.speed * interval;
    var newY = this.y + this.directions[this.currentDirection][1] * this.speed * interval;
    var canMove = true;

    if (newX > 480 || newY > 480 || newX < 0 || newY < 0){
        canMove = false;
    }

    for (var i = 0; i < allThings.length; i++){
        if (containsPos(allThings[i].basedraw.getRect(), [newX, newY])){
            if (!allThings[i].walkable){
                canMove = false;
                break;
            }
            else if (this.walkingBlock != allThings[i]){
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
    }
    else{
        this.currentDirection = undefined;
        for (var i = 0; i < this.directions.length; i++){
            var blockPos = [this.x + this.directions[i][0] * squareSize,
                            this.y + this.directions[i][1] * squareSize];
            for (var j = 0; j < allThings.length; j++){
                if (containsPos(allThings[j].basedraw.getRect(), blockPos)){
                    if (allThings[j].walkable && ! allThings[j].hasBeenWalkedUpon){
                        this.currentDirection = i;
                        break;
                    }
                }
            }
        }
        if (this.currentDirection == undefined){
            for (var i = 0; i < this.directions.length; i++){
                var blockPos = [this.x + this.directions[i][0] * squareSize,
                                this.y + this.directions[i][1] * squareSize];
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
        }
        if (this.currentDirection == undefined){
            for (var i = 0; i < this.directions.length; i++){
                var blockPos = [this.x + this.directions[i][0] * squareSize,
                                this.y + this.directions[i][1] * squareSize];
                for (var j = 0; j < allThings.length; j++){
                    allThings[j].hasBeenWalkedUpon = false;
                    if (containsPos(allThings[j].basedraw.getRect(), blockPos)){
                        this.currentDirection = i;
                        allThings[j].walkable = true;
                    }
                }
            }
        }
    }
};

var heroImage = new Image(); heroImage.src = 'images/hero.png';
var heroPattern = ctx.createPattern(heroImage,'no-repeat');


Hero.prototype.draw = function(){
    ctx.drawImage(heroImage,this.x,this.y,20,20);
    var heroString = document.getElementById('hero');
    heroString.innerHTML = 'health: ' + this.health;
};

var GameLevel = function(game, map) {
    this.game = game;
    this.allThings = map.allThings();
    this.hero = new Hero(10, 10);
    this.villain = map.villain;
};

GameLevel.prototype.changeModeForLevelEnd = function() {
	this.game.currentMode = new BetweenLevels(this.game);
}

GameLevel.prototype.checkLevelEnded = function() {
    if (containsPos(this.villain.basedraw.getRect(), [this.hero.x + 10, this.hero.y + 10])) {
	alert('hero got to villain');
	this.changeModeForLevelEnd();
    }
    if (this.hero.health <= 0) {
	alert('hero died');
	this.changeModeForLevelEnd();
    }
}

GameLevel.prototype.draw = function(){
    for (var i = 0; i < this.allThings.length; i++){
	if (typeof this.allThings[i].draw !== 'undefined') {
	    this.allThings[i].draw();
	} else {
            this.allThings[i].basedraw.draw();
	}
    }
    this.hero.draw();
};

GameLevel.prototype.update = function(interval){
    for (var i = 0; i < this.allThings.length; i++){
	if (typeof this.allThings[i].update !== 'undefined') {
	    this.allThings[i].update(interval, this.hero);
	}
    }
    this.hero.update(interval, this.allThings);
    this.checkLevelEnded();
};

var BetweenLevels = function(game) {
    this.game = game;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    buttonPress = this.makePressFunction();
}

BetweenLevels.prototype.update = function(interval) {
}

BetweenLevels.prototype.draw = function() {
}

BetweenLevels.prototype.makePressFunction = function() {
    var that = this;
    return function() {
	that.game.currentMode = new SetupLevel(that.game);
    }
}

var Game = function() {
    this.currentMode = new SetupLevel(this);
}

Game.prototype.update = function(interval) {
    this.currentMode.update(interval);
}

Game.prototype.draw = function(draw) {
    this.currentMode.draw();
}

var getFrameFunctions = function(){
    var update = function(){}, draw=function(){};
    var game = new Game();
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
