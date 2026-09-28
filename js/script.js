// Small page interactions: sticky navigation, scroll reveals, and project filters.
document.addEventListener("DOMContentLoaded", () => {
  const siteHeader = document.querySelector(".site-header");
  const navLinks = [...document.querySelectorAll('.site-nav .nav-link[href^="#"]')];
  const sections = [...new Set(navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean))];
  const filterButtons = [...document.querySelectorAll(".filter-button")];
  const projectCards = [...document.querySelectorAll(".project-column")];
  const emptyMessage = document.querySelector("#filterEmpty");

  // Add a subtle header shadow after the visitor scrolls.
  const updateHeader = () => siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  // Highlight the navigation link for the section currently in view.
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visibleSection = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visibleSection) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${visibleSection.target.id}`;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.2, 0.5] });
    sections.forEach((section) => sectionObserver.observe(section));

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

  // Bootstrap's mobile menu closes after a navigation link is selected.
  document.querySelectorAll(".site-nav .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      const menu = document.querySelector("#mainNavigation");
      if (menu.classList.contains("show") && window.bootstrap) {
        window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
      }
    });
  });

  // Categories may contain more than one value, for example "software database".
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      let visibleCount = 0;
      filterButtons.forEach((filterButton) => {
        const active = filterButton === button;
        filterButton.classList.toggle("active", active);
        filterButton.setAttribute("aria-pressed", String(active));
      });
      projectCards.forEach((card) => {
        const categories = card.dataset.categories.split(" ");
        const show = filter === "all" || categories.includes(filter);
        card.classList.toggle("is-hidden", !show);
        if (show) visibleCount += 1;
      });
      emptyMessage.hidden = visibleCount > 0;
    });
  });
});
