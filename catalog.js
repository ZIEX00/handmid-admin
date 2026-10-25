const fallbackProducts = [
  { id: 3, name: "Crochet Medallion", name_ar: "ميدالية كروشيه", price: 150, category: "Keychains", image: "logos/Keychains.png" },
  { id: 4, name: "Beaded Lantern", name_ar: "فانوس خرز", price: 250, category: "Beadwork", image: "logos/Beadwork.png" },
  { id: 5, name: "Crochet Bucket Hat", name_ar: "قبعة كروشيه", price: 420, category: "Crochet", image: "logos/handmade_crochet_banner.png" },
];
const SUPABASE_URL = "https://gdhihedzthuininorhtw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CPWqXhFi7w4NOBeYdVvNcw_VFEQChY4";
const CART_KEY = "handmade-cart";
const categoryInfo = {
  Crochet: { title: "موديلات الكروشيه", description: "قطع ناعمة ومميزة معمولة بإيدينا وبحب.", titleEn: "Crochet pieces", descriptionEn: "Soft, unique pieces made by hand with love." },
  Beadwork: { title: "موديلات مشغولات الخرز", description: "تفاصيل لامعة وإكسسوارات تضيف لمسة مختلفة.", titleEn: "Beadwork pieces", descriptionEn: "Handmade beadwork and accessories with a little sparkle." },
  Keychains: { title: "موديلات الميداليات", description: "تفاصيل صغيرة مصممة عشان تفرّحك كل يوم.", titleEn: "Keychains", descriptionEn: "Small handmade details to brighten every day." },
  "Custom Orders": { title: "منتجات مميزة", description: "اكتشف قطعنا المصنوعة بعناية.", titleEn: "Handmade pieces", descriptionEn: "Discover our carefully handmade pieces." },
};
let category = new URLSearchParams(window.location.search).get("category") || "Crochet";
let searchTerm = "";
let language = localStorage.getItem("handmade-language") || "ar";
let products = [];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);
}

function normalizeCategory(value) {
  const categoryName = String(value || "").trim().toLowerCase();
  if (categoryName === "كروشيه" || categoryName === "crochet") return "Crochet";
  if (categoryName === "مشغولات خرز" || categoryName === "خرز" || categoryName === "beadwork") return "Beadwork";
  if (categoryName === "ميداليات" || categoryName === "ميدالية" || categoryName === "keychains") return "Keychains";
  return "Custom Orders";
}

function getStoredCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.warn("Invalid saved cart.", error);
    return [];
  }
}

function renderCartCount() {
  document.querySelector("#catalog-cart-count").textContent = String(
    getStoredCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0),
  );
}

function showToast(message, isError = false) {
  const container = document.querySelector("#toast-container");
  const toast = document.createElement("div");
  toast.className = `site-toast${isError ? " error" : ""}`;
  toast.textContent = message;
  container.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

function addToCart(product) {
  const cart = getStoredCart();
  const existing = cart.find((item) => String(item.id) === String(product.id)
    || (!item.id && item.name === product.name));
  const availableStock = Number(product.stock);
  if (Number.isFinite(availableStock) && availableStock <= (existing?.quantity || 0)) {
    showToast(language === "ar" ? "الكمية المتاحة من هذا المنتج نفدت." : "This product is out of stock.", true);
    return false;
  }
  if (existing) existing.quantity++;
  else cart.push({ ...product, quantity: 1 });
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCartCount();
  showToast(language === "ar" ? "تمت إضافة المنتج إلى السلة." : "Added to your bag.");
  return true;
}

function applyLanguage() {
  const isArabic = language === "ar";
  document.documentElement.lang = language;
  document.documentElement.dir = isArabic ? "rtl" : "ltr";
  document.querySelector("#catalog-language").textContent = isArabic ? "English" : "عربي";
  document.querySelector("#catalog-title").textContent = categoryInfo[category]?.[isArabic ? "title" : "titleEn"] || categoryInfo.Crochet[isArabic ? "title" : "titleEn"];
  document.querySelector("#catalog-description").textContent = categoryInfo[category]?.[isArabic ? "description" : "descriptionEn"] || categoryInfo.Crochet[isArabic ? "description" : "descriptionEn"];
  document.querySelector("#catalog-search").placeholder = isArabic ? "ابحث داخل المجموعة" : "Search this collection";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const values = {
      announcement: isArabic ? "مصنوع يدويًا في مصر • قطع مميزة بكميات محدودة" : "Handmade in Egypt • Unique pieces in limited quantities",
      eyebrow: isArabic ? "مجموعة هاند ميد" : "HANDMADE COLLECTION",
      back: isArabic ? "العودة للمتجر ←" : "Back to shop →",
      cart: isArabic ? "السلة" : "Bag",
      crochet: isArabic ? "كروشيه" : "Crochet",
      beadwork: isArabic ? "مشغولات خرز" : "Beadwork",
      keychains: isArabic ? "ميداليات" : "Keychains",
      custom: isArabic ? "طلبات خاصة" : "Custom orders",
    };
    element.textContent = values[key] || element.textContent;
  });
  document.querySelector("[data-i18n-aria-label='searchLabel']").setAttribute("aria-label", isArabic ? "البحث في المنتجات" : "Search products");
  document.querySelector("[data-i18n-aria-label='categoriesLabel']").setAttribute("aria-label", isArabic ? "تصنيفات المنتجات" : "Product categories");
  renderCatalog();
}

function renderCatalog() {
  document.querySelectorAll(".catalog-nav [data-category]").forEach((link) => {
    link.classList.toggle("active", link.dataset.category === category);
  });
  const visibleProducts = products.filter((product) => {
    const matchesCategory = normalizeCategory(product.category) === category;
    const name = `${product.name_ar || ""} ${product.name || ""}`.toLowerCase();
    return matchesCategory && (!searchTerm || name.includes(searchTerm.toLowerCase()));
  });
  document.querySelector("#catalog-grid").innerHTML = visibleProducts.length
    ? visibleProducts.map((product) => {
      const productName = language === "ar" ? product.name_ar || product.name : product.name || product.name_ar;
      const outOfStock = Number.isFinite(Number(product.stock)) && Number(product.stock) < 1;
      return `<article class="product-card" data-product-id="${escapeHtml(product.id)}"><img src="${escapeHtml(product.image || "")}" alt="${escapeHtml(productName)}" loading="lazy"><div class="product-info"><h3>${escapeHtml(productName)}</h3><strong class="price">${language === "ar" ? "جنيه" : "EGP"} ${escapeHtml(product.price ?? "")}</strong><button class="product-details-trigger" type="button">${language === "ar" ? "عرض التفاصيل" : "View details"}</button><button class="button dark catalog-add" data-id="${escapeHtml(product.id)}" type="button" ${outOfStock ? "disabled" : ""}><span>${outOfStock ? (language === "ar" ? "نفد المخزون" : "Out of stock") : (language === "ar" ? "أضف للسلة" : "Add to bag")}</span><span>+</span></button></div></article>`;
    }).join("")
    : `<div class="catalog-empty">${language === "ar" ? "لا توجد موديلات في هذا التصنيف حاليًا." : "No products found in this collection."}</div>`;
}

async function loadProducts() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&is_active=eq.true`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!response.ok) throw new Error(await response.text());
    products = await response.json();
  } catch (error) {
    console.warn("Supabase products unavailable; using saved products.", error);
    try {
      const saved = JSON.parse(localStorage.getItem("handmade-products") || "null");
      products = Array.isArray(saved) && saved.length ? saved : fallbackProducts;
    } catch (storageError) {
      console.warn("Invalid saved products.", storageError);
      products = fallbackProducts;
    }
  }
  products = products.filter((product) => product.is_active !== false);
  applyLanguage();
}

document.querySelector("#catalog-search").addEventListener("input", (event) => {
  searchTerm = event.target.value.trim();
  renderCatalog();
});
document.querySelector("#catalog-language").addEventListener("click", () => {
  language = language === "ar" ? "en" : "ar";
  localStorage.setItem("handmade-language", language);
  applyLanguage();
});
document.querySelector("#catalog-grid").addEventListener("click", (event) => {
  const button = event.target.closest(".catalog-add");
  if (button) {
    const product = products.find((item) => String(item.id) === button.dataset.id);
    if (product) addToCart(product);
    return;
  }
  const card = event.target.closest(".product-card[data-product-id]");
  if (!card) return;
  const product = products.find((item) => String(item.id) === card.dataset.productId);
  if (!product) return;
  window.openProductDetails(product, {
    language,
    currency: language === "ar" ? "جنيه" : "EGP",
    addLabel: language === "ar" ? "أضف للسلة" : "Add to bag",
    closeLabel: language === "ar" ? "إغلاق" : "Close",
    onAdd: () => addToCart(product),
  });
});

window.addEventListener("storage", (event) => {
  if (event.key === CART_KEY) renderCartCount();
});

renderCartCount();
loadProducts();
