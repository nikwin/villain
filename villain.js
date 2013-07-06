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

var BaseDraw = function(x, y, color){
    this.x = x;
    this.y = y;
    this.color = color;
}

BaseDraw.prototype.size = squareSize;

BaseDraw.prototype.draw = function(){
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y + this.size);
    ctx.lineTo(this.x + this.size, this.y + this.size);
    ctx.lineTo(this.x + this.size, this.y);
    ctx.closePath();
    ctx.stroke();
};

BaseDraw.prototype.getRect = function(){
    return [this.x, this.y, this.size, this.size];
}


var Square = function(x, y){
    this.basedraw = new BaseDraw(x, y, '#663300');
};

var Trap = function(x, y, props){
    this.basedraw = new BaseDraw(x, y, props['color']);
};

var Villain = function(x, y){
    this.basedraw = new BaseDraw(x, y, '#00ff00');
}

var HeroStart = function(x, y){
    this.basedraw = new BaseDraw(x, y, '#ffffff');
}

var EmptySpace = function(x, y){
    this.basedraw = new BaseDraw(x, y, '#000000');
}

var Map = function(){
    this.squares = [];
    this.traps = [];
    for (var x = 0; x < 480; x += squareSize){
        for (var y = 0; y < 480; y += squareSize){
            if ((x != 420 || y != 420) && (x != 0 || y != 0)){
                this.squares.push(new Square(x, y));
            }
        }
    }
    this.traps.push(new HeroStart(0, 0));
    this.traps.push(new Villain(420, 420));
    bindHandler.bindFunction(this.getTouchFunction())
};

Map.prototype.draw = function(){
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 1000, 1000);
    for (var i = 0; i < this.squares.length; i++){
        this.squares[i].basedraw.draw();
    }
    for (var j = 0; j < this.traps.length; j++){
        this.traps[j].basedraw.draw();
    }
};

Map.prototype.getTouchFunction = function(){
    var that = this;
    return function(e){
        var pos = getPos(e);
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
            }
        }
    };
};

var allTraps = {
    'one': {
        'color': '#ffff00',
	'cost': {
	    'money': 10,
	    'minions': 1
	}
    },
    'two': {
        'color': '#cccc00',
	'cost': {
	    'money': 10,
	    'minions': 1
	}
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

var GameLevel = function(){
    this.map = new Map();
    currencies.money = 1000;
    currencies.tech = 0;
    currencies.minions = 10;
};

GameLevel.prototype.draw = function(){
    this.map.draw();
}

var getFrameFunctions = function(){
    var gamelevel = new GameLevel();
    return {
        'update': function(){

        },
        'draw': function(){
            gamelevel.draw();
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
