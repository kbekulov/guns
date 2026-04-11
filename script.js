const filterButtons = Array.from(document.querySelectorAll(".filter-button"));
const gunCards = Array.from(document.querySelectorAll(".gun-card"));
const FILTER_STORAGE_KEY = "collection-roadmap-filter";

const savedFilter = getSavedFilter();
const initialFilter = filterButtons.some((button) => button.dataset.filter === savedFilter)
  ? savedFilter
  : "all";

applyFilter(initialFilter);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextFilter = button.dataset.filter || "all";
    saveFilter(nextFilter);
    applyFilter(nextFilter);
  });
});

function applyFilter(activeFilter) {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  gunCards.forEach((card) => {
    const shouldShow = activeFilter === "all" || card.dataset.status === activeFilter;
    card.classList.toggle("is-hidden", !shouldShow);
  });
}

function getSavedFilter() {
  try {
    return localStorage.getItem(FILTER_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveFilter(nextFilter) {
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, nextFilter);
  } catch {
    return;
  }
}
