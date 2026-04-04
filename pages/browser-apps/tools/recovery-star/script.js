/* Copyright (c) 2024-2026. Jericho Crosby (Chalwk) */

(function () {
    const DOMAINS = [
        {id: "mentalHealth", name: "Managing Mental Health", icon: "fas fa-brain"},
        {id: "physicalHealth", name: "Physical Health", icon: "fas fa-heartbeat"},
        {id: "livingSkills", name: "Living Skills", icon: "fas fa-utensils"},
        {id: "friendsCommunity", name: "Friends and Community", icon: "fas fa-users"},
        {id: "useOfTime", name: "Use of Time", icon: "fas fa-clock"},
        {id: "relationships", name: "Relationships", icon: "fas fa-hand-holding-heart"},
        {id: "addictiveBehavior", name: "Addictive Behavior", icon: "fas fa-ban"},
        {id: "home", name: "Home", icon: "fas fa-home"},
        {id: "identitySelfEsteem", name: "Identity & Self-Esteem", icon: "fas fa-smile"},
        {id: "trustHope", name: "Trust and Hope", icon: "fas fa-dove"}
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

    function loadFromStorage() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.ratings && parsed.notes) {
                    appData = parsed;
                } else {
                    initDefaultData();
                }
            } catch (e) {
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

    function initDefaultData() {
        const ratings = {};
        const notes = {};
        DOMAINS.forEach(domain => {
            ratings[domain.id] = 5;
            notes[domain.id] = "";
        });
        appData = {ratings, notes};
    }

    function persistData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    }

    function setRating(domainId, newRating) {
        appData.ratings[domainId] = Math.min(10, Math.max(1, newRating));
        persistData();
        renderAllDomains();
        drawStar();
        updateAverageDisplay();
    }

    function setNote(domainId, noteText) {
        appData.notes[domainId] = noteText;
        persistData();
        renderAllDomains();
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

    function computeAverage() {
        let sum = 0;
        DOMAINS.forEach(d => {
            sum += appData.ratings[d.id];
        });
        return (sum / DOMAINS.length).toFixed(1);
    }

    function updateAverageDisplay() {
        avgSpan.textContent = computeAverage();
    }

    function drawStar() {
        if (!canvas || !ctx) return;
        const size = canvas.width;
        const centerX = size / 2;
        const centerY = size / 2;
        const maxRadius = size * 0.42;
        const minRadius = size * 0.12;

        const ratings = DOMAINS.map(d => appData.ratings[d.id]);
        const radii = ratings.map(r => minRadius + (r - 1) / 9 * (maxRadius - minRadius));

        const angleStep = (Math.PI * 2) / DOMAINS.length;
        let points = [];
        for (let i = 0; i < DOMAINS.length; i++) {
            let angle = -Math.PI / 2 + i * angleStep;
            let r = radii[i];
            let x = centerX + r * Math.cos(angle);
            let y = centerY + r * Math.sin(angle);
            points.push({x, y, angle, rating: ratings[i]});
        }

        ctx.clearRect(0, 0, size, size);

        ctx.save();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius + 8, 0, Math.PI * 2);
        ctx.fillStyle = "#fdf8ed";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius - 2, 0, Math.PI * 2);
        ctx.fillStyle = "#fffaf2";
        ctx.fill();

        for (let level = 1; level <= 10; level++) {
            const ringRadius = minRadius + (level - 1) / 9 * (maxRadius - minRadius);
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = "#e0d6c6";
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }

        for (let i = 0; i < DOMAINS.length; i++) {
            let angle = -Math.PI / 2 + i * angleStep;
            let xEnd = centerX + maxRadius * Math.cos(angle);
            let yEnd = centerY + maxRadius * Math.sin(angle);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(xEnd, yEnd);
            ctx.strokeStyle = "#e9e0d0";
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();

        const gradient = ctx.createLinearGradient(centerX - maxRadius, centerY - maxRadius, centerX + maxRadius, centerY + maxRadius);
        gradient.addColorStop(0, "#ffd966");
        gradient.addColorStop(0.5, "#f4a261");
        gradient.addColorStop(1, "#e76f51");
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = "#fff1c1";
        ctx.fill();

        for (let p of points) {
            const nodeSize = 6 + (p.rating - 1) / 9 * 5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, nodeSize, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.shadowBlur = 6;
            ctx.fillStyle = "#2c7da0";
            ctx.arc(p.x, p.y, nodeSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(p.x - 1, p.y - 1, nodeSize * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
        }

        ctx.font = `500 ${Math.floor(size * 0.045)}px "Inter", system-ui`;
        ctx.fillStyle = "#3a5a6e";
        ctx.shadowBlur = 0;
        for (let i = 0; i < DOMAINS.length; i++) {
            let angle = -Math.PI / 2 + i * angleStep;
            let labelRadius = maxRadius + 18;
            let xLabel = centerX + labelRadius * Math.cos(angle);
            let yLabel = centerY + labelRadius * Math.sin(angle);
            let shortName = DOMAINS[i].name.split(" ").slice(0, 2).join(" ");
            if (shortName.length > 12) shortName = shortName.substring(0, 10) + "..";
            ctx.fillText(shortName, xLabel - 12, yLabel + 4);
        }

        ctx.font = `bold ${Math.floor(size * 0.085)}px "Inter", system-ui`;
        ctx.fillStyle = "#2c3e4e";
        ctx.fillText("★", centerX - 14, centerY + 10);
        ctx.font = `${Math.floor(size * 0.048)}px "Inter"`;
        ctx.fillStyle = "#2d4a62";
        ctx.fillText("recovery", centerX - 34, centerY + 34);

        ctx.font = `500 ${Math.floor(size * 0.035)}px "JetBrains Mono", monospace`;
        ctx.fillStyle = "#1f5068";
        for (let p of points) {
            let ratingText = Math.round(p.rating);
            let offsetX = p.x + 10;
            let offsetY = p.y - 8;
            ctx.fillText(ratingText, offsetX, offsetY);
        }

        ctx.restore();
    }

    function renderAllDomains() {
        if (!domainsContainer) return;
        domainsContainer.innerHTML = "";
        DOMAINS.forEach(domain => {
            const rating = appData.ratings[domain.id];
            const note = appData.notes[domain.id] || "";

            const card = document.createElement("div");
            card.className = "domain-card";
            card.dataset.id = domain.id;

            const headerDiv = document.createElement("div");
            headerDiv.className = "domain-header";
            headerDiv.innerHTML = `
                <div class="domain-title">
                    <i class="${domain.icon}"></i> ${domain.name}
                </div>
                <div class="rating-value" id="ratingValue-${domain.id}">${rating} / 10</div>
            `;

            const sliderContainer = document.createElement("div");
            sliderContainer.className = "slider-container";

            const sliderWrapper = document.createElement("div");
            sliderWrapper.className = "slider-wrapper";

            const slider = document.createElement("input");
            slider.type = "range";
            slider.min = 1;
            slider.max = 10;
            slider.step = 1;
            slider.value = rating;
            slider.classList.add("rating-slider");

            const markersDiv = document.createElement("div");
            markersDiv.className = "slider-markers";
            markersDiv.innerHTML = `<span>❶ Low</span><span>❼ Neutral</span><span>🔟 High</span>`;

            sliderWrapper.appendChild(slider);
            sliderWrapper.appendChild(markersDiv);

            const ratingLabel = document.createElement("span");
            ratingLabel.className = "rating-label";
            ratingLabel.textContent = `${rating}`;

            sliderContainer.appendChild(sliderWrapper);
            sliderContainer.appendChild(ratingLabel);

            slider.addEventListener("input", (e) => {
                e.stopPropagation();
                const newVal = parseInt(e.target.value, 10);
                ratingLabel.textContent = newVal.toString();
                const ratingSpan = card.querySelector(`.rating-value`);
                if (ratingSpan) ratingSpan.textContent = `${newVal} / 10`;
                setRating(domain.id, newVal);
            });

            slider.addEventListener("change", (e) => {
                const newVal = parseInt(e.target.value, 10);
                setRating(domain.id, newVal);
            });

            const textarea = document.createElement("textarea");
            textarea.className = "notes-area";
            textarea.rows = 2;
            textarea.placeholder = `e.g., ${getPlaceholderForDomain(domain.name)}`;
            textarea.value = note;
            textarea.addEventListener("change", (e) => {
                setNote(domain.id, e.target.value);
            });
            textarea.addEventListener("blur", (e) => {
                setNote(domain.id, e.target.value);
            });

            card.appendChild(headerDiv);
            card.appendChild(sliderContainer);
            card.appendChild(textarea);
            domainsContainer.appendChild(card);
        });
        updateAverageDisplay();
        drawStar();
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

    function handleCanvasResize() {
        if (canvas) {
            drawStar();
        }
    }

    function init() {
        loadFromStorage();
        renderAllDomains();
        drawStar();
        updateAverageDisplay();

        window.addEventListener("resize", () => {
            handleCanvasResize();
        });

        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                if (confirm("Reset all ratings and notes to default values?")) {
                    resetAllRatings();
                }
            });
        }

        const resizeObserver = new ResizeObserver(() => {
            drawStar();
        });
        if (canvas) resizeObserver.observe(canvas);
    }

    init();
})();