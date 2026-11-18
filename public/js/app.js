/* ============================================================
 * p7 — shared frontend helpers (login/role/session/sederhanakan API)
 * Dipakai oleh: login.ejs, register.ejs, seller/dashboard.ejs,
 *               pesanan/list.ejs
 * ============================================================ */
(function () {
  "use strict";

  function api(path, options) {
    return fetch(path, {
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      ...options,
    }).then(async (res) => {
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        const err = new Error(data.pesan || "Terjadi kesalahan");
        err.status = res.status;
        err.data = data;
        throw err;
      }
      return data;
    });
  }

  function showError(form, pesan) {
    const target = form.querySelector("[data-error]") || form.querySelector(".msg");
    if (target) {
      target.textContent = pesan;
      target.style.display = "block";
    } else {
      const div = document.createElement("div");
      div.className = "msg";
      div.textContent = pesan;
      form.prepend(div);
    }
  }

  function bindForm(id) {
    const form = document.getElementById(id);
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      form.querySelectorAll(".msg").forEach((m) => (m.style.display = "none"));
      const fd = new FormData(form);
      const body = new URLSearchParams(fd).toString();
      try {
        const res = await fetch(form.action, {
          method: form.method || "POST",
          headers: form.method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {},
          body,
          credentials: "same-origin",
        });
        let data = {};
        try { data = await res.json(); } catch (_) {}
        if (res.ok) {
          if (form.id === "form-login" || form.id === "form-register") {
            const role = form.querySelector('input[name="role"]:checked') ? form.querySelector('input[name="role"]:checked').value : null;
            window.location.href = role === "penjual" ? "/dashboard" : "/pesanan";
          }
        } else {
          showError(form, data.pesan || "Gagal.");
        }
      } catch (err) {
        showError(form, err.message);
      }
    });
  }

  async function renderSession(rootId) {
    const root = document.getElementById(rootId);
    if (!root) return;
    try {
      const data = await api("/api/auth/me");
      const user = data.data || data;
      root.innerHTML = `
        <span class="session-user">
          <b>${escapeHtml(user.nama || user.email)}</b>
          <span class="role-badge role-${user.role || ""}">${user.role || ""}</span>
        </span>
        <button class="link-button" id="btn-logout">Keluar</button>
      `;
      document.getElementById("btn-logout")?.addEventListener("click", async () => {
        await api("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      });
    } catch (_) {}
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    renderSession("session-root");
    bindForm("form-login");
    bindForm("form-register");
  }
})();
