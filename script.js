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
let products = fallbackProducts;
let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
let language = localStorage.getItem("handmade-language") || "en";
let activeCategory = "all";
let searchTerm = "";
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
function updateStoredInventory(items) {
  const saved = localStorage.getItem("handmade-products");
  if (!saved) return;
  try {
    const storedProducts = JSON.parse(saved);
    if (!Array.isArray(storedProducts)) return;
    const updatedProducts = storedProducts.map((product) => {
      const orderedItem = items.find((item) => String(item.id) === String(product.id) || item.name === product.name);
      if (!orderedItem) return product;
      return { ...product, stock: Math.max(0, Number(product.stock || 0) - Number(orderedItem.quantity || 0)) };
    });
    localStorage.setItem("handmade-products", JSON.stringify(updatedProducts));
    localStorage.setItem("handmade-products-demo", JSON.stringify(updatedProducts));
  } catch (error) {
    console.warn("Unable to update stored inventory", error);
  }
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
  showToast(nextIds.includes(id) ? (language === "ar" ? "تمت إضافة المنتج للمفضلة." : "Added to favorites.") : (language === "ar" ? "تمت إزالة المنتج من المفضلة." : "Removed from favorites."), "success");
}
const translations = {
  en: {
    announcement: "Free delivery on orders over EGP 800 <span>•</span> Made by hand in Egypt",
    home: "Home", shop: "Shop", categories: "Categories", customOrders: "Custom Orders", about: "About", contact: "Contact", contactEyebrow: "LET'S TALK", contactTitle: "A little question? We're here.", contactDescription: "Message us about an order, a custom idea, or anything you'd like to know.", whatsappUs: "Chat with us on WhatsApp",
    heroEyebrow: "HANDMADE WITH LOVE", heroTitle: "Made by Hand.<br>Made for You.", heroDescription: "Unique crochet pieces, beautiful beadwork and handmade accessories — crafted with care, just for you.", shopCollection: "Shop Collection", shopByCategory: "Shop by Category", viewAll: "View All", featuredProducts: "Featured Products",
    yourIdea: "Your Idea, Handmade.", customDescription: "Want something special? Choose your colors, size and style — and we’ll create it just for you.", requestOrder: "Request Custom Order", chooseStyle: "Choose Your Style", bracelets: "◌ Bracelets", necklaces: "◌ Necklaces", keychains: "◌ Keychains", crochetItems: "◌ Crochet Items", customerReviews: "What Our Customers Say", viewReviews: "View All Reviews", followUs: "Follow Us @handmade", moreInstagram: "More on Instagram", yourBag: "Your Bag", emptyCart: "Your bag is waiting for something special.", total: "Total", checkout: "Checkout", addToBag: "Add to bag", loading: "Loading handmade pieces...", currency: "EGP", storyEyebrow: "OUR STORY", storyTitle: "Crafted slowly, made to feel personal.", storyDescription: "Each handmade piece begins with an idea, a color palette, and a lot of love. We design crochet, beadwork, and accessories that feel warm, wearable, and unique.", smallBatch: "Small batch", smallBatchDescription: "Thoughtfully made in limited runs.", giftReady: "Gift-ready", giftReadyDescription: "Beautiful packaging for every order.", madeInEgypt: "Made in Egypt", nameLabel: "Name", phoneLabel: "Phone", noteLabel: "Order note", placeOrder: "Place Order", writeReview: "Share your review", sendReview: "Send review",
  },
  ar: {
    announcement: "توصيل مجاني للطلبات أكثر من ٨٠٠ جنيه <span>•</span> مصنوع يدويًا في مصر",
    home: "الرئيسية", shop: "المتجر", categories: "التصنيفات", customOrders: "طلبات خاصة", about: "عن Handmade", contact: "تواصل معنا", contactEyebrow: "احكيلنا", contactTitle: "عندك سؤال؟ إحنا موجودين.", contactDescription: "كلمينا عن طلبك، أو فكرتك لتصميم خاص، أو أي حاجة حابة تعرفيها.", whatsappUs: "راسلينا على واتساب",
    heroEyebrow: "مصنوع بحب", heroTitle: "صُنع يدويًا.<br>صُنع لك.", heroDescription: "قطع كروشيه مميزة، وإكسسوارات من الخرز مصنوعة يدويًا بعناية مخصوص عشانك.", shopCollection: "تسوق المجموعة", shopByCategory: "تسوق حسب التصنيف", viewAll: "عرض الكل", featuredProducts: "منتجات مميزة",
    yourIdea: "فكرتك، بتنفيذ يدوي.", customDescription: "عايز حاجة مميزة؟ اختار الألوان والمقاس والشكل، وإحنا هننفذها مخصوص ليك.", requestOrder: "اطلب تصميم خاص", chooseStyle: "اختار الشكل", bracelets: "◌ أساور", necklaces: "◌ سلاسل", keychains: "◌ ميداليات", crochetItems: "◌ منتجات كروشيه", customerReviews: "آراء عملائنا", viewReviews: "عرض كل الآراء", followUs: "تابعنا @handmaid_00", moreInstagram: "المزيد على إنستجرام", yourBag: "سلتك", emptyCart: "سلتك مستنية حاجة مميزة.", total: "الإجمالي", checkout: "إتمام الطلب", addToBag: "أضف للسلة", loading: "جاري تحميل المنتجات...", currency: "جنيه", storyEyebrow: "حكايتنا", storyTitle: "مصنوع على مهله، ومخصوص عشانك.", storyDescription: "كل قطعة بتبدأ بفكرة وألوان متناسقة وحب كبير. بنصمم كروشيه ومشغولات خرز وإكسسوارات دافئة ومميزة وسهلة الاستخدام.", smallBatch: "كميات محدودة", smallBatchDescription: "مصنوعة بعناية وبأعداد قليلة.", giftReady: "جاهزة كهدية", giftReadyDescription: "تغليف جميل مع كل طلب.", madeInEgypt: "مصنوع في مصر", nameLabel: "الاسم", phoneLabel: "رقم الهاتف", noteLabel: "ملاحظات الطلب", placeOrder: "تأكيد الطلب", writeReview: "شاركنا رأيك", sendReview: "إرسال الرأي",
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
    const productName = language === "ar" ? product.name_ar || product.name : product.name;
    const matchesCategory = activeCategory === "all" || safeCategory === activeCategory;
    const matchesSearch = !searchTerm || productName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}
function renderProducts() {
  const visibleProducts = getVisibleProducts();
  if (!visibleProducts.length) {
    document.querySelector("#product-grid").innerHTML = `<div class="empty-state">${language === "ar" ? "لا توجد منتجات مطابقة للبحث." : "No products match your search."}</div>`;
    return;
  }

  document.querySelector("#product-grid").innerHTML = visibleProducts
    .map(
      (product, index) =>
        `<article class="product-card"><button class="heart ${getFavoriteIds().includes(String(product.id || index)) ? "active" : ""}" data-favorite-id="${product.id || index}" aria-label="Add ${product.name} to wishlist"><i data-lucide="heart"></i></button><img src="${product.image}" alt="${product.name}" loading="lazy"><div class="product-info"><h3>${language === "ar" ? product.name_ar || product.name : product.name}</h3><strong class="price">${translations[language].currency} ${product.price}</strong><div class="stars">★★★★★ <small>(${index * 7 + 12})</small></div><button class="button dark add-to-cart" data-index="${product.id || index}" style="margin-top:10px;padding:8px 11px;width:100%"><span>${translations[language].addToBag}</span> <span>+</span></button></div></article>`,
    )
    .join("");
  lucide.createIcons({ attrs: { "stroke-width": 1.5 } });
}
function getReviews() {
  const saved = localStorage.getItem(REVIEW_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (error) {
      console.warn("Invalid saved reviews", error);
    }
  }
  const initialReviews = [
    { id: "seed-sara", name: "Sara Ahmed", rating: 5, text: "The bag is even more beautiful in real life. I’m in love with my new necklace!", status: "approved" },
    { id: "seed-omar", name: "Omar Khaled", rating: 5, text: "Fastest delivery and the packaging was so cute. The bracelet looks even better in real life!", status: "approved" },
    { id: "seed-lina", name: "Lina Mostafa", rating: 5, text: "I ordered a custom keychain and it turned out perfect. The seller was really helpful and kind.", status: "approved" },
  ];
  localStorage.setItem(REVIEW_KEY, JSON.stringify(initialReviews));
  return initialReviews;
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
    if (sharedReviews.length) approvedReviews = sharedReviews;
  } catch (error) {
    console.warn("Shared reviews unavailable; showing saved starter reviews.", error);
  }
  const arabicSeedReviews = {
    "seed-sara": "الشنطة أجمل بكتير في الحقيقة، وأنا بحب السلسلة الجديدة!",
    "seed-omar": "التوصيل كان سريع جدًا والتغليف جميل. السوار أحلى من الصور!",
    "seed-lina": "طلبت ميدالية مخصوص وطلعت ممتازة. البائعة كانت متعاونة ولطيفة جدًا.",
  };
  reviewGrid.innerHTML = approvedReviews.length
    ? approvedReviews.map((review, index) => {
      const initials = review.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
      const reviewText = language === "ar" ? arabicSeedReviews[review.id] || review.text : review.text;
      return `<article><div class="review-head"><span class="avatar ${index % 3 === 1 ? "peach" : index % 3 === 2 ? "green" : ""}">${escapeHtml(initials)}</span><span><b>${escapeHtml(review.name)}</b><em>${"★".repeat(Math.max(1, Math.min(5, Number(review.rating) || 5)))} </em></span></div><p>“${escapeHtml(reviewText)}”</p></article>`;
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
  document.querySelector("#product-search").placeholder = language === "ar" ? "ابحث باسم المنتج" : "Search by product name";
  document.querySelector('input[name="name"]').placeholder = language === "ar" ? "اسمك" : "Your name";
  document.querySelector('input[name="phone"]').placeholder = language === "ar" ? "01xxxxxxxxx" : "+966 5xx xxx xxx";
  document.querySelector('textarea[name="note"]').placeholder = language === "ar" ? "اكتب الألوان أو أي تفاصيل تفضلها" : "Tell us your preferred colors or details";
  document.querySelector('[data-review-placeholder="name"]').placeholder = language === "ar" ? "اسمك" : "Your name";
  document.querySelector('[data-review-placeholder="text"]').placeholder = language === "ar" ? "اكتب رأيك في تجربتك معنا" : "Tell us about your experience";
  updateWhatsAppLinks();
  renderCategories();
  renderFilterPills();
  renderProducts();
  renderReviews();
  updateCart();
}
async function loadProducts() {
  const localProducts = getLocalProducts();
  if (localProducts !== null) {
    products = localProducts.map((product) => ({
      ...product,
      category: inferCategory(product),
      name_ar: product.name_ar || product.name,
    }));
    renderFilterPills();
    renderProducts();
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (response.ok) {
      const remoteProducts = await response.json();
      if (remoteProducts.length) {
        products = remoteProducts.map((product) => ({
          ...product,
          category: inferCategory(product),
          name_ar: product.name_ar || product.name,
        }));
      }
      renderFilterPills();
      renderProducts();
    }
  } catch (error) {
    console.warn(
      "Supabase products unavailable; using fallback products.",
      error,
    );
  }
}
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function updateCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const drawer = document.querySelector("#cart-drawer");
  const checkoutButton = document.querySelector(".checkout");
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
  checkoutButton.style.display = cart.length ? "block" : "none";
  checkoutForm.style.display = cart.length ? "grid" : "none";
  saveCart();
}
function toggleCart(open) {
  document.querySelector("#cart-drawer").classList.toggle("open", open);
  document.querySelector(".overlay").classList.toggle("open", open);
  document
    .querySelector("#cart-drawer")
    .setAttribute("aria-hidden", String(!open));
}
document.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest(".heart");
  if (favoriteButton) {
    toggleFavorite(favoriteButton.dataset.favoriteId);
    return;
  }
  const categoryButton = event.target.closest(".filter-pill");
  if (categoryButton) {
    activeCategory = categoryButton.dataset.category;
    renderFilterPills();
    renderProducts();
    return;
  }

  const categoryCard = event.target.closest(".category-card");
  if (categoryCard) {
    const chosenCategory = categoryCard.dataset.category;
    if (chosenCategory) {
      activeCategory = chosenCategory;
      renderFilterPills();
      renderProducts();
      document.querySelector("#shop").scrollIntoView({ behavior: "smooth" });
    }
  }

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "cart") toggleCart(true);
  if (action === "close-cart") toggleCart(false);
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
  if (action === "favorites") {
    document.querySelector("#shop").scrollIntoView({ behavior: "smooth" });
    showToast(language === "ar" ? "اختار علامة القلب لإضافة المنتجات للمفضلة." : "Use the heart icon on a product to save it to favorites.", "success");
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
    const existing = cart.find((item) => item.name === product.name);
    const availableStock = Number(product.stock);
    if (Number.isFinite(availableStock) && availableStock <= (existing?.quantity || 0)) {
      showToast(language === "ar" ? "الكمية المتاحة من هذا المنتج خلصت." : "This product is out of stock.", "error");
      return;
    }
    existing ? existing.quantity++ : cart.push({ ...product, quantity: 1 });
    updateCart();
    toggleCart(true);
  }

  if (event.target.closest(".checkout")) {
    if (!cart.length) return;
    document.querySelector("#checkout-form").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});
document.addEventListener("input", (event) => {
  if (event.target.matches("#product-search")) {
    searchTerm = event.target.value.trim();
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

    const name = event.target.elements.name.value.trim() || "Customer";
    const phone = event.target.elements.phone.value.trim();
    const note = event.target.elements.note.value.trim();
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = {
      id: Date.now(),
      customer_name: name,
      phone,
      notes: note,
      items: cart,
      total,
      status: "pending",
      created_at: new Date().toISOString(),
      name,
      note,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          customer_name: name,
          phone,
          notes: note,
          items: cart,
          total,
          status: "pending",
        }),
      });
      if (!response.ok) throw new Error(await response.text());
    } catch (error) {
      console.error("Unable to submit order to Supabase.", error);
      showToast(language === "ar" ? "تعذر إرسال الطلب بسبب الاتصال. لم يتم تسجيله، تواصل معنا عبر واتساب." : "The order could not be sent. It was not recorded; please contact us on WhatsApp.", "error");
      return;
    }

    const orders = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
    orders.unshift(order);
    localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
    updateStoredInventory(cart);

    cart = [];
    updateCart();
    toggleCart(false);
    event.target.reset();
    showToast(language === "ar" ? `شكرًا يا ${name}! تم استلام طلبك وسنتواصل معك قريبًا.` : `Thank you, ${name}! Your order request has been received.`, "success");
  }
});
applyLanguage();
loadProducts();
