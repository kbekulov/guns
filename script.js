const STORAGE_KEY = "handgun-planner-items-v1";

const priorityOrder = ["immediate", "shortlist", "research", "backburner"];
const priorityLabels = {
  immediate: "Immediate Focus",
  shortlist: "Shortlist",
  research: "Researching",
  backburner: "Back Burner",
};

const starterItems = [
  {
    id: crypto.randomUUID(),
    maker: "Glock",
    model: "G48 Gen5 MOS",
    variant: "Slimline optic-ready carry setup",
    price: "",
    imageUrl: "img/g48-mos.webp",
    priority: "immediate",
    notes: "Strong all-around practical choice. Likely easiest to justify as a next buy.",
  },
  {
    id: crypto.randomUUID(),
    maker: "SIG Sauer",
    model: "P211 GT4",
    variant: "High-interest premium pick",
    price: "",
    imageUrl: "img/p211-gt4.jpg",
    priority: "shortlist",
    notes: "Aspirational option. Worth comparing once real-world pricing and availability settle.",
  },
  {
    id: crypto.randomUUID(),
    maker: "Walther",
    model: "PDP Pro",
    variant: "Exact version still undecided",
    price: "",
    imageUrl: "",
    priority: "research",
    notes: "Needs configuration narrowing before moving higher on the ladder.",
  },
  {
    id: crypto.randomUUID(),
    maker: "Walther",
    model: 'PDP F Series 4"',
    variant: "4-inch configuration",
    price: "",
    imageUrl: "",
    priority: "shortlist",
    notes: "High-interest alternative with a clearer compact-use angle.",
  },
];

let items = loadItems();
let selectedItemId = items[0]?.id ?? null;

const laneElements = Object.fromEntries(
  priorityOrder.map((priority) => [priority, document.getElementById(`lane-${priority}`)])
);

const spotlightPanel = document.getElementById("spotlight-panel");
const form = document.getElementById("handgun-form");
const modalElement = document.getElementById("handgunModal");
const modal = new bootstrap.Modal(modalElement);
const deleteButton = document.getElementById("delete-button");
const addButton = document.getElementById("add-handgun-button");
const resetButton = document.getElementById("reset-board-button");

initializeBoard();
render();

addButton.addEventListener("click", () => openForm());
resetButton.addEventListener("click", resetBoard);
form.addEventListener("submit", handleSubmit);
deleteButton.addEventListener("click", deleteCurrentItem);

function initializeBoard() {
  priorityOrder.forEach((priority) => {
    new Sortable(laneElements[priority], {
      group: "handgun-priorities",
      animation: 180,
      ghostClass: "ghost-card",
      onEnd: handleDragEnd,
    });
  });
}

function loadItems() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return structuredClone(starterItems);
  }

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.length) {
      return structuredClone(starterItems);
    }

    return parsed.map((item) => {
      const starterMatch = starterItems.find(
        (starterItem) => starterItem.maker === item.maker && starterItem.model === item.model
      );

      if (!starterMatch) {
        return item;
      }

      return {
        ...item,
        imageUrl: item.imageUrl || starterMatch.imageUrl,
      };
    });
  } catch {
    return structuredClone(starterItems);
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function render() {
  priorityOrder.forEach((priority) => {
    const lane = laneElements[priority];
    lane.innerHTML = "";

    const laneItems = items.filter((item) => item.priority === priority);
    laneItems.forEach((item) => lane.appendChild(createCard(item)));
  });

  renderSpotlight();
  renderSummary();
}

function createCard(item) {
  const card = document.createElement("article");
  card.className = "gallery-card";
  card.dataset.id = item.id;

  if (item.id === selectedItemId) {
    card.classList.add("is-active");
  }

  const imageMarkup = item.imageUrl
    ? `<img class="gallery-image" src="${escapeAttribute(item.imageUrl)}" alt="${escapeAttribute(`${item.maker} ${item.model}`)}" />`
    : '<div class="image-placeholder">Image coming later</div>';

  const variantMarkup = escapeHtml(item.variant || "Variant still open");
  const noteSnippet = escapeHtml(item.notes || "No notes yet.");
  const priceMarkup = `<span class="planner-badge price">${escapeHtml(item.price || "Price TBD")}</span>`;

  card.innerHTML = `
    ${imageMarkup}
    <div class="gallery-card-body">
      <div class="gallery-meta">
        <span class="maker-label"><span class="maker-dot"></span>${escapeHtml(item.maker)}</span>
        <span class="planner-badge">${priorityLabels[item.priority]}</span>
      </div>
      <h3>${escapeHtml(item.model)}</h3>
      <p class="gallery-variant mb-3">${variantMarkup}</p>
      <div class="gallery-tags">
        ${priceMarkup}
      </div>
      <p class="gallery-notes">${noteSnippet}</p>
      <div class="gallery-actions">
        <button class="btn btn-sm btn-outline-dark" type="button" data-action="select">Show</button>
        <button class="btn btn-sm btn-dark" type="button" data-action="edit">Edit</button>
      </div>
    </div>
  `;

  card.addEventListener("click", (event) => {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    if (event.target.dataset.action === "edit") {
      event.stopPropagation();
      openForm(item.id);
      return;
    }

    if (event.target.dataset.action === "select") {
      event.stopPropagation();
    }

    selectedItemId = item.id;
    render();
  });

  return card;
}

function renderSummary() {
  document.getElementById("total-count").textContent = String(items.length);
  document.getElementById("priced-count").textContent = String(items.filter((item) => item.price).length);
  document.getElementById("photo-count").textContent = String(items.filter((item) => item.imageUrl).length);

  const topItem = priorityOrder
    .flatMap((priority) => items.filter((item) => item.priority === priority))
    .at(0);

  document.getElementById("top-choice").textContent = topItem ? topItem.model : "None yet";
}

function renderSpotlight() {
  const item = items.find((entry) => entry.id === selectedItemId);

  if (!item) {
    spotlightPanel.innerHTML = `
      <div class="spotlight-empty">
        <p class="mb-0">No handguns in the board yet.</p>
      </div>
    `;
    return;
  }

  const imageMarkup = item.imageUrl
    ? `<img class="spotlight-image" src="${escapeAttribute(item.imageUrl)}" alt="${escapeAttribute(`${item.maker} ${item.model}`)}" />`
    : '<div class="image-placeholder spotlight-placeholder">Image coming later</div>';

  const notes = item.notes
    ? escapeHtml(item.notes).replace(/\n/g, "<br />")
    : "Add notes about fit, use case, optics plans, pricing windows, or range impressions.";

  spotlightPanel.innerHTML = `
    <div>
      ${imageMarkup}
    </div>
    <div class="spotlight-copy">
      <div class="spotlight-meta">
        <span class="maker-label"><span class="maker-dot"></span>${escapeHtml(item.maker)}</span>
        <span class="planner-badge">${priorityLabels[item.priority]}</span>
        <span class="planner-badge price">${escapeHtml(item.price || "Price TBD")}</span>
      </div>
      <h2 class="spotlight-model">${escapeHtml(item.model)}</h2>
      <p class="spotlight-variant mb-0">${escapeHtml(item.variant || "Variant still undecided")}</p>
      <div class="spotlight-tags">
        <span class="planner-badge">${item.imageUrl ? "Photo ready" : "Photo pending"}</span>
        <span class="planner-badge">${item.notes ? "Notes added" : "Notes pending"}</span>
      </div>
      <p class="spotlight-notes mb-0">${notes}</p>
      <div class="spotlight-actions">
        <button class="btn btn-dark" type="button" id="spotlight-edit-button">Edit item</button>
      </div>
    </div>
  `;

  document.getElementById("spotlight-edit-button").addEventListener("click", () => openForm(item.id));
}

function openForm(itemId = null) {
  const item = items.find((entry) => entry.id === itemId);

  form.reset();
  document.getElementById("handgun-id").value = item?.id ?? "";
  document.querySelector(".modal-title").textContent = item ? "Edit Handgun" : "Add Handgun";

  document.getElementById("model").value = item?.model ?? "";
  document.getElementById("maker").value = item?.maker ?? "";
  document.getElementById("variant").value = item?.variant ?? "";
  document.getElementById("price").value = item?.price ?? "";
  document.getElementById("priority").value = item?.priority ?? "research";
  document.getElementById("imageUrl").value = item?.imageUrl ?? "";
  document.getElementById("notes").value = item?.notes ?? "";
  deleteButton.hidden = !item;

  modal.show();
}

function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(form);
  const id = document.getElementById("handgun-id").value || crypto.randomUUID();
  const nextItem = {
    id,
    model: String(formData.get("model")).trim(),
    maker: String(formData.get("maker")).trim(),
    variant: String(formData.get("variant")).trim(),
    price: String(formData.get("price")).trim(),
    priority: String(formData.get("priority")).trim(),
    imageUrl: String(formData.get("imageUrl")).trim(),
    notes: String(formData.get("notes")).trim(),
  };

  const existingIndex = items.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    items.splice(existingIndex, 1, nextItem);
  } else {
    items.push(nextItem);
  }

  selectedItemId = id;
  saveItems();
  render();
  modal.hide();
}

function deleteCurrentItem() {
  const id = document.getElementById("handgun-id").value;
  if (!id) {
    return;
  }

  items = items.filter((item) => item.id !== id);
  selectedItemId = items[0]?.id ?? null;
  saveItems();
  render();
  modal.hide();
}

function resetBoard() {
  items = structuredClone(starterItems);
  selectedItemId = items[0]?.id ?? null;
  saveItems();
  render();
}

function handleDragEnd(event) {
  const movedId = event.item.dataset.id;
  const nextPriority = event.to.id.replace("lane-", "");

  const movedItem = items.find((item) => item.id === movedId);
  if (!movedItem) {
    return;
  }

  movedItem.priority = nextPriority;

  const nextItems = [];
  priorityOrder.forEach((priority) => {
    const cardIds = [...laneElements[priority].children].map((child) => child.dataset.id);
    cardIds.forEach((id) => {
      const match = items.find((item) => item.id === id);
      if (match) {
        nextItems.push(match);
      }
    });
  });

  items = nextItems;
  selectedItemId = movedId;
  saveItems();
  render();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
