/* e-FAIL 2.0 - frontend role-based visibility for DEMO/TESTING only.
   Real access control must be enforced by a trusted backend after Government SSO. */
(function () {
  'use strict';

  const ROLE_KEY = 'efail_demo_role';
  const ROLES = ['Pengguna', 'Pentadbir', 'Penyelaras'];
  const ACCESS = {
    dashboard: ['Pengguna', 'Pentadbir', 'Penyelaras'],
    pengguna: ['Pentadbir'],
    pengesahan: ['Pentadbir'],
    'tambah-pengguna': ['Pentadbir'],
    'tetapan-pengguna': ['Pentadbir'],
    'buka-umum': ['Pengguna', 'Pentadbir', 'Penyelaras'],
    'jilid-baru': ['Pengguna', 'Pentadbir', 'Penyelaras'],
    'naik-taraf': ['Pengguna', 'Pentadbir', 'Penyelaras'],
    'pergerakan': ['Pengguna', 'Pentadbir', 'Penyelaras'],
    'permohonan': ['Pengguna', 'Pentadbir', 'Penyelaras'],
    'buka-peribadi': ['Pengguna', 'Pentadbir', 'Penyelaras'],
    'jilid-barup': ['Pengguna', 'Pentadbir', 'Penyelaras'],
    'naik-tarafp': ['Pengguna', 'Pentadbir', 'Penyelaras'],
    'pergerakanp': ['Pengguna', 'Pentadbir', 'Penyelaras'],
    'permohonanp': ['Pengguna', 'Pentadbir', 'Penyelaras'],
    pendaftaran: ['Pengguna', 'Pentadbir', 'Penyelaras'],
    penutupan: ['Pengguna', 'Pentadbir', 'Penyelaras'],
    pelupusan: ['Pentadbir', 'Penyelaras'],
    pemindahan: ['Pentadbir', 'Penyelaras'],
    sejarah: ['Pengguna', 'Pentadbir', 'Penyelaras'],
    laporan: ['Pentadbir', 'Penyelaras'],
    profil: ['Pengguna', 'Pentadbir', 'Penyelaras'],
    tetapan: ['Pengguna', 'Pentadbir', 'Penyelaras'],
    keluar: ['Pengguna', 'Pentadbir', 'Penyelaras']
  };

  // These modules are view-only for Penyelaras, as specified in the access matrix.
  const VIEW_ONLY_FOR_COORDINATOR = [
    'pendaftaran', 'pergerakan', 'permohonan', 'penutupan', 'pelupusan'
  ];

  function getRole() {
    const saved = localStorage.getItem(ROLE_KEY);
    return ROLES.includes(saved) ? saved : 'Pentadbir';
  }

  function setRole(role) {
    if (!ROLES.includes(role)) return;
    localStorage.setItem(ROLE_KEY, role);
    applyPermissions();
    const active = document.querySelector('.page.page--active');
    if (active) showPage(active.id.replace(/^page-/, ''));
  }

  function canAccess(page, role) {
    return (ACCESS[page] || []).includes(role);
  }

  function getCurrentPage() {
    const active = document.querySelector('.page.page--active');
    return active ? active.id.replace(/^page-/, '') : 'dashboard';
  }

  function showNotice(page, role) {
    document.querySelectorAll('.role-access-notice').forEach(el => el.remove());
    const pageEl = document.getElementById('page-' + page);
    if (!pageEl) return;
    let message = '';
    if (role === 'Penyelaras' && VIEW_ONLY_FOR_COORDINATOR.includes(page)) {
      message = 'Mod paparan sahaja — peranan Penyelaras boleh melihat maklumat tetapi tidak boleh mengubah atau menghantar rekod.';
    } else if (role === 'Pengguna' && ['pendaftaran', 'permohonan', 'penutupan'].includes(page)) {
      message = 'Mod permohonan — peranan Pengguna boleh menghantar permohonan sahaja. Kelulusan dan pengesahan dibuat oleh Pentadbir.';
    } else if (role === 'Pentadbir' && ['pendaftaran', 'pergerakan', 'permohonan', 'penutupan'].includes(page)) {
      message = 'Mod Pentadbir — tindakan pentadbiran tersedia berdasarkan modul ini.';
    }
    if (!message) return;
    const notice = document.createElement('div');
    notice.className = 'role-access-notice';
    notice.innerHTML = '<i class="bi bi-info-circle-fill" aria-hidden="true"></i><span></span>';
    notice.querySelector('span').textContent = message;
    pageEl.insertBefore(notice, pageEl.firstChild);
  }

  function setReadOnly(page, role) {
    const pageEl = document.getElementById('page-' + page);
    if (!pageEl) return;
    const readOnly = role === 'Penyelaras' && VIEW_ONLY_FOR_COORDINATOR.includes(page);
    pageEl.classList.toggle('page--read-only', readOnly);
    pageEl.querySelectorAll('input, select, textarea, button').forEach(control => {
      // Keep controls used for navigation available; disable data-entry/actions only.
      if (control.matches('[data-go], [data-page], .sidebar__link, .sidebar__sublink')) return;
      if (readOnly) {
        if (!control.dataset.permissionWasDisabled) {
          control.dataset.permissionWasDisabled = control.disabled ? 'true' : 'false';
        }
        control.disabled = true;
        control.setAttribute('aria-disabled', 'true');
      } else if (control.dataset.permissionWasDisabled !== undefined) {
        control.disabled = control.dataset.permissionWasDisabled === 'true';
        control.removeAttribute('aria-disabled');
      }
    });
  }

  function showPage(page) {
    const role = getRole();
    if (!canAccess(page, role)) {
      const target = document.getElementById('page-dashboard');
      if (target) {
        document.querySelectorAll('.page').forEach(el => el.classList.toggle('page--active', el === target));
      }
      window.alert('Akses tidak dibenarkan. Peranan ' + role + ' tidak mempunyai kebenaran untuk modul ini.');
      return false;
    }
    document.querySelectorAll('.page').forEach(el => el.classList.toggle('page--active', el.id === 'page-' + page));
    showNotice(page, role);
    setReadOnly(page, role);
    return true;
  }

  function applyPermissions() {
    const role = getRole();
    document.querySelectorAll('[data-page]').forEach(link => {
      const page = link.dataset.page;
      const allowed = canAccess(page, role);
      link.hidden = !allowed;
      link.setAttribute('aria-hidden', String(!allowed));
    });
    // Hide the Pengurusan Pengguna group if the role cannot access its parent module.
    const userGroup = document.querySelector('.sidebar__group');
    if (userGroup) userGroup.hidden = !canAccess('pengguna', role);

    const selector = document.getElementById('demoRoleSelect');
    if (selector) selector.value = role;
    const roleLabel = document.querySelector('.topbar__user-role');
    if (roleLabel) roleLabel.textContent = 'Ujian peranan · ' + role;
    const avatar = document.querySelector('.topbar__avatar');
    if (avatar) avatar.textContent = role === 'Pentadbir' ? 'PT' : role === 'Penyelaras' ? 'PY' : 'PG';

    const current = getCurrentPage();
    if (!canAccess(current, role)) showPage('dashboard');
    else {
      showNotice(current, role);
      setReadOnly(current, role);
    }
  }

  window.eFailPermissions = { getRole, setRole, canAccess, showPage, applyPermissions, accessMatrix: ACCESS };
  document.addEventListener('DOMContentLoaded', function () {
    const selector = document.getElementById('demoRoleSelect');
    if (selector) selector.addEventListener('change', event => setRole(event.target.value));
    applyPermissions();
  });
})();
