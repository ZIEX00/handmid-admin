const form = document.querySelector("#custom-order-form");
const toastContainer = document.querySelector("#toast-container");
const imageInput = document.querySelector("#reference-image");
const imagePreview = document.querySelector("#attachment-preview");
const SUPABASE_URL = "https://gdhihedzthuininorhtw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CPWqXhFi7w4NOBeYdVvNcw_VFEQChY4";
let language = localStorage.getItem("handmade-language") || "ar";
const translations = {
  ar: {
    announcement: "فكرتك، بتنفيذ يدوي • احكيلنا تفاصيلها", eyebrow: "طلبات خاصة", title: "فكرتك، نعملها مخصوص ليك.",
    description: "اختار النوع والألوان والمقاس، واحكيلنا عن فكرتك. هنراجع الطلب ونتواصل معاك بتفاصيل التنفيذ والسعر.",
    back: "العودة للمتجر ←", name: "الاسم", phone: "رقم الهاتف", category: "نوع المنتج", size: "المقاس أو الكمية",
    optCrochet: "كروشيه", optBeadwork: "مشغولات خرز", optKeychain: "ميدالية", optBag: "شنطة", optOther: "أخرى",
    colors: "الألوان المفضلة", deadline: "موعد التسليم المطلوب", details: "تفاصيل فكرتك", reference: "صورة مرجعية",
    fileHint: "اختياري، حجم الصورة لا يتعدى 2 ميجابايت", submit: "إرسال طلب خاص",
    namePlaceholder: "اسمك", phonePlaceholder: "01xxxxxxxxx", sizePlaceholder: "مثال: متوسط، قطعتين",
    colorsPlaceholder: "مثال: أوف وايت ووردي", deadlinePlaceholder: "مثال: خلال أسبوعين",
    detailsPlaceholder: "اكتب كل التفاصيل أو أرفق رابط صورة مرجعية...",
    previewAlt: "معاينة الصورة المرفقة", imageTooLarge: "الصورة يجب ألا تتعدى 2 ميجابايت.",
    failed: "تعذر إرسال الطلب الخاص. تحقق من الاتصال وحاول مرة أخرى.",
    success: "تم إرسال طلبك الخاص، هنتواصل معاك قريبًا.",
  },
  en: {
    announcement: "Your idea, handmade • Tell us what you have in mind", eyebrow: "CUSTOM ORDERS", title: "Your idea, made just for you.",
    description: "Choose a type, colors, and size, then tell us about your idea. We will review your request and contact you about the design and price.",
    back: "Back to shop →", name: "Name", phone: "Phone number", category: "Product type", size: "Size or quantity",
    optCrochet: "Crochet", optBeadwork: "Beadwork", optKeychain: "Keychain", optBag: "Bag", optOther: "Other",
    colors: "Preferred colors", deadline: "Requested delivery date", details: "Tell us about your idea", reference: "Reference image",
    fileHint: "Optional; image size must not exceed 2 MB", submit: "Send custom request",
    namePlaceholder: "Your name", phonePlaceholder: "+20 1x xxxx xxxx", sizePlaceholder: "For example: medium, 2 pieces",
    colorsPlaceholder: "For example: off-white and pink", deadlinePlaceholder: "For example: within two weeks",
    detailsPlaceholder: "Share details or a link to a reference image...",
    previewAlt: "Preview of attached image", imageTooLarge: "The image must not exceed 2 MB.",
    failed: "Could not send your request. Check your connection and try again.",
    success: "Your request was sent. We will contact you soon.",
  },
};

function applyLanguage() {
  const text = translations[language] || translations.ar;
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = text[element.dataset.i18n];
  });
  document.querySelector("#custom-language").textContent = language === "ar" ? "English" : "عربي";
  document.querySelector('[name="name"]').placeholder = text.namePlaceholder;
  document.querySelector('[name="phone"]').placeholder = text.phonePlaceholder;
  document.querySelector('[name="size"]').placeholder = text.sizePlaceholder;
  document.querySelector('[name="colors"]').placeholder = text.colorsPlaceholder;
  document.querySelector('[name="deadline"]').placeholder = text.deadlinePlaceholder;
  document.querySelector('[name="details"]').placeholder = text.detailsPlaceholder;
  imagePreview.alt = text.previewAlt;
}

function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `site-toast${isError ? " error" : ""}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

function readCompressedImage(file, onReady) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const image = new Image();
    image.addEventListener("load", () => {
      const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      onReady(canvas.toDataURL("image/jpeg", 0.78));
    });
    image.addEventListener("error", () => onReady(reader.result));
    image.src = reader.result;
  });
  reader.readAsDataURL(file);
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) {
    imagePreview.removeAttribute("src");
    imagePreview.style.display = "none";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    imageInput.value = "";
    showToast(translations[language].imageTooLarge, true);
    return;
  }
  imagePreview.src = URL.createObjectURL(file);
  imagePreview.style.display = "block";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const file = imageInput.files[0];
  const saveRequest = async (image) => {
    const request = {
      name: String(data.get("name") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      category: String(data.get("category") || "").trim(),
      size: String(data.get("size") || "").trim(),
      colors: String(data.get("colors") || "").trim(),
      deadline: String(data.get("deadline") || "").trim(),
      details: String(data.get("details") || "").trim(),
      reference_image: image || "",
      status: "pending",
    };
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/custom_orders`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error(await response.text());
    } catch (error) {
      console.error("Unable to submit custom order.", error);
      showToast(translations[language].failed, true);
      return;
    }
    form.reset();
    imagePreview.removeAttribute("src");
    imagePreview.style.display = "none";
    showToast(translations[language].success);
  };

  if (!file) {
    saveRequest("");
    return;
  }
  readCompressedImage(file, saveRequest);
});

document.querySelector("#custom-language").addEventListener("click", () => {
  language = language === "ar" ? "en" : "ar";
  localStorage.setItem("handmade-language", language);
  applyLanguage();
});

applyLanguage();
