// Pomodoro Focus Timer & Gamification Logger
let timerInterval = null;
let totalSeconds = 25 * 60;
let remainingSeconds = totalSeconds;
let isRunning = false;

document.addEventListener('DOMContentLoaded', () => {
  const display = document.getElementById('timerDisplay');
  const startBtn = document.getElementById('timerStartBtn');
  const pauseBtn = document.getElementById('timerPauseBtn');
  const resetBtn = document.getElementById('timerResetBtn');
  const durationBtns = document.querySelectorAll('.timer-duration-btn');
  const courseSelect = document.getElementById('timerCourseSelect');

  if (!display) return;

  function updateDisplay() {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  durationBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      durationBtns.forEach(b => b.classList.remove('btn-primary-gradient', 'active'));
      e.target.classList.add('btn-primary-gradient', 'active');

      const mins = parseInt(e.target.getAttribute('data-mins'), 10) || 25;
      clearInterval(timerInterval);
      isRunning = false;
      totalSeconds = mins * 60;
      remainingSeconds = totalSeconds;
      updateDisplay();
      if (startBtn && pauseBtn) {
        startBtn.classList.remove('d-none');
        pauseBtn.classList.add('d-none');
      }
    });
  });

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (isRunning) return;
      isRunning = true;
      startBtn.classList.add('d-none');
      pauseBtn.classList.remove('d-none');

      timerInterval = setInterval(() => {
        if (remainingSeconds > 0) {
          remainingSeconds--;
          updateDisplay();
        } else {
          // Completed Focus Session!
          clearInterval(timerInterval);
          isRunning = false;
          startBtn.classList.remove('d-none');
          pauseBtn.classList.add('d-none');
          playCompletionChime();
          logCompletedSession();
        }
      }, 1000);
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      clearInterval(timerInterval);
      isRunning = false;
      startBtn.classList.remove('d-none');
      pauseBtn.classList.add('d-none');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      clearInterval(timerInterval);
      isRunning = false;
      remainingSeconds = totalSeconds;
      updateDisplay();
      if (startBtn && pauseBtn) {
        startBtn.classList.remove('d-none');
        pauseBtn.classList.add('d-none');
      }
    });
  }

  async function logCompletedSession() {
    const courseId = courseSelect ? courseSelect.value : null;
    const completedMinutes = Math.round(totalSeconds / 60);

    try {
      const res = await fetch('/gamification/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          duration_minutes: completedMinutes
        })
      });
      const data = await res.json();
      if (data.success) {
        if (typeof triggerConfetti === 'function') triggerConfetti();
        if (typeof showCustomToast === 'function') {
          showCustomToast(`🔥 Awesome focus session! You earned +${data.xpEarned} XP!`, 'success');
        }
      }
    } catch (err) {
      console.error('Failed to log study session:', err);
    }
  }

  function playCompletionChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {}
  }
});
