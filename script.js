/* =========================================================
   C.e1031 · 个人网站交互
   无依赖，全部原生 JS；尊重 prefers-reduced-motion
   ========================================================= */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- 年份 ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- 头部 / 导航 / 回顶 ---------- */
  const header = $("#siteHeader");
  const nav = $("#nav");
  const menuToggle = $("#menuToggle");
  const backTop = $("#backTop");
  const navLinks = $$("[data-nav]");
  const sections = $$("main section[id]");
  const hideAt = 640;

  const closeMenu = () => {
    if (!document.body.classList.contains("menu-open")) return;
    document.body.classList.remove("menu-open");
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "打开菜单");
    }
  };

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 960) closeMenu();
    });
  }

  if (backTop) {
    backTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion.matches ? "auto" : "smooth",
      });
    });
  }

  let ticking = false;

  const updateOnScroll = () => {
    const y = window.scrollY;

    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (backTop) backTop.classList.toggle("is-visible", y > hideAt);

    // 当前所在区块高亮
    let currentId = "";
    for (const section of sections) {
      if (section.offsetTop - 140 <= y) currentId = section.id;
    }
    // 滚到页面底部时，高亮最后一个导航项（页面本身够长时）
    const atBottom =
      window.innerHeight + y >= document.documentElement.scrollHeight - 4;
    if (atBottom && document.documentElement.scrollHeight > window.innerHeight + 240) {
      currentId = "contact";
    }
    navLinks.forEach((link) => {
      link.classList.toggle(
        "is-active",
        link.getAttribute("href") === `#${currentId}`
      );
    });

    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateOnScroll);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  updateOnScroll();

  /* ---------- 首屏打字机 ---------- */
  const typedEl = $("[data-typed]");
  if (typedEl) {
    const roles = ["独立开发者", "桌面工具作者", "本地优先实践者", "长期主义者"];
    const defaultText = typedEl.textContent;
    let roleIndex = 0;
    let charIndex = Array.from(defaultText).length;
    let deleting = false;

    if (reduceMotion.matches) {
      // 减少动效：固定展示第一个角色
      typedEl.textContent = roles[0];
    } else {
      const tick = () => {
        const word = Array.from(roles[roleIndex]);
        let delay;

        if (!deleting) {
          charIndex = Math.min(charIndex + 1, word.length);
          if (charIndex >= word.length) {
            deleting = true;
            delay = 2200;
          } else {
            delay = 92;
          }
        } else {
          charIndex = Math.max(charIndex - 1, 0);
          if (charIndex === 0) {
            deleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            delay = 380;
          } else {
            delay = 42;
          }
        }

        typedEl.textContent = word.slice(0, charIndex).join("");
        window.setTimeout(tick, delay);
      };
      window.setTimeout(tick, 1400);
    }
  }

  /* ---------- 滚动显现 ---------- */
  const revealItems = $$("[data-reveal]");
  const reveal = (el) => el.classList.add("is-visible");

  if (!("IntersectionObserver" in window) || reduceMotion.matches) {
    revealItems.forEach(reveal);
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealItems.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- 数字滚动 ---------- */
  const counters = $$("[data-count]");
  if (counters.length && !reduceMotion.matches) {
    const animateCount = (el) => {
      if (el.dataset.done) return;
      el.dataset.done = "1";

      const target = Number(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || "";
      const duration = 1300;
      const start = performance.now();

      const frame = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${Math.round(target * eased)}${suffix}`;
        if (progress < 1) window.requestAnimationFrame(frame);
      };
      window.requestAnimationFrame(frame);
    };

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
    } else {
      const countObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateCount(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => countObserver.observe(el));
    }
  }

  /* ---------- 卡片鼠标聚光 ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    $$("[data-spotlight]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        card.style.setProperty("--my", `${event.clientY - rect.top}px`);
      });
    });
  }

  /* ---------- 名片轻微倾斜 ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    const tiltArea = $("[data-tilt]");
    const tiltCard = tiltArea && $(".id-card", tiltArea);

    if (tiltArea && tiltCard) {
      tiltArea.addEventListener("pointermove", (event) => {
        const rect = tiltArea.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        tiltCard.style.transform = `rotateY(${px * 6}deg) rotateX(${
          -py * 6
        }deg)`;
      });
      tiltArea.addEventListener("pointerleave", () => {
        tiltCard.style.transform = "";
      });
    }
  }

  /* ---------- 复制邮箱 ---------- */
  const toast = $("#toast");
  let toastTimer = 0;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2200);
  };

  const fallbackCopy = (text) => {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (error) {
      ok = false;
    }
    area.remove();
    return ok;
  };

  $$("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.dataset.copy || "";
      if (!text) return;

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          showToast(`已复制：${text}`);
        } else if (fallbackCopy(text)) {
          showToast(`已复制：${text}`);
        } else {
          showToast(`请手动复制：${text}`);
        }
      } catch (error) {
        showToast(
          fallbackCopy(text) ? `已复制：${text}` : `请手动复制：${text}`
        );
      }
    });
  });

  /* ---------- 首屏加载完成后标记 ---------- */
  window.addEventListener("load", () => {
    document.body.classList.add("is-loaded");
  });
})();
