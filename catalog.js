const fallbackProducts = [
  { id: 3, name: "Crochet Medallion", name_ar: "ميدالية كروشيه", price: 150, category: "Keychains", image: "logos/Keychains.png" },
  { id: 4, name: "Beaded Lantern", name_ar: "فانوس خرز", price: 250, category: "Beadwork", image: "logos/Beadwork.png" },
  { id: 5, name: "Crochet Bucket Hat", name_ar: "قبعة كروشيه", price: 420, category: "Crochet", image: "logos/handmade_crochet_banner.png" },
];
const categoryInfo = {
  Crochet: { title: "موديلات الكروشيه", description: "قطع ناعمة ومميزة معمولة بإيدينا وبحب." },
  Beadwork: { title: "موديلات مشغولات الخرز", description: "تفاصيل لامعة وإكسسوارات تضيف لمسة مختلفة." },
  Keychains: { title: "موديلات الميداليات", description: "تفاصيل صغيرة مصممة عشان تفرّحك كل يوم." },
};
let category = new URLSearchParams(window.location.search).get("category") || "Crochet";
let searchTerm = "";
let products = [];

function normalizeCategory(value) {
  const categoryName = String(value || "").trim().toLowerCase();
  if (categoryName === "كروشيه" || categoryName === "crochet") return "Crochet";
  if (categoryName === "مشغولات خرز" || categoryName === "خرز" || categoryName === "beadwork") return "Beadwork";
  if (categoryName === "ميداليات" || categoryName === "ميدالية" || categoryName === "keychains") return "Keychains";
  return "Custom Orders";
}

function getProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem("handmade-products") || "null");
    return Array.isArray(saved) ? saved : fallbackProducts;
  } catch (error) {
    return fallbackProducts;
  }
}
function showToast(message) {
  const container = document.querySelector("#toast-container");
  const toast = document.createElement("div");
  toast.className = "site-toast";
  toast.textContent = message;
  container.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3600);
}
function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem("handmade-cart") || "[]");
  const existing = cart.find((item) => item.name === product.name);
  existing ? existing.quantity++ : cart.push({ ...product, quantity: 1 });
  localStorage.setItem("handmade-cart", JSON.stringify(cart));
  showToast("تمت إضافة المنتج إلى السلة");
}
function renderCatalog() {
  const info = categoryInfo[category] || categoryInfo.Crochet;
  document.querySelector("#catalog-title").textContent = info.title;
  document.querySelector("#catalog-description").textContent = info.description;
  document.querySelectorAll("[data-category]").forEach((link) => link.classList.toggle("active", link.dataset.category === category));
  const visibleProducts = products.filter((product) => {
    const matchesCategory = normalizeCategory(product.category) === category;
    const name = `${product.name_ar || ""} ${product.name || ""}`.toLowerCase();
    return matchesCategory && (!searchTerm || name.includes(searchTerm.toLowerCase()));
  });
  document.querySelector("#catalog-grid").innerHTML = visibleProducts.length
    ? visibleProducts.map((product) => `<article class="product-card"><img src="${product.image}" alt="${product.name_ar || product.name}" loading="lazy"><div class="product-info"><h3>${product.name_ar || product.name}</h3><strong class="price">جنيه ${product.price}</strong><button class="button dark catalog-add" data-id="${product.id}" type="button"><span>أضف للسلة</span><span>+</span></button></div></article>`).join("")
    : '<div class="catalog-empty">لا توجد موديلات في هذا التصنيف حاليًا.</div>';
}

document.querySelector("#catalog-search").addEventListener("input", (event) => {
  searchTerm = event.target.value.trim();
  renderCatalog();
});
document.querySelector("#catalog-grid").addEventListener("click", (event) => {
  const button = event.target.closest(".catalog-add");
  if (!button) return;
  const product = products.find((item) => String(item.id) === button.dataset.id);
  if (product) addToCart(product);
});
products = getProducts();
renderCatalog();
