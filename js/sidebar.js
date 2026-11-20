// e-FAIL navigation: role checks are delegated to permissions.js.
(function () {
  'use strict';
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('menuToggle');

  function showPage(name) {
    if (window.eFailPermissions && !window.eFailPermissions.showPage(name)) return;
    if (!window.eFailPermissions) {
      document.querySelectorAll('.page').forEach(page => page.classList.toggle('page--active', page.id === 'page-' + name));
    }
    const userSubmodules = ['pengguna', 'tambah-pengguna', 'tetapan-pengguna'];
    document.querySelectorAll('.sidebar__link').forEach(link => {
      const isUserSubmodule = userSubmodules.includes(name) && name !== 'pengguna';
      link.classList.toggle('sidebar__link--active', link.dataset.page === name || (link.dataset.page === 'pengguna' && isUserSubmodule));
    });
    document.querySelectorAll('.sidebar__sublink').forEach(link => link.classList.toggle('sidebar__sublink--active', link.dataset.page === name));
    if (sidebar && toggle) {
      sidebar.classList.remove('sidebar--open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Buka menu navigasi');
    }
    history.replaceState(null, '', '#' + name);
  }
  window.showPage = showPage;
  window.openModule = function (target) { showPage(String(target).replace(/^page-/, '')); };

  document.querySelectorAll('[data-page]').forEach(link => link.addEventListener('click', function (event) {
    const name = link.dataset.page;
    if (!name) return;
    event.preventDefault();
    showPage(name);
  }));
  document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => showPage(button.dataset.go)));


  // Buka/tutup submenu menggunakan klik, termasuk submenu bertingkat.
  document.querySelectorAll('.sidebar__group > .sidebar__link, .sidebar__group > .sidebar__sublink').forEach(link => {
    const submenu = link.nextElementSibling;
    if (!submenu || !submenu.classList.contains('sidebar__submenu')) return;

    link.addEventListener('click', function (event) {
      event.preventDefault();
      link.parentElement.classList.toggle('sidebar__group--open');
    });
  });
  

  if (toggle && sidebar) toggle.addEventListener('click', function () {
    const isOpen = sidebar.classList.toggle('sidebar--open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi');
  });

  document.addEventListener('click', function (event) {
    if (window.innerWidth <= 1024 && sidebar && toggle && !sidebar.contains(event.target) && !toggle.contains(event.target)) {
      sidebar.classList.remove('sidebar--open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Buka menu navigasi');
    }
  });

  const logout = document.getElementById('confirm-logout');
  if (logout) logout.addEventListener('click', function () {
    alert('Anda telah berjaya log keluar (mod ujian).');
    if (window.eFailPermissions) window.eFailPermissions.setRole('Pentadbir');
    showPage('dashboard');
  });

  window.showNotifications = function () {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.add('show');
  };
  window.hideNotifications = function () {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.remove('show');
  };
  window.toggleNotifications = function () {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.toggle('show');
  };
})();
