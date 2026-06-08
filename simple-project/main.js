// Simple interactive logic for the starter template
document.addEventListener('DOMContentLoaded', () => {
  const actionBtn = document.getElementById('action-btn');
  const clickCountSpan = document.getElementById('click-count');

  let count = 0;

  if (actionBtn && clickCountSpan) {
    actionBtn.addEventListener('click', () => {
      count++;
      clickCountSpan.textContent = count;

      // Add a small scale bump effect on click
      actionBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        actionBtn.style.transform = '';
      }, 100);
    });
  }
});
