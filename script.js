const fallbackProducts = [
  {
    id: 3,
    name: "Crochet Medallion",
    name_ar: "ميدالية كروشيه",
    price: 150,
    category: "Keychains",
    image:
      "logos/Keychains.png",
  },
  {
    id: 4,
    name: "Beaded Lantern",
    name_ar: "فانوس خرز",
    price: 250,
    category: "Beadwork",
    image:
      "logos/Beadwork.png",
  },
  {
    id: 5,
    name: "Crochet Bucket Hat",
    name_ar: "قبعة كروشيه",
    price: 420,
    category: "Crochet",
    image:
      "logos/handmade_crochet_banner.png",
  },
];
const SUPABASE_URL = "https://gdhihedzthuininorhtw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CPWqXhFi7w4NOBeYdVvNcw_VFEQChY4";
const CART_KEY = "handmade-cart";
const ORDER_KEY = "handmade-orders";
const REVIEW_KEY = "handmade-reviews";
const FAVORITES_KEY = "handmade-favorites";
const PRODUCT_PREVIEW_LIMIT = 10;
let products = fallbackProducts;
let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
let language = localStorage.getItem("handmade-language") || "en";
let activeCategory = "all";
let searchTerm = "";
let showAllProducts = false;
function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}
function showToast(message, type = "success") {
  const container = document.querySelector("#toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `site-toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add("hide");
    window.setTimeout(() => toast.remove(), 250);
  }, 4200);
}
function showOrderTrackingToast(orderId) {
  const container = document.querySelector("#toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "site-toast order-tracking-toast";
  const message = document.createElement("span");
  message.textContent = language === "ar" ? `تم استلام طلبك. رقم الطلب: ${orderId}` : `Order received. Order number: ${orderId}`;
  const link = document.createElement("a");
  link.href = `track-order.html?id=${encodeURIComponent(orderId)}`;
  link.textContent = language === "ar" ? "تتبع الطلب أو إلغاؤه" : "Track or cancel order";
  toast.append(message, link);
  container.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add("hide");
    window.setTimeout(() => toast.remove(), 250);
  }, 15000);
}
function getFavoriteIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(saved) ? saved.map(String) : [];
  } catch (error) {
    return [];
  }
}
function toggleFavorite(productId) {
  const favoriteIds = getFavoriteIds();
  const id = String(productId);
  const nextIds = favoriteIds.includes(id) ? favoriteIds.filter((item) => item !== id) : [...favoriteIds, id];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextIds));
  renderProducts();
  renderFavorites();
  showToast(nextIds.includes(id) ? (language === "ar" ? "تمت إضافة المنتج للمفضلة." : "Added to favorites.") : (language === "ar" ? "تمت إزالة المنتج من المفضلة." : "Removed from favorites."), "success");
}
const translations = {
  en: {
    announcement: "Free delivery on orders over EGP 800 <span>•</span> Made by hand in Egypt",
    home: "Home", shop: "Shop", categories: "Categories", customOrders: "Custom Orders", about: "About", contact: "Contact", trackOrder: "Track Order", contactEyebrow: "LET'S TALK", contactTitle: "A little question? We're here.", contactDescription: "Message us about an order, a custom idea, or anything you'd like to know.", whatsappUs: "Chat with us on WhatsApp",
    heroEyebrow: "HANDMADE WITH LOVE", heroTitle: "Made by Hand.<br>Made for You.", heroDescription: "Unique crochet pieces, beautiful beadwork and handmade accessories — crafted with care, just for you.", shopCollection: "Shop Collection", shopByCategory: "Shop by Category", viewAll: "View All", featuredProducts: "Featured Products",
    yourIdea: "Your Idea, Handmade.", customDescription: "Want something special? Choose your colors, size and style — and we’ll create it just for you.", requestOrder: "Request Custom Order", chooseStyle: "Choose Your Style", bracelets: "◌ Bracelets", necklaces: "◌ Necklaces", keychains: "◌ Keychains", crochetItems: "◌ Crochet Items", customerReviews: "What Our Customers Say", viewReviews: "View All Reviews", followUs: "Follow Us @handmade_egypt_1", moreInstagram: "More on Instagram", yourBag: "Your Bag", favorites: "Favorites", emptyFavorites: "You haven't saved any products yet.", removeFavorite: "Remove from favorites", openProduct: "View product", emptyCart: "Your bag is waiting for something special.", total: "Total", checkout: "Checkout", addToBag: "Add to bag", showMoreProducts: "Show remaining products", loading: "Loading handmade pieces...", currency: "EGP", storyEyebrow: "OUR STORY", storyTitle: "Crafted slowly, made to feel personal.", storyDescription: "Each handmade piece begins with an idea, a color palette, and a lot of love. We design crochet, beadwork, and accessories that feel warm, wearable, and unique.", smallBatch: "Small batch", smallBatchDescription: "Thoughtfully made in limited runs.", giftReady: "Gift-ready", giftReadyDescription: "Beautiful packaging for every order.", madeInEgypt: "Made in Egypt", nameLabel: "Name", phoneLabel: "Phone", addressLabel: "Delivery address", checkoutNote: "We will contact you to confirm delivery and payment. Delivery is free on orders over EGP 800.", noteLabel: "Order note", placeOrder: "Place Order", search: "Search", writeReview: "Share your review", sendReview: "Send review",
  },
  ar: {
    announcement: "توصيل مجاني للطلبات أكثر من ٨٠٠ جنيه <span>•</span> مصنوع يدويًا في مصر",
    home: "الرئيسية", shop: "المتجر", categories: "التصنيفات", customOrders: "طلبات خاصة", about: "عن Handmade", contact: "تواصل معنا", trackOrder: "تتبع طلبك", contactEyebrow: "احكيلنا", contactTitle: "عندك سؤال؟ إحنا موجودين.", contactDescription: "كلمينا عن طلبك، أو فكرتك لتصميم خاص، أو أي حاجة حابة تعرفيها.", whatsappUs: "راسلينا على واتساب",
    heroEyebrow: "مصنوع بحب", heroTitle: "صُنع يدويًا.<br>صُنع لك.", heroDescription: "قطع كروشيه مميزة، وإكسسوارات من الخرز مصنوعة يدويًا بعناية مخصوص عشانك.", shopCollection: "تسوق المجموعة", shopByCategory: "تسوق حسب التصنيف", viewAll: "عرض الكل", featuredProducts: "منتجات مميزة",
    yourIdea: "فكرتك، بتنفيذ يدوي.", customDescription: "عايز حاجة مميزة؟ اختار الألوان والمقاس والشكل، وإحنا هننفذها مخصوص ليك.", requestOrder: "اطلب تصميم خاص", chooseStyle: "اختار الشكل", bracelets: "◌ أساور", necklaces: "◌ سلاسل", keychains: "◌ ميداليات", crochetItems: "◌ منتجات كروشيه", customerReviews: "آراء عملائنا", viewReviews: "عرض كل الآراء", followUs: "تابعنا @handmade_egypt_1", moreInstagram: "المزيد على إنستجرام", yourBag: "سلتك", favorites: "المفضلة", emptyFavorites: "لسه ما أضفتش منتجات للمفضلة.", removeFavorite: "إزالة من المفضلة", openProduct: "عرض المنتج", emptyCart: "سلتك مستنية حاجة مميزة.", total: "الإجمالي", checkout: "إتمام الطلب", addToBag: "أضف للسلة", showMoreProducts: "عرض باقي المنتجات", loading: "جاري تحميل المنتجات...", currency: "جنيه", storyEyebrow: "حكايتنا", storyTitle: "مصنوع على مهله، ومخصوص عشانك.", storyDescription: "كل قطعة بتبدأ بفكرة وألوان متناسقة وحب كبير. بنصمم كروشيه ومشغولات خرز وإكسسوارات دافئة ومميزة وسهلة الاستخدام.", smallBatch: "كميات محدودة", smallBatchDescription: "مصنوعة بعناية وبأعداد قليلة.", giftReady: "جاهزة كهدية", giftReadyDescription: "تغليف جميل مع كل طلب.", madeInEgypt: "مصنوع في مصر", nameLabel: "الاسم", phoneLabel: "رقم الهاتف", addressLabel: "عنوان التوصيل", checkoutNote: "هنتواصل معاك لتأكيد تفاصيل التوصيل وطريقة الدفع. التوصيل مجاني للطلبات فوق ٨٠٠ جنيه.", noteLabel: "ملاحظات الطلب", placeOrder: "تأكيد الطلب", search: "بحث", writeReview: "شاركنا رأيك", sendReview: "إرسال الرأي",
  },
};
const categories = [
  ["Crochet", "Soft, cozy & unique", "كروشيه", "ناعم، دافئ ومميز",
    "logos/crochet.png",
  ],
  ["Beadwork", "Sparkle with handmade beadwork", "مشغولات خرز", "إكسسوارات خرز مصنوعة يدويًا",
    "logos/Beadwork.png",
  ],
  ["Keychains", "Small details, big smiles", "ميداليات", "تفاصيل صغيرة وفرحة كبيرة",
    "logos/Keychains.png",
  ],
  ["Custom Orders", "Your idea, handmade", "طلبات خاصة", "فكرتك، بتنفيذ يدوي",
    "logos/custom-order.png",
  ],
];
function getLocalProducts() {
  const saved = localStorage.getItem("handmade-products");
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    const remainingProducts = Array.isArray(parsed) ? parsed.filter((product) => ![1, 2].includes(Number(product.id))) : [];
    if (remainingProducts.length !== parsed.length) {
      localStorage.setItem("handmade-products", JSON.stringify(remainingProducts));
      localStorage.setItem("handmade-products-demo", JSON.stringify(remainingProducts));
    }
    return remainingProducts;
  } catch (error) {
    console.warn("Invalid local products", error);
    return null;
  }
}
function normalizeCategory(category) {
  const value = String(category || "").trim().toLowerCase();
  if (value === "crochet" || value === "كروشيه") return "Crochet";
  if (value === "beadwork" || value === "مشغولات خرز" || value === "خرز") return "Beadwork";
  if (value === "keychains" || value === "ميداليات" || value === "ميدالية") return "Keychains";
  return "Custom Orders";
}
function renderCategories() {
  document.querySelector("#category-grid").innerHTML = categories
    .map(
      ([name, description, arabicName, arabicDescription, image]) =>
        `<a class="category-card" href="${name === "Custom Orders" ? "custom-orders.html" : `catalog.html?category=${encodeURIComponent(name)}`}" data-category="${name}" style="background-image:url('${image}')"><div><span><b>${language === "ar" ? arabicName : name}</b><small>${language === "ar" ? arabicDescription : description}</small></span><span>→</span></div></a>`,
    )
    .join("");
}
function renderFilterPills() {
  const filterPills = [
    { value: "all", label: language === "ar" ? "الكل" : "All" },
    ...categories.map(([name, , arabicName]) => ({ value: name, label: language === "ar" ? arabicName : name })),
  ];

  document.querySelector("#filter-pills").innerHTML = filterPills
    .map(
      (pill) =>
        `<button class="filter-pill ${activeCategory === pill.value ? "active" : ""}" data-category="${pill.value}">${pill.label}</button>`,
    )
    .join("");
}
function inferCategory(product) {
  if (product.category) return normalizeCategory(product.category);
  const text = `${product.name || ""} ${product.name_ar || ""}`.toLowerCase();
  if (text.includes("crochet") || text.includes("كروشيه") || text.includes("قبعة") || text.includes("حقيبة")) return "Crochet";
  if (text.includes("bead") || text.includes("خرز") || text.includes("فانوس") || text.includes("لولي")) return "Beadwork";
  if (text.includes("key") || text.includes("ميدال") || text.includes("ميدالية")) return "Keychains";
  return "Custom Orders";
}
function getVisibleProducts() {
  return products.filter((product) => {
    const safeCategory = inferCategory(product);
    const productName = `${product.name_ar || ""} ${product.name || ""}`;
    const matchesCategory = activeCategory === "all" || safeCategory === activeCategory;
    const matchesSearch = !searchTerm || productName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}
function getProductId(product) {
  return String(product.id || products.indexOf(product));
}
function addProductToCart(product) {
  const existing = cart.find((item) => String(item.id) === String(product.id)
    || (!item.id && item.name === product.name));
  const availableStock = Number(product.stock);
  if (Number.isFinite(availableStock) && availableStock <= (existing?.quantity || 0)) {
    showToast(language === "ar" ? "الكمية المتاحة من هذا المنتج خلصت." : "This product is out of stock.", "error");
    return false;
  }
  existing ? existing.quantity++ : cart.push({ ...product, quantity: 1 });
  updateCart();
  toggleCart(true);
  return true;
}
function showProductDetails(product) {
  window.openProductDetails(product, {
    language,
    currency: translations[language].currency,
    addLabel: translations[language].addToBag,
    closeLabel: language === "ar" ? "إغلاق" : "Close",
    onAdd: () => addProductToCart(product),
  });
}
function renderProducts() {
  const visibleProducts = getVisibleProducts();
  const showMoreButton = document.querySelector("#show-more-products");
  showMoreButton.hidden = visibleProducts.length <= PRODUCT_PREVIEW_LIMIT || showAllProducts;
  showMoreButton.textContent = translations[language].showMoreProducts;
  if (!visibleProducts.length) {
    document.querySelector("#product-grid").innerHTML = `<div class="empty-state">${language === "ar" ? "لا توجد منتجات مطابقة للبحث." : "No products match your search."}</div>`;
    return;
  }

  const productsToRender = showAllProducts
    ? visibleProducts
    : visibleProducts.slice(0, PRODUCT_PREVIEW_LIMIT);
  document.querySelector("#product-grid").innerHTML = productsToRender
    .map((product, index) => {
      const productId = getProductId(product);
      const name = language === "ar" ? product.name_ar || product.name : product.name;
      return `<article class="product-card" data-product-id="${escapeHtml(productId)}"><button class="heart ${getFavoriteIds().includes(productId) ? "active" : ""}" data-favorite-id="${escapeHtml(productId)}" aria-label="${language === "ar" ? "أضف إلى المفضلة" : "Add to favorites"}"><i data-lucide="heart"></i></button><img src="${escapeHtml(product.image)}" alt="${escapeHtml(name)}" loading="lazy"><div class="product-info"><h3>${escapeHtml(name)}</h3><strong class="price">${translations[language].currency} ${escapeHtml(product.price)}</strong><button class="product-details-trigger" type="button">${language === "ar" ? "عرض التفاصيل" : "View details"}</button><button class="button dark add-to-cart" data-index="${escapeHtml(productId)}" style="margin-top:10px;padding:8px 11px;width:100%"><span>${translations[language].addToBag}</span> <span>+</span></button></div></article>`;
    })
    .join("");
  lucide.createIcons({ attrs: { "stroke-width": 1.5 } });
}
function renderFavorites() {
  const favoritesList = document.querySelector("#favorites-items");
  if (!favoritesList) return;
  const favoriteProducts = getFavoriteIds()
    .map((favoriteId) => products.find((product) => getProductId(product) === favoriteId))
    .filter(Boolean);
  favoritesList.innerHTML = favoriteProducts.length
    ? favoriteProducts.map((product) => {
      const productId = getProductId(product);
      const name = language === "ar" ? product.name_ar || product.name : product.name;
      return `<article class="favorite-item">
        <button class="favorite-product-link" type="button" data-open-favorite="${escapeHtml(productId)}" aria-label="${escapeHtml(translations[language].openProduct)}: ${escapeHtml(name)}">
          <img src="${escapeHtml(product.image)}" alt="">
          <span><b>${escapeHtml(name)}</b><small>${translations[language].currency} ${escapeHtml(product.price)}</small></span>
        </button>
        <button class="favorite-remove" type="button" data-remove-favorite="${escapeHtml(productId)}" aria-label="${escapeHtml(translations[language].removeFavorite)}">×</button>
      </article>`;
    }).join("")
    : `<p class="empty-cart">${translations[language].emptyFavorites}</p>`;
}
function getReviews() {
  const saved = localStorage.getItem(REVIEW_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.filter((review) => !String(review.id).startsWith("seed-"));
    } catch (error) {
      console.warn("Invalid saved reviews", error);
    }
  }
  return [];
}
async function renderReviews() {
  const reviewGrid = document.querySelector("#review-grid");
  if (!reviewGrid) return;
  let approvedReviews = getReviews().filter((review) => review.status === "approved");
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/reviews?select=id,name,rating,text,status,created_at&status=eq.approved&order=created_at.desc`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!response.ok) throw new Error(await response.text());
    const sharedReviews = await response.json();
    approvedReviews = sharedReviews;
  } catch (error) {
    console.warn("Shared reviews unavailable; showing approved saved reviews.", error);
  }
  reviewGrid.innerHTML = approvedReviews.length
    ? approvedReviews.map((review, index) => {
      const initials = String(review.name || "").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
      return `<article><div class="review-head"><span class="avatar ${index % 3 === 1 ? "peach" : index % 3 === 2 ? "green" : ""}">${escapeHtml(initials)}</span><span><b>${escapeHtml(review.name || "")}</b><em>${"★".repeat(Math.max(1, Math.min(5, Number(review.rating) || 5)))} </em></span></div><p>“${escapeHtml(review.text || "")}”</p></article>`;
    }).join("")
    : '<div class="empty-state">لا توجد آراء منشورة حتى الآن.</div>';
}
function updateWhatsAppLinks() {
  const messages = language === "ar"
    ? { contact: "مرحبًا هاند ميد، عندي استفسار.", customOrder: "مرحبًا هاند ميد، أريد طلب قطعة بتصميم خاص." }
    : { contact: "Hello Handmade, I have a question.", customOrder: "Hello Handmade, I want to order a custom piece." };
  document.querySelectorAll("[data-whatsapp-message]").forEach((link) => {
    const message = messages[link.dataset.whatsappMessage];
    if (message) link.href = `https://wa.me/201125935705?text=${encodeURIComponent(message)}`;
  });
}
function applyLanguage() {
  const text = translations[language];
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = text[element.dataset.i18n];
    if (value) element.innerHTML = value;
  });
  document.querySelector(".language-toggle").textContent = language === "ar" ? "English" : "عربي";
  document.querySelector(".language-toggle").setAttribute("aria-label", language === "ar" ? "التبديل إلى الإنجليزية" : "التبديل إلى العربية");
  document.querySelector("#favorites-button").setAttribute("aria-label", language === "ar" ? "المفضلة" : "Favorites");
  document.querySelector('[data-action="search"]').setAttribute("aria-label", text.search);
  document.querySelector("#product-search").placeholder = language === "ar" ? "ابحث باسم المنتج" : "Search by product name";
  document.querySelector('input[name="name"]').placeholder = language === "ar" ? "اسمك" : "Your name";
  document.querySelector('input[name="phone"]').placeholder = language === "ar" ? "01xxxxxxxxx" : "+20 1x xxxx xxxx";
  document.querySelector('input[name="address"]').placeholder = language === "ar" ? "المحافظة، المنطقة، العنوان بالتفصيل" : "City, area, and full street address";
  document.querySelector('textarea[name="note"]').placeholder = language === "ar" ? "اكتب الألوان أو أي تفاصيل تفضلها" : "Tell us your preferred colors or details";
  document.querySelector('[data-review-placeholder="name"]').placeholder = language === "ar" ? "اسمك" : "Your name";
  document.querySelector('[data-review-placeholder="text"]').placeholder = language === "ar" ? "اكتب رأيك في تجربتك معنا" : "Tell us about your experience";
  updateWhatsAppLinks();
  renderCategories();
  renderFilterPills();
  renderProducts();
  renderFavorites();
  renderReviews();
  updateCart();
}
async function loadProducts() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&is_active=eq.true`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!response.ok) throw new Error(await response.text());
    const remoteProducts = await response.json();
    products = remoteProducts.filter((product) => product.is_active !== false).map((product) => ({
      ...product,
      category: inferCategory(product),
      name_ar: product.name_ar || product.name,
    }));
  } catch (error) {
    console.warn("Supabase products unavailable; using saved products.", error);
    const localProducts = getLocalProducts();
    products = (localProducts?.length ? localProducts : fallbackProducts).filter((product) => product.is_active !== false).map((product) => ({
      ...product,
      category: inferCategory(product),
      name_ar: product.name_ar || product.name,
    }));
  }
  cart = cart.map((item) => {
    const currentProduct = products.find((product) => getProductId(product) === String(item.id));
    return currentProduct ? { ...currentProduct, quantity: item.quantity } : item;
  });
  renderFilterPills();
  renderProducts();
  renderFavorites();
  updateCart();
}
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function updateCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const drawer = document.querySelector("#cart-drawer");
  const checkoutForm = document.querySelector("#checkout-form");
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  document.querySelector("#cart-count").textContent = count;
  document.querySelector("#cart-total").textContent = `${translations[language].currency} ${total}`;
  document.querySelector("#cart-items").innerHTML = cart.length
    ? cart
        .map((item, index) => {
          const name = language === "ar" ? item.name_ar || item.name : item.name;
          const quantity = Number(item.quantity || 1);
          const lineTotal = Number(item.price || 0) * quantity;
          const decreaseLabel = language === "ar" ? "تقليل الكمية" : "Decrease quantity";
          const increaseLabel = language === "ar" ? "زيادة الكمية" : "Increase quantity";
          const removeLabel = language === "ar" ? "حذف" : "Remove";
          return `<article class="cart-item">
            <img class="cart-item-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(name)}">
            <div class="cart-item-info">
              <b class="cart-item-name">${escapeHtml(name)}</b>
              <span class="cart-item-price">${translations[language].currency} ${lineTotal}</span>
              <div class="cart-item-actions">
                <div class="quantity-control" aria-label="${language === "ar" ? "الكمية" : "Quantity"}">
                  <button type="button" data-cart-action="decrease" data-cart-index="${index}" aria-label="${decreaseLabel}" ${quantity <= 1 ? "disabled" : ""}>−</button>
                  <output>${quantity}</output>
                  <button type="button" data-cart-action="increase" data-cart-index="${index}" aria-label="${increaseLabel}">+</button>
                </div>
                <button class="cart-remove" type="button" data-cart-action="remove" data-cart-index="${index}">${removeLabel}</button>
              </div>
            </div>
          </article>`;
        })
        .join("")
    : `<p class="empty-cart">${translations[language].emptyCart}</p>`;

  drawer.classList.toggle("has-items", cart.length > 0);
  checkoutForm.style.display = cart.length ? "grid" : "none";
  saveCart();
}
function toggleCart(open) {
  const drawer = document.querySelector("#cart-drawer");
  const favoritesDrawer = document.querySelector("#favorites-drawer");
  drawer.classList.toggle("open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  if (open) {
    favoritesDrawer.classList.remove("open");
    favoritesDrawer.setAttribute("aria-hidden", "true");
  }
  document.querySelector(".overlay").classList.toggle("open", open || favoritesDrawer.classList.contains("open"));
}
function toggleFavorites(open) {
  const drawer = document.querySelector("#favorites-drawer");
  const cartDrawer = document.querySelector("#cart-drawer");
  if (open) renderFavorites();
  drawer.classList.toggle("open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  if (open) {
    cartDrawer.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
  }
  document.querySelector(".overlay").classList.toggle("open", open || cartDrawer.classList.contains("open"));
}
document.addEventListener("click", (event) => {
  const menuButton = event.target.closest(".menu-button");
  if (menuButton) {
    const navigation = document.querySelector("#main-nav");
    const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isExpanded));
    menuButton.setAttribute("aria-label", isExpanded ? "Open menu" : "Close menu");
    navigation.classList.toggle("mobile-open", !isExpanded);
    return;
  }
  if (event.target.closest("#main-nav a")) {
    const navigation = document.querySelector("#main-nav");
    const menuButton = document.querySelector(".menu-button");
    navigation.classList.remove("mobile-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
  }

  if (event.target.closest('[data-action="search"]')) {
    document.querySelector("#shop").scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => document.querySelector("#product-search").focus(), 350);
    return;
  }

  const favoriteButton = event.target.closest(".heart");
  if (favoriteButton) {
    toggleFavorite(favoriteButton.dataset.favoriteId);
    return;
  }
  const openFavorite = event.target.closest("[data-open-favorite]");
  if (openFavorite) {
    const favoriteId = openFavorite.dataset.openFavorite;
    const product = products.find((item) => getProductId(item) === favoriteId);
    if (!product) return;
    toggleFavorites(false);
    activeCategory = "all";
    searchTerm = "";
    document.querySelector("#product-search").value = "";
    showAllProducts = true;
    renderFilterPills();
    renderProducts();
    requestAnimationFrame(() => {
      const productCard = [...document.querySelectorAll(".product-card[data-product-id]")]
        .find((card) => card.dataset.productId === favoriteId);
      productCard?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return;
  }
  const removeFavorite = event.target.closest("[data-remove-favorite]");
  if (removeFavorite) {
    toggleFavorite(removeFavorite.dataset.removeFavorite);
    return;
  }
  const categoryButton = event.target.closest(".filter-pill");
  if (categoryButton) {
    activeCategory = categoryButton.dataset.category;
    showAllProducts = false;
    renderFilterPills();
    renderProducts();
    return;
  }

  if (event.target.closest("#show-more-products")) {
    showAllProducts = true;
    renderProducts();
    return;
  }

  const categoryCard = event.target.closest(".category-card");
  if (categoryCard) {
    const chosenCategory = categoryCard.dataset.category;
    if (chosenCategory) {
      activeCategory = chosenCategory;
      showAllProducts = false;
      renderFilterPills();
      renderProducts();
      document.querySelector("#shop").scrollIntoView({ behavior: "smooth" });
    }
  }

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "cart") toggleCart(true);
  if (action === "favorites") {
    toggleFavorites(true);
    return;
  }
  if (action === "close-cart" || action === "close-drawers") toggleCart(false);
  if (action === "close-favorites" || action === "close-drawers") toggleFavorites(false);
  const cartControl = event.target.closest("[data-cart-action]");
  if (cartControl) {
    const index = Number(cartControl.dataset.cartIndex);
    const item = cart[index];
    if (!item) return;
    if (cartControl.dataset.cartAction === "remove") {
      cart.splice(index, 1);
    } else if (cartControl.dataset.cartAction === "decrease") {
      if (item.quantity > 1) item.quantity--;
    } else if (cartControl.dataset.cartAction === "increase") {
      const availableStock = Number(item.stock);
      if (Number.isFinite(availableStock) && item.quantity >= availableStock) {
        showToast(language === "ar" ? "الكمية المتاحة من هذا المنتج خلصت." : "This product is out of stock.", "error");
        return;
      }
      item.quantity++;
    }
    updateCart();
    return;
  }
  if (action === "language") {
    language = language === "ar" ? "en" : "ar";
    localStorage.setItem("handmade-language", language);
    applyLanguage();
  }
  const add = event.target.closest(".add-to-cart");
  if (add) {
    const product = products.find((item) => String(item.id || products.indexOf(item)) === String(add.dataset.index)) || products[Number(add.dataset.index)];
    if (!product) return;
    addProductToCart(product);
    return;
  }
  if (event.target.closest(".product-details-trigger")) {
    const card = event.target.closest(".product-card[data-product-id]");
    const product = products.find((item) => String(item.id || products.indexOf(item)) === card?.dataset.productId) || products[Number(card?.dataset.productId)];
    if (product) showProductDetails(product);
    return;
  }
  const productCard = event.target.closest(".product-card[data-product-id]");
  if (productCard && !event.target.closest("button, a, input")) {
    const product = products.find((item) => String(item.id || products.indexOf(item)) === productCard.dataset.productId) || products[Number(productCard.dataset.productId)];
    if (product) showProductDetails(product);
  }

});
document.addEventListener("input", (event) => {
  if (event.target.matches("#product-search")) {
    searchTerm = event.target.value.trim();
    showAllProducts = false;
    renderProducts();
  }
});
document.addEventListener("submit", async (event) => {
  if (event.target.matches("#review-form")) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const review = {
      name: String(formData.get("name") || "").trim(),
      rating: Number(formData.get("rating") || 5),
      text: String(formData.get("text") || "").trim(),
      status: "pending",
    };
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(review),
      });
      if (!response.ok) throw new Error(await response.text());
    } catch (error) {
      console.error("Unable to submit review.", error);
      showToast(language === "ar" ? "تعذر إرسال الرأي. تحقق من الاتصال وحاول مرة أخرى." : "Could not send your review. Check your connection and try again.", "error");
      return;
    }
    event.target.reset();
    showToast(language === "ar" ? "تم إرسال رأيك وسيظهر بعد موافقة الإدارة." : "Your review was sent and will appear after approval.", "success");
    return;
  }
  if (event.target.matches("#checkout-form")) {
    event.preventDefault();
    if (!cart.length) return;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (cart.some((item) => !uuidPattern.test(String(item.id || "")))) {
      showToast(language === "ar"
        ? "المنتجات غير متزامنة مع قاعدة البيانات. حدّث الصفحة وحاول مرة أخرى."
        : "Products are not synced with the database. Refresh the page and try again.", "error");
      return;
    }

    const name = event.target.elements.name.value.trim() || "Customer";
    const phone = event.target.elements.phone.value.trim();
    const address = event.target.elements.address.value.trim();
    const note = event.target.elements.note.value.trim();
    const orderId = crypto.randomUUID();
    const submitButton = event.target.querySelector('[type="submit"]');
    submitButton.disabled = true;
    let order;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/place_customer_order`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_order_id: orderId,
          p_customer_name: name,
          p_phone: phone,
          p_address: address,
          p_notes: note,
          p_items: cart.map((item) => ({ product_id: item.id, quantity: Number(item.quantity) })),
        }),
      });
      if (!response.ok) {
        const details = await response.text();
        const functionMissing = response.status === 404 || details.includes("place_customer_order");
        throw new Error(functionMissing
          ? (language === "ar" ? "خدمة تأكيد الطلب الآمن غير مفعلة. شغّل تحديث supabase-setup.sql ثم حاول مرة أخرى." : "Secure checkout is not enabled. Run the updated supabase-setup.sql, then try again.")
          : details);
      }
      order = await response.json();
    } catch (error) {
      console.error("Unable to submit order to Supabase.", error);
      showToast(language === "ar" ? `تعذر تسجيل الطلب: ${error.message || "تحقق من الاتصال وحاول مرة أخرى."}` : `Could not place the order: ${error.message || "check your connection and try again."}`, "error");
    } finally {
      submitButton.disabled = false;
    }
    if (!order?.id) return;

    const orders = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
    orders.unshift({ ...order, name: order.customer_name, note: order.notes, createdAt: order.created_at });
    localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
    products = products.map((product) => {
      const purchasedQuantity = cart
        .filter((item) => String(item.id) === String(product.id))
        .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      return purchasedQuantity ? { ...product, stock: Math.max(0, Number(product.stock || 0) - purchasedQuantity) } : product;
    });
    renderProducts();

    cart = [];
    updateCart();
    toggleCart(false);
    event.target.reset();
    showOrderTrackingToast(order.id);
  }
});
applyLanguage();
loadProducts();
if (new URLSearchParams(window.location.search).get("openCart") === "1") toggleCart(true);
