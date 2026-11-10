import { io } from "https://cdn.jsdelivr.net/npm/socket.io-client@4/dist/socket.io.esm.min.js";

const SERVER_URL = "https://srv‑dbp0rr4ipgvc73da9mn0.onrender.com";
const appDiv = document.getElementById("app");

appDiv.innerHTML = `<h2>Menghubungkan ke server Ludo…</h2>`;

const socket = io(SERVER_URL);

socket.on("connect", () => {
  appDiv.innerHTML = `
    <div class="info-panel">
      <h3 style="color:green">✅ Berhasil terhubung!</h3>
      <p>ID‑koneksi: ${socket.id}</p>
    </div>
    <div class="board-wrap"></div>
    <div class="dice-box"><div class="dice">🎲</div></div>
    <div class="controls">
      <button id="rollBtn">Lempar Dadu</button>
    </div>
  `;
});

socket.on("disconnect", () => {
  appDiv.innerHTML = `<h2 style="color:orange">⚠️ Putus sambungan dari server</h2>`;
});

socket.on("connect_error", () => {
  appDiv.innerHTML = `<h2 style="color:red">❌ Gagal terhubung ke server</h2>`;
});
