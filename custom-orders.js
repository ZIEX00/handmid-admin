const form = document.querySelector("#custom-order-form");
const toastContainer = document.querySelector("#toast-container");
const imageInput = document.querySelector("#reference-image");
const imagePreview = document.querySelector("#attachment-preview");

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "site-toast";
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
    showToast("الصورة يجب ألا تتعدى 2 ميجابايت.");
    return;
  }
  imagePreview.src = URL.createObjectURL(file);
  imagePreview.style.display = "block";
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const file = imageInput.files[0];
  const saveRequest = (image) => {
    const request = {
    id: Date.now(),
    name: String(data.get("name") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    category: String(data.get("category") || "").trim(),
    size: String(data.get("size") || "").trim(),
    colors: String(data.get("colors") || "").trim(),
    deadline: String(data.get("deadline") || "").trim(),
    details: String(data.get("details") || "").trim(),
    reference_image: image || "",
    status: "pending",
    created_at: new Date().toISOString(),
    };
    const requests = JSON.parse(localStorage.getItem("handmade-custom-orders") || "[]");
    requests.unshift(request);
    try {
      localStorage.setItem("handmade-custom-orders", JSON.stringify(requests));
    } catch (error) {
      showToast("الصورة كبيرة على التخزين، اختار صورة أصغر.");
      return;
    }
    form.reset();
    imagePreview.removeAttribute("src");
    imagePreview.style.display = "none";
    showToast("تم إرسال طلبك الخاص، هنتواصل معاك قريبًا.");
  };

  if (!file) {
    saveRequest("");
    return;
  }
  readCompressedImage(file, saveRequest);
});
