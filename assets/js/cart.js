// Malzie Softs — Global Cart & Commerce Engine
// Manages shared cart state, local storage persistence, drawers, and checkout across all pages
(function () {
  'use strict';

  // --- Web Audio SFX Engine ---
  let audioCtx = null;
  let soundEnabled = localStorage.getItem('aether_sound') !== 'false';

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type = 'click') {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.05);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'whoosh') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.07);
        osc.frequency.setValueAtTime(783.99, now + 0.14);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'celebrate') {
        // High luxury chime
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const subOsc = audioCtx.createOscillator();
          const subGain = audioCtx.createGain();
          subOsc.connect(subGain);
          subGain.connect(audioCtx.destination);
          subOsc.frequency.setValueAtTime(freq, now + i * 0.07);
          subGain.gain.setValueAtTime(0.06, now + i * 0.07);
          subGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);
          subOsc.start(now + i * 0.07);
          subOsc.stop(now + i * 0.07 + 0.35);
        });
      }
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  // --- Cart State Management ---
  const STORAGE_KEY = 'aether_cart_items';
  const PROMO_KEY = 'aether_active_promo';
  const USER_KEY = 'aether_current_user';
  const ORDERS_KEY = 'aether_placed_orders';

  function getSavedCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading cart', e);
    }
    // Default starter item if user visits for first time
    return [
      {
        id: 'prod-1',
        name: 'Malzie Aero Excee Pure',
        size: 'US 10',
        price: 159,
        image: 'assets/images/shoe-white.jpg',
        quantity: 1,
        type: 'Footwear'
      }
    ];
  }

  function saveCart(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Error saving cart', e);
    }
  }

  function getActivePromo() {
    try {
      const p = localStorage.getItem(PROMO_KEY);
      if (p) return JSON.parse(p);
    } catch (e) {}
    return { code: '', percent: 0 };
  }

  function saveActivePromo(promo) {
    localStorage.setItem(PROMO_KEY, JSON.stringify(promo));
  }

  let cart = getSavedCart();
  let promo = getActivePromo();

  // Toast Notification Component
  function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-auto ${
      type === 'success'
        ? 'bg-neutral-900 text-white border border-neutral-700/80'
        : 'bg-red-600 text-white'
    }`;
    toast.innerHTML = `
      <div class="w-5 h-5 rounded-full ${type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/20 text-white'} flex items-center justify-center flex-shrink-0">
        ${type === 'success' ? '✓' : '!'}
      </div>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', '-translate-y-2');
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }

  // Calculate totals
  function getSubtotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function getDiscount() {
    const sub = getSubtotal();
    return sub * (promo.percent / 100);
  }

  function getTotal() {
    return Math.max(0, getSubtotal() - getDiscount());
  }

  function getTotalQuantity() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Update UI everywhere
  function updateCartUI() {
    const totalQty = getTotalQuantity();
    const subtotal = getSubtotal();
    const discount = getDiscount();
    const total = getTotal();

    // 1. Update all cart count badges in DOM
    document.querySelectorAll('#cart-count-badge, .cart-count-badge').forEach((badge) => {
      badge.textContent = totalQty;
      if (totalQty === 0) {
        badge.classList.add('hidden');
      } else {
        badge.classList.remove('hidden');
      }
    });

    // 2. Update price elements in cart drawer
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountEl = document.getElementById('cart-discount');
    const totalEl = document.getElementById('cart-total');

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (discountEl) discountEl.textContent = `-$${discount.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    // 3. Render drawer items
    const container = document.getElementById('cart-items-container');
    if (container) {
      if (cart.length === 0) {
        container.innerHTML = `
          <div class="flex flex-col items-center justify-center h-64 text-center px-4">
            <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
              <i data-lucide="shopping-bag" class="w-8 h-8 text-gray-400"></i>
            </div>
            <p class="text-base font-bold text-gray-900 mb-1">Your Bag is Empty</p>
            <p class="text-xs text-gray-500 max-w-xs mb-4">Explore our footwear and apparel roster to elevate your athletic experience.</p>
            <a href="products.html" class="inline-flex items-center gap-1.5 text-xs font-bold bg-black text-white px-5 py-2.5 rounded-full hover:bg-neutral-800 transition-colors">
              <span>Browse Catalog</span>
              <span>→</span>
            </a>
          </div>
        `;
      } else {
        container.innerHTML = cart
          .map(
            (item, index) => `
          <div class="flex items-center gap-4 py-4 border-b border-gray-100 group">
            <div class="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain blend-shoe group-hover:scale-105 transition-transform duration-300">
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-bold text-gray-900 truncate">${item.name}</h4>
              <p class="text-xs text-gray-500 font-medium">Size: <span class="text-gray-900 font-semibold">${item.size}</span></p>
              <p class="text-sm font-black text-gray-900 mt-0.5">$${item.price.toFixed(2)}</p>
              <div class="flex items-center gap-2 mt-2">
                <button data-action="decrease" data-index="${index}" class="cart-qty-btn w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold transition-colors" title="Decrease quantity">-</button>
                <span class="text-xs font-bold text-gray-900 w-4 text-center">${item.quantity}</span>
                <button data-action="increase" data-index="${index}" class="cart-qty-btn w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold transition-colors" title="Increase quantity">+</button>
              </div>
            </div>
            <button data-action="remove" data-index="${index}" class="cart-remove-btn text-gray-400 hover:text-red-500 p-2 transition-colors" title="Remove item">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        `
          )
          .join('');

        // Wire quantity and delete buttons
        container.querySelectorAll('.cart-qty-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            playSound('click');
            const action = btn.getAttribute('data-action');
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            if (action === 'increase') {
              cart[idx].quantity += 1;
            } else if (action === 'decrease') {
              if (cart[idx].quantity > 1) {
                cart[idx].quantity -= 1;
              } else {
                const removedName = cart[idx].name;
                cart.splice(idx, 1);
                showToast(`Removed ${removedName} from bag`);
              }
            }
            saveCart(cart);
            updateCartUI();
          });
        });

        container.querySelectorAll('.cart-remove-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            playSound('click');
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            const removedName = cart[idx].name;
            cart.splice(idx, 1);
            saveCart(cart);
            updateCartUI();
            showToast(`Removed ${removedName} from bag`);
          });
        });
      }
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  }

  // Open and Close Cart Drawer
  function openCart() {
    playSound('whoosh');
    updateCartUI();
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer && backdrop) {
      backdrop.classList.remove('hidden');
      requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        drawer.classList.remove('translate-x-full');
      });
    }
  }

  function closeCart() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('translate-x-full');
      backdrop.classList.add('opacity-0');
      setTimeout(() => {
        backdrop.classList.add('hidden');
      }, 300);
    }
  }

  // Add Item to Bag
  function addToBag(item) {
    playSound('success');
    const existing = cart.find((i) => i.name === item.name && i.size === item.size);
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      cart.push({
        id: item.id || 'prod-' + Date.now(),
        name: item.name,
        size: item.size || 'US 10',
        price: item.price,
        image: item.image,
        quantity: item.quantity || 1,
        type: item.type || 'Footwear'
      });
    }
    saveCart(cart);
    updateCartUI();
    showToast(`Added ${item.name} (${item.size || 'US 10'}) to bag!`);
    openCart();
  }

  // Apply Promo Code
  function applyPromo(code) {
    const clean = (code || '').trim().toUpperCase();
    const feedback = document.getElementById('promo-feedback');
    if (clean === 'FUTURE20' || clean === 'MALZIE20' || clean === 'SOFTS20' || clean === 'AETHER20') {
      promo = { code: clean, percent: 20 };
      saveActivePromo(promo);
      playSound('celebrate');
      if (feedback) {
        feedback.className = 'text-xs text-emerald-600 font-bold block mt-1.5';
        feedback.textContent = '🎉 20% future lab discount unlocked!';
      }
      showToast('20% Discount Code Applied!');
    } else if (clean === '') {
      if (feedback) {
        feedback.className = 'text-xs text-amber-600 font-semibold block mt-1.5';
        feedback.textContent = 'Please enter a promo voucher.';
      }
    } else {
      promo = { code: '', percent: 0 };
      saveActivePromo(promo);
      playSound('click');
      if (feedback) {
        feedback.className = 'text-xs text-red-500 font-semibold block mt-1.5';
        feedback.textContent = 'Invalid promo code. Try "FUTURE20".';
      }
    }
    updateCartUI();
  }

  // --- Dynamic Checkout Modal ---
  function createCheckoutModalIfNotExists() {
    if (document.getElementById('checkout-modal')) return;

    const modalHtml = `
      <div id="checkout-backdrop" class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 hidden opacity-0 transition-opacity duration-300"></div>
      <div id="checkout-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 opacity-0 scale-95 pointer-events-none transition-all duration-300">
        <div class="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto max-h-[92vh] flex flex-col">
          
          <!-- Modal Header -->
          <div class="p-6 border-b border-gray-100 flex items-center justify-between bg-neutral-900 text-white">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black">
                <i data-lucide="zap" class="w-4 h-4 text-black"></i>
              </div>
              <div>
                <h3 class="font-display font-bold text-xl leading-none">Malzie Softs Express Checkout</h3>
                <p class="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">256-Bit SSL Encrypted // Priority Dispatch</p>
              </div>
            </div>
            <button id="checkout-close-btn" class="p-2 rounded-full hover:bg-neutral-800 text-gray-400 hover:text-white transition-colors" aria-label="Close Checkout">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Checkout Body Scrollable -->
          <div id="checkout-content" class="p-6 overflow-y-auto space-y-6 flex-1">
            
            <!-- Order Snapshot Box -->
            <div class="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Order Summary</span>
                <span id="checkout-item-count">1 Item</span>
              </div>
              <div id="checkout-items-preview" class="divide-y divide-gray-200/60 max-h-36 overflow-y-auto pr-1">
                <!-- Injected dynamically -->
              </div>
              <div class="pt-2 border-t border-gray-200 flex justify-between items-baseline font-bold">
                <span class="text-xs text-gray-700">Total Payable (All Taxes & Shipping Included)</span>
                <span id="checkout-total-val" class="text-xl font-display text-black">$0.00</span>
              </div>
            </div>

            <!-- Shipping Form -->
            <form id="checkout-form" class="space-y-4">
              <h4 class="text-xs font-black uppercase tracking-wider text-gray-900">1. Delivery Destination</h4>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-gray-600 mb-1">Full Name *</label>
                  <input type="text" id="chk-name" required placeholder="Alex Mercer" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-black">
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-gray-600 mb-1">Email Address *</label>
                  <input type="email" id="chk-email" required placeholder="alex@malziesofts.com" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-black">
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-gray-600 mb-1">Street Address *</label>
                <input type="text" id="chk-address" required placeholder="104 Skyline Boulevard, Suite 402" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-black">
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-gray-600 mb-1">City *</label>
                  <input type="text" id="chk-city" required placeholder="New York" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-black">
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-gray-600 mb-1">Postal Code *</label>
                  <input type="text" id="chk-zip" required placeholder="10001" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-black">
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-gray-600 mb-1">Country *</label>
                  <select id="chk-country" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-black">
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="JP">Japan</option>
                    <option value="IN">India</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </div>

              <!-- Payment Method Selector -->
              <h4 class="text-xs font-black uppercase tracking-wider text-gray-900 pt-3">2. Payment Method</h4>
              <div class="grid grid-cols-3 gap-2.5">
                <label class="payment-method-option cursor-pointer border-2 border-black bg-neutral-50 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all">
                  <input type="radio" name="paymethod" value="card" checked class="hidden">
                  <span class="text-base mb-1">💳</span>
                  <span class="text-[11px] font-bold text-gray-900">Credit Card</span>
                </label>
                <label class="payment-method-option cursor-pointer border-2 border-gray-200 bg-white rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all hover:border-gray-400">
                  <input type="radio" name="paymethod" value="apple" class="hidden">
                  <span class="text-base mb-1"></span>
                  <span class="text-[11px] font-bold text-gray-900">Apple Pay</span>
                </label>
                <label class="payment-method-option cursor-pointer border-2 border-gray-200 bg-white rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all hover:border-gray-400">
                  <input type="radio" name="paymethod" value="cod" class="hidden">
                  <span class="text-base mb-1">📦</span>
                  <span class="text-[11px] font-bold text-gray-900">Pay on Arrival</span>
                </label>
              </div>

              <!-- Card Fields (shown when credit card selected) -->
              <div id="card-fields" class="space-y-3 pt-2">
                <div>
                  <label class="block text-[11px] font-bold text-gray-600 mb-1">Card Number</label>
                  <input type="text" id="chk-cardnum" placeholder="4242 •••• •••• 4242" maxlength="19" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-black">
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] font-bold text-gray-600 mb-1">Exp Date</label>
                    <input type="text" id="chk-exp" placeholder="MM/YY" maxlength="5" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-black">
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-gray-600 mb-1">Security CVC</label>
                    <input type="password" id="chk-cvc" placeholder="CVC" maxlength="4" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-black">
                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="pt-4 border-t border-gray-100">
                <button type="submit" id="btn-confirm-order" class="w-full bg-black hover:bg-neutral-900 text-white font-extrabold py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.99]">
                  <span>Authorize & Place Order</span>
                  <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
              </div>
            </form>

            <!-- Success Confirmation Screen (Hidden initially) -->
            <div id="checkout-success" class="hidden text-center py-6 space-y-4">
              <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <i data-lucide="check" class="w-8 h-8 text-emerald-600"></i>
              </div>
              <h4 class="font-display font-bold text-2xl uppercase tracking-tight text-black">Order Confirmed!</h4>
              <p class="text-xs text-gray-600 max-w-sm mx-auto">
                Thank you for choosing Malzie Softs. Your athletic gear has been scheduled for priority nitrogen inspection and dispatch.
              </p>
              
              <div class="bg-gray-50 border border-gray-200 rounded-2xl p-4 max-w-sm mx-auto text-left space-y-2 text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-500 font-semibold">Order Reference:</span>
                  <span id="order-ref-num" class="font-mono font-bold text-black">#MS-2026-8914</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 font-semibold">Estimated Delivery:</span>
                  <span class="font-bold text-emerald-600">2-3 Business Days</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 font-semibold">Tracking Updates:</span>
                  <span class="font-bold text-gray-800">Sent via Email</span>
                </div>
              </div>

              <div class="pt-4 flex justify-center gap-3">
                <button id="btn-continue-shopping" class="bg-black hover:bg-neutral-800 text-white font-bold text-xs px-6 py-3 rounded-full transition-colors">
                  Continue Shopping
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Event listeners on checkout modal
    const closeBtn = document.getElementById('checkout-close-btn');
    const backdrop = document.getElementById('checkout-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeCheckout);
    if (backdrop) backdrop.addEventListener('click', closeCheckout);

    // Payment methods toggling
    document.querySelectorAll('.payment-method-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.payment-method-option').forEach((o) => {
          o.className = 'payment-method-option cursor-pointer border-2 border-gray-200 bg-white rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all hover:border-gray-400';
        });
        opt.className = 'payment-method-option cursor-pointer border-2 border-black bg-neutral-50 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all';
        const radio = opt.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          const cardFields = document.getElementById('card-fields');
          if (cardFields) {
            cardFields.style.display = radio.value === 'card' ? 'block' : 'none';
          }
        }
      });
    });

    // Form submission
    const form = document.getElementById('checkout-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        playSound('celebrate');

        const orderId = '#MS-' + Math.floor(100000 + Math.random() * 900000);
        const orderSummary = {
          orderId,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          items: [...cart],
          total: getTotal(),
          name: document.getElementById('chk-name').value,
          email: document.getElementById('chk-email').value,
          address: document.getElementById('chk-address').value
        };

        // Save order to history
        try {
          const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
          orders.unshift(orderSummary);
          localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        } catch (err) {}

        // Clear cart
        cart = [];
        saveCart(cart);
        updateCartUI();

        // Switch to success view
        form.classList.add('hidden');
        const successView = document.getElementById('checkout-success');
        const refEl = document.getElementById('order-ref-num');
        if (refEl) refEl.textContent = orderId;
        if (successView) successView.classList.remove('hidden');

        if (window.lucide) {
          window.lucide.createIcons();
        }

        showToast(`Order Confirmed! Ref: ${orderId}`);
      });
    }

    const contBtn = document.getElementById('btn-continue-shopping');
    if (contBtn) {
      contBtn.addEventListener('click', () => {
        closeCheckout();
      });
    }
  }

  function openCheckout() {
    if (cart.length === 0) {
      showToast('Your bag is empty! Add items first.', 'error');
      return;
    }
    createCheckoutModalIfNotExists();
    playSound('whoosh');

    // Populate order preview
    const countEl = document.getElementById('checkout-item-count');
    const previewContainer = document.getElementById('checkout-items-preview');
    const totalEl = document.getElementById('checkout-total-val');

    if (countEl) countEl.textContent = `${getTotalQuantity()} Items`;
    if (totalEl) totalEl.textContent = `$${getTotal().toFixed(2)}`;

    if (previewContainer) {
      previewContainer.innerHTML = cart
        .map(
          (i) => `
        <div class="flex items-center justify-between py-2 text-xs">
          <div class="flex items-center gap-2">
            <img src="${i.image}" class="w-8 h-8 rounded-lg object-contain bg-white border border-gray-200">
            <div>
              <p class="font-bold text-gray-900">${i.name}</p>
              <p class="text-[10px] text-gray-500">Size: ${i.size} × ${i.quantity}</p>
            </div>
          </div>
          <span class="font-bold text-gray-900">$${(i.price * i.quantity).toFixed(2)}</span>
        </div>
      `
        )
        .join('');
    }

    // Reset views in case of previous submission
    const form = document.getElementById('checkout-form');
    const successView = document.getElementById('checkout-success');
    if (form) form.classList.remove('hidden');
    if (successView) successView.classList.add('hidden');

    const modal = document.getElementById('checkout-modal');
    const backdrop = document.getElementById('checkout-backdrop');
    if (modal && backdrop) {
      backdrop.classList.remove('hidden');
      requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        modal.classList.remove('opacity-0', 'scale-95');
        modal.classList.add('opacity-100', 'scale-100');
        if (window.lucide) window.lucide.createIcons();
      });
    }
    closeCart();
  }

  function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    const backdrop = document.getElementById('checkout-backdrop');
    if (modal && backdrop) {
      modal.classList.remove('opacity-100', 'scale-100');
      modal.classList.add('opacity-0', 'scale-95');
      backdrop.classList.add('opacity-0');
      setTimeout(() => {
        backdrop.classList.add('hidden');
      }, 250);
    }
  }

  // --- Size Guide Modal ---
  function createSizeGuideModalIfNotExists() {
    if (document.getElementById('size-guide-modal')) return;

    const modalHtml = `
      <div id="size-guide-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden opacity-0 transition-opacity duration-300"></div>
      <div id="size-guide-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 opacity-0 scale-95 pointer-events-none transition-all duration-300">
        <div class="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col">
          <div class="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 class="font-display font-bold text-2xl text-black">Malzie Softs Size & Fit Guide</h3>
              <p class="text-xs text-gray-500">Biomechanical athlete dimensions</p>
            </div>
            <button id="size-guide-close-btn" class="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <div class="p-6 overflow-y-auto space-y-6">
            <div>
              <h4 class="text-xs font-black uppercase tracking-wider text-black mb-3">Footwear Conversion (US / UK / EU / CM)</h4>
              <div class="overflow-x-auto">
                <table class="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-50 text-gray-500 border-b border-gray-200">
                      <th class="p-2.5 font-bold">US Men</th>
                      <th class="p-2.5 font-bold">US Women</th>
                      <th class="p-2.5 font-bold">UK</th>
                      <th class="p-2.5 font-bold">EU</th>
                      <th class="p-2.5 font-bold">Foot (CM)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 font-semibold text-gray-800">
                    <tr><td class="p-2.5">7.5</td><td class="p-2.5">9.0</td><td class="p-2.5">6.5</td><td class="p-2.5">40.5</td><td class="p-2.5">25.5</td></tr>
                    <tr><td class="p-2.5">8.0</td><td class="p-2.5">9.5</td><td class="p-2.5">7.0</td><td class="p-2.5">41.0</td><td class="p-2.5">26.0</td></tr>
                    <tr><td class="p-2.5">8.5</td><td class="p-2.5">10.0</td><td class="p-2.5">7.5</td><td class="p-2.5">42.0</td><td class="p-2.5">26.5</td></tr>
                    <tr><td class="p-2.5">9.0</td><td class="p-2.5">10.5</td><td class="p-2.5">8.0</td><td class="p-2.5">42.5</td><td class="p-2.5">27.0</td></tr>
                    <tr><td class="p-2.5">9.5</td><td class="p-2.5">11.0</td><td class="p-2.5">8.5</td><td class="p-2.5">43.0</td><td class="p-2.5">27.5</td></tr>
                    <tr><td class="p-2.5">10.0</td><td class="p-2.5">11.5</td><td class="p-2.5">9.0</td><td class="p-2.5">44.0</td><td class="p-2.5">28.0</td></tr>
                    <tr><td class="p-2.5">10.5</td><td class="p-2.5">12.0</td><td class="p-2.5">9.5</td><td class="p-2.5">44.5</td><td class="p-2.5">28.5</td></tr>
                    <tr><td class="p-2.5">11.0</td><td class="p-2.5">12.5</td><td class="p-2.5">10.0</td><td class="p-2.5">45.0</td><td class="p-2.5">29.0</td></tr>
                    <tr><td class="p-2.5">12.0</td><td class="p-2.5">13.5</td><td class="p-2.5">11.0</td><td class="p-2.5">46.5</td><td class="p-2.5">30.0</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="pt-4 border-t border-gray-100">
              <h4 class="text-xs font-black uppercase tracking-wider text-black mb-3">Apparel & Shirts Sizing</h4>
              <div class="overflow-x-auto">
                <table class="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-50 text-gray-500 border-b border-gray-200">
                      <th class="p-2.5 font-bold">Size</th>
                      <th class="p-2.5 font-bold">Chest (Inches)</th>
                      <th class="p-2.5 font-bold">Length (Inches)</th>
                      <th class="p-2.5 font-bold">Fit Note</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 font-semibold text-gray-800">
                    <tr><td class="p-2.5">XS</td><td class="p-2.5">34 - 36"</td><td class="p-2.5">27.0"</td><td class="p-2.5">Streamlined snug</td></tr>
                    <tr><td class="p-2.5">S</td><td class="p-2.5">36 - 38"</td><td class="p-2.5">28.0"</td><td class="p-2.5">Athletic fitted</td></tr>
                    <tr><td class="p-2.5">M</td><td class="p-2.5">38 - 41"</td><td class="p-2.5">29.0"</td><td class="p-2.5">Standard athletic</td></tr>
                    <tr><td class="p-2.5">L</td><td class="p-2.5">41 - 44"</td><td class="p-2.5">30.0"</td><td class="p-2.5">Generous chest drape</td></tr>
                    <tr><td class="p-2.5">XL</td><td class="p-2.5">44 - 47"</td><td class="p-2.5">31.0"</td><td class="p-2.5">Relaxed streetwear</td></tr>
                    <tr><td class="p-2.5">XXL</td><td class="p-2.5">47 - 50"</td><td class="p-2.5">32.0"</td><td class="p-2.5">Oversized comfort</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="bg-gray-50 rounded-2xl p-4 text-xs text-gray-600 font-medium">
              💡 <strong class="text-black">Fit Recommendation:</strong> All Malzie Softs products run true to athletic international standards. If you are between sizes, we advise sizing up for casual lifestyle wear or staying true to size for locked-in running performance.
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const closeBtn = document.getElementById('size-guide-close-btn');
    const backdrop = document.getElementById('size-guide-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeSizeGuide);
    if (backdrop) backdrop.addEventListener('click', closeSizeGuide);
  }

  function openSizeGuide() {
    createSizeGuideModalIfNotExists();
    playSound('whoosh');
    const modal = document.getElementById('size-guide-modal');
    const backdrop = document.getElementById('size-guide-backdrop');
    if (modal && backdrop) {
      backdrop.classList.remove('hidden');
      requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        modal.classList.remove('opacity-0', 'scale-95');
        modal.classList.add('opacity-100', 'scale-100');
        if (window.lucide) window.lucide.createIcons();
      });
    }
  }

  function closeSizeGuide() {
    const modal = document.getElementById('size-guide-modal');
    const backdrop = document.getElementById('size-guide-backdrop');
    if (modal && backdrop) {
      modal.classList.remove('opacity-100', 'scale-100');
      modal.classList.add('opacity-0', 'scale-95');
      backdrop.classList.add('opacity-0');
      setTimeout(() => {
        backdrop.classList.add('hidden');
      }, 250);
    }
  }

  // --- Initialize Global Listeners & Elements ---
  function init() {
    updateCartUI();

    // Cross-tab synchronization
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        cart = getSavedCart();
        updateCartUI();
      }
    });

    // Cart trigger buttons
    document.querySelectorAll('#cart-btn, .cart-trigger-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openCart();
      });
    });

    const closeBtn = document.getElementById('cart-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeCart);

    const backdrop = document.getElementById('cart-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeCart);

    // Promo Code buttons
    const promoInput = document.getElementById('promo-code-input');
    const promoBtn = document.getElementById('apply-promo-btn');
    if (promoBtn && promoInput) {
      promoBtn.addEventListener('click', () => {
        applyPromo(promoInput.value);
      });
    }

    // Checkout buttons
    document.querySelectorAll('#checkout-btn, .btn-open-checkout').forEach((btn) => {
      btn.addEventListener('click', () => {
        openCheckout();
      });
    });

    // Sound toggle buttons
    document.querySelectorAll('#sound-toggle-btn, .sound-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        localStorage.setItem('aether_sound', soundEnabled ? 'true' : 'false');
        if (soundEnabled) {
          playSound('success');
          showToast('Sound Effects Enabled 🔊');
        } else {
          showToast('Sound Effects Muted 🔇');
        }
        document.querySelectorAll('#sound-icon-on').forEach((el) => {
          el.classList.toggle('hidden', !soundEnabled);
        });
        document.querySelectorAll('#sound-icon-off').forEach((el) => {
          el.classList.toggle('hidden', soundEnabled);
        });
      });
    });
  }

  // Expose API on window
  window.MalzieCommerce = {
    cart,
    addToBag,
    openCart,
    closeCart,
    updateCartUI,
    openCheckout,
    closeCheckout,
    openSizeGuide,
    closeSizeGuide,
    showToast,
    playSound,
    applyPromo
  };
  window.AetherCommerce = window.MalzieCommerce;

  document.addEventListener('DOMContentLoaded', init);
})();
