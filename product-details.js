(function () {
  let activeProduct = null;
  let activeImages = [];
  let activeIndex = 0;
  let previousFocus = null;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    })[character]);
  }

  function productImages(product) {
    let extraImages = product.images;
    if (typeof extraImages === "string") {
      try {
        extraImages = JSON.parse(extraImages);
      } catch (error) {
        extraImages = extraImages.split(/[\n,]+/);
      }
    }
    const images = [product.image, ...(Array.isArray(extraImages) ? extraImages : [])]
      .map((image) => String(image || "").trim())
      .filter((image, index, allImages) => image && allImages.indexOf(image) === index);
    return images;
  }

  function closeModal() {
    const modal = document.querySelector("#product-details-modal");
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("product-modal-open");
    if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
    previousFocus = null;
  }

  function renderGallery() {
    const mainImage = document.querySelector("#product-details-image");
    mainImage.src = activeImages[activeIndex];
    mainImage.alt = activeProduct.options.language === "ar"
      ? activeProduct.name_ar || activeProduct.name || ""
      : activeProduct.name || activeProduct.name_ar || "";
    document.querySelector("#product-gallery-count").textContent = activeImages.length > 1
      ? `${activeIndex + 1} / ${activeImages.length}`
      : "";
    document.querySelector("#product-gallery-thumbnails").innerHTML = activeImages.length > 1
      ? activeImages.map((image, index) => `<button class="product-gallery-thumb ${index === activeIndex ? "active" : ""}" type="button" data-gallery-index="${index}" aria-label="${activeProduct.options.language === "ar" ? "الصورة" : "Image"} ${index + 1}" aria-current="${index === activeIndex}"><img src="${escapeHtml(image)}" alt="" loading="lazy"></button>`).join("")
      : "";
    document.querySelectorAll("[data-gallery-step]").forEach((button) => {
      button.hidden = activeImages.length < 2;
    });
  }

  function openProductDetails(product, options) {
    activeImages = productImages(product);
    if (!activeImages.length) return;
    activeProduct = { ...product, options };
    activeIndex = 0;
    previousFocus = document.activeElement;
    const name = options.language === "ar" ? product.name_ar || product.name : product.name || product.name_ar;
    const modal = document.querySelector("#product-details-modal") || createModal();
    modal.dir = options.language === "ar" ? "rtl" : "ltr";
    document.querySelector("#product-details-name").textContent = name || "";
    document.querySelector("#product-details-price").textContent = `${options.currency || ""} ${product.price ?? ""}`.trim();
    document.querySelector("#product-details-description").textContent = product.description || "";
    document.querySelector("#product-details-description").hidden = !product.description;
    document.querySelector("#product-details-add").textContent = options.addLabel || (options.language === "ar" ? "أضف للسلة" : "Add to bag");
    document.querySelector("#product-details-close").setAttribute("aria-label", options.closeLabel || "Close");
    document.querySelector('[data-gallery-step="-1"]').setAttribute("aria-label", options.language === "ar" ? "الصورة السابقة" : "Previous image");
    document.querySelector('[data-gallery-step="1"]').setAttribute("aria-label", options.language === "ar" ? "الصورة التالية" : "Next image");
    renderGallery();
    modal.hidden = false;
    document.body.classList.add("product-modal-open");
    document.querySelector("#product-details-close").focus();
  }

  function createModal() {
    const modal = document.createElement("section");
    modal.id = "product-details-modal";
    modal.className = "product-details-modal";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "product-details-name");
    modal.innerHTML = `<div class="product-details-backdrop" data-modal-close></div>
      <div class="product-details-panel">
        <button class="product-details-close" id="product-details-close" type="button" data-modal-close aria-label="Close">×</button>
        <div class="product-details-gallery">
          <button class="product-gallery-arrow previous" type="button" data-gallery-step="-1" aria-label="Previous image">‹</button>
          <img id="product-details-image" src="" alt="">
          <button class="product-gallery-arrow next" type="button" data-gallery-step="1" aria-label="Next image">›</button>
          <span class="product-gallery-count" id="product-gallery-count"></span>
          <div class="product-gallery-thumbnails" id="product-gallery-thumbnails"></div>
        </div>
        <div class="product-details-info">
          <h2 id="product-details-name"></h2>
          <strong class="price" id="product-details-price"></strong>
          <p id="product-details-description"></p>
          <button class="button dark" id="product-details-add" type="button"></button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-modal-close]")) {
        closeModal();
        return;
      }
      const step = event.target.closest("[data-gallery-step]");
      if (step) {
        activeIndex = (activeIndex + Number(step.dataset.galleryStep) + activeImages.length) % activeImages.length;
        renderGallery();
        return;
      }
      const thumbnail = event.target.closest("[data-gallery-index]");
      if (thumbnail) {
        activeIndex = Number(thumbnail.dataset.galleryIndex);
        renderGallery();
        return;
      }
      if (event.target.closest("#product-details-add") && activeProduct?.options.onAdd) {
        if (activeProduct.options.onAdd() !== false) closeModal();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (modal.hidden) return;
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        activeIndex = (activeIndex + (event.key === "ArrowRight" ? 1 : -1) + activeImages.length) % activeImages.length;
        renderGallery();
      }
    });
    return modal;
  }

  window.openProductDetails = openProductDetails;
})();
