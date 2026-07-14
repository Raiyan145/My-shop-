/* ========================================================================
   RAYAN STORE — shared script.js
   Handles: page loader, sticky/mobile nav, scroll reveals, back-to-top,
   FAQ accordion, "Buy Now" product handoff, checkout calculation +
   validation, and the success page order recap.
   ======================================================================== */

/* ---------- Product catalogue (single source of truth) ---------- */
const RAYAN_PRODUCTS = {
  "relax-keychain": {
    name: "Relax Keychain",
    price: 350,
    image: "images/image1.jpg",
    desc: "Premium Relax Keychain."
  },
  "football-player-brooch": {
    name: "Football Player Brooch",
    price: 150,
    image: "images/image2.jpg",
    desc: "Premium Football Player Brooch."
  }
};
const DELIVERY_CHARGE = 110;

/* ---------- Page loader ---------- */
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    setTimeout(() => loader.classList.add("hidden"), 350);
  }
});

/* ---------- Mobile nav toggle ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("hamburger");
  const links = document.getElementById("navLinks");
  if (burger && links) {
    burger.addEventListener("click", () => {
      burger.classList.toggle("open");
      links.classList.toggle("open");
    });
    links.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        burger.classList.remove("open");
        links.classList.remove("open");
      });
    });
  }

  /* Highlight active nav link */
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(a => {
    const href = a.getAttribute("href");
    if (href === current || (current === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("visible"));
  }

  /* ---------- Back to top ---------- */
  const backBtn = document.getElementById("backToTop");
  if (backBtn) {
    window.addEventListener("scroll", () => {
      backBtn.classList.toggle("show", window.scrollY > 420);
    });
    backBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(item => {
    const q = item.querySelector(".faq-q");
    if (!q) return;
    q.addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(i => i.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
    });
  });

  /* ---------- Buy Now buttons (anywhere in the site) ---------- */
  document.querySelectorAll("[data-buy]").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-buy");
      if (RAYAN_PRODUCTS[key]) {
        localStorage.setItem("rayanSelectedProduct", key);
        window.location.href = "checkout.html";
      }
    });
  });

  /* ---------- Checkout page ---------- */
  if (document.getElementById("checkoutForm")) {
    initCheckout();
  }

  /* ---------- Success page ---------- */
  if (document.getElementById("orderRecap")) {
    initSuccessPage();
  }

  /* ---------- Contact form (front-end only, no backend) ---------- */
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Message sent! We'll get back to you soon.");
      contactForm.reset();
    });
  }
});

/* ---------- Toast helper ---------- */
function showToast(msg) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span class="dot"></span><span class="toast-text"></span>`;
    document.body.appendChild(toast);
  }
  toast.querySelector(".toast-text").textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* ---------- Checkout logic ---------- */
function initCheckout() {
  const form = document.getElementById("checkoutForm");
  const productSelect = document.getElementById("productSelect");
  const summaryItem = document.getElementById("summaryItem");
  const lineSubtotal = document.getElementById("lineSubtotal");
  const lineDelivery = document.getElementById("lineDelivery");
  const lineTotal = document.getElementById("lineTotal");
  const payCheckbox = document.getElementById("paymentConfirm");
  const submitBtn = document.getElementById("submitOrderBtn");

  lineDelivery.textContent = DELIVERY_CHARGE + " BDT";

  function keyFromSelect() {
    return productSelect ? productSelect.value : localStorage.getItem("rayanSelectedProduct");
  }

  function renderSummary() {
    const key = keyFromSelect();
    const product = RAYAN_PRODUCTS[key];
    if (!product) return;

    summaryItem.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div>
        <div class="si-name">${product.name}</div>
        <div class="si-price">${product.price} BDT</div>
      </div>
    `;
    lineSubtotal.textContent = product.price + " BDT";
    lineTotal.textContent = (product.price + DELIVERY_CHARGE) + " BDT";
  }

  // Pre-select product from localStorage (set by "Buy Now"), else default to first
  const savedKey = localStorage.getItem("rayanSelectedProduct");
  if (productSelect) {
    if (savedKey && RAYAN_PRODUCTS[savedKey]) {
      productSelect.value = savedKey;
    }
    productSelect.addEventListener("change", renderSummary);
  }
  renderSummary();

  function validateField(field, condition) {
    if (condition) {
      field.closest(".field").classList.remove("invalid");
      return true;
    } else {
      field.closest(".field").classList.add("invalid");
      return false;
    }
  }

  function updateSubmitState() {
    submitBtn.disabled = !payCheckbox.checked;
  }
  payCheckbox.addEventListener("change", updateSubmitState);
  updateSubmitState();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName");
    const mobile = document.getElementById("mobile");
    const address = document.getElementById("address");
    const district = document.getElementById("district");
    const area = document.getElementById("area");

    let valid = true;
    valid = validateField(fullName, fullName.value.trim().length > 1) && valid;
    valid = validateField(mobile, /^0\d{10}$/.test(mobile.value.trim())) && valid;
    valid = validateField(address, address.value.trim().length > 4) && valid;
    valid = validateField(district, district.value.trim().length > 1) && valid;
    valid = validateField(area, area.value.trim().length > 1) && valid;

    if (!payCheckbox.checked) {
      document.getElementById("paymentError").classList.add("show");
      valid = false;
    } else {
      document.getElementById("paymentError").classList.remove("show");
    }

    if (!valid) return;

    const key = keyFromSelect();
    const product = RAYAN_PRODUCTS[key];
    const orderRef = "RS-" + Date.now().toString().slice(-8);

    const order = {
      ref: orderRef,
      product: product.name,
      price: product.price,
      delivery: DELIVERY_CHARGE,
      total: product.price + DELIVERY_CHARGE,
      fullName: fullName.value.trim(),
      mobile: mobile.value.trim(),
      address: address.value.trim(),
      district: district.value.trim(),
      area: area.value.trim(),
      notes: document.getElementById("notes").value.trim()
    };
    localStorage.setItem("rayanLastOrder", JSON.stringify(order));
    window.location.href = "success.html";
  });
}

/* ---------- Success page recap ---------- */
function initSuccessPage() {
  const recap = document.getElementById("orderRecap");
  const raw = localStorage.getItem("rayanLastOrder");
  if (!raw) {
    recap.style.display = "none";
    return;
  }
  const order = JSON.parse(raw);
  recap.innerHTML = `
    Order Reference: <strong>${order.ref}</strong><br>
    ${order.product} · Total Paid: <strong>${order.total} BDT</strong>
  `;
}
