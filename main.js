function setActiveNavLink() {
  var path = (location.pathname || '').toLowerCase();
  var links = document.querySelectorAll('.nav-links a');
  links.forEach(function(link) {
    var href = link.getAttribute('href');
    if (!href) return;
    var match = path.endsWith(href.toLowerCase());
    if (href === 'index.html' && (path.endsWith('/') || path.endsWith('\\'))) {
      match = true;
    }
    if (match) link.classList.add('active');
  });
}

function initMobileMenu() {
  var toggle = document.querySelector('[data-menu-toggle]');
  var links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', function() {
    links.classList.toggle('open');
  });
}

function initContactForm() {
  var form = document.querySelector('#contact-form');
  if (!form) return;

  function setError(id, message) {
    var el = document.getElementById(id + '-error');
    if (el) el.textContent = message || '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = (document.getElementById('name') || {}).value || '';
    var email = (document.getElementById('email') || {}).value || '';
    var message = (document.getElementById('message') || {}).value || '';

    var isValid = true;
    setError('name'); setError('email'); setError('message');

    if (name.trim().length < 2) { setError('name', 'Nombre demasiado corto.'); isValid = false; }
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError('email', 'Email no válido.'); isValid = false; }
    if (message.trim().length < 10) { setError('message', 'Mensaje demasiado corto.'); isValid = false; }

    if (!isValid) return;

    form.reset();
    alert('Gracias por contactarnos. Te responderemos pronto.');
  });
}

document.addEventListener('DOMContentLoaded', function() {
  setActiveNavLink();
  initMobileMenu();
  initContactForm();
  initAuth();
  initCart();
  initProfile();
  initEvents();
  initProductsStore();
  renderHomeProducts();
  enforceAdminGuard();
});

// -------- Auth (Mock) --------
function initAuth() {
  var loginBtn = document.getElementById('loginBtn');
  var logoutBtn = document.getElementById('logoutBtn');
  var registerBtn = document.getElementById('registerBtn');
  var modal = document.getElementById('loginModal');
  var cancel = document.getElementById('login-cancel');
  var form = document.getElementById('login-form');
  var adminLink = document.getElementById('adminLink');
  var regModal = document.getElementById('registerModal');
  var regCancel = document.getElementById('register-cancel');
  var regForm = document.getElementById('register-form');
  var sendCodeBtn = document.getElementById('send-code');

  function getUser() {
    try { return JSON.parse(localStorage.getItem('auth_user') || 'null'); } catch(_) { return null; }
  }
  function setUser(user) {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }
  function clearUser() {
    localStorage.removeItem('auth_user');
  }
  function getUsers() {
    try { return JSON.parse(localStorage.getItem('users') || '[]'); } catch(_) { return []; }
  }
  function setUsers(users) { localStorage.setItem('users', JSON.stringify(users)); }
  function setPendingCode(email, code) { localStorage.setItem('verify_' + email.toLowerCase(), String(code)); }
  function getPendingCode(email) { return localStorage.getItem('verify_' + email.toLowerCase()); }
  function clearPendingCode(email) { localStorage.removeItem('verify_' + email.toLowerCase()); }
  function render() {
    var user = getUser();
    if (loginBtn) loginBtn.style.display = user ? 'none' : 'inline-block';
    if (logoutBtn) logoutBtn.style.display = user ? 'inline-block' : 'none';
    if (adminLink) adminLink.style.display = (user && user.role === 'admin') ? 'inline-block' : 'none';
    var profileLink = document.getElementById('profileLink');
    if (profileLink) profileLink.style.display = user ? 'inline-block' : 'none';
  }
  function openModal() { if (modal) { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); } }
  function closeModal() { if (modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); } }

  if (loginBtn) loginBtn.addEventListener('click', openModal);
  if (cancel) cancel.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
  if (logoutBtn) logoutBtn.addEventListener('click', function(){ clearUser(); render(); alert('Sesión cerrada'); });
  if (registerBtn) registerBtn.addEventListener('click', function(){ if (regModal) { regModal.classList.add('open'); regModal.setAttribute('aria-hidden','false'); }});
  if (regCancel) regCancel.addEventListener('click', function(){ if (regModal) { regModal.classList.remove('open'); regModal.setAttribute('aria-hidden','true'); }});
  if (regModal) regModal.addEventListener('click', function(e){ if (e.target === regModal) { regModal.classList.remove('open'); regModal.setAttribute('aria-hidden','true'); }});
  if (sendCodeBtn) sendCodeBtn.addEventListener('click', function(){
    var email = (document.getElementById('reg-email') || {}).value || '';
    var emailErr = document.getElementById('reg-email-error');
    if (emailErr) emailErr.textContent = '';
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { if (emailErr) emailErr.textContent = 'Correo no válido.'; return; }
    var code = String(Math.floor(100000 + Math.random() * 900000));
    setPendingCode(email, code);
    // Aquí podrías integrar EmailJS u otro servicio para enviar el email
    alert('Código enviado a ' + email + ': ' + code + ' (modo prueba)');
  });

  if (form) {
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var username = ((document.getElementById('login-username') || {}).value || '').trim();
      var password = ((document.getElementById('login-password') || {}).value || '').trim();
      var userErr = document.getElementById('login-username-error');
      var passErr = document.getElementById('login-password-error');
      if (userErr) userErr.textContent = '';
      if (passErr) passErr.textContent = '';

      var ok = true;
      if (username.trim().length < 3) { if (userErr) userErr.textContent = 'Usuario no válido.'; ok = false; }
      if (password.trim().length < 4) { if (passErr) passErr.textContent = 'Mínimo 4 caracteres.'; ok = false; }
      if (!ok) return;

      var role = (username.toLowerCase() === 'admin' && password === 'admin') ? 'admin' : null;
      if (!role) {
        var users = getUsers();
        var uname = username.toLowerCase();
        var match = users.find(function(u){
          var byEmail = u.email && u.email.toLowerCase() === uname;
          var byUser = u.username && u.username.toLowerCase() === uname;
          return (byEmail || byUser) && u.password === password;
        });
        if (!match) { if (userErr) userErr.textContent = 'Credenciales inválidas.'; return; }
        role = 'user';
      }
      setUser({ username: username, role: role });
      closeModal();
      render();
      alert('Bienvenido, ' + username + '!');
      logEvent('auth:login', { username: username, role: role });
      form.reset();

      // If we are trying to access admin.html and just logged in as admin, ensure access
      if (role === 'admin' && location.pathname.toLowerCase().endsWith('admin.html')) {
        // nothing else needed; panels already visible
      }
    });
  }

  // Register
  if (regForm) regForm.addEventListener('submit', function(e){
    e.preventDefault();
    var username = (document.getElementById('reg-username') || {}).value || '';
    var email = (document.getElementById('reg-email') || {}).value || '';
    var password = (document.getElementById('reg-password') || {}).value || '';
    var password2 = (document.getElementById('reg-password2') || {}).value || '';
    var code = (document.getElementById('reg-code') || {}).value || '';
    var uErr = document.getElementById('reg-username-error');
    var eErr = document.getElementById('reg-email-error');
    var pErr = document.getElementById('reg-password-error');
    var p2Err = document.getElementById('reg-password2-error');
    var cErr = document.getElementById('reg-code-error');
    if (uErr) uErr.textContent = '';
    if (eErr) eErr.textContent = '';
    if (pErr) pErr.textContent = '';
    if (p2Err) p2Err.textContent = '';
    if (cErr) cErr.textContent = '';
    if (username.trim().length < 3) { if (uErr) uErr.textContent = 'Usuario muy corto.'; return; }
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { if (eErr) eErr.textContent = 'Correo no válido.'; return; }
    if (password.trim().length < 6) { if (pErr) pErr.textContent = 'Mínimo 6 caracteres.'; return; }
    if (password !== password2) { if (p2Err) p2Err.textContent = 'Las contraseñas no coinciden.'; return; }
    if (!/^\d{6}$/.test(code)) { if (cErr) cErr.textContent = 'Ingresa el código de 6 dígitos.'; return; }
    var expected = getPendingCode(email);
    if (String(code) !== String(expected)) { if (cErr) cErr.textContent = 'Código incorrecto o expirado.'; return; }
    var users = getUsers();
    if (users.some(function(u){ return u.email && u.email.toLowerCase() === email.toLowerCase(); })) { if (eErr) eErr.textContent = 'Correo ya registrado.'; return; }
    if (users.some(function(u){ return u.username && u.username.toLowerCase() === username.toLowerCase(); })) { if (uErr) uErr.textContent = 'Usuario ya existe.'; return; }
    users.push({ username: username, email: email, password: password });
    setUsers(users);
    clearPendingCode(email);
    if (regModal) { regModal.classList.remove('open'); regModal.setAttribute('aria-hidden','true'); }
    alert('Registro exitoso. Ahora puedes iniciar sesión.');
    regForm.reset();
  });

  render();
}

// -------- Cart --------
function initCart() {
  var cartBtn = document.getElementById('cartBtn');
  var cartBadge = document.getElementById('cartBadge');
  var drawer = document.getElementById('cartDrawer');
  var backdrop = document.getElementById('cartBackdrop');
  var cartClose = document.getElementById('cartClose');
  var cartItems = document.getElementById('cartItems');
  var cartTotal = document.getElementById('cartTotal');
  var cartClear = document.getElementById('cartClear');
  var cartCheckout = document.getElementById('cartCheckout');

  function getCart() {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch(_) { return []; }
  }
  function setCart(items) {
    localStorage.setItem('cart', JSON.stringify(items));
    logEvent('cart:update', { items: items });
  }
  function openDrawer() {
    if (drawer) { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); }
    if (backdrop) { backdrop.classList.add('open'); }
  }
  function closeDrawer() {
    if (drawer) { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
    if (backdrop) { backdrop.classList.remove('open'); }
  }
  function formatCurrency(n) { return '$ ' + n.toLocaleString(undefined, { maximumFractionDigits: 0 }); }

  function computeTotals(items) {
    var totalQty = 0, totalPrice = 0;
    items.forEach(function(it){ totalQty += it.qty; totalPrice += it.qty * it.price; });
    return { totalQty: totalQty, totalPrice: totalPrice };
  }

  function render() {
    var items = getCart();
    var totals = computeTotals(items);
    if (cartBadge) {
      cartBadge.textContent = String(totals.totalQty);
      cartBadge.classList.toggle('show', totals.totalQty > 0);
    }
    if (cartItems) {
      cartItems.innerHTML = '';
      if (items.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'muted';
        empty.textContent = 'Tu carrito está vacío.';
        cartItems.appendChild(empty);
      } else {
        items.forEach(function(it){
          var row = document.createElement('div');
          row.className = 'cart-item';
          row.innerHTML = '<div><div class="title">' + it.name + '</div><div class="muted">$ ' + it.price + '</div></div>'+
                          '<div style="display:grid; gap:6px; justify-items:end">'+
                          '<div class="qty">'+
                          '<button class="btn" data-dec="' + it.id + '">-</button>'+ 
                          '<span>' + it.qty + '</span>'+ 
                          '<button class="btn" data-inc="' + it.id + '">+</button>'+ 
                          '</div>'+ 
                          '<button class="btn ghost" data-remove="' + it.id + '">Quitar</button>'+ 
                          '</div>';
          cartItems.appendChild(row);
        });
      }
    }
    if (cartTotal) cartTotal.textContent = formatCurrency(totals.totalPrice);
  }

  function addItem(product) {
    var items = getCart();
    var existing = items.find(function(it){ return it.id === product.id; });
    if (existing) existing.qty += 1; else items.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    setCart(items); render();
  }
  function inc(id) {
    var items = getCart();
    items.forEach(function(it){ if (it.id === id) it.qty += 1; });
    setCart(items); render();
  }
  function dec(id) {
    var items = getCart().map(function(it){ if (it.id === id) it.qty = Math.max(1, it.qty - 1); return it; });
    setCart(items); render();
  }
  function removeItem(id) {
    var items = getCart().filter(function(it){ return it.id !== id; });
    setCart(items); render();
  }
  function clearCart() { setCart([]); render(); }

  // Wire buttons in product cards
  document.querySelectorAll('.add-to-cart').forEach(function(btn){
    btn.addEventListener('click', function(){
      var card = btn.closest('.card');
      if (!card) return;
      try {
        var product = JSON.parse(card.getAttribute('data-product') || '{}');
        if (product && product.id) { addItem(product); logEvent('cart:add', { id: product.id, name: product.name, price: product.price }); }
      } catch(_) {}
    });
  });

  if (cartBtn) cartBtn.addEventListener('click', openDrawer);
  if (cartClose) cartClose.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  if (cartItems) cartItems.addEventListener('click', function(e){
    var t = e.target;
    if (!(t instanceof Element)) return;
    var incId = t.getAttribute('data-inc');
    var decId = t.getAttribute('data-dec');
    var remId = t.getAttribute('data-remove');
    if (incId) inc(incId);
    if (decId) dec(decId);
    if (remId) removeItem(remId);
  });

  if (cartClear) cartClear.addEventListener('click', clearCart);
  if (cartCheckout) cartCheckout.addEventListener('click', function(){
    var items = getCart();
    if (items.length === 0) { alert('Tu carrito está vacío.'); return; }
    var totalText = (document.getElementById('cartTotal') || {textContent:'$ 0'}).textContent;
    alert('Compra simulada. Total: ' + totalText);
    logEvent('checkout', { total: totalText, items: items });
    clearCart();
    closeDrawer();
  });

  render();
}

// -------- Events / Admin --------
function logEvent(type, payload) {
  try {
    var list = JSON.parse(localStorage.getItem('events') || '[]');
    list.unshift({ t: new Date().toISOString(), type: type, data: payload || {} });
    list = list.slice(0, 300); // cap
    localStorage.setItem('events', JSON.stringify(list));
  } catch(_) {}
}

function initEvents() {
  // page view
  logEvent('page:view', { path: location.pathname });

  // login/logout hooks: already in auth render/actions by manual calls
  var refresh = document.getElementById('ev-refresh');
  var clear = document.getElementById('ev-clear');
  var clearUsers = document.getElementById('ev-clear-users');
  var clearCheckouts = document.getElementById('ev-clear-checkouts');
  var listEl = document.getElementById('eventsList');

  function render() {
    if (!listEl) return;
    var list = [];
    try { list = JSON.parse(localStorage.getItem('events') || '[]'); } catch(_) {}
    listEl.innerHTML = '';
    list.forEach(function(ev){
      var item = document.createElement('div');
      item.className = 'card';
      item.innerHTML = '<div class="body">'+
        '<div class="muted">' + new Date(ev.t).toLocaleString() + '</div>'+
        '<div><strong>' + ev.type + '</strong></div>'+
        '<pre style="white-space:pre-wrap; background:transparent; color:#e5e7eb; margin:0">' + JSON.stringify(ev.data, null, 2) + '</pre>'+
      '</div>';
      listEl.appendChild(item);
    });
  }

  if (refresh) refresh.addEventListener('click', render);
  if (clear) clear.addEventListener('click', function(){ localStorage.removeItem('events'); render(); });
  if (clearUsers) clearUsers.addEventListener('click', function(){
    localStorage.removeItem('users');
    localStorage.removeItem('auth_user');
    Object.keys(localStorage).forEach(function(k){ if (k.startsWith('verify_')) localStorage.removeItem(k); });
    alert('Usuarios, sesiones y códigos de verificación eliminados.');
  });
  if (clearCheckouts) clearCheckouts.addEventListener('click', function(){
    try {
      var list = JSON.parse(localStorage.getItem('events') || '[]');
      list = list.filter(function(ev){ return ev.type !== 'checkout'; });
      localStorage.setItem('events', JSON.stringify(list));
    } catch(_) {}
    render();
    try { if (window.renderMetrics) window.renderMetrics(); } catch(_) {}
  });

  render();
}

// Admin tabs and products CRUD
document.addEventListener('DOMContentLoaded', function(){
  var tabOverview = document.getElementById('tab-overview');
  var tabProducts = document.getElementById('tab-products');
  var panelOverview = document.getElementById('panel-overview');
  var panelProducts = document.getElementById('panel-products');
  function switchTab(which){
    if (!tabOverview || !tabProducts) return;
    var isOverview = which === 'overview';
    tabOverview.classList.toggle('active', isOverview);
    tabProducts.classList.toggle('active', !isOverview);
    if (panelOverview) panelOverview.style.display = isOverview ? 'block' : 'none';
    if (panelProducts) panelProducts.style.display = isOverview ? 'none' : 'block';
  }
  if (tabOverview) tabOverview.addEventListener('click', function(){ switchTab('overview'); });
  if (tabProducts) tabProducts.addEventListener('click', function(){ switchTab('products'); renderProductsTable(); });

  // metrics
  function renderMetrics(){
    var views = 0, adds = 0, checkouts = 0;
    try {
      var list = JSON.parse(localStorage.getItem('events') || '[]');
      list.forEach(function(ev){
        if (ev.type === 'page:view') views++;
        if (ev.type === 'cart:add') adds++;
        if (ev.type === 'checkout') checkouts++;
      });
    } catch(_) {}
    var m1 = document.getElementById('metric-views'); if (m1) m1.textContent = String(views);
    var m2 = document.getElementById('metric-adds'); if (m2) m2.textContent = String(adds);
    var m3 = document.getElementById('metric-checkouts'); if (m3) m3.textContent = String(checkouts);
  }
  renderMetrics();
  try { window.renderMetrics = renderMetrics; } catch(_) {}

  // products CRUD
  var tbody = document.getElementById('products-tbody');
  function renderProductsTable(){
    if (!tbody) return;
    tbody.innerHTML = '';
    getProducts().forEach(function(p){
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>'+p.id+'</td><td>'+p.name+'</td><td>$ '+p.price.toLocaleString()+'</td><td><button class="btn" data-del="'+p.id+'">Eliminar</button></td>';
      tbody.appendChild(tr);
    });
  }
  renderProductsTable();

  if (tbody) tbody.addEventListener('click', function(e){
    var t = e.target;
    if (!(t instanceof Element)) return;
    var id = t.getAttribute('data-del');
    if (!id) return;
    var list = getProducts().filter(function(p){ return p.id !== id; });
    setProducts(list);
    renderProductsTable();
    renderHomeProducts();
  });

  var pForm = document.getElementById('product-form');
  var pClear = document.getElementById('p-clear');
  if (pForm) pForm.addEventListener('submit', function(e){
    e.preventDefault();
    var id = (document.getElementById('p-id') || {}).value || '';
    var name = (document.getElementById('p-name') || {}).value || '';
    var price = parseFloat((document.getElementById('p-price') || {}).value || '0') || 0;
    if (!id || !name) return alert('Completa ID y Nombre');
    var list = getProducts();
    if (list.some(function(p){ return p.id === id; })) return alert('ID ya existe');
    list.push({ id: id, name: name, price: Math.max(0, Math.round(price)) });
    setProducts(list);
    (document.getElementById('p-id') || {}).value = '';
    (document.getElementById('p-name') || {}).value = '';
    (document.getElementById('p-price') || {}).value = '';
    renderProductsTable();
    renderHomeProducts();
  });
  if (pClear) pClear.addEventListener('click', function(){
    (document.getElementById('p-id') || {}).value = '';
    (document.getElementById('p-name') || {}).value = '';
    (document.getElementById('p-price') || {}).value = '';
  });
});

// -------- Products Store & Home Rendering --------
function initProductsStore() {
  try {
    var exists = localStorage.getItem('products');
    if (!exists) {
      var seed = [
        { id: 'ultrabook-14', name: 'Ultrabook 14" i7 16GB', price: 1199 },
        { id: 'pc-gamer', name: 'Ryzen 7 + RTX 4060', price: 1499 },
        { id: 'workstation-i9', name: 'Intel i9 + 64GB RAM', price: 2399 }
      ];
      localStorage.setItem('products', JSON.stringify(seed));
    }
  } catch(_) {}
}

function getProducts() {
  try { return JSON.parse(localStorage.getItem('products') || '[]'); } catch(_) { return []; }
}
function setProducts(list) { localStorage.setItem('products', JSON.stringify(list)); }

function renderHomeProducts() {
  var grid = document.getElementById('home-products');
  if (!grid) return;
  var products = getProducts();
  grid.innerHTML = '';
  products.forEach(function(p){
    var card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('data-product', JSON.stringify(p));
    card.innerHTML = '<div class="thumb">' + p.name.split(' ')[0] + '</div>'+
      '<div class="body">'+
      '<h3>' + p.name + '</h3>'+
      '<span class="price">$ ' + p.price.toLocaleString() + '</span>'+
      '<p class="muted">Producto agregado desde Admin.</p>'+
      '<div class="actions">'+
      '<button class="btn primary add-to-cart">Comprar</button>'+ 
      '<button class="btn">Detalles</button>'+ 
      '</div></div>';
    grid.appendChild(card);
  });
  // rewire add-to-cart for newly created nodes
  initCart();
}

// -------- Profile --------
function initProfile() {
  var profileLink = document.getElementById('profileLink');
  var form = document.getElementById('profile-form');

  function getUser() {
    try { return JSON.parse(localStorage.getItem('auth_user') || 'null'); } catch(_) { return null; }
  }
  function keyForUser(user) { return 'profile_' + (user && (user.username || user.email) ? (user.username || user.email) : 'guest'); }

  // Toggle profile link visibility based on auth
  var user = getUser();
  if (profileLink) profileLink.style.display = user ? 'inline-block' : 'none';

  if (!form) return; // only on perfil.html

  if (!user) {
    // not logged in: redirect to home
    window.location.href = 'index.html';
    return;
  }

  function loadProfile() {
    var data = {};
    try { data = JSON.parse(localStorage.getItem(keyForUser(user)) || '{}'); } catch(_) {}
    (document.getElementById('pf-name') || {}).value = data.name || (user && user.username ? user.username : '');
    (document.getElementById('pf-phone') || {}).value = data.phone || '';
    (document.getElementById('pf-address') || {}).value = data.address || '';
  }

  function saveProfile(e) {
    if (e) e.preventDefault();
    var data = {
      name: (document.getElementById('pf-name') || {}).value || '',
      phone: (document.getElementById('pf-phone') || {}).value || '',
      address: (document.getElementById('pf-address') || {}).value || ''
    };
    localStorage.setItem(keyForUser(user), JSON.stringify(data));
    alert('Perfil guardado');
  }

  var resetBtn = document.getElementById('pf-reset');
  if (form) form.addEventListener('submit', saveProfile);
  if (resetBtn) resetBtn.addEventListener('click', function(){ loadProfile(); });

  loadProfile();
}

function enforceAdminGuard() {
  var onAdmin = location.pathname.toLowerCase().endsWith('admin.html');
  if (!onAdmin) return;
  try {
    var user = JSON.parse(localStorage.getItem('auth_user') || 'null');
    if (!user || user.role !== 'admin') {
      var loginBtn = document.getElementById('loginBtn');
      var modal = document.getElementById('loginModal');
      if (modal) { modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); }
      if (loginBtn) loginBtn.style.display = 'inline-block';
    }
  } catch(_) {}
}


