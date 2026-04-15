const STORAGE_KEY = "premium_brand_demo_cart";

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(cents / 100);
}

function getProducts() {
  return window.PRODUCTS || [];
}

function findProduct(id) {
  return getProducts().find((product) => product.id === id);
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function cartSubtotal() {
  return getCart().reduce((sum, item) => {
    const product = findProduct(item.id);
    return product ? sum + (product.price * item.quantity) : sum;
  }, 0);
}

function addToCart(productId) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }
  saveCart(cart);
  renderCart();
  openCart();
}

function updateQuantity(productId, delta) {
  const cart = getCart();
  const item = cart.find((entry) => entry.id === productId);
  if (!item) return;
  item.quantity += delta;
  saveCart(cart.filter((entry) => entry.quantity > 0));
  renderCart();
}

function removeFromCart(productId) {
  saveCart(getCart().filter((item) => item.id !== productId));
  renderCart();
}

function openCart() {
  const cartDrawer = document.getElementById("cartDrawer");
  const backdrop = document.getElementById("backdrop");
  if (!cartDrawer || !backdrop) return;
  cartDrawer.classList.add("open");
  backdrop.classList.add("show");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  const cartDrawer = document.getElementById("cartDrawer");
  const backdrop = document.getElementById("backdrop");
  if (!cartDrawer || !backdrop) return;
  cartDrawer.classList.remove("open");
  backdrop.classList.remove("show");
  cartDrawer.setAttribute("aria-hidden", "true");
}

function renderCart() {
  const itemsEl = document.getElementById("cartItems");
  const countEl = document.getElementById("cartCount");
  const subtotalEl = document.getElementById("cartSubtotal");
  const badgeEls = document.querySelectorAll("[data-cart-count]");

  const count = cartCount();
  const subtotal = cartSubtotal();

  if (countEl) countEl.textContent = String(count);
  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  badgeEls.forEach((el) => el.textContent = String(count));

  if (!itemsEl) return;

  const cart = getCart();
  if (!cart.length) {
    itemsEl.innerHTML = '<div class="empty-state">Your cart is empty. Add products to begin checkout.</div>';
    return;
  }

  itemsEl.innerHTML = cart.map((item) => {
    const product = findProduct(item.id);
    if (!product) return "";
    return `
      <div class="cart-item">
        <div class="cart-item-top">
          <div>
            <h4>${product.name}</h4>
            <p>${formatCurrency(product.price)} each</p>
          </div>
          <div class="qty-controls">
            <button data-decrease="${product.id}" aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button data-increase="${product.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <strong>${formatCurrency(product.price * item.quantity)}</strong>
        <button class="remove-link" data-remove="${product.id}">Remove</button>
      </div>
    `;
  }).join("");
}

function renderProductGrid() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  const category = grid.dataset.category || "All";
  const products = getProducts().filter((product) => category === "All" || product.category === category);

  grid.innerHTML = products.map((product) => `
    <article class="product-card reveal">
      <a class="product-card-link" href="${product.slug}">
        <div class="product-media">
          <span class="product-badge">${product.badge}</span>
          <div class="product-shape"></div>
        </div>
      </a>
      <div class="product-copy">
        <div class="product-topline">
          <span>${product.category}</span>
          <span>${formatCurrency(product.price)}</span>
        </div>
        <h3><a href="${product.slug}">${product.name}</a></h3>
        <p>${product.shortDescription}</p>
        <div class="product-meta">
          <a href="${product.slug}" class="text-link">View details</a>
          <button class="btn btn-gold small" data-add="${product.id}">Add to Cart</button>
        </div>
      </div>
    </article>
  `).join("");
}

function setupFilters() {
  const buttons = document.querySelectorAll("[data-filter]");
  const grid = document.getElementById("productGrid");
  if (!buttons.length || !grid) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      grid.dataset.category = button.dataset.filter;
      renderProductGrid();
    });
  });
}

function setupFaq() {
  document.querySelectorAll(".faq-item").forEach((item) => {
    const button = item.querySelector(".faq-question");
    if (!button) return;
    button.addEventListener("click", () => {
      item.classList.toggle("open");
    });
  });
}

async function handleCheckout() {
  const checkoutBtn = document.getElementById("checkoutBtn");
  const cart = getCart();

  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Redirecting...";
  }

  try {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ cart })
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      throw new Error(data.error || "Unable to start checkout.");
    }

    window.location.href = data.url;
  } catch (error) {
    console.error(error);
    alert(error.message || "Checkout failed.");
  } finally {
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Checkout";
    }
  }
}

function setupContactForm() {
  const form = document.getElementById("contactForm");
  const message = document.getElementById("contactMessage");
  if (!form || !message) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    message.textContent = "Demo inquiry received. Connect this form to Formspree, Resend, or your preferred backend for production.";
    form.reset();
  });
}

function setupPageReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.12 });

  items.forEach((item) => observer.observe(item));
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const increaseButton = event.target.closest("[data-increase]");
  const decreaseButton = event.target.closest("[data-decrease]");
  const removeButton = event.target.closest("[data-remove]");
  const openCartBtn = event.target.closest("#openCartBtn");
  const closeCartBtn = event.target.closest("#closeCartBtn");
  const backdrop = event.target.closest("#backdrop");

  if (addButton) addToCart(addButton.dataset.add);
  if (increaseButton) updateQuantity(increaseButton.dataset.increase, 1);
  if (decreaseButton) updateQuantity(decreaseButton.dataset.decrease, -1);
  if (removeButton) removeFromCart(removeButton.dataset.remove);
  if (openCartBtn) openCart();
  if (closeCartBtn || backdrop) closeCart();
});

document.addEventListener("DOMContentLoaded", () => {
  renderProductGrid();
  renderCart();
  setupFilters();
  setupFaq();
  setupContactForm();
  setupPageReveal();

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", handleCheckout);

  const successPage = document.body.dataset.page === "success";
  if (successPage) localStorage.removeItem(STORAGE_KEY);
});
