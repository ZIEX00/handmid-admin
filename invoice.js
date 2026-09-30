const invoiceRoot = document.querySelector("#invoice");
const orderId = new URLSearchParams(window.location.search).get("id");

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function renderInvoice() {
  const orders = JSON.parse(localStorage.getItem("handmade-orders") || "[]");
  const order = orders.find((item) => String(item.id) === String(orderId));
  if (!order) {
    invoiceRoot.innerHTML = '<div class="empty">الفاتورة غير موجودة أو تم حذف الطلب.</div>';
    return;
  }
  const items = Array.isArray(order.items) ? order.items : [];
  invoiceRoot.innerHTML = `
    <header class="invoice-head">
      <div><h1>HANDMADE</h1><p>قطع مصنوعة يدويًا بعناية</p></div>
      <div class="invoice-title"><strong>فاتورة</strong><span class="meta">رقم الطلب: #${escapeHtml(order.id)}</span><span class="meta">${new Date(order.created_at || order.createdAt).toLocaleString('ar-EG')}</span></div>
    </header>
    <section class="customer">
      <strong>بيانات العميل</strong>
      <span>الاسم: ${escapeHtml(order.customer_name || order.name || 'غير متوفر')}</span>
      <span>الهاتف: ${escapeHtml(order.phone || 'غير متوفر')}</span>
    </section>
    <table>
      <thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
      <tbody>${items.map((item) => `<tr><td>${escapeHtml(item.name_ar || item.name)}</td><td>${Number(item.quantity || 1)}</td><td>${Number(item.price || 0)} جنيه</td><td>${Number(item.price || 0) * Number(item.quantity || 1)} جنيه</td></tr>`).join('')}</tbody>
    </table>
    <div class="total"><span>الإجمالي النهائي</span><span>${Number(order.total || 0)} جنيه</span></div>
    ${order.notes || order.note ? `<p class="meta">ملاحظات: ${escapeHtml(order.notes || order.note)}</p>` : ''}
    <div class="invoice-actions"><button type="button" id="print-invoice">طباعة الفاتورة</button><a href="index.dashboard.html">العودة للداشبورد</a></div>
  `;
  document.querySelector("#print-invoice").addEventListener("click", () => window.print());
}

renderInvoice();
