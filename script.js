"use strict";
//* html elements --------------------------------------------
const blueCode = document.getElementById("blueCode").value;
const redCode = document.getElementById("redCode").value;
const run = document.querySelector(".run");
const boardEl = document.querySelector("#board");
const bheight = boardEl.height;
const bwidth = boardEl.width;
const ctx = boardEl.getContext("2d");
//* -----------------------------------------------------------

const sleep = ms => new Promise(r => setTimeout(r, ms));

const tokenizer = () => {
	let lines = [];
	lines = blueCode.split("\n");
	lines = lines.map(line => line.split(/[\s,]+/));
	console.log(lines);
	// this is where we handle things like newlines and comments
	return lines;
};

// move takes in exact memory address and copies from to to
const mov = (from, to) => {
	// remember to avoid copying by reference
	board[to] = [...board[from]]; // we do [...] to spread the values then copy them
};

// handles syntax sugar and addressing modes
// turns something like mov 2, @2 into mov 2, 2_lines_down.B
const parser = lines => {
	for (const tokens of lines) {
	}
};

// actually runs the memory cells
const executor = (instruction, process) => {
	switch (instruction[0]) {
		case "DAT":
			throw new Error("Cannot execute DAT");
			break;
		case "MOV":
			mov(
				process.ip + instruction[1],
				process.ip + instruction[2]
			);
			break;
		case "ADD":
			break;
		case "SUB":
			break;
		case "MUL":
			break;
		case "DIV":
			break;
		case "MOD":
			break;
		case "JMP":
			break;
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

const board = new Array(8000).fill(["DAT", 0, 0]);

// async means it'll call the next line of code before it's done
// since we're not running anything after this, it doesn't matter
const interpreter = async board => {
	const r1 = new Process(6500);
	redplayer.queue.push(r1);
	board[6500] = ["MOV", 0, 1];
	const b1 = new Process(3000);
	blueplayer.queue.push(b1);
	for (let redsTurn = true; ; redsTurn = !redsTurn) {
		const player = redsTurn ? redplayer : blueplayer;
		if (player.queue.length === 0) continue; // debugging purposes

		const process = player.queue[player.index];
		player.index = (player.index + 1) % player.queue.length; // circular queue

		ctx.fillStyle = redsTurn ? "red" : "blue";
		// there should be 80 rows and 100 columns
		const dx = bwidth / 100;
		const dy = bheight / 80;
		// fillRect takes in x, y, width, height
		ctx.fillRect(
			(process.ip % 100) * dx,
			Math.floor(process.ip / 100) * dy,
			dx,
			dy
		);
		// console.log(player, process);
		const instruction = board[process.ip];
		// execute instruction failing if it's a DAT
		try {
			executor(instruction, process);
		} catch (e) {
			console.log(`${player} failed while encountering ${e}`);
		}
		process.ip++;
		process.ip %= 8000;
		await sleep(10); // wait for sleep 0.001 second to resolve
	}
};

let isRunning = false;
run.addEventListener("click", () => {
	if (isRunning) return; // singleton
	isRunning = true;
	const tokens = tokenizer();
	interpreter(board);
});

/*
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
