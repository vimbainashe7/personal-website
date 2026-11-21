// Socket.io Realtime Notification Listener
document.addEventListener('DOMContentLoaded', () => {
  if (typeof io === 'function') {
    const socket = io();

    const userIdEl = document.getElementById('currentUserIdMeta');
    if (userIdEl) {
      const userId = userIdEl.getAttribute('data-user-id');
      if (userId) {
        socket.emit('join_user_room', userId);
      }
    }

    socket.on('new_notification', (data) => {
      // 1. Trigger toast alert
      if (typeof showCustomToast === 'function') {
        showCustomToast(`🔔 <strong>${data.title}</strong><br>${data.message}`, 'info');
      }

      // 2. Bump notification badge count
      const badge = document.getElementById('navNotificationBadge');
      if (badge) {
        const count = parseInt(badge.textContent, 10) || 0;
        badge.textContent = count + 1;
        badge.classList.remove('d-none');
      }
    });
  }
});
