"use strict";
//* html elements ---------------------------------------------
const blueCode = document.getElementById("blueCode").value;
const redCode = document.getElementById("redCode").value;
const run = document.querySelector("#run");
const stop = document.querySelector("#stop");
const boardEl = document.querySelector("#board");
const bheight = boardEl.height;
const bwidth = boardEl.width;
const ctx = boardEl.getContext("2d");
ctx.fillStyle = "black";
//* -----------------------------------------------------------

//* Helpers ---------------------------------------------------
const BOARD_SIZE = 8000;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const numb = field => {
	if (
		field[0] === "#" ||
		field[0] === "@" ||
		field[0] === "*" ||
		field[0] === "<" ||
		field[0] === "{" ||
		field[0] === "}" ||
		field[0] === ">"
	) {
		return Number(field.slice(1));
	} else {
		return Number(field);
	}
};
// captures the prefix of the field and lets you execute a function on the number before returning a string
// use this for writes to the board ie (=) assignment
const cande = (field, op) => {
	let prefix = "";
	if (String(numb(field)).length === field.length) {
		field = numb(field);
	} else {
		prefix = field[0];
		field = numb(field.slice(1));
	}
	return `${prefix}${op(field)}`;
};
const color = idx => {
	// there should be 80 rows and 100 columns
	const dx = bwidth / 100;
	const dy = bheight / 80;
	// fillRect takes in x, y, width, height
	ctx.clearRect((idx % 100) * dx, Math.floor(idx / 100) * dy, dx, dy);
	ctx.fillRect((idx % 100) * dx, Math.floor(idx / 100) * dy, dx, dy);
};
//* -----------------------------------------------------------

// we'll store every line as 3 strings
// we need strings for the fields since we need to be able to handle things like @2
const board = new Array(BOARD_SIZE).fill(["DAT", "0", "0"]);

const tokenizer = () => {
	let lines = [];
	lines = blueCode.split("\n");
	lines = lines.map(line => line.split(/[\s,]+/));
	// console.log(lines);
	// this is where we handle things like newlines and comments
	return lines;
};

/*
 * Reference types
 * Everything is relative to the current instruction pointer
 * Immediate addressing: Exception to the above rule, the number is the value
 * Direct addressing: Just go the number in the field
 * Indirect addressing: Go to the number in the field and then go to the number in the field of that
 * if we read @2 then we go to the b field of 2 instructions ahead and it says 4, we go 4 ahead of it aswell
 */

// these functions all have a generic signature
//* function signature: (board: board, process: Process)

const mov = (board, process) => {
	const [arg1, arg2] = board[process.ip].slice(1);
	let from;
	let to;
	let pos = process.ip;
	// get absolute position of the destination and source
	const src = (numb(arg1) + pos) % BOARD_SIZE;
	const dst = (numb(arg2) + pos) % BOARD_SIZE;
	if (arg1[0] === "@") {
		// indirect b addressing
		// note that we're taking numb of the b field so we're avoiding chains of references
		from = (numb(board[src][2]) + src) % BOARD_SIZE;
	} else if (arg1[0] === "*") {
		// indirect a addressing
		from = (numb(board[src][1]) + src) % BOARD_SIZE;
	} else {
		// direct addressing
		from = src;
	}

	if (arg2[0] === "@") {
		to = (numb(board[dst][2]) + dst) % BOARD_SIZE;
	} else if (arg2[0] === "*") {
		to = (numb(board[dst][1]) + dst) % BOARD_SIZE;
	} else {
		to = dst;
	}
	// remember to avoid copying by reference
	board[to] = [...board[from]];
	color(to);
	process.ip = (process.ip + 1) % BOARD_SIZE;
};

const add = (board, process) => {
	const [arg1, arg2] = board[process.ip].slice(1);
	let pos = process.ip;
	const src = (numb(arg1) + pos) % BOARD_SIZE;
	const dst = (numb(arg2) + pos) % BOARD_SIZE;

	if (arg1[0] === "#" && arg2[0] === "#") return; // noop
	if (arg1[0] === "#") {
		// adds arg1 to the b field of arg2's instruction
		board[dst][2] = cande(
			board[dst][2],
			x => (x + numb(arg1)) % BOARD_SIZE
		);
	} else if (arg2[0] === "#") {
		// adds the a/arg1 field to the b/arg2 field of the add itself
		board[pos][2] = cande(arg2, x => (x + numb(arg1)) % BOARD_SIZE);
	} else {
		// adds the fields of arg1 and arg2 independently
		board[dst][1] = cande(
			board[dst][1],
			x => (x + numb(board[src][1])) % BOARD_SIZE
		);
		board[dst][2] = cande(
			board[dst][2],
			x => (x + numb(board[src][2])) % BOARD_SIZE
		);
	}
	process.ip = (process.ip + 1) % BOARD_SIZE;
};

const jmp = (board, process) => {
	const [arg1, _] = board[process.ip].slice(1);
	process.ip = (numb(arg1) + process.ip) % BOARD_SIZE;
};

// handles syntax sugar and addressing modes
// turns something like mov 2, @2 into mov 2, 2_lines_down.B
const parser = lines => {
	for (const tokens of lines) {
	}
};

let red = true
// actually runs the memory cells
const executor = (board, process) => {
	const instruction = board[process.ip][0];
	// debug log
	console.log(`${red ? "Red" : "Blue"} Executing ${instruction} at ${process.ip}`);
	red = !red
	switch (instruction) {
		case "DAT":
			throw new Error("Cannot execute DAT");
			break;
		case "MOV":
			mov(board, process);
			break;
		case "ADD":
			add(board, process);
		case "SUB":
			break;
		case "MUL":
			break;
		case "DIV":
			break;
		case "MOD":
			break;
		case "JMP":
			jmp(board, process);
		case "JMZ": // Jump if zero
			break;
		case "JMN": // Jump if not zero
			break;
		case "DJN": // Decrement and JMN
			break;
		case "SPL": // Starts second process at another address
			break;
		case "CMP": // Same as SEQ
			break;
		case "SEQ":
			break;
		default:
			throw new Error("Invalid instruction");
			break;
	}
};

class Process {
	// ip is instruction pointer
	constructor(ip) {
		this.ip = ip;
	}
}

const redplayer = {
	// circular queue that contains processes
	queue: [],
	index: 0
};

const blueplayer = {
	queue: [],
	index: 0
};

const imp = start => {
	board[start] = ["MOV", "0", "1"];
};

const dwarf = start => {
	board[start] = ["ADD", "#4", "3"];
	board[start + 1] = ["MOV", "2", "@2"];
	board[start + 2] = ["JMP", "-2", "0"];
	board[start + 3] = ["DAT", "#0", "#0"];
};

const interpreter = board => {
	const r1 = new Process(0);
	imp(0);
	redplayer.queue.push(r1);

	const b1 = new Process(4000);
	dwarf(4000);
	blueplayer.queue.push(b1);

	let redsTurn = false; // red starts since we invert this first in the function

	return function nextTurn() {
		redsTurn = !redsTurn;
		const player = redsTurn ? redplayer : blueplayer;
		if (player.queue.length === 0) return; // debugging purposes

		const process = player.queue[player.index];
		player.index = (player.index + 1) % player.queue.length; // circular queue

		ctx.fillStyle = redsTurn ? "red" : "blue";
		color(process.ip);
		// execute instruction at process.ip failing if it's a DAT
		try {
			executor(board, process);
		} catch (e) {
			console.log(`${player} failed while encountering ${e}`);
			player.queue.splice(player.index, 1);
		}
		// await sleep(10); // wait for sleep 0.001 second to resolve
	};
};

let isRunning = false;
let instance;
run.addEventListener("click", () => {
	if (isRunning) return; // singleton
	isRunning = true;
	const tokens = tokenizer();
	// creates an interval that calls the func returned by interpreter(board) every 1 ms
	instance = setInterval(interpreter(board), 1);
});

stop.addEventListener("click", () => {
	console.log("Stopping");
	clearInterval(instance);
	isRunning = false;
});

/* sample lexer output
aefihn aefoujbn 2436
aeoufjb 312, 12
aoedjbnf aef

[
  [
    "aefihn",
    "aefoujbn",
    "2436"
  ],
  [
    "aeoufjb",
    "312",
    "12"
  ],
  [
    "aoedjbnf",
    "aef"
  ]
]
*/

let testing = true;
if (testing) {
	console.log("Testing");
	// 2 x 2 board
	const b1 = [
		["ADD", "#4", "2"],
		["ADD", "-1", "1"],
		["DAT", "0", "0"],
		["DAT", "0", "0"]
	];
	const t1 = new Process(0);
	add(b1, t1);
	if (b1[2][2] !== "4") console.warn("add test 1 failed");
	add(b1, t1);
	if (b1[2][1] !== "4" || b1[2][2] != "6") console.warn("add test 2 failed");
	console.log("testing completed");
}
