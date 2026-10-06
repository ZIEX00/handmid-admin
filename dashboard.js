const USE_REAL_SUPABASE = true;
const SUPABASE_URL = 'https://gdhihedzthuininorhtw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CPWqXhFi7w4NOBeYdVvNcw_VFEQChY4';
const PRODUCTS_KEY = 'handmade-products';
const PRODUCTS_KEY_FALLBACK = 'handmade-products-demo';
const ORDER_KEY = 'handmade-orders';
const CUSTOM_ORDER_KEY = 'handmade-custom-orders';
const REVIEW_KEY = 'handmade-reviews';

const handmadeSupabase = USE_REAL_SUPABASE && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const authShell = document.querySelector('#auth-shell');
const dashboardApp = document.querySelector('#dashboard-app');
const authMessage = document.querySelector('#auth-message');
const loginForm = document.querySelector('#login-form');
const logoutBtn = document.querySelector('#logout-btn');
const productForm = document.querySelector('#product-form');
const productsTable = document.querySelector('#products-table');
const ordersList = document.querySelector('#orders-list');
const customRequestsList = document.querySelector('#custom-requests-list');
const reviewsList = document.querySelector('#reviews-list');

let products = [];
let orders = [];
let customRequests = [];
let reviews = [];

function setAuthMessage(text, type = 'error') {
  authMessage.textContent = text;
  authMessage.className = `message ${type}`;
}

const statusLabels = {
  pending: 'قيد المراجعة',
  confirmed: 'تم التأكيد',
  preparing: 'جاري التجهيز',
  shipped: 'تم الشحن',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

function getOrderCustomer(order) {
  return order.customer_name || order.name || 'عميل';
}

function getOrderDate(order) {
  return order.created_at || order.createdAt || new Date().toISOString();
}

function getOrderItems(order) {
  return Array.isArray(order.items) ? order.items : [];
}

function showDashboard() {
  authShell.classList.add('hidden');
  dashboardApp.classList.remove('hidden');
}

function showLogin() {
  dashboardApp.classList.add('hidden');
  authShell.classList.remove('hidden');
}

async function checkSession() {
  if (!handmadeSupabase) {
    showLogin();
    setAuthMessage('تعذر تحميل خدمة تسجيل الدخول. تحقق من اتصالك بالإنترنت ثم أعد المحاولة.');
    return;
  }

  const { data: { session } } = await handmadeSupabase.auth.getSession();

  if (session) {
    showDashboard();
    await loadDashboardData();
  } else {
    showLogin();
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();

  if (!email || !password) {
    setAuthMessage('من فضلك اكتب البريد الإلكتروني وكلمة المرور.', 'error');
    return;
  }

  if (!handmadeSupabase) {
    setAuthMessage('تعذر الاتصال بخدمة تسجيل الدخول. حاول مرة أخرى بعد استعادة الاتصال.', 'error');
    return;
  }

  const { error } = await handmadeSupabase.auth.signInWithPassword({ email, password });
  if (error) {
    setAuthMessage(error.message, 'error');
    return;
  }

  setAuthMessage('تم تسجيل الدخول بنجاح.', 'success');
  await checkSession();
}

async function handleLogout() {
  if (handmadeSupabase) {
    await handmadeSupabase.auth.signOut();
  }
  showLogin();
  setAuthMessage('تم تسجيل الخروج بنجاح.', 'success');
}

async function loadDashboardData() {
  await Promise.all([loadProducts(), loadOrders(), loadCustomRequests(), loadReviews()]);
  renderStats();
}

function getStoredProducts() {
  const saved = localStorage.getItem(PRODUCTS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        const remainingProducts = parsed.filter((product) => ![1, 2].includes(Number(product.id)));
        if (remainingProducts.length !== parsed.length) {
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(remainingProducts));
          localStorage.setItem(PRODUCTS_KEY_FALLBACK, JSON.stringify(remainingProducts));
        }
        return remainingProducts;
      }
    } catch (error) {
      console.warn('Invalid saved products', error);
    }
  }

  const fallback = [];

  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(fallback));
  localStorage.setItem(PRODUCTS_KEY_FALLBACK, JSON.stringify(fallback));
  return fallback;
}

async function loadProducts() {
  if (!handmadeSupabase) {
    products = getStoredProducts();
    renderProductsTable();
    return;
  }

  const { data, error } = await handmadeSupabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    productsTable.innerHTML = `<tr><td colspan="6"><div class="empty-state">لا توجد بيانات للمنتجات حاليًا.</div></td></tr>`;
    return;
  }

  products = data || [];
  renderProductsTable();
}

async function loadOrders() {
  if (!handmadeSupabase) {
    orders = JSON.parse(localStorage.getItem(ORDER_KEY) || '[]');
    orders = orders.map((order) => ({
      ...order,
      customer_name: getOrderCustomer(order),
      notes: order.notes || order.note || '',
      created_at: getOrderDate(order),
      status: order.status || 'pending',
    }));
    renderOrders();
    return;
  }

  const { data, error } = await handmadeSupabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    ordersList.innerHTML = '<div class="empty-state">لا توجد بيانات للطلبات حاليًا.</div>';
    return;
  }

  orders = data || [];
  renderOrders();
}

async function loadCustomRequests() {
  if (handmadeSupabase) {
    const { data, error } = await handmadeSupabase
      .from('custom_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      customRequestsList.innerHTML = '<div class="empty-state">تعذر تحميل الطلبات الخاصة.</div>';
      return;
    }
    customRequests = data || [];
    renderCustomRequests();
    return;
  }

  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_ORDER_KEY) || '[]');
    customRequests = Array.isArray(saved) ? saved : [];
  } catch (error) {
    customRequests = [];
  }
  renderCustomRequests();
}

async function loadReviews() {
  if (handmadeSupabase) {
    const { data, error } = await handmadeSupabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      reviewsList.innerHTML = '<div class="empty-state">تعذر تحميل آراء العملاء.</div>';
      return;
    }
    reviews = data || [];
    renderReviews();
    return;
  }

  try {
    const saved = JSON.parse(localStorage.getItem(REVIEW_KEY) || '[]');
    reviews = Array.isArray(saved) ? saved : [];
  } catch (error) {
    reviews = [];
  }
  renderReviews();
}

function renderProductsTable() {
  if (!products.length) {
    productsTable.innerHTML = '<tr><td colspan="6"><div class="empty-state">لم تتم إضافة منتجات بعد.</div></td></tr>';
    return;
  }

  productsTable.innerHTML = products
    .map((product) => {
      const status = Number(product.stock) > 0 ? 'متاح' : 'نفد المخزون';
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <img class="product-image" src="${product.image || 'https://placehold.co/80x80/f8f2e9/2e241d?text=IMG'}" alt="${product.name}" />
              <span>${product.name}</span>
            </div>
          </td>
          <td>${product.category || 'General'}</td>
          <td>EGP ${Number(product.price || 0)}</td>
          <td><input class="stock-input" data-stock-id="${product.id}" type="number" min="0" step="1" value="${Number(product.stock || 0)}" /></td>
          <td><span class="badge ${product.stock > 0 ? '' : 'pending'}">${status}</span></td>
          <td>
            <div class="inventory-actions">
              <button class="table-action" data-action="save-stock" data-product-id="${product.id}" type="button">حفظ</button>
              <button class="table-action delete" data-action="delete-product" data-product-id="${product.id}" type="button">حذف</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderOrders() {
  if (!orders.length) {
    ordersList.innerHTML = '<div class="empty-state">لا توجد طلبات حتى الآن.</div>';
    return;
  }

  ordersList.innerHTML = orders
    .map((order) => {
      const status = order.status || 'pending';
      const items = getOrderItems(order);
      const itemsMarkup = items.length
        ? items.map((item) => `${item.name_ar || item.name || 'منتج'} × ${item.quantity || 1}`).join('<br>')
        : 'تفاصيل المنتجات غير متاحة';
      return `
      <div class="order-card">
        <div class="order-head">
          <strong>${getOrderCustomer(order)}</strong>
          <select class="order-status" data-order-id="${order.id}">
            ${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${status === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="order-meta">
          <div>الهاتف: ${order.phone || 'غير متوفر'}</div>
          <div>${new Date(getOrderDate(order)).toLocaleString('ar-EG')}</div>
          <div>الإجمالي: ${Number(order.total || 0)} جنيه</div>
        </div>
        <div class="order-items">${itemsMarkup}</div>
        ${order.notes || order.note ? `<div class="order-meta">ملاحظات: ${order.notes || order.note}</div>` : ''}
        <div class="custom-request-actions"><a class="table-action" href="invoice.html?id=${encodeURIComponent(order.id)}" target="_blank" rel="noopener">الفاتورة</a><button class="table-action delete" data-action="delete-order" data-order-id="${order.id}" type="button">حذف الطلب</button></div>
      </div>
    `;
    })
    .join('');
}

function renderCustomRequests() {
  if (!customRequests.length) {
    customRequestsList.innerHTML = '<div class="empty-state">لا توجد طلبات خاصة حتى الآن.</div>';
    return;
  }

  customRequestsList.innerHTML = customRequests.map((request) => `
    <article class="order-card">
      <div class="order-head">
        <strong>${request.name || 'عميل'}</strong>
        <select class="order-status custom-request-status" data-request-id="${request.id}">
          ${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${request.status === value ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
      <div class="custom-request-details">
        <div>الهاتف: ${request.phone || 'غير متوفر'}</div>
        <div>النوع: ${request.category || 'غير محدد'}</div>
        <div>المقاس أو الكمية: ${request.size || 'غير محدد'}</div>
        <div>الألوان: ${request.colors || 'غير محددة'}</div>
        <div>موعد التسليم: ${request.deadline || 'غير محدد'}</div>
        <div>التفاصيل: ${request.details || 'لا توجد تفاصيل إضافية'}</div>
        <div>${new Date(request.created_at).toLocaleString('ar-EG')}</div>
      </div>
      ${request.reference_image ? `<img class="custom-request-image" src="${request.reference_image}" alt="الصورة المرجعية للطلب" loading="lazy" />` : '<div class="order-meta">لا توجد صورة مرفقة</div>'}
      <div class="custom-request-actions"><button class="table-action delete" data-action="delete-custom-request" data-request-id="${request.id}" type="button">حذف الطلب</button></div>
    </article>
  `).join('');
}

function renderReviews() {
  if (!reviews.length) {
    reviewsList.innerHTML = '<div class="empty-state">لا توجد آراء حتى الآن.</div>';
    return;
  }
  reviewsList.innerHTML = reviews.map((review) => `
    <article class="order-card">
      <div class="order-head">
        <strong>${review.name || 'عميل'}</strong>
        <span class="badge ${review.status === 'pending' ? 'pending' : ''}">${review.status === 'approved' ? 'منشور' : review.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}</span>
      </div>
      <div class="review-admin-stars">${'★'.repeat(Math.max(1, Math.min(5, Number(review.rating) || 5)))}</div>
      <div class="order-items">${review.text || 'بدون نص'}</div>
      <div class="custom-request-actions">
        <button class="table-action" data-action="approve-review" data-review-id="${review.id}" type="button">موافقة</button>
        <button class="table-action" data-action="reject-review" data-review-id="${review.id}" type="button">رفض</button>
        <button class="table-action delete" data-action="delete-review" data-review-id="${review.id}" type="button">حذف</button>
      </div>
    </article>
  `).join('');
}

async function updateOrderStatus(orderId, status) {
  if (handmadeSupabase) {
    const { error } = await handmadeSupabase.from('orders').update({ status }).eq('id', orderId);
    if (error) {
      setAuthMessage('تعذر تحديث حالة الطلب على قاعدة البيانات.', 'error');
      await loadOrders();
      return;
    }
  }

  orders = orders.map((order) => String(order.id) === String(orderId) ? { ...order, status } : order);
  localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  renderOrders();
  renderStats();
}

async function deleteOrder(orderId) {
  if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
  if (handmadeSupabase) {
    const { error } = await handmadeSupabase.from('orders').delete().eq('id', orderId);
    if (error) {
      setAuthMessage('تعذر حذف الطلب من قاعدة البيانات.', 'error');
      return;
    }
  }

  orders = orders.filter((order) => String(order.id) !== String(orderId));
  localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  renderOrders();
  renderStats();
  setAuthMessage('تم حذف الطلب.', 'success');
}

async function updateCustomRequestStatus(requestId, status) {
  if (handmadeSupabase) {
    const { error } = await handmadeSupabase.from('custom_orders').update({ status }).eq('id', requestId);
    if (error) {
      setAuthMessage('تعذر تحديث حالة الطلب الخاص.', 'error');
      await loadCustomRequests();
      return;
    }
  }

  customRequests = customRequests.map((request) => String(request.id) === String(requestId) ? { ...request, status } : request);
  localStorage.setItem(CUSTOM_ORDER_KEY, JSON.stringify(customRequests));
  renderCustomRequests();
  setAuthMessage('تم تحديث حالة الطلب الخاص.', 'success');
}

async function deleteCustomRequest(requestId) {
  if (!window.confirm('هل أنت متأكد من حذف الطلب الخاص؟')) return;
  if (handmadeSupabase) {
    const { error } = await handmadeSupabase.from('custom_orders').delete().eq('id', requestId);
    if (error) {
      setAuthMessage('تعذر حذف الطلب الخاص.', 'error');
      return;
    }
  }

  customRequests = customRequests.filter((request) => String(request.id) !== String(requestId));
  localStorage.setItem(CUSTOM_ORDER_KEY, JSON.stringify(customRequests));
  renderCustomRequests();
  setAuthMessage('تم حذف الطلب الخاص.', 'success');
}

async function updateReviewStatus(reviewId, status) {
  if (handmadeSupabase) {
    const { error } = await handmadeSupabase.from('reviews').update({ status }).eq('id', reviewId);
    if (error) {
      setAuthMessage('تعذر تحديث حالة الرأي.', 'error');
      await loadReviews();
      return;
    }
  }

  reviews = reviews.map((review) => String(review.id) === String(reviewId) ? { ...review, status } : review);
  localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews));
  renderReviews();
  setAuthMessage(status === 'approved' ? 'تم نشر الرأي على الموقع.' : 'تم رفض الرأي.', 'success');
}

async function deleteReview(reviewId) {
  if (!window.confirm('هل أنت متأكد من حذف هذا الرأي؟')) return;
  if (handmadeSupabase) {
    const { error } = await handmadeSupabase.from('reviews').delete().eq('id', reviewId);
    if (error) {
      setAuthMessage('تعذر حذف الرأي.', 'error');
      return;
    }
  }

  reviews = reviews.filter((review) => String(review.id) !== String(reviewId));
  localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews));
  renderReviews();
  setAuthMessage('تم حذف الرأي.', 'success');
}

async function updateProductStock(productId, stock) {
  const nextStock = Math.max(0, Number(stock || 0));
  if (handmadeSupabase) {
    const { error } = await handmadeSupabase.from('products').update({ stock: nextStock }).eq('id', productId);
    if (error) {
      setAuthMessage('تعذر تحديث المخزون.', 'error');
      return;
    }
  }

  products = products.map((product) => String(product.id) === String(productId) ? { ...product, stock: nextStock } : product);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  localStorage.setItem(PRODUCTS_KEY_FALLBACK, JSON.stringify(products));
  renderProductsTable();
  renderStats();
  setAuthMessage('تم تحديث المخزون.', 'success');
}

async function deleteProduct(productId) {
  if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

  if (handmadeSupabase) {
    const { error } = await handmadeSupabase.from('products').delete().eq('id', productId);
    if (error) {
      setAuthMessage('تعذر حذف المنتج.', 'error');
      return;
    }
  }

  products = products.filter((product) => String(product.id) !== String(productId));
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  localStorage.setItem(PRODUCTS_KEY_FALLBACK, JSON.stringify(products));
  renderProductsTable();
  renderStats();
  setAuthMessage('تم حذف المنتج.', 'success');
}

function renderStats() {
  document.querySelector('#product-count').textContent = String(products.length);
  document.querySelector('#order-count').textContent = String(orders.length);
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  document.querySelector('#revenue-total').textContent = `EGP ${totalRevenue}`;
  const stockTotal = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  document.querySelector('#stock-total').textContent = String(stockTotal);
}

async function handleProductSubmit(event) {
  event.preventDefault();
  const formData = new FormData(productForm);
  const payload = {
    name: String(formData.get('name') || '').trim(),
    name_ar: String(formData.get('name_ar') || '').trim(),
    category: String(formData.get('category') || 'Crochet').trim(),
    price: Number(formData.get('price') || 0),
    stock: Number(formData.get('stock') || 0),
    image: String(formData.get('image') || '').trim(),
    images: String(formData.get('images') || '').split(/[\n,]+/).map((image) => image.trim()).filter(Boolean),
    description: String(formData.get('description') || '').trim(),
    is_active: true,
  };

  if (!payload.name || !payload.image) {
    return;
  }

  if (!handmadeSupabase) {
    const updatedProducts = [{
      ...payload,
      id: Date.now(),
      created_at: new Date().toISOString(),
    }, ...products];
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
    localStorage.setItem(PRODUCTS_KEY_FALLBACK, JSON.stringify(updatedProducts));
    products = updatedProducts;
    renderProductsTable();
    renderStats();
    productForm.reset();
    return;
  }

  const { error } = await handmadeSupabase.from('products').insert([payload]);
  if (error) {
    setAuthMessage(`تعذر حفظ المنتج: ${error.message}`, 'error');
    return;
  }

  productForm.reset();
  await loadProducts();
  renderStats();
}

loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
productForm.addEventListener('submit', handleProductSubmit);
ordersList.addEventListener('change', (event) => {
  if (event.target.matches('.order-status')) {
    updateOrderStatus(event.target.dataset.orderId, event.target.value);
  }
});
ordersList.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action="delete-order"]');
  if (action) deleteOrder(action.dataset.orderId);
});
productsTable.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]');
  if (!action) return;
  const productId = action.dataset.productId;
  if (action.dataset.action === 'delete-product') {
    deleteProduct(productId);
  }
  if (action.dataset.action === 'save-stock') {
    const input = productsTable.querySelector(`[data-stock-id="${productId}"]`);
    updateProductStock(productId, input?.value);
  }
});
customRequestsList.addEventListener('change', (event) => {
  if (event.target.matches('.custom-request-status')) {
    updateCustomRequestStatus(event.target.dataset.requestId, event.target.value);
  }
});
customRequestsList.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action="delete-custom-request"]');
  if (action) deleteCustomRequest(action.dataset.requestId);
});
reviewsList.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]');
  if (!action) return;
  const reviewId = action.dataset.reviewId;
  if (action.dataset.action === 'approve-review') updateReviewStatus(reviewId, 'approved');
  if (action.dataset.action === 'reject-review') updateReviewStatus(reviewId, 'rejected');
  if (action.dataset.action === 'delete-review') deleteReview(reviewId);
});

window.addEventListener('storage', (event) => {
  if (event.key === ORDER_KEY && !handmadeSupabase) {
    loadOrders();
  }
});

checkSession();
