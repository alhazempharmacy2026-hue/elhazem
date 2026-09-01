/* ==========================================================================
   El Hazem Beauty — theme scripts
   No dependencies. All interactive pieces are custom elements so that
   sections re-rendered by the Section Rendering API rewire themselves.
   ========================================================================== */

(function () {
  'use strict';

  const routes = window.themeRoutes || {};
  const strings = window.themeStrings || {};
  const moneyFormat = window.themeMoneyFormat || '{{amount}} EGP';

  /* ---------------- helpers ---------------- */

  function formatMoney(cents) {
    const value = (cents / 100).toLocaleString(document.documentElement.lang || 'ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return moneyFormat.replace(/\{\{\s*amount[^}]*\}\}/, value);
  }

  function t(key, replacements) {
    let value = key.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), strings);
    if (typeof value !== 'string') return '';
    if (replacements) {
      Object.keys(replacements).forEach((k) => {
        value = value.replace(new RegExp('\\{\\{\\s*' + k + '\\s*\\}\\}', 'g'), replacements[k]);
      });
    }
    return value;
  }

  function fetchJSON(url, options) {
    return fetch(url, options).then((res) => res.json());
  }

  const trapStack = [];

  function trapFocus(container) {
    const selector = 'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
    function onKeydown(event) {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(container.querySelectorAll(selector)).filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    container.addEventListener('keydown', onKeydown);
    trapStack.push({ container, onKeydown });
  }

  function releaseFocus() {
    const entry = trapStack.pop();
    if (entry) entry.container.removeEventListener('keydown', entry.onKeydown);
  }

  /* ---------------- toast ---------------- */

  let toastEl = null;
  let toastTimer = null;

  function toast(message) {
    if (!message) return;
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add('is-open');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-open'), 2600);
  }

  /* ---------------- overlay + drawers ---------------- */

  function getOverlay() {
    let overlay = document.querySelector('.overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', () => {
        const open = document.querySelector('.drawer.is-open');
        if (open && open.close) open.close();
      });
    }
    return overlay;
  }

  class ThemeDrawer extends HTMLElement {
    connectedCallback() {
      this.opener = null;
      this.addEventListener('click', (event) => {
        if (event.target.closest('[data-drawer-close]')) this.close();
      });
      document.addEventListener('keydown', this.onKeydown = (event) => {
        if (event.key === 'Escape' && this.classList.contains('is-open')) this.close();
      });
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this.onKeydown);
    }

    open(opener) {
      this.opener = opener || document.activeElement;
      getOverlay().classList.add('is-open');
      this.classList.add('is-open');
      this.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      trapFocus(this);
      const focusTarget = this.querySelector('[data-drawer-focus], [data-drawer-close]');
      if (focusTarget) setTimeout(() => focusTarget.focus(), 60);
    }

    close() {
      getOverlay().classList.remove('is-open');
      this.classList.remove('is-open');
      this.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      releaseFocus();
      if (this.opener && this.opener.focus) this.opener.focus();
    }
  }
  customElements.define('theme-drawer', ThemeDrawer);

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-drawer-open]');
    if (!opener) return;
    const target = document.getElementById(opener.getAttribute('data-drawer-open'));
    if (!target) return;
    event.preventDefault();
    target.open(opener);
  });

  /* ---------------- cart ---------------- */

  const cart = {
    subscribers: [],

    onChange(fn) {
      this.subscribers.push(fn);
    },

    publish(state) {
      this.subscribers.forEach((fn) => fn(state));
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: state }));
    },

    async refreshSections() {
      const ids = [];
      document.querySelectorAll("[data-cart-section-id]").forEach((el) => {
        const id = el.getAttribute("data-cart-section-id");
        if (id && ids.indexOf(id) === -1) ids.push(id);
      });
      if (!ids.length) return;
      const url = `${routes.root || '/'}?sections=${ids.join(',')}`;
      try {
        const sections = await fetchJSON(url);
        ids.forEach((id) => {
          if (!sections[id]) return;
          const source = new DOMParser()
            .parseFromString(sections[id], 'text/html')
            .querySelector(`[data-cart-section-id="${id}"]`);
          const target = document.querySelector(`[data-cart-section-id="${id}"]`);
          if (source && target) target.innerHTML = source.innerHTML;
        });
      } catch (error) {
        console.error('[theme] section refresh failed', error);
      }
    },

    async add(formData) {
      const response = await fetch(`${routes.cart_add || '/cart/add'}.js`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw data;
      const state = await fetchJSON(`${routes.cart || '/cart'}.js`);
      await this.refreshSections();
      this.publish(state);
      return data;
    },

    async change(payload) {
      const state = await fetchJSON(`${routes.cart_change || '/cart/change'}.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      await this.refreshSections();
      this.publish(state);
      return state;
    }
  };

  window.themeCart = cart;

  cart.onChange((state) => {
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = state.item_count;
      el.hidden = state.item_count === 0;
    });
    document.querySelectorAll('[data-cart-total]').forEach((el) => {
      el.textContent = formatMoney(state.total_price);
    });
  });

  class CartItems extends HTMLElement {
    connectedCallback() {
      this.addEventListener('click', (event) => {
        const remove = event.target.closest('[data-cart-remove]');
        if (remove) {
          event.preventDefault();
          this.update(remove.getAttribute('data-line'), 0);
        }
      });

      this.addEventListener('quantity:change', (event) => {
        const input = event.target;
        this.update(input.getAttribute('data-line'), event.detail.value);
      });
    }

    async update(line, quantity) {
      this.classList.add('is-loading');
      try {
        await cart.change({ line: Number(line), quantity: Number(quantity) });
      } catch (error) {
        console.error('[theme] cart update failed', error);
      } finally {
        this.classList.remove('is-loading');
      }
    }
  }
  customElements.define('cart-items', CartItems);

  /* ---------------- quantity input ---------------- */

  class QuantityInput extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('input');
      if (!this.input) return;
      this.querySelectorAll('button').forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          const step = button.getAttribute('data-step') === 'down' ? -1 : 1;
          const min = Number(this.input.min || 1);
          const max = this.input.max ? Number(this.input.max) : Infinity;
          const next = Math.min(max, Math.max(min, Number(this.input.value || min) + step));
          if (next === Number(this.input.value)) return;
          this.input.value = next;
          this.emit(next);
        });
      });
      this.input.addEventListener('change', () => {
        const min = Number(this.input.min || 1);
        let value = Number(this.input.value);
        if (!Number.isFinite(value) || value < min) value = min;
        this.input.value = value;
        this.emit(value);
      });
    }

    emit(value) {
      this.input.dispatchEvent(
        new CustomEvent('quantity:change', { bubbles: true, detail: { value } })
      );
    }
  }
  customElements.define('quantity-input', QuantityInput);

  /* ---------------- product form ---------------- */

  class ProductForm extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      if (!this.form) return;
      this.button = this.querySelector('[type="submit"]');
      this.errorEl = this.querySelector('[data-form-error]');
      this.form.addEventListener('submit', this.onSubmit.bind(this));
    }

    async onSubmit(event) {
      event.preventDefault();
      if (!this.button || this.button.hasAttribute('disabled')) return;
      const label = this.button.innerHTML;
      this.button.setAttribute('disabled', '');
      this.button.innerHTML = '<span class="spinner"></span>';
      if (this.errorEl) this.errorEl.hidden = true;

      try {
        await cart.add(new FormData(this.form));
        const drawer = document.getElementById('cart-drawer-panel');
        if (drawer && drawer.open) {
          drawer.open(this.button);
        } else {
          toast(t('products.product.added'));
        }
      } catch (error) {
        const message = (error && (error.description || error.message)) || '';
        if (this.errorEl && message) {
          this.errorEl.textContent = message;
          this.errorEl.hidden = false;
        } else {
          toast(message);
        }
      } finally {
        this.button.removeAttribute('disabled');
        this.button.innerHTML = label;
      }
    }
  }
  customElements.define('product-form', ProductForm);

  /* ---------------- variant picker ---------------- */

  class VariantPicker extends HTMLElement {
    connectedCallback() {
      const data = this.querySelector('[type="application/json"]');
      this.variants = data ? JSON.parse(data.textContent) : [];
      this.sectionId = this.getAttribute("data-cart-section-id");
      this.productUrl = this.getAttribute('data-url');
      this.addEventListener('change', this.onChange.bind(this));
    }

    get selectedOptions() {
      return Array.from(this.querySelectorAll('input[type="radio"]:checked, select')).map(
        (el) => el.value
      );
    }

    onChange() {
      const selected = this.selectedOptions;
      const variant = this.variants.find((v) =>
        v.options.every((option, index) => option === selected[index])
      );
      this.markUnavailable(selected);
      this.updateUI(variant);
      document.dispatchEvent(new CustomEvent('variant:change', { detail: { variant } }));
    }

    markUnavailable(selected) {
      const groups = Array.from(this.querySelectorAll('[data-option-index]'));
      groups.forEach((group) => {
        const index = Number(group.getAttribute('data-option-index'));
        group.querySelectorAll('.option__value').forEach((label) => {
          const input = label.querySelector('input');
          if (!input) return;
          const candidate = selected.slice();
          candidate[index] = input.value;
          const match = this.variants.find((v) =>
            v.options.every((option, i) => (i === index || i > index ? true : option === candidate[i])) &&
            v.options[index] === input.value
          );
          label.classList.toggle('option__value--unavailable', !(match && match.available));
        });
      });
    }

    updateUI(variant) {
      const idInput = this.closest('[data-product-root]')?.querySelector('[data-variant-id]');
      if (idInput) idInput.value = variant ? variant.id : '';

      const button = this.closest('[data-product-root]')?.querySelector('[data-add-button]');
      if (button) {
        const available = variant && variant.available;
        button.toggleAttribute('disabled', !available);
        const text = button.querySelector('[data-add-text]') || button;
        text.textContent = !variant
          ? t('products.product.unavailable')
          : available
          ? t('products.product.add_to_cart')
          : t('products.product.sold_out');
      }

      if (variant && this.productUrl && window.history.replaceState) {
        const url = new URL(this.productUrl, window.location.origin);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }

      if (variant) this.refreshSection(variant);
    }

    async refreshSection(variant) {
      if (!this.sectionId || !this.productUrl) return;
      try {
        const url = `${this.productUrl}?variant=${variant.id}&section_id=${this.sectionId}`;
        const html = await fetch(url).then((res) => res.text());
        const doc = new DOMParser().parseFromString(html, 'text/html');
        ['[data-price-block]', '[data-stock-block]', '[data-sku-block]'].forEach((selector) => {
          const source = doc.querySelector(selector);
          const target = document.querySelector(selector);
          if (source && target) target.innerHTML = source.innerHTML;
        });
        const gallery = document.querySelector('media-gallery');
        if (gallery && variant.featured_media) gallery.selectByMediaId(variant.featured_media.id);
      } catch (error) {
        console.error('[theme] variant section refresh failed', error);
      }
    }
  }
  customElements.define('variant-picker', VariantPicker);

  /* ---------------- media gallery ---------------- */

  class MediaGallery extends HTMLElement {
    connectedCallback() {
      this.main = this.querySelector('[data-gallery-main]');
      this.thumbs = Array.from(this.querySelectorAll('[data-gallery-thumb]'));
      this.thumbs.forEach((thumb) => {
        thumb.addEventListener('click', () => this.select(thumb));
      });
    }

    select(thumb) {
      if (!this.main) return;
      const img = this.main.querySelector('img');
      if (img) {
        img.src = thumb.getAttribute('data-src');
        img.srcset = thumb.getAttribute('data-srcset') || '';
        img.alt = thumb.getAttribute('data-alt') || '';
      }
      this.thumbs.forEach((el) => el.setAttribute('aria-current', String(el === thumb)));
    }

    selectByMediaId(mediaId) {
      const thumb = this.thumbs.find((el) => el.getAttribute('data-media-id') === String(mediaId));
      if (thumb) this.select(thumb);
    }
  }
  customElements.define('media-gallery', MediaGallery);

  /* ---------------- sticky add to cart ---------------- */

  class StickyAtc extends HTMLElement {
    connectedCallback() {
      const anchor = document.querySelector('[data-atc-anchor]');
      if (!anchor || !('IntersectionObserver' in window)) return;
      document.body.classList.add('has-sticky-atc');
      const observer = new IntersectionObserver(
        ([entry]) => this.classList.toggle('is-visible', !entry.isIntersecting && entry.boundingClientRect.top < 0),
        { threshold: 0 }
      );
      observer.observe(anchor);

      this.querySelector('[data-sticky-add]')?.addEventListener('click', () => {
        const form = document.querySelector('product-form form');
        if (form) form.requestSubmit();
      });
    }
  }
  customElements.define('sticky-atc', StickyAtc);

  /* ---------------- slideshow ---------------- */

  class HeroSlideshow extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-slides]');
      this.slides = Array.from(this.querySelectorAll('[data-slide]'));
      this.dots = Array.from(this.querySelectorAll('[data-dot]'));
      this.index = 0;
      if (this.slides.length < 2) return;

      this.dots.forEach((dot, i) => dot.addEventListener('click', () => this.goTo(i, true)));

      const interval = Number(this.getAttribute('data-autoplay') || 0);
      if (interval > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.timer = setInterval(() => this.goTo(this.index + 1), interval * 1000);
        this.addEventListener('mouseenter', () => clearInterval(this.timer));
      }

      let startX = null;
      this.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
      this.addEventListener('touchend', (e) => {
        if (startX === null) return;
        const delta = e.changedTouches[0].clientX - startX;
        if (Math.abs(delta) > 45) {
          const rtl = document.documentElement.dir === 'rtl';
          const forward = rtl ? delta > 0 : delta < 0;
          this.goTo(this.index + (forward ? 1 : -1), true);
        }
        startX = null;
      });
    }

    disconnectedCallback() {
      clearInterval(this.timer);
    }

    goTo(index, stop) {
      if (stop) clearInterval(this.timer);
      this.index = (index + this.slides.length) % this.slides.length;
      const rtl = document.documentElement.dir === 'rtl';
      const offset = this.index * 100 * (rtl ? 1 : -1);
      this.track.style.transform = `translateX(${offset}%)`;
      this.dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === this.index)));
      this.slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== this.index)));
    }
  }
  customElements.define('hero-slideshow', HeroSlideshow);

  /* ---------------- announcement rotator ---------------- */

  class AnnouncementBar extends HTMLElement {
    connectedCallback() {
      this.items = Array.from(this.querySelectorAll('[data-announcement]'));
      if (this.items.length < 2) return;
      const interval = Number(this.getAttribute('data-interval') || 5) * 1000;
      let index = 0;
      this.timer = setInterval(() => {
        this.items[index].hidden = true;
        index = (index + 1) % this.items.length;
        this.items[index].hidden = false;
      }, interval);
    }

    disconnectedCallback() {
      clearInterval(this.timer);
    }
  }
  customElements.define('announcement-bar', AnnouncementBar);

  /* ---------------- countdown ---------------- */

  class CountdownTimer extends HTMLElement {
    connectedCallback() {
      const target = new Date(this.getAttribute('data-deadline')).getTime();
      if (!Number.isFinite(target)) return;
      this.units = {
        days: this.querySelector('[data-unit="days"]'),
        hours: this.querySelector('[data-unit="hours"]'),
        minutes: this.querySelector('[data-unit="minutes"]'),
        seconds: this.querySelector('[data-unit="seconds"]')
      };
      const tick = () => {
        let diff = Math.max(0, target - Date.now());
        const days = Math.floor(diff / 86400000); diff -= days * 86400000;
        const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
        const minutes = Math.floor(diff / 60000); diff -= minutes * 60000;
        const seconds = Math.floor(diff / 1000);
        const pad = (n) => String(n).padStart(2, '0');
        if (this.units.days) this.units.days.textContent = pad(days);
        if (this.units.hours) this.units.hours.textContent = pad(hours);
        if (this.units.minutes) this.units.minutes.textContent = pad(minutes);
        if (this.units.seconds) this.units.seconds.textContent = pad(seconds);
        if (target - Date.now() <= 0) {
          clearInterval(this.timer);
          this.closest('[data-countdown-section]')?.setAttribute('hidden', '');
        }
      };
      tick();
      this.timer = setInterval(tick, 1000);
    }

    disconnectedCallback() {
      clearInterval(this.timer);
    }
  }
  customElements.define('countdown-timer', CountdownTimer);

  /* ---------------- product recommendations ---------------- */

  class ProductRecommendations extends HTMLElement {
    connectedCallback() {
      const url = this.getAttribute('data-url');
      if (!url || this.dataset.loaded) return;
      const load = () => {
        this.dataset.loaded = 'true';
        fetch(url)
          .then((res) => res.text())
          .then((html) => {
            const fresh = new DOMParser()
              .parseFromString(html, 'text/html')
              .querySelector('product-recommendations');
            if (fresh && fresh.innerHTML.trim()) this.innerHTML = fresh.innerHTML;
          })
          .catch((error) => console.error('[theme] recommendations failed', error));
      };

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              observer.disconnect();
              load();
            }
          },
          { rootMargin: '400px' }
        );
        observer.observe(this);
      } else {
        load();
      }
    }
  }
  customElements.define('product-recommendations', ProductRecommendations);

  /* ---------------- facets responsive panel ---------------- */

  class FacetsPanel extends HTMLElement {
    connectedCallback() {
      this.details = this.querySelector('details');
      if (!this.details) return;
      this.query = window.matchMedia('(min-width: 990px)');
      this.sync = () => { if (this.query.matches) this.details.open = true; };
      this.sync();
      this.query.addEventListener('change', this.sync);
    }

    disconnectedCallback() {
      if (this.query) this.query.removeEventListener('change', this.sync);
    }
  }
  customElements.define('facets-panel', FacetsPanel);

  /* ---------------- quick add ---------------- */

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-quick-add]');
    if (!button) return;
    event.preventDefault();
    const variantId = button.getAttribute('data-quick-add');
    if (!variantId) return;
    const label = button.innerHTML;
    button.classList.add('is-loading');
    button.innerHTML = '<span class="spinner"></span>';
    try {
      const formData = new FormData();
      formData.append('id', variantId);
      formData.append('quantity', '1');
      await cart.add(formData);
      const drawer = document.getElementById('cart-drawer-panel');
      if (drawer && drawer.open) drawer.open(button);
      else toast(t('products.product.added'));
    } catch (error) {
      toast((error && error.description) || '');
    } finally {
      button.classList.remove('is-loading');
      button.innerHTML = label;
    }
  });

  /* ---------------- share ---------------- */

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-share]');
    if (!button) return;
    const url = button.getAttribute('data-share') || window.location.href;
    if (navigator.share) {
      try { await navigator.share({ url, title: document.title }); } catch (e) { /* dismissed */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toast(t('general.share.copied'));
    }
  });

  /* ---------------- collection sort ---------------- */

  document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-sort-by]');
    if (!select) return;
    const url = new URL(window.location.href);
    url.searchParams.set('sort_by', select.value);
    url.searchParams.delete('page');
    window.location.assign(url.toString());
  });

  /* ---------------- expose ---------------- */

  window.theme = { formatMoney, toast, t };
})();
