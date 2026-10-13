// AETHER Footwear - Next-Gen Ecommerce Interactive Logic
(function () {
  'use strict';

  // --- Sound FX Engine (Web Audio API) ---
  let audioCtx = null;
  let soundEnabled = true;

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

  function playUiSound(type = 'click') {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'whoosh') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.12);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  // --- Shoe Colorway Models ---
  const shoeModels = [
    {
      id: 'excee',
      slug: 'white',
      name: 'AETHER AERO EXCEE',
      badge: 'Bestseller // Pure Ice',
      tagline: 'Feel the future. Move with pure zero-gravity Air.',
      price: '$159.00',
      priceInr: '₹12,995',
      image: 'assets/images/shoe-white.jpg',
      watermark: 'AERO EXCEE',
      glowClass: 'theme-glow-white',
      accentColor: '#121316',
      colorName: 'Pure Ice / Triple White',
      description: 'Ultralight nitrogen-charged air cushion capsule with seamless hyper-weave knit. Unrivaled purity and cloud-soft rebound.'
    },
    {
      id: '270',
      slug: 'red',
      name: 'AETHER AERO 270',
      badge: 'High Velocity // Crimson Blaze',
      tagline: 'High-octane scarlet energy. Ignite every stride.',
      price: '$179.00',
      priceInr: '₹14,995',
      image: 'assets/images/shoe-red.jpg',
      watermark: 'AERO 270',
      glowClass: 'theme-glow-red',
      accentColor: '#ff3b30',
      colorName: 'Crimson Blaze / Deep Scarlet',
      description: 'Engineered with an enlarged 270° heel air reservoir and high-durability thermal welds for maximum athletic torque.'
    },
    {
      id: 'alpha',
      slug: 'black',
      name: 'AETHER AERO ALPHA',
      badge: 'Matte Carbon // Stealth Onyx',
      tagline: 'Nocturnal engineering. Surgical control & carbon stability.',
      price: '$149.00',
      priceInr: '₹11,995',
      image: 'assets/images/shoe-black.jpg',
      watermark: 'AERO ALPHA',
      glowClass: 'theme-glow-black',
      accentColor: '#1e2026',
      colorName: 'Stealth Onyx / Triple Black',
      description: 'Precision carbon-fiber side matrix panels and stealth aerodynamic chassis. Designed for athletes operating in high gear.'
    },
    {
      id: 'pulse',
      slug: 'cyan',
      name: 'AETHER AERO PULSE',
      badge: 'Cyber Luminescent // Electric Cyan',
      tagline: 'Step directly into 2030 with luminescent gas chambers.',
      price: '$169.00',
      priceInr: '₹13,995',
      image: 'assets/images/shoe-cyan.jpg',
      watermark: 'AERO PULSE',
      glowClass: 'theme-glow-cyan',
      accentColor: '#00c3ff',
      colorName: 'Electric Cyan / Charcoal Grey',
      description: 'Luminescent nitrogen gas pods with biometric traction lugs for wet/dry micro-traction and instant street presence.'
    }
  ];

  let currentShoeIndex = 0; // Default to white / pure ice (index 0)

  // --- Catalog Database for Ecommerce Browsing (Synchronized from products-data.js) ---
  const catalogProducts = window.AETHER_PRODUCTS || [
    {
      id: 'prod-1',
      name: 'AETHER Aero Excee Pure',
      type: 'Footwear',
      category: 'Footwear',
      price: 159,
      priceStr: '$159.00',
      image: 'assets/images/shoe-white.jpg',
      color: 'Triple White',
      rating: 4.9,
      badge: 'Hot'
    }
  ];

  // --- Cart State ---
  let cart = [
    {
      id: 'prod-1',
      name: 'AETHER Aero Excee Pure',
      size: 'US 10',
      price: 159,
      image: 'assets/images/shoe-white.jpg',
      quantity: 1
    }
  ];
  let discountPercent = 0;

  // --- DOM Elements ---
  document.addEventListener('DOMContentLoaded', () => {
    // Hero Elements
    const heroSection = document.getElementById('hero-section');
    const heroShoeImg = document.getElementById('hero-shoe-image');
    const heroShoeShadow = document.getElementById('hero-shoe-shadow');
    const heroWatermark = document.getElementById('hero-watermark');
    const heroTitle = document.getElementById('hero-title');
    const heroTagline = document.getElementById('hero-tagline');
    const heroPrice = document.getElementById('hero-price');
    const heroPriceInr = document.getElementById('hero-price-inr');
    const heroBadge = document.getElementById('hero-badge');
    const heroAura = document.getElementById('hero-aura');
    const tiltContainer = document.getElementById('hero-tilt-container');

    // Colorway Thumbnails
    const variantCards = document.querySelectorAll('.variant-card');
    const btnPrevVariant = document.getElementById('btn-prev-variant');
    const btnNextVariant = document.getElementById('btn-next-variant');

    // Cart Drawer Elements
    const cartBtn = document.getElementById('cart-btn');
    const cartCloseBtn = document.getElementById('cart-close-btn');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartBackdrop = document.getElementById('cart-backdrop');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartCountBadge = document.getElementById('cart-count-badge');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartDiscountEl = document.getElementById('cart-discount');
    const cartTotalEl = document.getElementById('cart-total');
    const promoCodeInput = document.getElementById('promo-code-input');
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    const promoFeedback = document.getElementById('promo-feedback');

    // Auth Modal Elements
    const authBtn = document.getElementById('auth-btn');
    const authModal = document.getElementById('auth-modal');
    const authBackdrop = document.getElementById('auth-backdrop');
    const authCloseBtn = document.getElementById('auth-close-btn');
    const tabSignIn = document.getElementById('tab-sign-in');
    const tabSignUp = document.getElementById('tab-sign-up');
    const formSignIn = document.getElementById('form-sign-in');
    const formSignUp = document.getElementById('form-sign-up');

    // Search Modal Elements
    const searchBtn = document.getElementById('search-btn');
    const searchModal = document.getElementById('search-modal');
    const searchBackdrop = document.getElementById('search-backdrop');
    const searchCloseBtn = document.getElementById('search-close-btn');
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');

    // Sound Toggle
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    const soundIconOn = document.getElementById('sound-icon-on');
    const soundIconOff = document.getElementById('sound-icon-off');

    // Toast Container
    const toastContainer = document.getElementById('toast-container');

    // Mobile Menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    // Hotspots
    const hotspotBtns = document.querySelectorAll('.hotspot-btn');
    const hotspotTooltip = document.getElementById('hotspot-tooltip');
    const hotspotTitle = document.getElementById('hotspot-title');
    const hotspotDesc = document.getElementById('hotspot-desc');

    // Catalog Rendering
    const catalogContainer = document.getElementById('catalog-products-container');
    const catalogFilters = document.querySelectorAll('.catalog-filter-btn');

    // Quick View Modal
    const quickViewModal = document.getElementById('quick-view-modal');
    const quickViewBackdrop = document.getElementById('quick-view-backdrop');
    const quickViewCloseBtn = document.getElementById('quick-view-close-btn');
    let quickViewActiveProduct = null;
    let selectedSize = 'US 9.5';

    // ----------------------------------------------------
    // 1. UPDATE HERO SHOE DISPLAY
    // ----------------------------------------------------
    function updateHeroShoe(index, animate = true) {
      if (index < 0) index = shoeModels.length - 1;
      if (index >= shoeModels.length) index = 0;
      currentShoeIndex = index;

      const model = shoeModels[index];

      // Update variant cards state
      variantCards.forEach((card, idx) => {
        const isCurrent = idx === index;
        const checkBadge = card.querySelector('.active-check');
        if (isCurrent) {
          card.classList.add('border-black', 'bg-white', 'shadow-xl', 'scale-[1.03]');
          card.classList.remove('border-transparent', 'bg-white/60');
          if (checkBadge) checkBadge.classList.remove('hidden');
        } else {
          card.classList.remove('border-black', 'bg-white', 'shadow-xl', 'scale-[1.03]');
          card.classList.add('border-transparent', 'bg-white/60');
          if (checkBadge) checkBadge.classList.add('hidden');
        }
      });

      // Update Watermark & Titles with smooth burst
      if (animate && heroShoeImg) {
        heroShoeImg.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease';
        heroShoeImg.style.transform = 'scale(0.88) rotate(-4deg)';
        heroShoeImg.style.opacity = '0.3';

        if (heroWatermark) {
          heroWatermark.style.opacity = '0';
          heroWatermark.style.transform = 'translateY(15px) scale(0.96)';
        }

        setTimeout(() => {
          heroShoeImg.src = model.image;
          heroShoeImg.alt = model.name;

          if (heroTitle) heroTitle.innerHTML = `AETHER<br><span class="text-neutral-800">${model.name.replace('AETHER ', '')}</span>`;
          if (heroTagline) heroTagline.textContent = model.tagline;
          if (heroPrice) heroPrice.textContent = model.price;
          if (heroPriceInr) heroPriceInr.textContent = model.priceInr;
          if (heroBadge) heroBadge.textContent = model.badge;
          if (heroWatermark) {
            heroWatermark.textContent = model.watermark;
            heroWatermark.style.opacity = '1';
            heroWatermark.style.transform = 'translateY(0) scale(1)';
          }

          // Update aura glow class
          if (heroAura) {
            heroAura.className = 'absolute inset-0 pointer-events-none transition-all duration-700 ' + model.glowClass;
          }

          heroShoeImg.style.transform = 'scale(1) rotate(0deg)';
          heroShoeImg.style.opacity = '1';
        }, 180);
      } else {
        if (heroShoeImg) {
          heroShoeImg.src = model.image;
          heroShoeImg.alt = model.name;
        }
        if (heroTitle) heroTitle.innerHTML = `AETHER<br><span class="text-neutral-800">${model.name.replace('AETHER ', '')}</span>`;
        if (heroTagline) heroTagline.textContent = model.tagline;
        if (heroPrice) heroPrice.textContent = model.price;
        if (heroPriceInr) heroPriceInr.textContent = model.priceInr;
        if (heroBadge) heroBadge.textContent = model.badge;
        if (heroWatermark) heroWatermark.textContent = model.watermark;
      }
    }

    // Attach click events on variant cards
    variantCards.forEach((card) => {
      card.addEventListener('click', () => {
        initAudio();
        playUiSound('whoosh');
        const index = parseInt(card.getAttribute('data-index'), 10);
        updateHeroShoe(index, true);
      });
    });

    if (btnPrevVariant) {
      btnPrevVariant.addEventListener('click', () => {
        initAudio();
        playUiSound('click');
        updateHeroShoe(currentShoeIndex - 1, true);
      });
    }

    if (btnNextVariant) {
      btnNextVariant.addEventListener('click', () => {
        initAudio();
        playUiSound('click');
        updateHeroShoe(currentShoeIndex + 1, true);
      });
    }

    // ----------------------------------------------------
    // 2. 3D INTERACTIVE MOUSE PARALLAX TILT
    // ----------------------------------------------------
    if (heroSection && tiltContainer) {
      let isHovered = false;

      heroSection.addEventListener('mouseenter', () => {
        isHovered = true;
      });

      heroSection.addEventListener('mousemove', (e) => {
        if (!isHovered) return;
        const rect = heroSection.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        const rotateX = -y * 18; // Max 9 deg
        const rotateY = x * 22;  // Max 11 deg
        const translateZ = 35;   // 3D pop

        tiltContainer.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;

        // Inversely shift shadow
        if (heroShoeShadow) {
          heroShoeShadow.style.transform = `scale(${1 - Math.abs(y) * 0.2}) translateX(${x * -35}px) translateY(${y * -15}px)`;
        }

        // Parallax watermark text
        if (heroWatermark) {
          heroWatermark.style.transform = `translate3d(${x * -40}px, ${y * -30}px, 0)`;
        }
      });

      heroSection.addEventListener('mouseleave', () => {
        isHovered = false;
        tiltContainer.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        tiltContainer.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        if (heroShoeShadow) {
          heroShoeShadow.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
          heroShoeShadow.style.transform = 'scale(1) translateX(0px) translateY(0px)';
        }
        if (heroWatermark) {
          heroWatermark.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
          heroWatermark.style.transform = 'translate3d(0, 0, 0)';
        }

        setTimeout(() => {
          tiltContainer.style.transition = '';
          if (heroShoeShadow) heroShoeShadow.style.transition = '';
          if (heroWatermark) heroWatermark.style.transition = '';
        }, 600);
      });
    }

    // ----------------------------------------------------
    // 3. INTERACTIVE FEATURE HOTSPOTS
    // ----------------------------------------------------
    const hotspotData = {
      'heel': {
        title: '360° Aero-Nitrogen Capsule',
        desc: 'Hermetically sealed nitrogen cushion absorbs 92% of ground shock with explosive rebound propulsion.'
      },
      'upper': {
        title: 'Matrix Ultra-Weave Upper',
        desc: 'Engineered from 100% recycled polymers for breathable thermal dissipation and featherlight sock-like fit.'
      },
      'sole': {
        title: 'Kinetic Biomimetic Outsole',
        desc: 'Hexagonal micro-lug geometry delivers unmatched grip across dry pavement, wet asphalt, and track surfaces.'
      }
    };

    hotspotBtns.forEach((btn) => {
      btn.addEventListener('mouseenter', (e) => {
        const spot = btn.getAttribute('data-spot');
        const data = hotspotData[spot];
        if (data && hotspotTooltip && hotspotTitle && hotspotDesc) {
          hotspotTitle.textContent = data.title;
          hotspotDesc.textContent = data.desc;
          hotspotTooltip.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
          hotspotTooltip.classList.add('opacity-100', 'scale-100');
        }
      });

      btn.addEventListener('mouseleave', () => {
        if (hotspotTooltip) {
          hotspotTooltip.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
          hotspotTooltip.classList.remove('opacity-100', 'scale-100');
        }
      });
    });

    // ----------------------------------------------------
    // 4. TOAST NOTIFICATIONS
    // ----------------------------------------------------
    function showToast(message, type = 'success') {
      if (!toastContainer) return;
      const toast = document.createElement('div');
      toast.className = `flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold transition-all duration-300 transform translate-y-4 opacity-0 ${
        type === 'success' ? 'bg-gray-900 text-white border border-gray-700' : 'bg-red-600 text-white'
      }`;
      toast.innerHTML = `
        <svg class="w-5 h-5 ${type === 'success' ? 'text-emerald-400' : 'text-white'} flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
        </svg>
        <span>${message}</span>
      `;
      toastContainer.appendChild(toast);

      // Animate in
      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
      });

      // Remove after 3.2s
      setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-2');
        setTimeout(() => toast.remove(), 350);
      }, 3200);
    }

    // ----------------------------------------------------
    // 5. CART DRAWER & LOGIC
    // ----------------------------------------------------
    function updateCartUI() {
      // Calculate totals
      let totalQty = 0;
      let subtotal = 0;

      cart.forEach((item) => {
        totalQty += item.quantity;
        subtotal += item.price * item.quantity;
      });

      const discount = subtotal * (discountPercent / 100);
      const total = Math.max(0, subtotal - discount);

      // Update badge
      if (cartCountBadge) {
        cartCountBadge.textContent = totalQty;
        cartCountBadge.classList.toggle('hidden', totalQty === 0);
      }

      // Update prices
      if (cartSubtotalEl) cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
      if (cartDiscountEl) cartDiscountEl.textContent = `-$${discount.toFixed(2)}`;
      if (cartTotalEl) cartTotalEl.textContent = `$${total.toFixed(2)}`;

      // Render items
      if (cartItemsContainer) {
        if (cart.length === 0) {
          cartItemsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-center px-4">
              <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
              </div>
              <p class="text-base font-bold text-gray-900 mb-1">Your Bag is Empty</p>
              <p class="text-xs text-gray-500 max-w-xs">Explore the Aether collection and elevate your stride today.</p>
            </div>
          `;
          return;
        }

        cartItemsContainer.innerHTML = cart
          .map(
            (item, index) => `
          <div class="flex items-center gap-4 py-4 border-b border-gray-100 group">
            <div class="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain blend-shoe group-hover:scale-105 transition-transform duration-300">
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-bold text-gray-900 truncate">${item.name}</h4>
              <p class="text-xs text-gray-500 font-medium">Size: ${item.size}</p>
              <p class="text-sm font-black text-gray-900 mt-1">$${item.price.toFixed(2)}</p>
              <div class="flex items-center gap-2 mt-2">
                <button data-action="decrease" data-index="${index}" class="cart-qty-btn w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold transition-colors">-</button>
                <span class="text-xs font-bold text-gray-900 w-4 text-center">${item.quantity}</span>
                <button data-action="increase" data-index="${index}" class="cart-qty-btn w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold transition-colors">+</button>
              </div>
            </div>
            <button data-action="remove" data-index="${index}" class="cart-remove-btn text-gray-400 hover:text-red-500 p-2 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        `
          )
          .join('');

        // Attach listeners to quantity and remove buttons
        cartItemsContainer.querySelectorAll('.cart-qty-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            initAudio();
            playUiSound('click');
            const action = btn.getAttribute('data-action');
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            if (action === 'increase') {
              cart[idx].quantity += 1;
            } else if (action === 'decrease') {
              if (cart[idx].quantity > 1) {
                cart[idx].quantity -= 1;
              } else {
                cart.splice(idx, 1);
              }
            }
            updateCartUI();
          });
        });

        cartItemsContainer.querySelectorAll('.cart-remove-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            initAudio();
            playUiSound('click');
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            cart.splice(idx, 1);
            updateCartUI();
            showToast('Item removed from bag');
          });
        });
      }
    }

    function openCart() {
      initAudio();
      playUiSound('whoosh');
      updateCartUI();
      if (cartDrawer && cartBackdrop) {
        cartBackdrop.classList.remove('hidden');
        requestAnimationFrame(() => {
          cartBackdrop.classList.remove('opacity-0');
          cartDrawer.classList.remove('translate-x-full');
        });
      }
    }

    function closeCart() {
      if (cartDrawer && cartBackdrop) {
        cartDrawer.classList.add('translate-x-full');
        cartBackdrop.classList.add('opacity-0');
        setTimeout(() => {
          cartBackdrop.classList.add('hidden');
        }, 300);
      }
    }

    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
    if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

    // Apply Promo Code
    if (applyPromoBtn && promoCodeInput && promoFeedback) {
      applyPromoBtn.addEventListener('click', () => {
        initAudio();
        const code = promoCodeInput.value.trim().toUpperCase();
        if (code === 'FUTURE20' || code === 'AETHER20') {
          discountPercent = 20;
          playUiSound('success');
          promoFeedback.className = 'text-xs text-emerald-600 font-bold block mt-1.5';
          promoFeedback.textContent = '🎉 20% discount code applied!';
          updateCartUI();
          showToast('20% Future Code Applied!');
        } else if (code === '') {
          promoFeedback.className = 'text-xs text-amber-600 font-semibold block mt-1.5';
          promoFeedback.textContent = 'Please enter a voucher code.';
        } else {
          discountPercent = 0;
          playUiSound('click');
          promoFeedback.className = 'text-xs text-red-500 font-semibold block mt-1.5';
          promoFeedback.textContent = 'Invalid promo code. Try "FUTURE20".';
          updateCartUI();
        }
      });
    }

    // Checkout Button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
          showToast('Your bag is empty! Add a shoe first.', 'error');
          return;
        }
        initAudio();
        playUiSound('success');
        showToast('Initiating Secure Checkout...');
        setTimeout(() => {
          openAuthModal();
        }, 800);
      });
    }

    // ----------------------------------------------------
    // 6. ADD TO BAG FUNCTIONALITY
    // ----------------------------------------------------
    function addToBag(item) {
      if (window.AetherCommerce && window.AetherCommerce.addToBag) {
        window.AetherCommerce.addToBag(item);
      } else {
        showToast(`Added ${item.name} (${item.size || 'US 10'}) to bag!`);
      }
    }

    // Hero "Shop Now" & "Add to Bag"
    const heroShopNowBtn = document.getElementById('hero-shop-now-btn');
    const heroAddToBagBtn = document.getElementById('hero-add-to-bag-btn');

    if (heroShopNowBtn) {
      heroShopNowBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const model = shoeModels[currentShoeIndex];
        addToBag({
          id: model.id,
          name: model.name,
          size: 'US 10',
          price: parseFloat(model.price.replace('$', '')),
          image: model.image,
          type: 'Footwear'
        });
      });
    }

    if (heroAddToBagBtn) {
      heroAddToBagBtn.addEventListener('click', () => {
        const model = shoeModels[currentShoeIndex];
        addToBag({
          id: model.id,
          name: model.name,
          size: 'US 10',
          price: parseFloat(model.price.replace('$', '')),
          image: model.image,
          type: 'Footwear'
        });
      });
    }

    // ----------------------------------------------------
    // 7. CATALOG PRODUCTS RENDERING & FILTERING
    // ----------------------------------------------------
    function renderCatalog(filterCategory = 'All') {
      if (!catalogContainer) return;
      const allProducts = window.AETHER_PRODUCTS || catalogProducts;
      let filtered = allProducts;
      if (filterCategory !== 'All') {
        filtered = allProducts.filter((p) =>
          (p.type && p.type.toLowerCase() === filterCategory.toLowerCase()) ||
          (p.category && p.category.toLowerCase() === filterCategory.toLowerCase())
        );
      }

      catalogContainer.innerHTML = filtered
        .map(
          (product) => `
        <div class="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between">
          <div class="block">
            <div class="relative bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl p-4 h-60 flex items-center justify-center overflow-hidden">
              <span class="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-gray-900 px-2.5 py-1 rounded-full shadow-sm">
                ${product.badge}
              </span>
              <span class="absolute top-3 right-3 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                ${product.type || 'Product'}
              </span>
              <a href="product-detail.html?id=${product.id}" class="w-full h-full flex items-center justify-center">
                <img src="${product.image}" alt="${product.name}" class="w-full h-full object-contain blend-shoe group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
              </a>
              <!-- Quick View Floating Action -->
              <button data-id="${product.id}" class="quick-view-btn absolute bottom-3 right-3 bg-white/95 hover:bg-black hover:text-white text-gray-800 p-2.5 rounded-xl shadow-md transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0" title="Quick Preview">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
            <div class="mt-4">
              <div class="flex items-center justify-between text-xs text-gray-400 font-semibold mb-1">
                <span>${product.type}</span>
                <span class="flex items-center text-amber-500 font-bold">
                  ★ ${product.rating}
                </span>
              </div>
              <a href="product-detail.html?id=${product.id}">
                <h3 class="text-base font-extrabold text-gray-900 hover:text-red-500 transition-colors leading-snug">${product.name}</h3>
              </a>
              <p class="text-xs text-gray-500 mt-0.5">${product.color}</p>
            </div>
          </div>
          <!-- Bottom Action Buttons: Quick Bag + View Specs -->
          <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
            <button data-id="${product.id}" class="catalog-add-btn flex-1 bg-gray-100 hover:bg-gray-200 text-black text-xs font-bold py-2.5 px-3 rounded-full transition-colors flex items-center justify-center gap-1" title="Quick Add">
              <span>+ Bag</span>
            </button>
            <a href="product-detail.html?id=${product.id}" class="flex-1 bg-black hover:bg-neutral-800 text-white text-xs font-bold py-2.5 px-3 rounded-full transition-all text-center group-hover:scale-102 shadow-sm">
              <span>View Specs</span>
            </a>
          </div>
        </div>
      `
        )
        .join('');

      // Attach add-to-bag handlers
      catalogContainer.querySelectorAll('.catalog-add-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const p = (window.AETHER_PRODUCTS || catalogProducts).find((item) => item.id === id);
          if (p) {
            addToBag({
              id: p.id,
              name: p.name,
              size: p.sizes ? p.sizes[0] : (p.type === 'Shirts' ? 'M' : 'US 10'),
              price: p.price,
              image: p.image,
              type: p.type
            });
          }
        });
      });

      // Attach quick view handlers
      catalogContainer.querySelectorAll('.quick-view-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const p = (window.AETHER_PRODUCTS || catalogProducts).find((item) => item.id === id);
          if (p) openQuickView(p);
        });
      });
    }

    // Filter Buttons
    catalogFilters.forEach((btn) => {
      btn.addEventListener('click', () => {
        initAudio();
        playUiSound('click');
        catalogFilters.forEach((b) => {
          b.classList.remove('bg-black', 'text-white');
          b.classList.add('bg-white', 'text-gray-700', 'border-gray-200');
        });
        btn.classList.add('bg-black', 'text-white');
        btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-200');
        const cat = btn.getAttribute('data-category');
        renderCatalog(cat);
      });
    });

    // ----------------------------------------------------
    // 8. QUICK VIEW MODAL
    // ----------------------------------------------------
    function openQuickView(product) {
      initAudio();
      playUiSound('whoosh');
      quickViewActiveProduct = product;
      selectedSize = product.sizes ? product.sizes[0] : (product.type === 'Shirts' ? 'M' : 'US 10');

      const qImg = document.getElementById('qv-image');
      const qTitle = document.getElementById('qv-title');
      const qCategory = document.getElementById('qv-category');
      const qPrice = document.getElementById('qv-price');
      const qDesc = document.getElementById('qv-desc');
      const qSizeLabel = document.getElementById('qv-size-label');
      const qDetailLink = document.getElementById('qv-view-detail-link');
      const qSizesContainer = document.getElementById('qv-sizes-container');

      if (qImg) qImg.src = product.image;
      if (qTitle) qTitle.textContent = product.name;
      if (qCategory) qCategory.textContent = `${product.type} // ${product.color}`;
      if (qPrice) qPrice.textContent = product.priceStr || `$${product.price}.00`;
      if (qDesc) qDesc.textContent = product.description || `High-performance athletic gear featuring precision engineering.`;
      if (qSizeLabel) qSizeLabel.textContent = product.type === 'Shirts' ? 'Select Apparel Size' : 'Select Footwear Size (US)';
      if (qDetailLink) qDetailLink.href = `product-detail.html?id=${product.id}`;

      // Populate dynamic sizes
      if (qSizesContainer) {
        const sizesList = product.sizes || (product.type === 'Shirts' ? ['XS', 'S', 'M', 'L', 'XL'] : ['US 8', 'US 9', 'US 10', 'US 11']);
        qSizesContainer.innerHTML = sizesList
          .map(
            (s, idx) => `
          <button data-size="${s}" class="size-select-btn border py-2 rounded-xl text-xs font-bold transition-all ${
            idx === 0 ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-800 hover:border-black'
          }">${s}</button>
        `
          )
          .join('');

        qSizesContainer.querySelectorAll('.size-select-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            initAudio();
            playUiSound('click');
            qSizesContainer.querySelectorAll('.size-select-btn').forEach((b) => {
              b.className = 'size-select-btn border border-gray-200 bg-white text-gray-800 hover:border-black py-2 rounded-xl text-xs font-bold transition-all';
            });
            btn.className = 'size-select-btn border border-black bg-black text-white py-2 rounded-xl text-xs font-bold transition-all';
            selectedSize = btn.getAttribute('data-size');
          });
        });
      }

      if (quickViewModal && quickViewBackdrop) {
        quickViewBackdrop.classList.remove('hidden');
        requestAnimationFrame(() => {
          quickViewBackdrop.classList.remove('opacity-0');
          quickViewModal.classList.remove('opacity-0', 'scale-95');
          quickViewModal.classList.add('opacity-100', 'scale-100');
        });
      }
    }

    function closeQuickView() {
      if (quickViewModal && quickViewBackdrop) {
        quickViewModal.classList.remove('opacity-100', 'scale-100');
        quickViewModal.classList.add('opacity-0', 'scale-95');
        quickViewBackdrop.classList.add('opacity-0');
        setTimeout(() => {
          quickViewBackdrop.classList.add('hidden');
        }, 250);
      }
    }

    if (quickViewCloseBtn) quickViewCloseBtn.addEventListener('click', closeQuickView);
    if (quickViewBackdrop) quickViewBackdrop.addEventListener('click', closeQuickView);

    const qvAddBagBtn = document.getElementById('qv-add-bag-btn');
    if (qvAddBagBtn) {
      qvAddBagBtn.addEventListener('click', () => {
        if (quickViewActiveProduct) {
          addToBag({
            id: quickViewActiveProduct.id,
            name: quickViewActiveProduct.name,
            size: selectedSize,
            price: quickViewActiveProduct.price,
            image: quickViewActiveProduct.image,
            type: quickViewActiveProduct.type
          });
          closeQuickView();
        }
      });
    }

    // ----------------------------------------------------
    // 9. AUTH MODAL & USER SESSION
    // ----------------------------------------------------
    function openAuthModal(defaultTab = 'signin') {
      initAudio();
      playUiSound('whoosh');
      if (authModal && authBackdrop) {
        authBackdrop.classList.remove('hidden');
        requestAnimationFrame(() => {
          authBackdrop.classList.remove('opacity-0');
          authModal.classList.remove('opacity-0', 'scale-95');
          authModal.classList.add('opacity-100', 'scale-100');
        });
      }
      switchAuthTab(defaultTab);
    }

    function closeAuthModal() {
      if (authModal && authBackdrop) {
        authModal.classList.remove('opacity-100', 'scale-100');
        authModal.classList.add('opacity-0', 'scale-95');
        authBackdrop.classList.add('opacity-0');
        setTimeout(() => {
          authBackdrop.classList.add('hidden');
        }, 250);
      }
    }

    function switchAuthTab(tab) {
      if (tab === 'signin') {
        tabSignIn.classList.add('border-black', 'text-black', 'font-black');
        tabSignIn.classList.remove('border-transparent', 'text-gray-400');
        tabSignUp.classList.remove('border-black', 'text-black', 'font-black');
        tabSignUp.classList.add('border-transparent', 'text-gray-400');
        formSignIn.classList.remove('hidden');
        formSignUp.classList.add('hidden');
      } else {
        tabSignUp.classList.add('border-black', 'text-black', 'font-black');
        tabSignUp.classList.remove('border-transparent', 'text-gray-400');
        tabSignIn.classList.remove('border-black', 'text-black', 'font-black');
        tabSignIn.classList.add('border-transparent', 'text-gray-400');
        formSignUp.classList.remove('hidden');
        formSignIn.classList.add('hidden');
      }
    }

    function initUserSession() {
      const savedUserStr = localStorage.getItem('aether_current_user');
      const authAvatar = document.getElementById('auth-avatar');
      const authIconOut = document.getElementById('auth-icon-logged-out');
      const userDropdown = document.getElementById('user-menu-dropdown');
      const displayName = document.getElementById('user-display-name');
      const displayEmail = document.getElementById('user-display-email');
      const signOutBtn = document.getElementById('btn-sign-out');
      const viewOrdersBtn = document.getElementById('btn-view-orders');

      if (savedUserStr) {
        try {
          const user = JSON.parse(savedUserStr);
          if (authAvatar && authIconOut) {
            authIconOut.classList.add('hidden');
            authAvatar.classList.remove('hidden');
            authAvatar.classList.add('flex');
            const initials = user.name
              ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              : 'AM';
            authAvatar.textContent = initials;
          }
          if (displayName) displayName.textContent = user.name || 'Alex Mercer';
          if (displayEmail) displayEmail.textContent = user.email || 'alex@aetherlabs.com';
        } catch (e) {}
      } else {
        if (authAvatar && authIconOut) {
          authAvatar.classList.add('hidden');
          authAvatar.classList.remove('flex');
          authIconOut.classList.remove('hidden');
        }
      }

      if (authBtn) {
        authBtn.onclick = (e) => {
          e.stopPropagation();
          const currentUser = localStorage.getItem('aether_current_user');
          if (currentUser && userDropdown) {
            userDropdown.classList.toggle('hidden');
          } else {
            openAuthModal('signin');
          }
        };
      }

      document.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.contains(e.target) && !authBtn.contains(e.target)) {
          userDropdown.classList.add('hidden');
        }
      });

      if (signOutBtn) {
        signOutBtn.onclick = () => {
          localStorage.removeItem('aether_current_user');
          if (userDropdown) userDropdown.classList.add('hidden');
          showToast('Signed out successfully');
          initUserSession();
        };
      }

      if (viewOrdersBtn) {
        viewOrdersBtn.onclick = () => {
          if (userDropdown) userDropdown.classList.add('hidden');
          showOrderHistoryModal();
        };
      }
    }

    function showOrderHistoryModal() {
      let orders = [];
      try {
        orders = JSON.parse(localStorage.getItem('aether_placed_orders') || '[]');
      } catch (e) {}

      let historyModal = document.getElementById('orders-history-modal');
      if (!historyModal) {
        const modalHtml = `
          <div id="orders-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden opacity-0 transition-opacity duration-300"></div>
          <div id="orders-history-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 opacity-0 scale-95 pointer-events-none transition-all duration-300">
            <div class="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto max-h-[85vh] flex flex-col">
              <div class="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 class="font-display font-bold text-xl text-black">Order Dispatch History</h3>
                  <p class="text-xs text-gray-500">Track shipments & laboratory receipts</p>
                </div>
                <button id="orders-close-btn" class="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div id="orders-list-body" class="p-6 overflow-y-auto divide-y divide-gray-100 space-y-4">
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('orders-close-btn').onclick = closeOrderHistoryModal;
        document.getElementById('orders-backdrop').onclick = closeOrderHistoryModal;
      }

      const listBody = document.getElementById('orders-list-body');
      if (orders.length === 0) {
        listBody.innerHTML = `
          <div class="text-center py-10 text-gray-400 space-y-2">
            <p class="text-base font-bold text-gray-700">No past orders yet</p>
            <p class="text-xs text-gray-500">Your recent gear purchases will appear here with live tracking.</p>
          </div>
        `;
      } else {
        listBody.innerHTML = orders
          .map(
            (o) => `
          <div class="pt-4 first:pt-0 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-mono font-bold text-black">${o.orderId}</span>
              <span class="text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">In Transit</span>
            </div>
            <p class="text-[11px] text-gray-500">Placed on ${o.date} • Total: $${o.total.toFixed(2)}</p>
            <div class="space-y-1 pt-1">
              ${(o.items || [])
                .map(
                  (it) => `
                <div class="flex items-center justify-between text-xs text-gray-700">
                  <span>${it.name} (${it.size}) × ${it.quantity}</span>
                  <span class="font-bold">$${(it.price * it.quantity).toFixed(2)}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
          )
          .join('');
      }

      const modal = document.getElementById('orders-history-modal');
      const backdrop = document.getElementById('orders-backdrop');
      backdrop.classList.remove('hidden');
      requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        modal.classList.remove('opacity-0', 'scale-95');
        modal.classList.add('opacity-100', 'scale-100');
      });
    }

    function closeOrderHistoryModal() {
      const modal = document.getElementById('orders-history-modal');
      const backdrop = document.getElementById('orders-backdrop');
      if (modal && backdrop) {
        modal.classList.remove('opacity-100', 'scale-100');
        modal.classList.add('opacity-0', 'scale-95');
        backdrop.classList.add('opacity-0');
        setTimeout(() => {
          backdrop.classList.add('hidden');
        }, 250);
      }
    }

    if (authCloseBtn) authCloseBtn.addEventListener('click', closeAuthModal);
    if (authBackdrop) authBackdrop.addEventListener('click', closeAuthModal);

    if (tabSignIn) tabSignIn.addEventListener('click', () => { initAudio(); playUiSound('click'); switchAuthTab('signin'); });
    if (tabSignUp) tabSignUp.addEventListener('click', () => { initAudio(); playUiSound('click'); switchAuthTab('signup'); });

    // Mock Login & Sign Up
    if (formSignIn) {
      formSignIn.addEventListener('submit', (e) => {
        e.preventDefault();
        initAudio();
        playUiSound('success');
        const email = formSignIn.querySelector('input[type="email"]').value;
        const name = email.split('@')[0].replace('.', ' ');
        const capName = name.charAt(0).toUpperCase() + name.slice(1);
        localStorage.setItem('aether_current_user', JSON.stringify({ name: capName, email: email }));
        initUserSession();
        showToast(`Welcome back, ${capName}!`);
        closeAuthModal();
      });
    }

    if (formSignUp) {
      formSignUp.addEventListener('submit', (e) => {
        e.preventDefault();
        initAudio();
        playUiSound('success');
        const name = formSignUp.querySelector('input[placeholder="Alex Mercer"]').value;
        const email = formSignUp.querySelector('input[type="email"]').value;
        localStorage.setItem('aether_current_user', JSON.stringify({ name: name, email: email }));
        initUserSession();
        showToast('Account created successfully! Welcome to Aether.');
        closeAuthModal();
      });
    }

    // ----------------------------------------------------
    // 10. SEARCH MODAL
    // ----------------------------------------------------
    function openSearchModal() {
      initAudio();
      playUiSound('whoosh');
      if (searchModal && searchBackdrop) {
        searchBackdrop.classList.remove('hidden');
        requestAnimationFrame(() => {
          searchBackdrop.classList.remove('opacity-0');
          searchModal.classList.remove('opacity-0', 'scale-95');
          searchModal.classList.add('opacity-100', 'scale-100');
          if (searchInput) searchInput.focus();
        });
      }
      renderSearchResults('');
    }

    function closeSearchModal() {
      if (searchModal && searchBackdrop) {
        searchModal.classList.remove('opacity-100', 'scale-100');
        searchModal.classList.add('opacity-0', 'scale-95');
        searchBackdrop.classList.add('opacity-0');
        setTimeout(() => {
          searchBackdrop.classList.add('hidden');
        }, 250);
      }
    }

    function renderSearchResults(query) {
      if (!searchResultsContainer) return;
      const allProducts = window.AETHER_PRODUCTS || catalogProducts;
      const q = query.trim().toLowerCase();
      const results = q === ''
        ? allProducts.slice(0, 5)
        : allProducts.filter((p) =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.type.toLowerCase().includes(q) ||
            p.color.toLowerCase().includes(q)
          );

      if (results.length === 0) {
        searchResultsContainer.innerHTML = `
          <div class="py-8 text-center text-gray-400">
            <p class="font-semibold text-sm">No items matching "${query}"</p>
            <p class="text-xs mt-1 text-gray-500">Try searching for "Aero", "Pulse", "Shirt", or "Excee"</p>
          </div>
        `;
        return;
      }

      searchResultsContainer.innerHTML = results
        .map(
          (p) => `
        <div data-id="${p.id}" class="search-result-item flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gray-100 p-1 flex-shrink-0 flex items-center justify-center">
              <img src="${p.image}" alt="${p.name}" class="w-full h-full object-contain blend-shoe">
            </div>
            <div>
              <h5 class="text-sm font-bold text-gray-900">${p.name}</h5>
              <p class="text-xs text-gray-500">${p.type} • ${p.color}</p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-sm font-black text-gray-900">${p.priceStr || '$' + p.price}</span>
          </div>
        </div>
      `
        )
        .join('');

      searchResultsContainer.querySelectorAll('.search-result-item').forEach((item) => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id');
          const p = (window.AETHER_PRODUCTS || catalogProducts).find((i) => i.id === id);
          if (p) {
            closeSearchModal();
            openQuickView(p);
          }
        });
      });
    }

    if (searchBtn) searchBtn.addEventListener('click', openSearchModal);
    if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearchModal);
    if (searchBackdrop) searchBackdrop.addEventListener('click', closeSearchModal);

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderSearchResults(e.target.value);
      });
    }

    // Keyboard shortcut (Ctrl+K or Command+K or /)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearchModal();
      } else if (e.key === 'Escape') {
        if (window.AetherCommerce) window.AetherCommerce.closeCart();
        closeAuthModal();
        closeSearchModal();
        closeQuickView();
        closeOrderHistoryModal();
      }
    });

    // ----------------------------------------------------
    // 11. MOBILE MENU TOGGLE
    // ----------------------------------------------------
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        initAudio();
        playUiSound('click');
        mobileMenu.classList.toggle('hidden');
      });
    }

    // ----------------------------------------------------
    // INITIALIZATION
    // ----------------------------------------------------
    updateHeroShoe(0, false);
    renderCatalog('All');
    initUserSession();
    if (window.AetherCommerce) {
      window.AetherCommerce.updateCartUI();
    }
  });
})();

