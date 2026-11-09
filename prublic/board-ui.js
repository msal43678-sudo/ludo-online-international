import { animateTokenMove } from './animate-token.js';
import { animateDiceRoll } from './animate-dice.js';

// Ubah nomor petak menjadi koordinat piksel di papan
export function getPixelXY(posIndex) {
  const boardSize = 600;
  const cellSize = boardSize / 14;
  const cx = boardSize / 2;
  const cy = boardSize / 2;
  const angle = (posIndex * 2 * Math.PI) / 52;
  const radius = cellSize * 4.2;
  const x = cx + radius * Math.cos(angle) - cellSize/2;
  const y = cy + radius * Math.sin(angle) - cellSize/2;
  return [x, y];
}

// Panggil saat hasil lemparan dadu diterima
export function onDiceRollUi(diceElement, value, callback) {
  animateDiceRoll(diceElement, value, callback);
}

// Panggil untuk menggerakkan pion di layar
export function moveTokenOnBoard(tokenElement, oldPos, newPos, callback) {
  const [fx, fy] = getPixelXY(oldPos);
  const [tx, ty] = getPixelXY(newPos);
  animateTokenMove(tokenElement, fx, fy, tx, ty, callback);
}
