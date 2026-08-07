(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Scroll reveal
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  // Contact form → FormSubmit → swordsgod@staff.1111.com.tw
  const form = document.getElementById("contact-form");
  const success = document.getElementById("contact-success");
  const errorEl = document.getElementById("contact-error");
  const submitBtn = document.getElementById("contact-submit");

  if (form) {
    const requiredFields = form.querySelectorAll("[required]");
    const endpoint = form.getAttribute("action");

    const clearInvalid = () => {
      requiredFields.forEach((el) => el.classList.remove("is-invalid"));
      if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = "";
      }
    };

    const showError = (message) => {
      if (!errorEl) return;
      errorEl.hidden = false;
      errorEl.textContent = message;
    };

    const setLoading = (loading) => {
      if (!submitBtn) return;
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? "送出中…" : "送出表單";
    };

    requiredFields.forEach((el) => {
      el.addEventListener("input", () => el.classList.remove("is-invalid"));
      el.addEventListener("change", () => el.classList.remove("is-invalid"));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearInvalid();

      let firstInvalid = null;
      requiredFields.forEach((el) => {
        if (!el.value.trim()) {
          el.classList.add("is-invalid");
          if (!firstInvalid) firstInvalid = el;
        }
      });

      const email = form.querySelector("#email");
      if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        email.classList.add("is-invalid");
        if (!firstInvalid) firstInvalid = email;
        showError("請輸入有效的聯絡信箱");
        firstInvalid.focus();
        return;
      }

      const phone = form.querySelector("#phone");
      if (phone && phone.value.trim() && !/^[\d\s+\-()]{8,}$/.test(phone.value.trim())) {
        phone.classList.add("is-invalid");
        if (!firstInvalid) firstInvalid = phone;
        showError("請輸入有效的電話號碼");
        firstInvalid.focus();
        return;
      }

      if (firstInvalid) {
        showError("請完整填寫必填欄位");
        firstInvalid.focus();
        return;
      }

      const honey = form.querySelector("[name='_honey']");
      if (honey && honey.value) return;

      const payload = Object.fromEntries(new FormData(form).entries());
      delete payload._honey;
      payload._replyto = email.value.trim();
      payload._captcha = "false";

      setLoading(true);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("submit failed");

        form.classList.add("is-hidden");
        if (success) {
          success.hidden = false;
          success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        }
      } catch (_) {
        showError("送出失敗，請稍後再試，或直接來電 02-8787-1111");
        setLoading(false);
      }
    });
  }

  // Stat count-up
  const nums = document.querySelectorAll("[data-count]");
  if (!nums.length) return;

  const animateCount = (el) => {
    const target = Number(el.getAttribute("data-count")) || 0;
    if (reduceMotion) {
      el.textContent = target.toLocaleString("en-US");
      return;
    }

    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-US");
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const countIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    nums.forEach((el) => countIo.observe(el));
  } else {
    nums.forEach(animateCount);
  }
})();
