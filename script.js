// ==========================================
// VERDANT WEATHER
// Weather Dashboard
// ==========================================

const API_BASE = "https://api.open-meteo.com/v1/forecast";
const GEO_BASE = "https://geocoding-api.open-meteo.com/v1/search";

const $ = (id) => document.getElementById(id);

let useFahrenheit = false;
let currentLocation = null;

// ==========================================
// 1. DAFTAR KONDISI CUACA
// ==========================================

const weatherCodes = {
    0: { label: "Cerah", icon: "☀️" },
    1: { label: "Cerah berawan", icon: "🌤️" },
    2: { label: "Berawan sebagian", icon: "⛅" },
    3: { label: "Mendung", icon: "☁️" },
    45: { label: "Berkabut", icon: "🌫️" },
    48: { label: "Kabut tebal", icon: "🌫️" },
    51: { label: "Gerimis ringan", icon: "🌦️" },
    53: { label: "Gerimis", icon: "🌦️" },
    55: { label: "Gerimis lebat", icon: "🌧️" },
    56: { label: "Gerimis beku ringan", icon: "🌧️" },
    57: { label: "Gerimis beku lebat", icon: "🌧️" },
    61: { label: "Hujan ringan", icon: "🌦️" },
    63: { label: "Hujan", icon: "🌧️" },
    65: { label: "Hujan lebat", icon: "🌧️" },
    66: { label: "Hujan beku ringan", icon: "🌧️" },
    67: { label: "Hujan beku lebat", icon: "🌧️" },
    71: { label: "Salju ringan", icon: "🌨️" },
    73: { label: "Salju", icon: "🌨️" },
    75: { label: "Salju lebat", icon: "❄️" },
    77: { label: "Butiran salju", icon: "❄️" },
    80: { label: "Hujan lokal ringan", icon: "🌦️" },
    81: { label: "Hujan lokal", icon: "🌧️" },
    82: { label: "Hujan lokal lebat", icon: "⛈️" },
    85: { label: "Hujan salju ringan", icon: "🌨️" },
    86: { label: "Hujan salju lebat", icon: "❄️" },
    95: { label: "Badai petir", icon: "⛈️" },
    96: { label: "Badai petir dan hujan es", icon: "⛈️" },
    99: { label: "Badai petir kuat", icon: "⛈️" }
};

// ==========================================
// 2. FUNGSI BANTUAN
// ==========================================

function weatherInfo(code) {
    return weatherCodes[code] || {
        label: "Kondisi tidak diketahui",
        icon: "🌤️"
    };
}

function temperature(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "--";
    }

    return Math.round(Number(value));
}

function temperatureUnit() {
    return useFahrenheit ? "°F" : "°C";
}

function showMessage(message, type = "info") {
    const element = $("message");

    if (!element) {
        console.log(message);
        return;
    }

    element.textContent = message;
    element.className = `message show ${type}`;
}

function hideMessage() {
    const element = $("message");

    if (!element) return;

    element.textContent = "";
    element.className = "message";
}

function formatTime(value) {
    if (!value) return "--:--";

    return value.slice(11, 16);
}

function formatDate(value) {
    return new Date(`${value}T12:00:00`).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short"
    });
}

function formatDay(value, index) {
    if (index === 0) return "Hari ini";

    return new Date(`${value}T12:00:00`).toLocaleDateString("id-ID", {
        weekday: "short"
    });
}

// ==========================================
// 3. PENCARIAN LOKASI
// ==========================================

async function findLocation(query) {
    const params = new URLSearchParams({
        name: query,
        count: "10",
        language: "id",
        format: "json"
    });

    const response = await fetch(`${GEO_BASE}?${params}`);

    if (!response.ok) {
        throw new Error("Layanan pencarian lokasi sedang bermasalah.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error(
            `Lokasi "${query}" tidak ditemukan. Coba nama kota lain.`
        );
    }

    const normalizedQuery = query.trim().toLowerCase();

    const exactMatch = data.results.find(location =>
        location.name.toLowerCase() === normalizedQuery
    );

    return exactMatch || data.results[0];
}

// ==========================================
// 4. MENGAMBIL DATA CUACA DARI API
// ==========================================

async function getWeather(location) {
    const params = new URLSearchParams({
        latitude: location.latitude,
        longitude: location.longitude,

        current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "weather_code",
            "pressure_msl",
            "wind_speed_10m"
        ].join(","),

        daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "sunrise",
            "sunset",
            "precipitation_probability_max"
        ].join(","),

        timezone: "auto",
        forecast_days: "7",

        temperature_unit: useFahrenheit ? "fahrenheit" : "celsius",
        wind_speed_unit: "kmh"
    });

    const response = await fetch(`${API_BASE}?${params}`);

    if (!response.ok) {
        throw new Error(
            "Data cuaca gagal dimuat. Periksa koneksi internet."
        );
    }

    return await response.json();
}

// ==========================================
// 5. MENAMPILKAN CUACA SAAT INI
// ==========================================

function renderCurrent(location, data) {
    const current = data.current;
    const info = weatherInfo(current.weather_code);

    $("locationName").textContent = location.name;

    $("locationDetail").textContent = [
        location.admin1,
        location.country
    ].filter(Boolean).join(" · ");

    $("temperature").textContent = temperature(current.temperature_2m);
    $("temperatureUnit").textContent = temperatureUnit();

    $("feelsLike").textContent =
        `Terasa seperti ${temperature(current.apparent_temperature)}${temperatureUnit()}`;

    $("condition").textContent = info.label;
    $("weatherIcon").textContent = info.icon;

    $("rain").textContent =
        `${Number(current.precipitation ?? 0).toLocaleString("id-ID")} mm`;

    $("humidity").textContent =
        `${current.relative_humidity_2m ?? "--"}%`;

    $("wind").textContent =
        `${Math.round(current.wind_speed_10m ?? 0)} km/j`;

    $("pressure").textContent =
        `${Math.round(current.pressure_msl ?? 0)} hPa`;

    const sunrise = data.daily.sunrise?.[0];
    const sunset = data.daily.sunset?.[0];

    $("sunrise").textContent = formatTime(sunrise);
    $("sunset").textContent = formatTime(sunset);

    if (sunrise && sunset) {
        $("daylight").textContent =
            `Matahari terbit pukul ${formatTime(sunrise)} dan terbenam pukul ${formatTime(sunset)} waktu setempat.`;
    } else {
        $("daylight").textContent =
            "Informasi matahari belum tersedia.";
    }

    $("updatedAt").textContent =
        `Waktu lokal lokasi: ${formatTime(current.time)} · Data dimuat saat pencarian`;
}

// ==========================================
// 6. MENAMPILKAN PRAKIRAAN 7 HARI
// ==========================================

function renderForecast(data) {
    const daily = data.daily;
    const forecastList = $("forecastList");

    forecastList.innerHTML = daily.time.map((date, index) => {
        const info = weatherInfo(daily.weather_code[index]);

        const high = temperature(daily.temperature_2m_max[index]);
        const low = temperature(daily.temperature_2m_min[index]);

        const rainChance = daily.precipitation_probability_max?.[index];

        const rainText =
            rainChance !== null && rainChance !== undefined
                ? `Peluang hujan ${rainChance}%`
                : "Peluang hujan tidak tersedia";

        return `
            <article
                class="forecast-day ${index === 0 ? "today" : ""}"
                title="${info.label} · ${rainText}"
            >
                <span class="day-name">
                    ${formatDay(date, index)}
                </span>

                <span class="day-date">
                    ${formatDate(date)}
                </span>

                <span class="forecast-icon">
                    ${info.icon}
                </span>

                <span class="forecast-condition">
                    ${info.label}
                </span>

                <span class="forecast-temps">
                    <span>${high}°</span>
                    <span class="low">${low}°</span>
                </span>
            </article>
        `;
    }).join("");
}

// ==========================================
// 7. MEMUAT DATA LOKASI
// ==========================================

async function loadCity(query) {
    const button = $("searchButton");

    button.disabled = true;
    button.textContent = "Memuat...";

    showMessage(`Sedang mencari cuaca untuk ${query}...`);

    try {
        const location = await findLocation(query);
        const data = await getWeather(location);

        currentLocation = location;

        renderCurrent(location, data);
        renderForecast(data);

        hideMessage();

    } catch (error) {
        console.error("Weather error:", error);

        showMessage(
            error.message || "Terjadi kesalahan. Silakan coba lagi.",
            "error"
        );

    } finally {
        button.disabled = false;
        button.textContent = "Cari lokasi ↗";
    }
}

// ==========================================
// 8. EVENT PENCARIAN
// ==========================================

$("searchForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const query = $("cityInput").value.trim();

    if (query) {
        loadCity(query);
    }
});

// ==========================================
// 9. MENGGANTI CELSIUS DAN FAHRENHEIT
// ==========================================

$("unitToggle").addEventListener("click", async function() {
    if (!currentLocation) return;

    const previousUnit = useFahrenheit;

    useFahrenheit = !useFahrenheit;

    $("unitToggle").textContent = useFahrenheit ? "°F" : "°C";

    try {
        const data = await getWeather(currentLocation);

        renderCurrent(currentLocation, data);
        renderForecast(data);

        hideMessage();

    } catch (error) {
        useFahrenheit = previousUnit;

        $("unitToggle").textContent = useFahrenheit ? "°F" : "°C";

        showMessage(
            "Gagal mengganti satuan suhu. Periksa koneksi internet.",
            "error"
        );
    }
});

// ==========================================
// 10. MEMUAT CUACA JAKARTA SAAT PERTAMA KALI
// ==========================================

loadCity("Jakarta");