async function login() {
    const admissionInput = document.getElementById("admission_id");
    const dobInput = document.getElementById("date_of_birth");
    const errorEl = document.getElementById("error");

    const admission_id = (admissionInput?.value || "").trim();
    const date_of_birth = (dobInput?.value || "").trim();

    if (!admission_id || !date_of_birth) {
        if (errorEl) errorEl.innerText = "Please enter both Admission ID and Date of Birth";
        return;
    }

    if (errorEl) errorEl.innerText = "";

    const apiBase = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || 'http://localhost:3000/api';

    try {
        const res = await fetch(`${apiBase}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                admission_id,
                date_of_birth
            })
        });

        const data = await res.json();

        if (!res.ok) {
            if (errorEl) errorEl.innerText = data.message || "Invalid credentials. Please try again.";
            return;
        }

        localStorage.setItem("studentData", JSON.stringify(data));
        window.location.href = "dashboard.html";

    } catch (err) {
        console.error("Login fetch error:", err);
        if (errorEl) errorEl.innerText = "Unable to connect to backend server. Make sure it is running.";
    }
}
