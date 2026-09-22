const bubble = document.getElementById('summon-bubble');

let isDragging = false;
let startX = 0;
let startY = 0;
let moved = false;

bubble.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; // Only left click
  isDragging = true;
  moved = false;
  startX = e.screenX;
  startY = e.screenY;

  window.summonApi.startDrag();
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = e.screenX - startX;
  const dy = e.screenY - startY;

  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
    moved = true;
  }

  if (moved) {
    window.summonApi.dragMove(dx, dy);
    startX = e.screenX;
    startY = e.screenY;
  }
});

window.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;

  window.summonApi.endDrag();

  if (!moved) {
    // It was a click!
    window.summonApi.summonPet();
  }
});
