
document.addEventListener("DOMContentLoaded", function () {

    // SAMPLE DATA - replace with database data later
    const requests = [
        {
            id: "EF-001",
            module: "Pinjaman Fail",
            date: "11/11/2026",
            status: "pending",
            remarks: "Permohonan sedang menunggu pengesahan Pentadbir."
        },
        {
            id: "EF-002",
            module: "Pendaftaran Fail",
            date: "09/11/2026",
            status: "approved",
            remarks: "Permohonan telah diluluskan."
        },
        {
            id: "EF-003",
            module: "Pergerakan Fail",
            date: "08/11/2026",
            status: "rejected",
            remarks: "Sila lengkapkan maklumat lokasi fail."
        },
        {
            id: "EF-004",
            module: "Pinjaman Fail",
            date: "07/11/2026",
            status: "completed",
            remarks: "Permohonan telah selesai diproses."
        }
    ];

    const labels = {
        pending: "Menunggu Pengesahan",
        approved: "Diluluskan",
        rejected: "Ditolak",
        progress: "Dalam Proses",
        completed: "Selesai"
    };

    const body = document.getElementById("requestHistoryBody");
    if (!body) return;

    const modal = document.getElementById("requestDetailModal");

    function renderRequests() {

        const search = document
            .getElementById("requestSearch")
            .value.toLowerCase();

        const filter = document
            .getElementById("requestStatusFilter")
            .value;

        const filtered = requests.filter(request => {

            const matchesSearch =
                request.id.toLowerCase().includes(search) ||
                request.module.toLowerCase().includes(search);

            const matchesStatus =
                !filter || request.status === filter;

            return matchesSearch && matchesStatus;
        });

        body.innerHTML = filtered.map(request => `
            <tr>
                <td><strong>${request.id}</strong></td>
                <td>${request.module}</td>
                <td>${request.date}</td>
                <td>
                    <span class="request-status ${request.status}">
                        ${labels[request.status]}
                    </span>
                </td>
                <td>${request.remarks}</td>
                <td>
                    <button class="request-view-btn"
                        data-request-id="${request.id}">
                        <i class="bi bi-eye"></i> Lihat
                    </button>
                </td>
            </tr>
        `).join("");

        document.getElementById("requestEmpty").hidden =
            filtered.length !== 0;

        document.querySelector("#page-sejarah-permohonan .data-table")
            .style.display = filtered.length ? "table" : "none";

        updateSummary();
    }

    function updateSummary() {

        document.getElementById("totalRequests").textContent =
            requests.length;

        document.getElementById("pendingRequests").textContent =
            requests.filter(r => r.status === "pending").length;

        document.getElementById("approvedRequests").textContent =
            requests.filter(r => r.status === "approved").length;

        document.getElementById("rejectedRequests").textContent =
            requests.filter(r => r.status === "rejected").length;
    }

    function openRequest(id) {

        const request = requests.find(r => r.id === id);

        if (!request) return;

        document.getElementById("requestDetailId").textContent =
            request.id;

        document.getElementById("requestDetailModule").textContent =
            request.module;

        document.getElementById("requestDetailDate").textContent =
            request.date;

        document.getElementById("requestDetailApplicant").textContent =
            "Pemohon semasa";

        document.getElementById("requestDetailStatus").innerHTML = `
            <span class="request-status ${request.status}">
                ${labels[request.status]}
            </span>
        `;

        document.getElementById("requestAdminRemarks").textContent =
            request.remarks || "Tiada catatan daripada Pentadbir.";

        modal.classList.add("is-open");
        document.body.style.overflow = "hidden";
    }

    function closeRequest() {
        modal.classList.remove("is-open");
        document.body.style.overflow = "";
    }

    document.getElementById("requestSearch")
        .addEventListener("input", renderRequests);

    document.getElementById("requestStatusFilter")
        .addEventListener("change", renderRequests);

    body.addEventListener("click", function (event) {
        const button = event.target.closest("[data-request-id]");

        if (button) {
            openRequest(button.dataset.requestId);
        }
    });

    document.querySelectorAll("[data-close-request]")
        .forEach(button => {
            button.addEventListener("click", closeRequest);
        });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeRequest();
    });

    renderRequests();

});
// Carian Fail module behaviour can be added here.
