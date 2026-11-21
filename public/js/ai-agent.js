// AI Assistant Drawer Controller
document.addEventListener('DOMContentLoaded', () => {
  const drawer = document.getElementById('aiDrawer');
  const overlay = document.getElementById('aiDrawerOverlay');
  const openBtn = document.getElementById('openAiDrawerBtn');
  const closeBtn = document.getElementById('closeAiDrawerBtn');
  const chatForm = document.getElementById('aiChatForm');
  const chatInput = document.getElementById('aiChatInput');
  const chatBody = document.getElementById('aiChatBody');
  const chips = document.querySelectorAll('.chip-prompt');

  if (!drawer) return;

  // Toggle Drawer
  function openDrawer() {
    drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    if (chatInput) chatInput.focus();
    loadHistory();
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  if (openBtn) openBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  // Quick Chips
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (chatInput) chatInput.value = prompt;
      submitPrompt(prompt);
    });
  });

  // Chat Form Submission
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      submitPrompt(text);
      chatInput.value = '';
    });
  }

  async function submitPrompt(promptText) {
    appendMessage('user', promptText);

    // Show typing skeleton
    const loadingId = 'loading-' + Date.now();
    appendLoadingBubble(loadingId);

    try {
      const courseIdInput = document.getElementById('aiContextCourseId');
      const courseId = courseIdInput ? courseIdInput.value : null;

      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: promptText, course_id: courseId })
      });

      const data = await res.json();
      removeLoadingBubble(loadingId);

      if (data.answer) {
        appendMessage('assistant', data.answer);
      } else {
        appendMessage('assistant', 'Sorry, I could not process that request right now.');
      }
    } catch (err) {
      removeLoadingBubble(loadingId);
      appendMessage('assistant', 'Network error. Please try again.');
    }
  }

  function appendMessage(role, text) {
    if (!chatBody) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;

    // Basic markdown conversion for bold, bullets, headers
    let formatted = text
      .replace(/### (.*?)\n/g, '<h6 class="fw-bold mt-2 mb-1">$1</h6>')
      .replace(/#### (.*?)\n/g, '<h6 class="fw-bold mt-2 mb-1 text-primary">$1</h6>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1 bg-dark rounded">$1</code>')
      .replace(/\n/g, '<br>');

    bubble.innerHTML = formatted;
    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendLoadingBubble(id) {
    if (!chatBody) return;
    const bubble = document.createElement('div');
    bubble.id = id;
    bubble.className = 'chat-bubble assistant d-flex align-items-center gap-2';
    bubble.innerHTML = `
      <div class="spinner-grow spinner-grow-sm text-primary" role="status"></div>
      <span class="text-muted small">AI is thinking...</span>
    `;
    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function removeLoadingBubble(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  async function loadHistory() {
    try {
      const res = await fetch('/api/ai/history');
      const data = await res.json();
      if (data.history && data.history.length > 0 && chatBody.children.length <= 1) {
        data.history.forEach(msg => {
          appendMessage(msg.role, msg.message);
        });
      }
    } catch (err) {
      // history fetch warning
    }
  }
});
