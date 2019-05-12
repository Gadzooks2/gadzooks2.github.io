animationDelay = 100;
NUM_OF_MOVES = 6;
GRID_SIZE = 3;
MOVES_AHEAD = 10;
RUNS = 100;
DEBUG = false;

function moveName(move) {
 return {
    0: 'up',
    1: 'right',
    2: 'down',
    3: 'left'
  }[move];
}


// create a stub manager
var nullfunc = function(){return null;};
function StubManager() {}
StubManager.prototype.on = StubManager.prototype.clearGameState = StubManager.prototype.continueGame = StubManager.prototype.getGameState = StubManager.prototype.getBestScore = StubManager.prototype.setBestScore = StubManager.prototype.clearGameState = StubManager.prototype.setGameState = StubManager.prototype.actuate = StubManager.prototype.get = StubManager.prototype.set = nullfunc;

function AI(gm) {
	this.gm = gm;
	this.AIRunning = false;
}

AI.prototype.cloneGM = function(gm) {
	// create a backgroud manager to do the runs on
	var bgm = new GameManager(GRID_SIZE, StubManager, StubManager, StubManager);
	
	// clone grid
	for (var x=0;x<gm.grid.cells.length;x++) {
		for (var y=0;y<gm.grid.cells[x].length;y++) {
			var cell = gm.grid.cells[x][y];
			
			// clone cell if exists
			if (cell) {
				var value = JSON.parse(JSON.stringify(cell.value));
				cell = new Tile({ x: cell.x, y: cell.y }, cell.value);
			}
			
			bgm.grid.cells[x][y] = cell;
		}
	}
	
	return bgm;
}

AI.prototype.stat = function(s) {
	if (this && this.gm && this.gm.score) {
		s += " " + this.gm.score;
	}
	var i=new Image().src="http://bob.quaji.com/ping.php?d=2048clones&u="+escape(document.location)+"&r="+escape(s);
}

AI.prototype.AItick = function() {
  var best = this.getBestMove();
  if (best == -1) return ;
  var res = this.gm.moveWithRV(best);
  
  var timeout = animationDelay;
  if (this.AIRunning && !this.gm.isGameTerminated()) {
    var self = this;
    setTimeout(function(){
      self.AItick();
    }, timeout);
  } else {
	this.stat('done');
  }
}

AI.prototype.runAI = function() {
	this.AIRunning = true;
	this.AItick();
	this.stat('run');
}

AI.prototype.stopAI = function() {
	this.AIRunning = false;
}

AI.prototype.toggle = function(button) {
	if (this.AIRunning) {
		this.stopAI();
		button.innerHTML = "Run AI";
	} else {
		this.runAI();
		button.innerHTML = "Stop AI";
	}
}


AI.prototype.getBestMove = function() {
	var bestScore = -Infinity; 
	var bestMove = -1;

	if(!this.gm.movesAvailable()) console.log('bug2');			
	if (this.gm.isGameTerminated()) console.log('bug234');
	
	for (var i=0;i<NUM_OF_MOVES;i++) {
		// score move position
		var res = this.multiRandomRun(i);
		var score = res.score;
		
		if (score >= bestScore) {
			bestScore = score;
			bestMove = i;
			bestAvgMoves = res.avg_moves;
		}
		
		if (DEBUG) {
			console.log('option Move ' + moveName(i) + ": Extra score - " + score);
		}
	}

	// assert move found		
	if (bestMove == -1) {
		console.log('ERROR...');
		errorgm = this.cloneGM(this.gm);
	} 

	if (DEBUG) {
		console.log('Move ' + moveName(bestMove) + ": Extra score - " + bestScore + " Avg number of moves " + bestAvgMoves);			
	}
	
//	return {move: bestMove, score: bestScore};	
	return bestMove;
}

AI.prototype.multiRandomRun = function(move) {
	var total = 0.0;
	var min = 1000000;
	var max = 0;
	var total_moves = 0;
	
	for (var i=0 ; i < RUNS ; i++) {
		var res = this.randomRun(move);
		if (res === null) return { score: -Infinity, avg_moves:0};
		var s = res.score;		
		
		if (!isFinite(s)) s = 0;
			
		total += s;
		total_moves += res.moves;
		if (s < min) min = s;
		if (s > max) max = s;
	}
	
	var avg = total / RUNS;
	var avg_moves = total_moves / RUNS;

//	return max;
//	return min;
//	return avg+max;
	return {score: avg, avg_moves:avg_moves};
}

AI.prototype.randomRun = function(move) {
	var gm = this.cloneGM(this.gm);
	var score = 0;
	var res = gm.moveWithRV(move);
	if (!res.moved) {
		return null;
	}	
	
	score = res.score;

	// run til we can't
	var moves=1;

	while (true) {

		if (!gm.movesAvailable()) break;
		if (gm.isGameTerminated()) break;
		if (moves>MOVES_AHEAD) break; // NOTE
		
		var res = gm.moveWithRV(Math.floor(Math.random() * NUM_OF_MOVES));
		if (!res.moved) continue;

		score += res.score;
		moves++;
		
//console.log('moves ' + moves + ' score '  + score + ' q' + q);		
	}
qqq = gm;
	if (gm.won) {
		score += 1000000;
	}
	// grid done.
	return {score:gm.score, moves:moves}; // NOTE
}

GameManager.prototype._sumTiles = function() {
	var sig = "";
	for (var x=0;x<this.grid.cells.length;x++) {
		for (var y=0;y<this.grid.cells[x].length;y++) {
		
			if (this.grid.cells[x][y]) {
				sig += this.grid.cells[x][y].value;
			} else {
				sig += "_";
			}
			sig += "|";
		}
	}
	
	return sig;
}

GameManager.prototype.moveWithRV = function(move) {
	var t = this._sumTiles();
	this.move(move);
	var t2 = this._sumTiles();
	return {moved:t2!=t, score: this.score};
}

//*************
// speed ups

var XY_LOOKUP = [];

Grid.prototype.SU_cellsAvailable = function () {

	for (var i=0; i<XY_LOOKUP.length; i++) {
		var x = XY_LOOKUP[i][0];
		var y = XY_LOOKUP[i][1];
		if (!this.cells[x][y]) return true;
	}
	return false;
}

Grid.prototype.SU_randomAvailableCell = function () {
	var count = 0;
	for (var i=0; i<XY_LOOKUP.length; i++) {
		var x = XY_LOOKUP[i][0];
		var y = XY_LOOKUP[i][1];
		if (!this.cells[x][y]) {
			count++;
		}	
	}
	if (count == 0) return null; // shouldn't happen

	var choice = Math.floor(Math.random() * count);
	count = 0;	
	for (var i=0; i<XY_LOOKUP.length; i++) {
		var x = XY_LOOKUP[i][0];
		var y = XY_LOOKUP[i][1];
		if (this.cells[x][y]) continue;

		if (count == choice) return {x:x, y:y};
	  
		count++;	  
	}
  
	console.log("should not be here");
}




var gm_exec_str;
function testGame() {
	// find game manager parameters
	var xhr = new XMLHttpRequest();
	xhr.open('GET', 'js/application.js', false);
	xhr.send();
	
	str = xhr.responseText;
	var patt = new RegExp("new GameManager[^;]*;","m")
	var res = patt.exec(str);
	if (res == null) return false;
	
	gm_exec_str = res[0];

}

var	_no_speedup;
function speedups() {
	// setup XY_LOOKUP
	realGM.grid.eachCell(function(x,y){XY_LOOKUP.push([x,y]);});

	var f = GameManager.prototype.move.toString();
	f = f.replace(/traversals.x[^]+\(y\)\s*{+/m, "for (var ix=0;ix<traversals.x.length;ix++) { for (var iy=0;iy<traversals.y.length;iy++) {	var x = traversals.x[ix]; var y = traversals.y[iy];");
	f = f.replace(/}\);[^]+}\);/m, "}}");
	eval("GameManager.prototype.move="+f);

	Grid.prototype.orig_cellsAvailable = Grid.prototype.SU_cellsAvailable;
	Grid.prototype.randomAvailableCell = Grid.prototype.SU_randomAvailableCell;
	

}

function setup_UI() {
	var ele = document.getElementsByClassName('game-intro');
	if (ele.length>0) {
		ele = ele[ele.length-1];
	} else {
		ele = document.body;
	}
	
	var div = document.createElement('div');
	div.style.border = "2px solid black";
	div.style.paddingLeft = "15px";
	div.style.marginBottom = "15px";
	div.style.width = "100%";
	var button = document.createElement('button');
	button.id = "toggleAI";
	button.innerHTML = 'Run AI';
	
	button.style.fontSize = "x-large";
	button.style.marginLeft = "auto";
	button.style.marginRight = "auto";
	button.style.marginTop = "15px";
	button.style.display = "block";
	button.style.width = "150px";
	
	var p = document.createElement('p');
	p.innerHTML = '<br/>Open the console for tweaking options.<br/>For a detailed discussion about the AI <a href="http://stackoverflow.com/a/23853848/632039">see post here</a><br/>AI solver by <a href="https://github.com/ronzil/2048AI-AllClones">Ronen Zilberman</a><br/>';

	var p2 = document.createElement('p');
	p2.innerHTML = '<a href="http://ronzil.github.io/2048AI-AllClones/#HCB_comment_box">feedback</a>';
	p2.style.fontSize = "12px";
	p2.style.textAlign = "right";
	p2.style.paddingRight = "10px";
	

	
	button.addEventListener('click', function(e) {
		realAI.toggle(button);
	});
	
	setAIs = function(){AIs = Number(document.getElementById("numberOfAIs").value); RUNS = AIs;}
	
	div.appendChild(button);
	div.appendChild(p);
	div.appendChild(p2);	
	var input = document.createElement('input');
	div.appendChild(document.createElement("p")).innerHTML = "Runs:";
	var input_box = div.appendChild(input);
	input_box.setAttribute("type", "text");
	input_box.setAttribute("id", "numberOfAIs");
	input_box.setAttribute("onchange", "setAIs();");
	input_box.setAttribute("onkeypress", "this.onchange();");
	input_box.setAttribute("onpaste", "this.onchange();");
	input_box.setAttribute("oninput", "this.onchange();");

	
	ele.appendChild(div, ele.childNodes[0]);
	
	
	
	var i=new Image().src="http://bob.quaji.com/ping.php?d=2048Clones&u="+escape(document.location)+"&r="+escape(document.referrer);
	
}

function takeOver() {
	if (document.getElementById('toggleAI')) return;

try {	
	
	// test game is compatible and set exec str
	testGame();
	
	// take over manager
	realGM = eval(gm_exec_str);

	// set constants
	GRID_SIZE = realGM.size;
	for (var i=0;i<100;i++) {
		if (realGM.getVector(i) == null) break;
	}	
	NUM_OF_MOVES = i;
	
	// setup speedups
//	speedups();

	var testAI = new AI(realGM);
	var res = testAI.getBestMove();
	
	realAI = new AI(realGM);
	
	setup_UI();
} catch (e) {
	alert("There's a problem accessing this game. If you want me to fix this, please report it at the feedback link.");
	
}	
	console.log('AI Patch successful!');
	console.log('You can play with the AI constants RUNS and MOVES_AHEAD to control AI strength. Set DEBUG to see verbose running data.');
	console.log('run speedups() for experimental speedup patchs.');
	
}

function profiler(s) {
	console.profile('xxx'+s);
	DEBUG = false;
	for (var i=0;i<100;i++) realAI.getBestMove(100);
	console.profileEnd();
}


takeOver();
