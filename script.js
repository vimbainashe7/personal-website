// Bootstrap collapses and tooltips are loaded from the CDN in index.html.
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".site-nav");
  const navLinks = [...document.querySelectorAll('.site-nav .nav-link[href^="#"]')];
  const sections = [...document.querySelectorAll("main section[id]")];
  const themeToggle = document.querySelector(".theme-toggle");
  const filterButtons = [...document.querySelectorAll(".filter-button")];
  const projectCards = [...document.querySelectorAll(".project-column")];
  const emptyMessage = document.querySelector("#filterEmpty");
  const contactForm = document.querySelector("#contactForm");
  const formFeedback = document.querySelector("#formFeedback");
  const heroPortrait = document.querySelector(".hero-portrait");

  // Keep the terminal visual intact until the local portrait file is added.
  heroPortrait.addEventListener("error", () => { heroPortrait.hidden = true; });
  if (heroPortrait.complete && heroPortrait.naturalWidth === 0) heroPortrait.hidden = true;

  // Add a quiet glass effect after the visitor starts scrolling.
  const updateNavbar = () => navbar.classList.toggle("is-scrolled", window.scrollY > 16);
  updateNavbar();
  window.addEventListener("scroll", updateNavbar, { passive: true });

  // Keep the navigation state in sync with the section in view.
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${visible.target.id}`;
        link.classList.toggle("active", isActive);
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.2, 0.5] });
    sections.forEach((section) => sectionObserver.observe(section));

    // Reveal content as it enters the viewport; show it immediately for reduced motion.
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
  } else {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
  }

  // Close the mobile menu after choosing an in-page destination.
  document.querySelectorAll(".site-nav .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      const menu = document.querySelector("#mainNavigation");
      if (menu.classList.contains("show") && window.bootstrap) {
        window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
      }
    });
  });

  // Remember the visitor's theme choice when browser storage is available.
  const setTheme = (isLight) => {
    document.body.classList.toggle("light-theme", isLight);
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
    themeToggle.innerHTML = `<i class="bi ${isLight ? "bi-moon" : "bi-sun"}" aria-hidden="true"></i>`;
  };
  let savedTheme = null;
  try { savedTheme = localStorage.getItem("vimbai-theme"); } catch (_) { /* Storage may be disabled by the browser. */ }
  setTheme(savedTheme === "light");
  themeToggle.addEventListener("click", () => {
    const isLight = !document.body.classList.contains("light-theme");
    setTheme(isLight);
    try { localStorage.setItem("vimbai-theme", isLight ? "light" : "dark"); } catch (_) { /* The current-page theme still works without storage. */ }
  });

  // Filter project cards by category without navigating away from the page.
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      let shownCount = 0;
      filterButtons.forEach((item) => {
        const isSelected = item === button;
        item.classList.toggle("active", isSelected);
        item.setAttribute("aria-pressed", String(isSelected));
      });
      projectCards.forEach((card) => {
        const shouldShow = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !shouldShow);
        if (shouldShow) shownCount += 1;
      });
      emptyMessage.hidden = shownCount !== 0;
    });
  });

  // This demo validates the fields and previews a message locally; nothing is sent.
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = new FormData(contactForm).get("name").trim();
    formFeedback.textContent = `Thanks, ${name}. Your message is ready, but this demo form does not send or store it.`;
    contactForm.reset();
  });
});