// --- 1. INISIALISASI SAAT HALAMAN DIMUAT ---
document.addEventListener("DOMContentLoaded", function() {
    setupRealTimeValidation();
});

// Fungsi Satpam Real-Time 👮‍♂️
function setupRealTimeValidation() {
    const validators = [
        { id: "pressure", min: 1, max: 20000 },
        { id: "temperature", min: 1, max: 500 },
        { id: "gravity", min: 0.5, max: 1.5 },
        { id: "n2", min: 0, max: 100 },
        { id: "co2", min: 0, max: 100 },
        { id: "h2s", min: 0, max: 100 }
    ];

    validators.forEach(item => {
        const input = document.getElementById(item.id);
        
        // Event 'input': Cek setiap kali user mengetik
        input.addEventListener("input", function() {
            validateSingleInput(this, item.min, item.max);
        });
        
        // Event 'blur': Cek saat user klik di luar kotak (kalo kosong, dianggap error utk data utama)
        input.addEventListener("blur", function() {
            validateSingleInput(this, item.min, item.max);
        });
    });
}

// Logika Cek Satu Input
function validateSingleInput(inputElement, min, max) {
    let val = parseFloat(inputElement.value);

    // Kalau kosong atau NaN (Bukan Angka)
    if (inputElement.value === "" || isNaN(val)) {
        // Khusus Impurities boleh kosong (dianggap 0), tapi data utama gak boleh
        if(["n2","co2","h2s"].includes(inputElement.id)) {
            inputElement.classList.remove("is-invalid"); // Aman
        } else {
            inputElement.classList.add("is-invalid"); // Merah
        }
        return false;
    }

    // Cek Range Angka
    if (val < min || val > max) {
        inputElement.classList.add("is-invalid"); // MERAH (Bootstrap)
        return false;
    } else {
        inputElement.classList.remove("is-invalid"); // Hijau/Normal
        inputElement.classList.add("is-valid");      // Opsional: Kasih centang hijau
        return true;
    }
}

// --- 2. FUNGSI UTAMA HITUNG (Dipanggil Tombol) ---
export async function hitungGas() {
    console.log("🚀 Starting Calculation...");

    // Cek dulu apakah ada kotak yang masih merah (Error)
    if (document.querySelectorAll(".is-invalid").length > 0) {
        alert("⚠️ Masih ada input yang salah (berwarna merah). Mohon perbaiki dulu!");
        return;
    }

    // 1. AMBIL DATA
    let P = parseFloat(document.getElementById("pressure").value);
    let T = parseFloat(document.getElementById("temperature").value);
    let G = parseFloat(document.getElementById("gravity").value);
    
    let n2 = parseFloat(document.getElementById("n2").value) || 0;
    let co2 = parseFloat(document.getElementById("co2").value) || 0;
    let h2s = parseFloat(document.getElementById("h2s").value) || 0;

    let ppcM = document.getElementById("ppc_method").value;
    let corrM = document.getElementById("correction_method").value;
    let zM = document.getElementById("z_method").value;
    let viscM = document.getElementById("viscosity_method").value;

    // Cek Kosong Terakhir (Jaga-jaga)
    if (isNaN(P) || isNaN(T) || isNaN(G)) {
        alert("⚠️ Data utama tidak boleh kosong!");
        return;
    }

    // 2. BUNGKUS PAKET
    let dataPaket = {
        pressure: P, temperature: T, gas_gravity: G,
        n2: n2, co2: co2, h2s: h2s,
        ppc_method: ppcM, correction_method: corrM, z_method: zM, viscosity_method: viscM
    };

    try {
        // 3. KIRIM KE SERVER
        let response = await fetch("https://petrohub-engine.vercel.app/pvt/gas/full", {
            method: "POST",
            mode: "cors", // Tambahkan ini khusus buat Safari
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataPaket)
        });
        if (!response.ok) {
            let errorData = await response.json();
            alert("Error Server: " + JSON.stringify(errorData.detail));
            return;
        }

        let hasil = await response.json();
        let r = hasil.results; 
        
        // 4. TAMPILKAN HASIL
        document.getElementById("res-z").innerText = r.z_factor.toFixed(4);
        document.getElementById("res-bg").innerText = r.bg.toFixed(5);
        document.getElementById("res-rho").innerText = r.density.toFixed(3);
        document.getElementById("res-visc").innerText = r.viscosity.toExponential(3); 
        document.getElementById("res-cg").innerText = r.compressibility.toExponential(3);
        document.getElementById("res-ppc").innerText = r.ppc.toFixed(1);

        document.getElementById("result-area").style.display = "block";
        document.getElementById("result-area").scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error(error);
        alert("Gagal koneksi ke server!");
    }
}