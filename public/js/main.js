// Main App Interactions & Theme Controller
document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Management (Dark / Light)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const currentTheme = localStorage.getItem('cm_theme') || 'dark';
  document.documentElement.setAttribute('data-bs-theme', currentTheme);

  if (themeToggleBtn) {
    updateThemeIcon(currentTheme);
    themeToggleBtn.addEventListener('click', () => {
      const active = document.documentElement.getAttribute('data-bs-theme') || 'dark';
      const newTheme = active === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-bs-theme', newTheme);
      localStorage.setItem('cm_theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    themeToggleBtn.innerHTML = theme === 'dark' ? '🌙' : '☀️';
  }

  // 2. Auto-initialize Bootstrap Toasts & Tooltips
  const toastElList = document.querySelectorAll('.toast');
  toastElList.forEach(toastEl => {
    const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
    toast.show();
  });

  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipTriggerList.forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  // 3. Task / Assignment Checkbox Completion Toggle with Confetti!
  document.querySelectorAll('.task-checkbox-toggle').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const entryId = e.target.getAttribute('data-entry-id');
      const itemContainer = e.target.closest('.task-item');

      try {
        const res = await fetch(`/timetable/${entryId}/toggle-complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();

        if (data.success) {
          if (data.isCompleted) {
            itemContainer.classList.add('completed');
            triggerConfetti();
            showCustomToast(`🎉 Completed! Earned +${data.xpEarned} XP!`, 'success');
            // Update XP pill in navbar if present
            const xpPill = document.querySelector('.xp-badge-val');
            if (xpPill) {
              const currentVal = parseInt(xpPill.textContent, 10) || 0;
              xpPill.textContent = `${currentVal + data.xpEarned} XP`;
            }
          } else {
            itemContainer.classList.remove('completed');
          }
        }
      } catch (err) {
        console.error('Failed to toggle task:', err);
      }
    });
  });

  // 4. Quick Mood Selector on Course Details
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const mood = e.currentTarget.getAttribute('data-mood');
      const courseId = e.currentTarget.getAttribute('data-course-id');

      try {
        const res = await fetch(`/courses/${courseId}/mood`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mood })
        });
        const data = await res.json();
        if (data.success) {
          document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active', 'border-primary'));
          e.currentTarget.classList.add('active', 'border-primary');
          showCustomToast(`Course vibe updated to ${mood}!`, 'info');
        }
      } catch (err) {
        console.error('Failed to update mood:', err);
      }
    });
  });
});

// Canvas-Confetti Trigger Helper
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.75 }
    });
  }
}

// Toast Alert Helper
function showCustomToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toastId = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success text-white' : type === 'error' ? 'bg-danger text-white' : 'bg-dark text-white border-primary';

  const html = `
    <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body fw-medium">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
  const el = document.getElementById(toastId);
  setTimeout(() => {
    if (el) el.remove();
  }, 5000);
}
