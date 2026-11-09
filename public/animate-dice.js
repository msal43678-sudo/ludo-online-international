// Animasi putar dadu sebelum menampilkan angka akhir
export function animateDiceRoll(el, finalValue, onDone) {
  let count = 0;
  const interval = setInterval(() => {
    el.textContent = String(1 + Math.floor(Math.random() * 6));
    el.style.transform = `rotate(${count * 36}deg)`;
    count++;
    if (count >= 12) {
      clearInterval(interval);
      el.textContent = String(finalValue);
      el.style.transform = "rotate(0deg)";
      onDone?.();
    }
  }, 75);
}
