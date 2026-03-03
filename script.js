const btn = document.getElementById("btn");
if (btn) btn.addEventListener("click", getWeather);

async function getWeather() {
    const cityInput = document.getElementById("cityName");
    const city = cityInput ? cityInput.value.trim() : "";
    const apiKey = "f9307f3f85dc154ab86b7f6df392d029";


    

    if (!city) {
        alert("Please enter a city name");
        return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    try {
        console.log("Fetching weather for:", city, url);
        const res = await fetch(url);

        if (!res.ok) {
            let errText = "";
            try {
                const errJson = await res.json();
                errText = errJson.message || JSON.stringify(errJson);
            } catch (e) {
                errText = await res.text();
            }
            throw new Error(`HTTP ${res.status}: ${errText}`);
        }

        const data = await res.json();
        console.log("API response:", data);

        // Update UI
        document.getElementById("city").textContent = data.name || "-";
        document.getElementById("temp").textContent = data.main && data.main.temp !== undefined ? data.main.temp + "°C" : "-";
        document.getElementById("desc").textContent = data.weather && data.weather[0] ? data.weather[0].description : "-";

        const iconEl = document.getElementById("icon");
        if (data.weather && data.weather[0] && data.weather[0].icon) {
            const iconCode = data.weather[0].icon;
            iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            iconEl.alt = data.weather[0].description || "weather icon";
        } else if (iconEl) {
            iconEl.src = "";
            iconEl.alt = "";
        }

    
        if (data.coord && data.coord.lat !== undefined && data.coord.lon !== undefined) {
            const lat = data.coord.lat;
            const lon = data.coord.lon;
            const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
            try {
                console.log("Fetching AQI for:", lat, lon, aqiUrl);
                const aqiRes = await fetch(aqiUrl);
                if (!aqiRes.ok) {
                    console.warn("AQI fetch failed", aqiRes.status);
                } else {
                    const aqiData = await aqiRes.json();
                    console.log("AQI response:", aqiData);
                    // OpenWeatherMap returns an object with list[0].main.aqi (1-5)
                    const aqiObj = aqiData && aqiData.list && aqiData.list[0];
                    const aqiVal = aqiObj && aqiObj.main ? aqiObj.main.aqi : null;
                    const components = aqiObj && aqiObj.components ? aqiObj.components : null;

                    const aqiEl = document.getElementById("aqi");
                    const aqiDescEl = document.getElementById("aqi-desc");
                    const mainPollutantEl = document.getElementById("main-pollutant");

                    const aqiMap = {
                        1: "Good",
                        2: "Fair",
                        3: "Moderate",
                        4: "Poor",
                        5: "Very Poor",
                    };

                    if (aqiVal) {
                        if (aqiEl) aqiEl.textContent = `${aqiVal} (${aqiMap[aqiVal] || "Unknown"})`;
                        if (aqiDescEl) aqiDescEl.textContent = `AQI level: ${aqiMap[aqiVal] || "Unknown"}`;

                        // Determine main pollutant (largest concentration among common pollutants)
                        if (components && mainPollutantEl) {
                            // components is an object like {co: 201.94053649902344, no: 0.01877196955680847, ...}
                            let main = null;
                            let max = -Infinity;
                            for (const [key, value] of Object.entries(components)) {
                                if (typeof value === 'number' && value > max) {
                                    max = value;
                                    main = key;
                                }
                            }
                            mainPollutantEl.textContent = main ? `Main pollutant: ${main.toUpperCase()} (${max} µg/m3)` : "";
                        }
                    } else {
                        if (aqiEl) aqiEl.textContent = "N/A";
                        if (aqiDescEl) aqiDescEl.textContent = "AQI data not available";
                        if (mainPollutantEl) mainPollutantEl.textContent = "";
                    }
                }
            } catch (e) {
                console.error("Error fetching AQI:", e);
            }
        } else {
            console.warn("Coordinates not available for AQI lookup");
        }

    } catch (error) {
        console.error("Error fetching weather:", error);
        alert("Error fetching weather: " + (error.message || error));
    }
}
