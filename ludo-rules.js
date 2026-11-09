function globalCell(playerIndex, localStep) {
  const startOffsets = [0, 13, 26, 39];
  return (startOffsets[playerIndex] + localStep) % 52;
}

function legalMoves(playerIdx, tokens, diceVal) {
  const out = [];
  for (let i = 0; i < 4; i++) {
    const pos = tokens[i];
    if (pos === -1) {
      if (diceVal === 6) out.push(i);
    } else {
      const newPos = pos + diceVal;
      if (newPos <= 57) out.push(i);
    }
  }
  return out;
}

function applyMove(players, playerIdx, tokenIdx, diceVal) {
  const p = players[playerIdx];
  let extraTurn = false;
  let captured = [];
  let won = false;

  if (p.tokens[tokenIdx] === -1) {
    p.tokens[tokenIdx] = 0;
    extraTurn = true;
  } else {
    p.tokens[tokenIdx] += diceVal;
  }

  const newLocal = p.tokens[tokenIdx];
  if (newLocal <= 51) {
    const gPos = globalCell(playerIdx, newLocal);
    for (let oppIdx = 0; oppIdx < players.length; oppIdx++) {
      if (oppIdx === playerIdx) continue;
      const opp = players[oppIdx];
      for (let ti = 0; ti < 4; ti++) {
        const t = opp.tokens[ti];
        if (t >= 0 && t <= 51 && globalCell(oppIdx, t) === gPos) {
          opp.tokens[ti] = -1;
          captured.push({oppIdx, token: ti});
        }
      }
    }
  }

  if (diceVal === 6) extraTurn = true;

  const allHome = p.tokens.every(x => x >= 52);
  if (allHome) won = true;

  return {extraTurn, captured, won};
}

function snapshot(room) {
  return {
    players: room.players.map(pl => ({
      id: pl.id,
      name: pl.name,
      color: pl.color,
      tokens: [...pl.tokens]
    })),
    turn: room.turn,
    pendingRoll: room.pendingRoll,
    legalMoves: [...room.legalMoves],
    started: room.started
  };
}

module.exports = {globalCell, legalMoves, applyMove, snapshot};
