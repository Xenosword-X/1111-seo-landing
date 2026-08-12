(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Scroll reveal → Animate.css
  const reveals = document.querySelectorAll(".reveal");

  const playReveal = (el) => {
    const name = el.getAttribute("data-animate") || "fadeInUp";
    const delay = el.getAttribute("data-delay");
    const duration = el.getAttribute("data-duration") || "0.6s";
    const animClass = `animate__${name}`;

    if (delay) el.style.setProperty("--animate-delay", delay);
    el.style.setProperty("--animate-duration", duration);

    el.classList.add("is-visible", "animate__animated", animClass);

    const cleanup = (event) => {
      if (event.target !== el) return;
      el.classList.remove("animate__animated", animClass);
      el.removeEventListener("animationend", cleanup);
    };
    el.addEventListener("animationend", cleanup);
  };

  if (reduceMotion) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playReveal(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach(playReveal);
  }

  // FAQ accordion (single-open, all closed by default)
  const accordion = document.querySelector("[data-accordion]");
  if (accordion) {
    const items = Array.from(accordion.querySelectorAll(".faq__item"));

    const setOpen = (item, open) => {
      const btn = item.querySelector(".faq__btn");
      const panel = item.querySelector(".faq__panel");
      if (!btn || !panel) return;

      const isOpen = item.classList.contains("is-open");
      if (open === isOpen) return;

      btn.setAttribute("aria-expanded", open ? "true" : "false");

      if (open) {
        panel.hidden = false;
        if (reduceMotion) {
          item.classList.add("is-open");
          return;
        }
        requestAnimationFrame(() => {
          item.classList.add("is-open");
        });
      } else {
        item.classList.remove("is-open");
        if (reduceMotion) {
          panel.hidden = true;
          return;
        }
        const onEnd = (event) => {
          if (event.target !== panel) return;
          if (!item.classList.contains("is-open")) panel.hidden = true;
          panel.removeEventListener("transitionend", onEnd);
        };
        panel.addEventListener("transitionend", onEnd);
        window.setTimeout(() => {
          if (!item.classList.contains("is-open")) panel.hidden = true;
          panel.removeEventListener("transitionend", onEnd);
        }, 320);
      }
    };

    items.forEach((item) => {
      const btn = item.querySelector(".faq__btn");
      if (!btn) return;

      btn.addEventListener("click", () => {
        const willOpen = !item.classList.contains("is-open");
        items.forEach((other) => {
          if (other !== item) setOpen(other, false);
        });
        setOpen(item, willOpen);
      });
    });
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

  const animateCount = (el) => {
    const target = Number(el.getAttribute("data-count")) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    const format = (n) => Math.round(n).toLocaleString("en-US") + suffix;

    if (reduceMotion) {
      el.textContent = format(target);
      return;
    }

    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = format(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = format(target);
    };

    requestAnimationFrame(tick);
  };

  if (nums.length) {
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
        { threshold: 0.35 }
      );
      nums.forEach((el) => countIo.observe(el));
    } else {
      nums.forEach(animateCount);
    }
  }

  // Sticky page-nav offset for anchors + scroll spy (keep in sync with --anchor-offset)
  const isMobilePageNav = () => window.matchMedia("(max-width: 900px)").matches;

  const getAnchorOffset = () => {
    // Mobile: section nav is fixed to the bottom, so only a small top clearance is needed.
    if (isMobilePageNav()) return 12;
    const nav = document.querySelector(".page-nav");
    const navH = nav ? nav.getBoundingClientRect().height : 64;
    // Extra buffer so section titles clear the sticky bar cleanly
    return navH + 24;
  };

  const scrollToAnchorId = (id, behavior = "auto") => {
    const el = document.getElementById(id);
    if (!el) return false;
    const top = Math.max(0, window.scrollY + el.getBoundingClientRect().top - getAnchorOffset());
    window.scrollTo({ top, behavior });
    return true;
  };

  const getHashIdFromHref = (href) => {
    if (!href || href === "#") return "";
    try {
      const url = new URL(href, window.location.href);
      if (url.pathname !== window.location.pathname) return "";
      if (url.search !== window.location.search) return "";
      if (!url.hash || url.hash.length < 2) return "";
      return decodeURIComponent(url.hash.slice(1));
    } catch {
      return "";
    }
  };

  // Cross-page / new-tab hash jumps can miss sticky-nav clearance; correct after layout.
  const fixHashAnchor = () => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const id = decodeURIComponent(hash.slice(1));
    scrollToAnchorId(id, "auto");
  };

  if (window.location.hash) {
    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    fixHashAnchor();
    requestAnimationFrame(fixHashAnchor);
    window.addEventListener(
      "load",
      () => {
        fixHashAnchor();
        window.setTimeout(() => {
          fixHashAnchor();
          html.style.scrollBehavior = prevBehavior;
        }, 80);
      },
      { once: true }
    );
  }

  // Intercept all same-page hash links (hero CTA, buttons, page-nav, etc.)
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = getHashIdFromHref(link.getAttribute("href"));
    if (!id || !document.getElementById(id)) return;
    event.preventDefault();
    history.pushState(null, "", `#${id}`);
    scrollToAnchorId(id, reduceMotion ? "auto" : "smooth");
  });

  // Page section nav: scroll spy active state
  const sectionNav = document.querySelector(".page-nav__sections");
  if (sectionNav) {
    const links = Array.from(sectionNav.querySelectorAll('a[href^="#"]'));
    const items = links
      .map((link) => {
        const id = decodeURIComponent(link.getAttribute("href").slice(1));
        const section = document.getElementById(id);
        return section ? { link, section } : null;
      })
      .filter(Boolean);

    const setActive = (activeLink) => {
      links.forEach((link) => {
        const on = link === activeLink;
        link.classList.toggle("is-active", on);
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
      // Keep the active tab visible inside the mobile bottom scroller
      if (activeLink && isMobilePageNav() && sectionNav) {
        const scroller = sectionNav.closest(".page-nav__inner") || sectionNav;
        const linkRect = activeLink.getBoundingClientRect();
        const scrollerRect = scroller.getBoundingClientRect();
        if (linkRect.left < scrollerRect.left + 12 || linkRect.right > scrollerRect.right - 12) {
          activeLink.scrollIntoView({
            inline: "center",
            block: "nearest",
            behavior: reduceMotion ? "auto" : "smooth",
          });
        }
      }
    };

    const updateFromScroll = () => {
      if (!items.length) return;
      const y = getAnchorOffset();
      let current = items[0];
      for (let i = 0; i < items.length; i += 1) {
        const top = items[i].section.getBoundingClientRect().top;
        if (top - y <= 1) current = items[i];
      }
      setActive(current.link);
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateFromScroll();
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("hashchange", () => {
      fixHashAnchor();
      updateFromScroll();
    });
    window.addEventListener("popstate", () => {
      if (window.location.hash) fixHashAnchor();
      updateFromScroll();
    });
    updateFromScroll();
  }

  // 1111 blackbar: 服務總覽 dropdown
  const dropdown = document.querySelector(".blackbar .nav-item.dropdown");
  const dropdownToggle = document.querySelector(".blackbar .dropdown-toggle");
  if (dropdown && dropdownToggle) {
    dropdownToggle.addEventListener("click", (e) => {
      e.preventDefault();
      const open = dropdown.classList.toggle("show");
      dropdownToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("show");
        dropdownToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // 1111 blackbar: FB分享
  const fbShare = document.getElementById("fb-share");
  if (fbShare) {
    fbShare.addEventListener("click", (e) => {
      e.preventDefault();
      const url = encodeURIComponent(window.location.href);
      window.open(
        "https://www.facebook.com/sharer/sharer.php?u=" + url,
        "_blank",
        "noopener,noreferrer"
      );
    });
  }
})();
