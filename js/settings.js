/* ==========================================
   MODULE: TETAPAN PENGGUNA
   Tujuan: Menyimpan dan menggunakan tetapan paparan
========================================== */

document.addEventListener("DOMContentLoaded", function () {
    const sidebarColor = document.getElementById("settingSidebarColor");
    const fontSize = document.getElementById("settingFontSize");
    const displayMode = document.getElementById("settingDisplayMode");
    const highContrast = document.getElementById("settingHighContrast");
    const resetButton = document.getElementById("resetSettings");
    const message = document.getElementById("settingsMessage");

    const defaultSettings = { sidebarColor: "#183153", fontSize: "16px", displayMode: "light", highContrast: false };

    // FUNCTION: applySettings
    // PURPOSE: Menggunakan tetapan warna, saiz tulisan dan mod paparan.
    function applySettings(settings) {
        document.documentElement.style.setProperty("--user-sidebar-color", settings.sidebarColor);
        document.documentElement.style.setProperty("--user-font-size", settings.fontSize);
        document.body.classList.toggle("dark-mode", settings.displayMode === "dark");
        document.body.classList.toggle("high-contrast", settings.highContrast || settings.displayMode === "dark");
        sidebarColor.value = settings.sidebarColor;
        fontSize.value = settings.fontSize;
        displayMode.value = settings.displayMode;
        highContrast.checked = settings.highContrast;
    }

    // FUNCTION: saveSettings
    // PURPOSE: Menyimpan tetapan pengguna ke localStorage.
    function saveSettings() {
        const settings = {
            sidebarColor: sidebarColor.value,
            fontSize: fontSize.value,
            displayMode: displayMode.value,
            highContrast: highContrast.checked
        };
        localStorage.setItem("efailUserSettings", JSON.stringify(settings));
        applySettings(settings);
        message.textContent = "Tetapan berjaya disimpan.";
    }

    // Load saved settings.
    const savedSettings = localStorage.getItem("efailUserSettings");
    let settings = defaultSettings;
    if (savedSettings) {
        try {
            settings = { ...defaultSettings, ...JSON.parse(savedSettings) };
        } catch (error) {
            console.error("Tetapan tidak dapat dibaca:", error);
        }
    }
    applySettings(settings);

    // Save when user changes settings.
    sidebarColor.addEventListener("change", saveSettings);
    fontSize.addEventListener("change", saveSettings);
    displayMode.addEventListener("change", saveSettings);
    highContrast.addEventListener("change", saveSettings);

    // Reset settings.
    resetButton.addEventListener("click", function () {
        localStorage.removeItem("efailUserSettings");
        applySettings(defaultSettings);
        message.textContent = "Tetapan asal telah dipulihkan.";
    });
});
