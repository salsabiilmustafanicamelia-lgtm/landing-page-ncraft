const CART_STORAGE_KEY = "ncraft-cart";
const FAVORITES_STORAGE_KEY = "ncraft-favorites";

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    cartStatus.textContent = "Penyimpanan browser tidak tersedia.";
  }
}

const cart = new Map(Object.entries(readStorage(CART_STORAGE_KEY, {})));
const favorites = new Set(readStorage(FAVORITES_STORAGE_KEY, []));
const cartCount = document.querySelector("#cart-count");
const cartItemCount = document.querySelector("#cart-item-count");
const cartEmpty = document.querySelector("#cart-empty");
const cartItems = document.querySelector("#cart-items");
const cartTotalRow = document.querySelector("#cart-total-row");
const cartTotal = document.querySelector("#cart-total");
const cartStatus = document.querySelector("#cart-status");
const cartClear = document.querySelector("#cart-clear");
const searchInput = document.querySelector("#product-search");
const favoriteFilter = document.querySelector("#favorite-filter");
const favoriteCount = document.querySelector("#favorite-count");
const productResults = document.querySelector("#product-results");
const productsEmpty = document.querySelector("#products-empty");
const productCards = [...document.querySelectorAll(".product-card")];
let favoritesOnly = false;
const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function renderCart() {
  const entries = [...cart.entries()];
  const itemCount = entries.reduce((total, [, item]) => total + item.quantity, 0);
  const total = entries.reduce((sum, [, item]) => sum + item.price * item.quantity, 0);

  cartCount.textContent = itemCount;
  cartItemCount.textContent = itemCount;
  cartEmpty.hidden = entries.length > 0;
  cartTotalRow.hidden = entries.length === 0;
  cartClear.disabled = entries.length === 0;
  cartItems.replaceChildren();

  for (const [name, item] of entries) {
    const row = document.createElement("li");
    const description = document.createElement("span");
    const price = document.createElement("span");
    const remove = document.createElement("button");

    row.className = "cart-item";
    description.textContent = `${name} × ${item.quantity}`;
    price.className = "cart-item-price";
    price.textContent = rupiah.format(item.price * item.quantity);
    remove.className = "cart-remove";
    remove.type = "button";
    remove.textContent = "Hapus";
    remove.setAttribute("aria-label", `Hapus ${name} dari keranjang`);
    remove.addEventListener("click", () => {
      cart.delete(name);
      writeStorage(CART_STORAGE_KEY, Object.fromEntries(cart));
      cartStatus.textContent = `${name} dihapus dari keranjang.`;
      renderCart();
    });

    row.append(description, price, remove);
    cartItems.append(row);
  }

  cartTotal.textContent = rupiah.format(total);
}

function renderProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase("id-ID");
  let visibleCount = 0;

  productCards.forEach(card => {
    const name = card.dataset.productName;
    const matchesQuery = name.toLocaleLowerCase("id-ID").includes(query);
    const matchesFavorites = !favoritesOnly || favorites.has(name);
    const isVisible = matchesQuery && matchesFavorites;

    card.hidden = !isVisible;
    visibleCount += Number(isVisible);
  });

  productsEmpty.hidden = visibleCount > 0;
  productResults.textContent = `${visibleCount} produk ditampilkan`;
}

function updateFavoriteButton(button, name) {
  const isFavorite = favorites.has(name);

  button.setAttribute("aria-pressed", String(isFavorite));
  button.setAttribute("aria-label", `${isFavorite ? "Hapus" : "Simpan"} ${name} ${isFavorite ? "dari" : "ke"} favorit`);
  button.title = isFavorite ? "Hapus dari favorit" : "Simpan ke favorit";
  button.querySelector("span").textContent = isFavorite ? "♥" : "♡";
}

function renderFavorites() {
  favoriteCount.textContent = favorites.size;

  productCards.forEach(card => {
    updateFavoriteButton(card.querySelector(".favorite-toggle"), card.dataset.productName);
  });

  renderProducts();
}

productCards.forEach(card => {
  const quantityInput = card.querySelector(".quantity-input");
  const productName = card.dataset.productName;
  const productPrice = Number(card.dataset.price);

  card.querySelector(".favorite-toggle").addEventListener("click", event => {
    const button = event.currentTarget;

    if (favorites.has(productName)) {
      favorites.delete(productName);
      cartStatus.textContent = `${productName} dihapus dari favorit.`;
    } else {
      favorites.add(productName);
      cartStatus.textContent = `${productName} disimpan ke favorit.`;
    }

    writeStorage(FAVORITES_STORAGE_KEY, [...favorites]);
    renderFavorites();
  });

  card.querySelectorAll(".quantity-button").forEach(button => {
    button.addEventListener("click", () => {
      const change = button.dataset.change === "increase" ? 1 : -1;
      const current = Number.parseInt(quantityInput.value, 10) || 1;
      quantityInput.value = Math.min(99, Math.max(1, current + change));
    });
  });

  quantityInput.addEventListener("change", () => {
    const quantity = Number.parseInt(quantityInput.value, 10) || 1;
    quantityInput.value = Math.min(99, Math.max(1, quantity));
  });

  card.querySelector(".add-to-cart").addEventListener("click", () => {
    const quantity = Math.min(99, Math.max(1, Number.parseInt(quantityInput.value, 10) || 1));
    const item = cart.get(productName) ?? { price: productPrice, quantity: 0 };

    item.quantity += quantity;
    cart.set(productName, item);
    writeStorage(CART_STORAGE_KEY, Object.fromEntries(cart));
    cartStatus.textContent = `${quantity} ${productName} ditambahkan ke keranjang.`;
    renderCart();
  });
});

searchInput.addEventListener("input", renderProducts);

favoriteFilter.addEventListener("click", () => {
  favoritesOnly = !favoritesOnly;
  favoriteFilter.setAttribute("aria-pressed", String(favoritesOnly));
  favoriteFilter.querySelector("span").textContent = favoritesOnly ? "♥" : "♡";
  renderProducts();
});

cartClear.addEventListener("click", () => {
  cart.clear();
  writeStorage(CART_STORAGE_KEY, Object.fromEntries(cart));
  cartStatus.textContent = "Keranjang berhasil dikosongkan.";
  renderCart();
});

renderCart();
renderFavorites();