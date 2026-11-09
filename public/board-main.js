import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";
import { onDiceRollUi, moveTokenOnBoard, getPixelXY } from "./board-ui.js";

let socket;
let localPlayerId = null;
let gameState = null;
const appDiv = document.getElementById("app");

function renderBoard() {
  appDiv.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "board-wrap";
  appDiv.appendChild(wrap);

  const diceBox = document.createElement("div");
  diceBox.className = "dice-box";
  const diceEl = document.createElement("div");
  diceEl.className = "dice";
  diceEl.textContent = "-";
  diceBox.appendChild(diceEl);
  appDiv.appendChild(diceBox);

  const ctrl = document.createElement("div");
  ctrl.className = "controls";
  const btnRoll = document.createElement("button");
  btnRoll.textContent = "Lempar Dadu";
  ctrl.appendChild(btnRoll);
  appDiv.appendChild(ctrl);

  if (!gameState || !gameState.started) return;

  gameState.players.forEach((pl, pi) => {
    pl.tokens.forEach((pos, ti) => {
      const tEl = document.createElement("div");
      tEl.className = `token ${pl.color}`;
      if (pos >= 0) {
        const [x, y] = getPixelXY(pos);
        tEl.style.transform = `translate(${x}px,${y}px)`;
      }
      if (gameState.legalMoves?.includes(ti) && gameState.turn === pi) {
        tEl.classList.add("highlight");
        tEl.onclick = () => socket.emit("move", { token: ti });
      }
      wrap.appendChild(tEl);
    });
  });

  btnRoll.onclick = () => socket.emit("rollDice");
}

function connect() {
  const url = window.LUDO_SERVER_URL || window.location.origin;
  socket = io(url);

  socket.on("connect", () => {
    localPlayerId = socket.id;
    socket.emit("createRoom", { name: "Pemain" });
  });

  socket.on("roomUpdate", () => renderBoard());
  socket.on("gameState", (s) => {
    gameState = s;
    renderBoard();
  });
  socket.on("rollResult", (res) => {
    const diceEl = document.querySelector(".dice");
    onDiceRollUi(diceEl, res.value, () => renderBoard());
  });
  socket.on("errorMsg", (msg) => alert(msg));
  socket.on("gameOver", (r) => alert("Pemenang: " + r.winner));
}

connect();
