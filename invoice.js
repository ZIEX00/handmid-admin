const invoiceRoot = document.querySelector("#invoice");
const orderId = new URLSearchParams(window.location.search).get("id");
const ORDERS_KEY = "handmade-orders";
const invoiceSupabase = window.supabase?.createClient(
  "https://gdhihedzthuininorhtw.supabase.co",
  "sb_publishable_CPWqXhFi7w4NOBeYdVvNcw_VFEQChY4",
);
const orderStatuses = {
  pending: "قيد المراجعة",
  confirmed: "تم التأكيد",
  preparing: "جاري التجهيز",
  shipped: "تم الشحن",
  completed: "مكتمل",
  cancelled: "ملغي",
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function getSavedOrders() {
  try {
    const savedOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    return Array.isArray(savedOrders) ? savedOrders : [];
  } catch (error) {
    console.warn("Saved orders could not be read.", error);
    return [];
  }
}

function saveOrder(order) {
  const savedOrders = getSavedOrders().filter((savedOrder) => String(savedOrder.id) !== String(order.id));
  localStorage.setItem(ORDERS_KEY, JSON.stringify([{ ...order, name: order.customer_name || order.name }, ...savedOrders]));
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("ar-EG")} جنيه`;
}

function showLookup(message = "") {
  invoiceRoot.innerHTML = `
    <header class="invoice-head">
      <div><h1>HANDMADE</h1><p>قطع مصنوعة يدويًا بعناية</p></div>
      <div class="invoice-title"><strong>عرض الفاتورة</strong><span class="meta">أدخل رقم الهاتف المستخدم عند الطلب لاسترجاع الفاتورة.</span></div>
    </header>
    <form class="lookup" id="invoice-lookup">
      <label>رقم الهاتف المستخدم في الطلب<input name="phone" type="tel" autocomplete="tel" required /></label>
      <button type="submit">استرجاع الفاتورة</button>
      <p class="lookup-message" role="status">${escapeHtml(message)}</p>
    </form>
    <div class="invoice-actions"><a href="index.html">العودة للمتجر</a></div>
  `;
}

function renderInvoice(order) {
  const orderReference = order.order_number || order.id;
  const items = Array.isArray(order.items) ? order.items : [];
  const createdAt = order.created_at || order.createdAt;
  const date = createdAt ? new Date(createdAt).toLocaleString("ar-EG") : "—";
  const itemRows = items.map((item) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    const price = Number(item.price || 0);
    return `<tr><td>${escapeHtml(item.name_ar || item.name || "منتج")}</td><td>${quantity}</td><td>${formatPrice(price)}</td><td>${formatPrice(price * quantity)}</td></tr>`;
  }).join("");
  const status = orderStatuses[order.status] || orderStatuses.pending;

  invoiceRoot.innerHTML = `
    <div class="success-banner"><strong>تم استلام طلبك بنجاح</strong><span>تم حفظ الطلب في قائمة طلباتك على هذا الجهاز. يمكنك الرجوع إليه ومتابعته من صفحة تتبع الطلب.</span></div>
    <header class="invoice-head">
      <div><h1>HANDMADE</h1><p>تفاصيل طلبك المحفوظة</p></div>
      <div class="invoice-title"><strong>إيصال الطلب</strong><span class="meta">رقم الطلب: ${escapeHtml(orderReference)}</span><span class="meta">تاريخ الطلب: ${escapeHtml(date)}</span><span class="meta">حالة الطلب: ${escapeHtml(status)}</span></div>
    </header>
    <section class="customer">
      <strong>بيانات العميل</strong>
      <span>الاسم: ${escapeHtml(order.customer_name || order.name || "غير متوفر")}</span>
      ${order.phone ? `<span>الهاتف: ${escapeHtml(order.phone)}</span>` : ""}
      ${order.address ? `<span>العنوان: ${escapeHtml(order.address)}</span>` : ""}
    </section>
    <table>
      <thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
      <tbody>${itemRows || '<tr><td colspan="4">تفاصيل المنتجات غير متاحة.</td></tr>'}</tbody>
    </table>
    <div class="total"><span>قيمة المنتجات</span><span>${formatPrice(order.total)}</span></div>
    <p class="delivery-note">مصاريف التوصيل تُحدد حسب المنتجات والعنوان، وسيؤكدها فريق خدمة العملاء معك عند تأكيد الطلب.</p>
    ${order.notes || order.note ? `<p class="meta">ملاحظات الطلب: ${escapeHtml(order.notes || order.note)}</p>` : ""}
    <div class="invoice-actions">
      <button type="button" id="download-invoice">تحميل الفاتورة PDF</button>
      <a href="track-order.html?id=${encodeURIComponent(orderReference)}">متابعة الطلب</a>
      <a href="index.html">العودة للمتجر</a>
    </div>
    <p class="pdf-status" id="pdf-status" role="status" aria-live="polite"></p>
  `;
  document.querySelector("#download-invoice").addEventListener("click", (event) => downloadInvoicePdf(order, event.currentTarget));
}

async function downloadInvoicePdf(order, button) {
  const status = document.querySelector("#pdf-status");
  if (typeof window.html2pdf !== "function") {
    status.textContent = "تعذر تحميل أداة إنشاء PDF. تحقق من اتصال الإنترنت وحاول مرة أخرى.";
    return;
  }

  button.disabled = true;
  status.textContent = "جاري تجهيز الفاتورة...";
  try {
    const safeOrderId = String(order.order_number || order.id).replace(/[^a-zA-Z0-9-]/g, "");
    await window.html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `HANDMADE-invoice-${safeOrderId}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fffdfb",
        onclone: (clonedDocument) => {
          clonedDocument.querySelectorAll(".invoice-actions, .pdf-status").forEach((element) => element.remove());
        },
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"], avoid: [".success-banner", ".invoice-head", ".customer", "tr", ".total", ".delivery-note"] },
    }).from(invoiceRoot).save();
    status.textContent = "تم تنزيل الفاتورة بصيغة PDF.";
  } catch (error) {
    console.error("Unable to download invoice as PDF.", error);
    status.textContent = "تعذر إنشاء ملف PDF. حاول مرة أخرى.";
  } finally {
    button.disabled = false;
  }
}

async function lookupInvoice(event) {
  event.preventDefault();
  const phone = new FormData(event.currentTarget).get("phone").toString().trim();
  const message = invoiceRoot.querySelector(".lookup-message");
  message.textContent = "جاري البحث عن الطلب...";
  try {
    const { data, error } = await invoiceSupabase.rpc("get_customer_order", {
      p_order_id: orderId,
      p_phone: phone,
    });
    if (error) throw error;
    if (!data) {
      message.textContent = "رقم الطلب أو رقم الهاتف غير صحيح.";
      return;
    }
    data.phone = phone;
    saveOrder(data);
    renderInvoice(data);
  } catch (error) {
    console.error("Unable to retrieve customer invoice.", error);
    message.textContent = "تعذر استرجاع الفاتورة. تحقق من الاتصال وحاول مرة أخرى.";
  }
}

async function loadInvoice() {
  if (!orderId) {
    invoiceRoot.innerHTML = '<div class="empty">رابط الفاتورة غير مكتمل. ارجع إلى صفحة تتبع الطلب لاختيار الفاتورة.</div><div class="invoice-actions"><a href="track-order.html">تتبع الطلبات</a><a href="index.html">العودة للمتجر</a></div>';
    return;
  }
  const savedOrder = getSavedOrders().find((order) =>
    String(order.id) === String(orderId) || String(order.order_number || "").toUpperCase() === String(orderId).toUpperCase(),
  );
  if (savedOrder) {
    renderInvoice(savedOrder);
    return;
  }
  if (invoiceSupabase) {
    try {
      const { data: { session }, error: sessionError } = await invoiceSupabase.auth.getSession();
      if (sessionError) {
        console.error("Unable to check the dashboard session.", sessionError);
      } else if (session && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
        const { data, error } = await invoiceSupabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();
        if (error) {
          console.error("Unable to load invoice from Supabase.", error);
        } else if (data) {
          renderInvoice(data);
          return;
        }
      }
    } catch (error) {
      console.error("Unable to load the saved invoice.", error);
    }
  }
  showLookup();
  document.querySelector("#invoice-lookup")?.addEventListener("submit", lookupInvoice);
}

loadInvoice();
