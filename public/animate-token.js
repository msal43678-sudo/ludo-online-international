// Animasi perpindahan pion mengikuti jalur papan
export function animateTokenMove(el, fromX, fromY, toX, toY, onDone) {
  const dur = 320;
  const start = performance.now();
  function step(t) {
    const p = Math.min(1, (t - start) / dur);
    const x = fromX + (toX - fromX) * p;
    const y = fromY + (toY - fromY) * p - 6 * Math.sin(p * Math.PI);
    el.style.transform = `translate(${x}px,${y}px)`;
    if (p < 1) requestAnimationFrame(step);
    else onDone?.();
  }
  requestAnimationFrame(step);
}
