const SUPABASE_URL = "https://gdhihedzthuininorhtw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CPWqXhFi7w4NOBeYdVvNcw_VFEQChY4";
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const trackingForm = document.querySelector("#tracking-form");
const orderIdInput = document.querySelector("#order-id");
const phoneInput = document.querySelector("#order-phone");
const messageElement = document.querySelector("#tracking-message");
const resultElement = document.querySelector("#tracking-result");
const language = localStorage.getItem("handmade-language") || "ar";
const copy = {
  ar: {
    backToShop: "العودة للمتجر", eyebrow: "خدمة الطلبات", title: "تتبع طلبك",
    description: "اكتب رقم الطلب ورقم الهاتف المستخدم عند الشراء لمتابعة الحالة أو إلغاء الطلب قبل تأكيده.",
    orderId: "رقم الطلب", phone: "رقم الهاتف المستخدم في الطلب", trackButton: "تتبع الطلب",
    loading: "جاري البحث عن الطلب...", notFound: "رقم الطلب أو رقم الهاتف غير صحيح.",
    unavailable: "تعذر الاتصال بخدمة الطلبات. حاول مرة أخرى لاحقًا.",
    setupRequired: "دوال التتبع غير موجودة في Supabase. شغّل ملف supabase-setup.sql كاملًا من SQL Editor.",
    order: "الطلب", status: "الحالة", created: "تاريخ الطلب", items: "المنتجات",
    total: "الإجمالي", pending: "قيد المراجعة", confirmed: "تم التأكيد", preparing: "جاري التجهيز",
    shipped: "تم الشحن", completed: "مكتمل", cancelled: "ملغي",
    canCancel: "يمكنك إلغاء الطلب قبل تأكيده.", cannotCancel: "لا يمكن إلغاء الطلب بعد بدء تجهيزه أو شحنه.",
    cancel: "إلغاء الطلب", cancelConfirm: "هل تريد إلغاء هذا الطلب؟", cancelling: "جاري إلغاء الطلب...",
    cancelledSuccess: "تم إلغاء الطلب.", cancelDenied: "لا يمكن إلغاء الطلب في حالته الحالية.",
    cancelFailed: "تعذر إلغاء الطلب. حاول مرة أخرى.", noItems: "تفاصيل المنتجات غير متاحة.",
  },
  en: {
    backToShop: "Back to shop", eyebrow: "ORDER SERVICE", title: "Track your order",
    description: "Enter the order number and phone used at checkout to view its status or cancel it before confirmation.",
    orderId: "Order number", phone: "Phone used for the order", trackButton: "Track order",
    loading: "Looking up your order...", notFound: "The order number or phone number is incorrect.",
    unavailable: "Order service is unavailable. Please try again later.",
    setupRequired: "Tracking functions are missing in Supabase. Run the full supabase-setup.sql file in the SQL Editor.",
    order: "Order", status: "Status", created: "Order date", items: "Items",
    total: "Total", pending: "Pending review", confirmed: "Confirmed", preparing: "Preparing",
    shipped: "Shipped", completed: "Completed", cancelled: "Cancelled",
    canCancel: "You can cancel the order before it is confirmed.", cannotCancel: "The order can no longer be cancelled after preparation or shipping starts.",
    cancel: "Cancel order", cancelConfirm: "Cancel this order?", cancelling: "Cancelling order...",
    cancelledSuccess: "The order was cancelled.", cancelDenied: "This order can no longer be cancelled.",
    cancelFailed: "Could not cancel the order. Please try again.", noItems: "Item details are unavailable.",
  },
};
const text = copy[language] || copy.ar;
let currentOrder = null;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function setMessage(message, isError = false) {
  messageElement.textContent = message;
  messageElement.style.color = isError ? "#9b5145" : "";
}

function renderOrder(order) {
  const status = order.status || "pending";
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsMarkup = items.length
    ? items.map((item) => `<div>${escapeHtml(item.name_ar || item.name)} × ${Number(item.quantity || 1)}</div>`).join("")
    : text.noItems;
  const orderDate = order.created_at ? new Date(order.created_at).toLocaleString(language === "ar" ? "ar-EG" : "en") : "—";
  resultElement.innerHTML = `
    <dl>
      <dt>${text.order}</dt><dd>${escapeHtml(order.id)}</dd>
      <dt>${text.status}</dt><dd class="tracking-status ${escapeHtml(status)}">${text[status] || text.pending}</dd>
      <dt>${text.created}</dt><dd>${escapeHtml(orderDate)}</dd>
      <dt>${text.items}</dt><dd class="tracking-items">${itemsMarkup}</dd>
      <dt>${text.total}</dt><dd>${Number(order.total || 0)} ${language === "ar" ? "جنيه" : "EGP"}</dd>
    </dl>
    <p class="tracking-message">${status === "pending" ? text.canCancel : text.cannotCancel}</p>
    ${status === "pending" ? `<button class="tracking-cancel" id="cancel-order" type="button">${text.cancel}</button>` : ""}
  `;
  resultElement.querySelector("#cancel-order")?.addEventListener("click", cancelOrder);
}

async function findOrder(event) {
  event?.preventDefault();
  resultElement.replaceChildren();
  if (!supabaseClient) {
    setMessage(text.unavailable, true);
    return;
  }
  const orderId = orderIdInput.value.trim();
  const phone = phoneInput.value.trim();
  if (!orderId || !phone) return;
  setMessage(text.loading);
  try {
    const { data, error } = await supabaseClient.rpc("get_customer_order", {
      p_order_id: orderId,
      p_phone: phone,
    });
    if (error) throw error;
    currentOrder = data;
    if (!currentOrder) {
      setMessage(text.notFound, true);
      return;
    }
    setMessage("");
    renderOrder(currentOrder);
  } catch (error) {
    console.error("Order lookup failed.", error);
    const functionMissing = error.code === "PGRST202" || error.message?.includes("get_customer_order");
    setMessage(functionMissing ? text.setupRequired : text.unavailable, true);
  }
}

async function cancelOrder() {
  if (!currentOrder || !window.confirm(text.cancelConfirm)) return;
  setMessage(text.cancelling);
  try {
    const { data, error } = await supabaseClient.rpc("cancel_customer_order", {
      p_order_id: currentOrder.id,
      p_phone: phoneInput.value.trim(),
    });
    if (error) throw error;
    if (!data?.cancelled) {
      currentOrder.status = data?.status || currentOrder.status;
      renderOrder(currentOrder);
      setMessage(text.cancelDenied, true);
      return;
    }
    currentOrder.status = "cancelled";
    renderOrder(currentOrder);
    setMessage(text.cancelledSuccess);
  } catch (error) {
    console.error("Order cancellation failed.", error);
    setMessage(text.cancelFailed, true);
  }
}

document.documentElement.lang = language;
document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
document.querySelectorAll("[data-i18n]").forEach((element) => {
  element.textContent = text[element.dataset.i18n] || element.textContent;
});
orderIdInput.value = new URLSearchParams(window.location.search).get("id") || "";
trackingForm.addEventListener("submit", findOrder);