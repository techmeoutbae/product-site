const STORAGE_KEY = "premium_storefront_cart"

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(cents / 100)
}

function getProducts() {
  return window.PRODUCTS || []
}

function findProduct(id) {
  return getProducts().find((product) => product.id === id)
}

function applyProductVisualStyle(element, product) {
  if (!element || !product) return

  element.style.setProperty("--product-glow", product.glow)
  element.style.setProperty("--product-core", product.core)
  element.style.setProperty("--product-edge", product.edge)
  element.dataset.index = product.badge
}

function renderProductVisual(product, className = "") {
  const mediaClass = ["product-media", className].filter(Boolean).join(" ")

  return `
    <div class="${mediaClass}" data-index="${product.badge}" style="--product-glow: ${product.glow}; --product-core: ${product.core}; --product-edge: ${product.edge};">
      <div class="product-shell"></div>
      <div class="product-core"></div>
      <div class="product-orbit"></div>
    </div>
  `
}

function renderProductCard(product) {
  return `
    <article class="product-card reveal">
      <a class="product-card-link" href="${product.slug}">
        ${renderProductVisual(product)}
      </a>
      <div class="product-copy">
        <div class="product-topline">
          <span>${product.category}</span>
          <span>${formatCurrency(product.price)}</span>
        </div>
        <h3><a href="${product.slug}">${product.name}</a></h3>
        <p>${product.shortDescription}</p>
        <div class="product-meta">
          <a href="${product.slug}" class="text-link">View product</a>
          <button class="btn btn-gold small" data-add="${product.id}">Add to Cart</button>
        </div>
      </div>
    </article>
  `
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0)
}

function cartSubtotal() {
  return getCart().reduce((sum, item) => {
    const product = findProduct(item.id)
    return product ? sum + (product.price * item.quantity) : sum
  }, 0)
}

function addToCart(productId) {
  const cart = getCart()
  const existing = cart.find((item) => item.id === productId)

  if (existing) {
    existing.quantity += 1
  } else {
    cart.push({ id: productId, quantity: 1 })
  }

  saveCart(cart)
  renderCart()
  openCart()
}

function updateQuantity(productId, delta) {
  const cart = getCart()
  const item = cart.find((entry) => entry.id === productId)
  if (!item) return

  item.quantity += delta
  saveCart(cart.filter((entry) => entry.quantity > 0))
  renderCart()
}

function removeFromCart(productId) {
  saveCart(getCart().filter((item) => item.id !== productId))
  renderCart()
}

function openCart() {
  const cartDrawer = document.getElementById("cartDrawer")
  const backdrop = document.getElementById("backdrop")
  if (!cartDrawer || !backdrop) return

  closeMobileNav()
  cartDrawer.classList.add("open")
  backdrop.classList.add("show")
  cartDrawer.setAttribute("aria-hidden", "false")
  document.body.classList.add("cart-open")
}

function closeCart() {
  const cartDrawer = document.getElementById("cartDrawer")
  const backdrop = document.getElementById("backdrop")
  if (!cartDrawer || !backdrop) return

  cartDrawer.classList.remove("open")
  backdrop.classList.remove("show")
  cartDrawer.setAttribute("aria-hidden", "true")
  document.body.classList.remove("cart-open")
}

function openMobileNav() {
  const navLinks = document.querySelector(".nav-links")
  const navToggle = document.querySelector(".nav-toggle")
  if (!navLinks || !navToggle) return

  closeCart()
  navLinks.classList.add("open")
  document.body.classList.add("nav-open")
  navToggle.setAttribute("aria-expanded", "true")
}

function closeMobileNav() {
  const navLinks = document.querySelector(".nav-links")
  const navToggle = document.querySelector(".nav-toggle")
  if (!navLinks || !navToggle) return

  navLinks.classList.remove("open")
  document.body.classList.remove("nav-open")
  navToggle.setAttribute("aria-expanded", "false")
}

function setupMobileNav() {
  const nav = document.querySelector(".nav")
  const navLinks = nav?.querySelector(".nav-links")
  const navActions = nav?.querySelector(".nav-actions")
  if (!nav || !navLinks || !navActions) return

  navLinks.id = "siteNav"

  let navToggle = nav.querySelector(".nav-toggle")
  if (!navToggle) {
    navToggle = document.createElement("button")
    navToggle.type = "button"
    navToggle.className = "nav-toggle"
    navToggle.setAttribute("aria-label", "Toggle navigation")
    navToggle.setAttribute("aria-controls", "siteNav")
    navToggle.setAttribute("aria-expanded", "false")
    navToggle.innerHTML = "<span></span><span></span><span></span>"
    navActions.prepend(navToggle)
  }

  navToggle.addEventListener("click", () => {
    if (document.body.classList.contains("nav-open")) {
      closeMobileNav()
    } else {
      openMobileNav()
    }
  })

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileNav)
  })

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeMobileNav()
  })
}

function renderCart() {
  const itemsEl = document.getElementById("cartItems")
  const countEl = document.getElementById("cartCount")
  const subtotalEl = document.getElementById("cartSubtotal")
  const badgeEls = document.querySelectorAll("[data-cart-count]")

  const count = cartCount()
  const subtotal = cartSubtotal()

  if (countEl) countEl.textContent = String(count)
  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal)
  badgeEls.forEach((el) => {
    el.textContent = String(count)
  })

  if (!itemsEl) return

  const cart = getCart()
  if (!cart.length) {
    itemsEl.innerHTML = '<div class="empty-state">Your cart is empty. Add products to begin checkout.</div>'
    return
  }

  itemsEl.innerHTML = cart.map((item) => {
    const product = findProduct(item.id)
    if (!product) return ""

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
    `
  }).join("")
}

function renderProductGrid() {
  const grid = document.getElementById("productGrid")
  if (!grid) return

  const category = grid.dataset.category || "All"
  const products = getProducts().filter((product) => category === "All" || product.category === category)

  grid.innerHTML = products.length
    ? products.map(renderProductCard).join("")
    : '<div class="empty-state">No products match this filter.</div>'

  setupPageReveal()
}

function getRelatedProducts(currentProduct, count = 3) {
  const products = getProducts()
  const currentIndex = products.findIndex((product) => product.id === currentProduct.id)

  if (currentIndex === -1) {
    return products.slice(0, count)
  }

  return Array.from({ length: Math.min(count, Math.max(products.length - 1, 0)) }, (_, offset) => {
    return products[(currentIndex + offset + 1) % products.length]
  })
}

function setupProductPage() {
  const productId = document.body.dataset.productId
  if (!productId) return

  const product = findProduct(productId)
  if (!product) return

  document.title = `${product.name} — YOUR BRAND`

  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription) {
    metaDescription.setAttribute("content", `${product.name} in a premium, responsive storefront template.`)
  }

  const heroLabel = document.getElementById("productHeroLabel")
  const heroTitle = document.getElementById("productHeroTitle")
  const heroDescription = document.getElementById("productHeroDescription")
  const panelTitle = document.getElementById("productPanelTitle")
  const panelPrice = document.getElementById("productPanelPrice")
  const panelDescription = document.getElementById("productPanelDescription")
  const productReference = document.getElementById("productReference")
  const addButton = document.getElementById("productAddBtn")
  const productStage = document.getElementById("productStage")
  const relatedProducts = document.getElementById("relatedProducts")

  if (heroLabel) heroLabel.textContent = product.category
  if (heroTitle) heroTitle.textContent = product.name
  if (heroDescription) heroDescription.textContent = product.description
  if (panelTitle) panelTitle.textContent = product.name
  if (panelPrice) panelPrice.textContent = formatCurrency(product.price)
  if (panelDescription) panelDescription.textContent = product.description
  if (productReference) productReference.textContent = `Ref ${product.badge}`
  if (addButton) addButton.dataset.add = product.id

  applyProductVisualStyle(productStage, product)

  if (relatedProducts) {
    relatedProducts.innerHTML = getRelatedProducts(product).map(renderProductCard).join("")
  }
}

function setupFilters() {
  const buttons = document.querySelectorAll("[data-filter]")
  const grid = document.getElementById("productGrid")
  if (!buttons.length || !grid) return

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((entry) => entry.classList.remove("active"))
      button.classList.add("active")
      grid.dataset.category = button.dataset.filter
      renderProductGrid()
    })
  })
}

function setupFaq() {
  document.querySelectorAll(".faq-item").forEach((item) => {
    const button = item.querySelector(".faq-question")
    if (!button) return

    button.addEventListener("click", () => {
      item.classList.toggle("open")
    })
  })
}

async function handleCheckout() {
  const checkoutBtn = document.getElementById("checkoutBtn")
  const cart = getCart()

  if (!cart.length) {
    alert("Your cart is empty.")
    return
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = true
    checkoutBtn.textContent = "Redirecting..."
  }

  try {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ cart })
    })

    const data = await response.json()

    if (!response.ok || !data.url) {
      throw new Error(data.error || "Unable to start checkout.")
    }

    window.location.href = data.url
  } catch (error) {
    console.error(error)
    alert(error.message || "Checkout failed.")
  } finally {
    if (checkoutBtn) {
      checkoutBtn.disabled = false
      checkoutBtn.textContent = "Checkout"
    }
  }
}

function setupContactForm() {
  const form = document.getElementById("contactForm")
  const message = document.getElementById("contactMessage")
  if (!form || !message) return

  form.addEventListener("submit", (event) => {
    event.preventDefault()
    message.textContent = "Thanks. This form is ready to connect to your inbox, CRM, or backend workflow."
    form.reset()
  })
}

function setupPageReveal() {
  const items = document.querySelectorAll(".reveal")
  if (!items.length) return

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((item) => item.classList.add("visible"))
    return
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible")
    })
  }, { threshold: 0.12 })

  items.forEach((item) => observer.observe(item))
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]")
  const increaseButton = event.target.closest("[data-increase]")
  const decreaseButton = event.target.closest("[data-decrease]")
  const removeButton = event.target.closest("[data-remove]")
  const openCartBtn = event.target.closest("#openCartBtn")
  const closeCartBtn = event.target.closest("#closeCartBtn")
  const backdrop = event.target.closest("#backdrop")

  if (addButton) addToCart(addButton.dataset.add)
  if (increaseButton) updateQuantity(increaseButton.dataset.increase, 1)
  if (decreaseButton) updateQuantity(decreaseButton.dataset.decrease, -1)
  if (removeButton) removeFromCart(removeButton.dataset.remove)
  if (openCartBtn) openCart()
  if (closeCartBtn || backdrop) closeCart()
})

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart()
    closeMobileNav()
  }
})

document.addEventListener("DOMContentLoaded", () => {
  renderProductGrid()
  renderCart()
  setupMobileNav()
  setupFilters()
  setupFaq()
  setupContactForm()
  setupProductPage()
  setupPageReveal()

  const checkoutBtn = document.getElementById("checkoutBtn")
  if (checkoutBtn) checkoutBtn.addEventListener("click", handleCheckout)

  const successPage = document.body.dataset.page === "success"
  if (successPage) localStorage.removeItem(STORAGE_KEY)
})
