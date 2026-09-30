const form = document.querySelector("#custom-order-form");
const toastContainer = document.querySelector("#toast-container");
const imageInput = document.querySelector("#reference-image");
const imagePreview = document.querySelector("#attachment-preview");
const SUPABASE_URL = "https://gdhihedzthuininorhtw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CPWqXhFi7w4NOBeYdVvNcw_VFEQChY4";

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
      showToast("تعذر إرسال الطلب الخاص. تحقق من الاتصال وحاول مرة أخرى.");
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
