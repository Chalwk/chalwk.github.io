/* Copyright (c) 2024-2026. Jericho Crosby (Chalwk) */

(function () {
    const DOMAINS = [
        { id: "mentalHealth", name: "Managing Mental Health", icon: "fas fa-brain" },
        { id: "physicalHealth", name: "Physical Health", icon: "fas fa-heartbeat" },
        { id: "livingSkills", name: "Living Skills", icon: "fas fa-utensils" },
        { id: "friendsCommunity", name: "Friends and Community", icon: "fas fa-users" },
        { id: "useOfTime", name: "Use of Time", icon: "fas fa-clock" },
        { id: "relationships", name: "Relationships", icon: "fas fa-hand-holding-heart" },
        { id: "addictiveBehavior", name: "Addictive Behavior", icon: "fas fa-ban" },
        { id: "home", name: "Home", icon: "fas fa-home" },
        { id: "identitySelfEsteem", name: "Identity & Self-Esteem", icon: "fas fa-smile" },
        { id: "trustHope", name: "Trust and Hope", icon: "fas fa-dove" }
    ];

    const STORAGE_KEY = "recoveryStarAppData";

    let appData = {
        ratings: {},
        notes: {}
    };

    const canvas = document.getElementById("recoveryStarCanvas");
    const ctx = canvas.getContext("2d");
    const avgSpan = document.querySelector("#avgRatingDisplay strong");
    const resetBtn = document.getElementById("resetAllBtn");
    const domainsContainer = document.getElementById("domainsContainer");

    function initDefaultData() {
        const ratings = {};
        const notes = {};
        DOMAINS.forEach(domain => {
            ratings[domain.id] = 5;
            notes[domain.id] = "";
        });
        appData = { ratings, notes };
    }

    function loadFromStorage() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.ratings && parsed.notes) {
                    appData = parsed;
                } else {
                    initDefaultData();
                }
            } catch (error) {
                initDefaultData();
            }
        } else {
            initDefaultData();
        }

        DOMAINS.forEach(domain => {
            if (appData.ratings[domain.id] === undefined) appData.ratings[domain.id] = 5;
            if (appData.notes[domain.id] === undefined) appData.notes[domain.id] = "";
        });

        persistData();
    }

    function persistData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    }

    function computeAverage() {
        let sum = 0;
        DOMAINS.forEach(domain => {
            sum += Number(appData.ratings[domain.id] || 0);
        });
        return (sum / DOMAINS.length).toFixed(1);
    }

    function updateAverageDisplay() {
        if (avgSpan) avgSpan.textContent = computeAverage();
    }

    function clampRating(value) {
        return Math.min(10, Math.max(1, Number(value) || 1));
    }

    function ratingToSliderPercent(value) {
        const rating = clampRating(value);
        if (rating <= 5) {
            return ((rating - 1) / 4) * 50;
        }
        return 50 + ((rating - 5) / 5) * 50;
    }

    function syncSliderVisuals(slider) {
        if (!slider) return;
        const shell = slider.closest(".slider-shell");
        if (!shell) return;

        const value = clampRating(slider.value);
        const percent = ratingToSliderPercent(value);

        shell.style.setProperty("--fill-width", `${percent}%`);
        shell.style.setProperty("--thumb-left", `${percent}%`);
        shell.dataset.value = String(value);
    }

    function updateSingleDomainRating(domainId, newRating) {
        const card = document.querySelector(`.domain-card[data-id="${domainId}"]`);
        if (!card) return;

        const ratingValueSpan = card.querySelector(".rating-value");
        if (ratingValueSpan) ratingValueSpan.textContent = `${newRating} / 10`;

        const ratingLabel = card.querySelector(".rating-label");
        if (ratingLabel) ratingLabel.textContent = String(newRating);

        const slider = card.querySelector(".rating-slider");
        if (slider) {
            if (Number(slider.value) !== newRating) slider.value = String(newRating);
            syncSliderVisuals(slider);
        }
    }

    function updateSingleDomainNote(domainId, noteText) {
        const card = document.querySelector(`.domain-card[data-id="${domainId}"]`);
        if (!card) return;
        const textarea = card.querySelector(".notes-area");
        if (textarea && textarea.value !== noteText) textarea.value = noteText;
    }

    function setRating(domainId, newRating) {
        const clamped = clampRating(newRating);
        appData.ratings[domainId] = clamped;
        persistData();
        updateSingleDomainRating(domainId, clamped);
        drawStar();
        updateAverageDisplay();
    }

    function setNote(domainId, noteText) {
        appData.notes[domainId] = noteText;
        persistData();
        updateSingleDomainNote(domainId, noteText);
    }

    function resetAllRatings() {
        DOMAINS.forEach(domain => {
            appData.ratings[domain.id] = 5;
            appData.notes[domain.id] = "";
        });
        persistData();
        renderAllDomains();
        drawStar();
        updateAverageDisplay();
    }

    function resizeCanvasForDisplay() {
        if (!canvas) return;

        const wrapper = canvas.parentElement;
        const displayedWidth = Math.floor(Math.min(wrapper.clientWidth, 560));
        const cssSize = Math.max(320, displayedWidth);
        const dpr = window.devicePixelRatio || 1;

        const pixelSize = Math.round(cssSize * dpr);
        if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
            canvas.width = pixelSize;
            canvas.height = pixelSize;
            canvas.style.width = `${cssSize}px`;
            canvas.style.height = `${cssSize}px`;
        }
    }

    function drawLabelOnArc(text, centerX, centerY, angle, radius, fontSize, color) {
        if (!text || text.length === 0) return;

        ctx.save();
        ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = color;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(255,255,255,0.85)";
        ctx.shadowBlur = 5;

        const fullWidth = ctx.measureText(text).width;
        const angularSpan = fullWidth / radius;
        let startAngle = angle - angularSpan / 2;

        const shouldReverse = Math.sin(angle) > 0;
        let chars = text.split('');
        if (shouldReverse) chars = chars.reverse();

        let currentX = 0;
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const charWidth = ctx.measureText(char).width;
            const charAngle = startAngle + (currentX + charWidth / 2) / radius;
            const x = centerX + radius * Math.cos(charAngle);
            const y = centerY + radius * Math.sin(charAngle);

            ctx.save();
            ctx.translate(x, y);
            let rotation = charAngle + Math.PI / 2;
            if (shouldReverse) {
                rotation += Math.PI;
            }
            ctx.rotate(rotation);
            ctx.fillText(char, 0, 0);
            ctx.restore();

            currentX += charWidth;
        }

        ctx.restore();
    }

    function drawStar() {
        if (!canvas || !ctx) return;

        resizeCanvasForDisplay();
        const size = canvas.width;
        const dpr = window.devicePixelRatio || 1;
        const logicalSize = size / dpr;
        const centerX = logicalSize / 2;
        const centerY = logicalSize / 2;
        const maxRadius = logicalSize * 0.34;
        const minRadius = logicalSize * 0.12;
        const labelRadius = logicalSize * 0.47;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, logicalSize, logicalSize);

        const ratings = DOMAINS.map(domain => clampRating(appData.ratings[domain.id]));
        const radii = ratings.map(rating => minRadius + ((rating - 1) / 9) * (maxRadius - minRadius));
        const angleStep = (Math.PI * 2) / DOMAINS.length;

        const points = DOMAINS.map((domain, index) => {
            const angle = -Math.PI / 2 + index * angleStep;
            const r = radii[index];
            return {
                x: centerX + r * Math.cos(angle),
                y: centerY + r * Math.sin(angle),
                angle,
                rating: ratings[index],
                name: domain.name
            };
        });

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius + 34, 0, Math.PI * 2);
        ctx.fillStyle = "#fbf7f0";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius + 16, 0, Math.PI * 2);
        ctx.fillStyle = "#fffdf9";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fill();

        for (let level = 1; level <= 10; level++) {
            const ringRadius = minRadius + ((level - 1) / 9) * (maxRadius - minRadius);
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = level === 5 ? "#d2c6b4" : "#e8dfd2";
            ctx.lineWidth = level === 5 ? 1.2 : 0.8;
            ctx.stroke();
        }

        for (let i = 0; i < DOMAINS.length; i++) {
            const angle = -Math.PI / 2 + i * angleStep;
            const xEnd = centerX + maxRadius * Math.cos(angle);
            const yEnd = centerY + maxRadius * Math.sin(angle);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(xEnd, yEnd);
            ctx.strokeStyle = "#ede3d6";
            ctx.lineWidth = 1.15;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();

        const gradient = ctx.createLinearGradient(centerX - maxRadius, centerY - maxRadius, centerX + maxRadius, centerY + maxRadius);
        gradient.addColorStop(0, "#ffe08a");
        gradient.addColorStop(0.55, "#f6b26b");
        gradient.addColorStop(1, "#e76f51");
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * 0.17, 0, Math.PI * 2);
        ctx.fillStyle = "#fff1c7";
        ctx.fill();
        ctx.strokeStyle = "rgba(44,125,160,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();

        points.forEach(point => {
            const nodeSize = 6 + ((point.rating - 1) / 9) * 5;

            ctx.beginPath();
            ctx.arc(point.x, point.y, nodeSize + 2, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(point.x, point.y, nodeSize, 0, Math.PI * 2);
            ctx.fillStyle = "#2c7da0";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(point.x - 1, point.y - 1, Math.max(1.8, nodeSize * 0.25), 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.fill();
        });

        const labelFontSize = Math.max(11, Math.min(16, logicalSize * 0.022));
        const labelColor = "#2d4a62";
        DOMAINS.forEach((domain, index) => {
            const angle = -Math.PI / 2 + index * angleStep;
            drawLabelOnArc(domain.name, centerX, centerY, angle, labelRadius, labelFontSize, labelColor);
        });

        ctx.font = `700 ${Math.max(42, logicalSize * 0.12)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "#2c3e50";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(255,255,255,0.9)";
        ctx.shadowBlur = 8;
        ctx.fillText("★", centerX, centerY - logicalSize * 0.01);

        ctx.shadowBlur = 0;
        ctx.font = `600 ${Math.max(16, logicalSize * 0.035)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "#2d4a62";
        ctx.fillText("recovery", centerX, centerY + logicalSize * 0.07);

        ctx.font = `600 ${Math.max(13, logicalSize * 0.022)}px JetBrains Mono, monospace`;
        ctx.fillStyle = "#1f5068";
        points.forEach(point => {
            const ratingText = String(point.rating);
            ctx.fillText(ratingText, point.x + 11, point.y - 9);
        });

        ctx.restore();
    }

    function getPlaceholderForDomain(name) {
        const placeholders = {
            "Managing Mental Health": "Therapy, coping strategies, mood tracking...",
            "Physical Health": "Exercise, sleep, medical checkups...",
            "Living Skills": "Cooking, budgeting, daily routines...",
            "Friends and Community": "Social connections, support groups...",
            "Use of Time": "Work, hobbies, productive activities...",
            "Relationships": "Family, partner, communication...",
            "Addictive Behavior": "Substances, triggers, recovery steps...",
            "Home": "Safe housing, cleanliness, stability...",
            "Identity & Self-Esteem": "Self-worth, goals, achievements...",
            "Trust and Hope": "Belief in future, trust in others..."
        };
        return placeholders[name] || "Write your personal note here...";
    }

    function renderAllDomains() {
        if (!domainsContainer) return;

        domainsContainer.innerHTML = "";

        DOMAINS.forEach(domain => {
            const rating = clampRating(appData.ratings[domain.id]);
            const note = appData.notes[domain.id] || "";

            const card = document.createElement("div");
            card.className = "domain-card";
            card.dataset.id = domain.id;

            const headerDiv = document.createElement("div");
            headerDiv.className = "domain-header";
            headerDiv.innerHTML = `
                <div class="domain-title">
                    <i class="${domain.icon}"></i>
                    <span>${domain.name}</span>
                </div>
                <div class="rating-value" id="ratingValue-${domain.id}">${rating} / 10</div>
            `;

            const sliderContainer = document.createElement("div");
            sliderContainer.className = "slider-container";

            const sliderShell = document.createElement("div");
            sliderShell.className = "slider-shell";
            sliderShell.style.setProperty("--fill-width", `${ratingToSliderPercent(rating)}%`);
            sliderShell.style.setProperty("--thumb-left", `${ratingToSliderPercent(rating)}%`);

            const sliderTrack = document.createElement("div");
            sliderTrack.className = "slider-track";

            const sliderFill = document.createElement("div");
            sliderFill.className = "slider-fill";

            const sliderThumb = document.createElement("div");
            sliderThumb.className = "slider-thumb";

            const slider = document.createElement("input");
            slider.type = "range";
            slider.min = "1";
            slider.max = "10";
            slider.step = "1";
            slider.value = String(rating);
            slider.classList.add("rating-slider");
            slider.setAttribute("aria-label", `${domain.name} rating`);

            const markersDiv = document.createElement("div");
            markersDiv.className = "slider-markers";
            markersDiv.innerHTML = `
                <span class="slider-marker left">1 Low</span>
                <span class="slider-marker center">5 Neutral</span>
                <span class="slider-marker right">10 High</span>
            `;

            sliderShell.appendChild(sliderTrack);
            sliderShell.appendChild(sliderFill);
            sliderShell.appendChild(sliderThumb);
            sliderShell.appendChild(slider);
            sliderShell.appendChild(markersDiv);

            const ratingLabel = document.createElement("span");
            ratingLabel.className = "rating-label";
            ratingLabel.textContent = String(rating);

            sliderContainer.appendChild(sliderShell);
            sliderContainer.appendChild(ratingLabel);

            const textarea = document.createElement("textarea");
            textarea.className = "notes-area";
            textarea.rows = 2;
            textarea.placeholder = `e.g., ${getPlaceholderForDomain(domain.name)}`;
            textarea.value = note;
            textarea.addEventListener("change", e => setNote(domain.id, e.target.value));
            textarea.addEventListener("blur", e => setNote(domain.id, e.target.value));

            card.appendChild(headerDiv);
            card.appendChild(sliderContainer);
            card.appendChild(textarea);
            domainsContainer.appendChild(card);

            slider.addEventListener("input", e => {
                const newVal = clampRating(e.target.value);
                ratingLabel.textContent = String(newVal);
                ratingValue.textContent = `${newVal} / 10`;
                syncSliderVisuals(slider);
                setRating(domain.id, newVal);
            });

            slider.addEventListener("change", e => {
                const newVal = clampRating(e.target.value);
                setRating(domain.id, newVal);
            });

            syncSliderVisuals(slider);
        });

        updateAverageDisplay();
        drawStar();
    }

    function init() {
        loadFromStorage();
        renderAllDomains();
        updateAverageDisplay();
        drawStar();

        window.addEventListener("resize", drawStar);

        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                if (confirm("Reset all ratings and notes to default values?")) {
                    resetAllRatings();
                }
            });
        }

        const resizeObserver = new ResizeObserver(() => drawStar());
        if (canvas) resizeObserver.observe(canvas.parentElement);
    }

    init();
})();
