document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const navToggle = document.getElementById("nav-toggle");
  const navMenu = document.getElementById("nav-menu");
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Año dinámico en el footer ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---------- 2. Sombra del header al hacer scroll ---------- */
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- 3. Menú móvil ---------- */
  const closeMenu = () => {
    navMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Abrir menú");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  /* ---------- 4. Smooth Scroll con compensación del header fijo ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (targetId.length < 2) return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      const headerHeight = header.offsetHeight;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight + 1;

      window.scrollTo({
        top: targetId === "#inicio" ? 0 : top,
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });

      history.replaceState(null, "", targetId);
      closeMenu();
    });
  });

  /* ---------- 5. Scroll Reveal con Intersection Observer ---------- */
  const revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- 6. Enlace activo según la sección visible ---------- */
  const sections = Array.from(navLinks)
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.forEach((link) => {
              link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
            });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ---------- 7. Validación del formulario de contacto ---------- */
  const form = document.getElementById("contact-form");
  const successMessage = document.getElementById("form-success");

  const fields = {
    nombre: {
      validate: (value) => (value.trim().length >= 3 ? "" : "Introduce tu nombre completo.")
    },
    telefono: {
      validate: (value) => (/^[+]?[\d\s().-]{9,18}$/.test(value.trim()) ? "" : "Introduce un teléfono válido.")
    },
    email: {
      validate: (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? "" : "Introduce un correo electrónico válido.")
    },
    mensaje: {
      validate: (value) => (value.trim().length >= 10 ? "" : "Cuéntanos un poco más sobre tu reforma (mínimo 10 caracteres).")
    },
    privacidad: {
      validate: (_value, input) => (input.checked ? "" : "Debes aceptar el aviso legal para continuar.")
    }
  };

  const validateField = (name) => {
    const input = form.elements[name];
    const errorEl = document.getElementById("error-" + name);
    const message = fields[name].validate(input.value, input);
    const group = input.closest(".form__group");

    errorEl.textContent = message;
    group.classList.toggle("has-error", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");

    return !message;
  };

  Object.keys(fields).forEach((name) => {
    const input = form.elements[name];
    const eventName = input.type === "checkbox" ? "change" : "blur";
    input.addEventListener(eventName, () => validateField(name));
    input.addEventListener("input", () => {
      if (input.closest(".form__group").classList.contains("has-error")) validateField(name);
    });
  });

    
  const WEB3FORMS_KEY = "56f0a601-3337-4f14-8d72-538203366de0";
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    successMessage.hidden = true;

    const results = Object.keys(fields).map((name) => validateField(name));
    const isValid = results.every(Boolean);

    if (!isValid) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const formData = new FormData(form);
    formData.append("access_key", WEB3FORMS_KEY);
    formData.append("name", form.elements["nombre"].value);
    formData.append("subject", "Nueva solicitud de presupuesto - Punto Azul");
    formData.append("from_name", "Web Punto Azul");

    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (!data.success) throw new Error(data.message);

      form.reset();
      successMessage.hidden = false;
    } catch (error) {
      alert("No se pudo enviar la solicitud. Inténtalo de nuevo o llámanos al +34 631 661 933.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
});