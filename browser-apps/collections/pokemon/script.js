/*
Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

My Pokémon TCG Collection - Script
*/

(function () {
    const BASE_URL = "https://www.pokemon.com/us/pokemon-tcg/pokemon-cards/series/";
    const IMAGE_BASE = "images/";
    const RARITY_MAP = new Map([
        ['common', 'common'], ['uncommon', 'uncommon'], ['rare', 'rare'],
        ['rare holo', 'rare'], ['holo rare', 'rare'],
        ['double rare', 'double-rare'], ['ultra rare', 'ultra-rare'], ['illustration rare', 'illustration-rare'],
        ['special illustration rare', 'special-illustration-rare'], ['hyper rare', 'hyper-rare'],
        ['shiny rare', 'shiny-rare'], ['shiny ultra rare', 'shiny-ultra-rare'], ['ace spec rare', 'ace-spec-rare'],
        ['promo', 'promo']
    ]);

    const TYPE_ICON_MAP = {
        psychic: 'brain',
        fire: 'fire',
        water: 'water',
        grass: 'leaf',
        lightning: 'bolt',
        fighting: 'fist',
        darkness: 'moon',
        metal: 'cog',
        fairy: 'star',
        dragon: 'dragon',
        colorless: 'circle'
    };

    const energyContainer = document.getElementById('energy-container');
    const supportersContainer = document.getElementById('supporters-container');
    const itemsContainer = document.getElementById('items-container');
    const toolsContainer = document.getElementById('tools-container');
    const pokemonTypeContainer = document.getElementById('pokemon-type-sections');
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    const noResultsDiv = document.getElementById('noResultsMessage');
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    const modalPrevBtn = document.getElementById('modalPrevBtn');
    const modalNextBtn = document.getElementById('modalNextBtn');

    let allCards = [];
    let energySection, trainersSection, pokemonSection;
    let trainerSubsections = [];
    let pokemonTypeBlocks = [];

    let currentCardElement = null;
    let lazyObserver = null;

    const getImagePath = (name) => `${IMAGE_BASE}${encodeURIComponent(name)}.jpg`;
    const buildUrlFromPart = (part) => part ? BASE_URL + part.replace(/\/?$/, '/') : '';

    const normalizeRarity = (rarity) => {
        if (!rarity) return '';
        const key = rarity.toLowerCase().trim();
        return RARITY_MAP.get(key) || 'unknown';
    };

    const getRarityBadge = (rarity) => {
        if (!rarity) return '';
        const normalized = normalizeRarity(rarity);
        return `<span class="rarity-badge rarity-${normalized}">${escapeHtml(rarity)}</span>`;
    };

    const escapeHtml = (str) => {
        if (!str) return '';
        return str.replace(/[&<>]/g, function (m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function (c) {
            return c;
        });
    };

    const PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%23e0e0e0'/%3E%3C/svg%3E";

    const formatWeakness = (weakness) => {
        if (!weakness) return [];
        if (Array.isArray(weakness) && weakness.length === 2 && typeof weakness[1] === 'string' && !isNaN(parseInt(weakness[1]))) {
            return [`${weakness[0]} ×${weakness[1]}`];
        }
        if (Array.isArray(weakness)) return weakness;
        return [];
    };

    const formatResistance = (resistance) => {
        if (!resistance) return [];
        if (Array.isArray(resistance) && resistance.length === 2) {
            return [`${resistance[0]} ${resistance[1]}`];
        }
        if (typeof resistance === 'object' && !Array.isArray(resistance) && resistance.symbol && resistance.value !== undefined) {
            const reduction = -resistance.value;
            return [`${resistance.symbol} ${reduction}`];
        }
        if (Array.isArray(resistance)) {
            return resistance;
        }
        return [];
    };

    const createCardHTML = (card, isPokemon = false) => {
        const imgSrc = getImagePath(card.name);
        const escapedImgSrc = imgSrc.replace(/'/g, "\\'");
        const holoTag = card.holo ? '<span class="holo-indicator">H</span>' : '';
        const linkIcon = card.url ? `<a href="${card.url}" target="_blank" rel="noopener" class="card-link-icon" title="View on Pokémon Database"><i class="fas fa-external-link-alt"></i></a>` : '';
        const rarityBadgeHtml = getRarityBadge(card.rarity);
        const qtyBadge = `<span class="qty-badge">×${card.count}</span>`;

        let detailsHtml = '';
        let extraDetailsHtml = '';

        if (isPokemon) {
            detailsHtml = `
                <div class="pokemon-details">
                    <span><i class="fas fa-arrow-up"></i> ${escapeHtml(card.stage)}</span>
                    <span class="hp-value">${card.hp} HP</span>
                    ${rarityBadgeHtml}
                </div>
            `;

            let attacksHtml = '';
            if (card.attacks && card.attacks.length) {
                attacksHtml = '<div class="attacks-list">';
                card.attacks.forEach(attack => {
                    const costHtml = attack.cost.map(c => `<span class="attack-cost-icon">${escapeHtml(c)}</span>`).join('');
                    attacksHtml += `
                        <div class="attack">
                            <div class="attack-header">
                                <span class="attack-name">${escapeHtml(attack.name)}</span>
                                <span class="attack-damage">${attack.damage}</span>
                            </div>
                            <div class="attack-cost">
                                <span class="stat-label">Attack Cost:</span>
                                ${costHtml}
                            </div>
                            ${attack.effect ? `<div class="attack-effect">${escapeHtml(attack.effect)}</div>` : ''}
                        </div>
                    `;
                });
                attacksHtml += '</div>';
            }

            let weaknessesHtml = '';
            const weaknessArray = formatWeakness(card.weakness);
            if (weaknessArray.length) {
                weaknessesHtml = `<div class="weakness"><span class="stat-label">Weakness:</span> ${weaknessArray.map(w => `<span class="type-badge">${escapeHtml(w)}</span>`).join('')}</div>`;
            }

            let resistancesHtml = '';
            const resistanceArray = formatResistance(card.resistance);
            if (resistanceArray.length) {
                resistancesHtml = `<div class="resistance"><span class="stat-label">Resistance:</span> ${resistanceArray.map(r => `<span class="type-badge">${escapeHtml(r)}</span>`).join('')}</div>`;
            }

            let retreatHtml = '';
            if (card.retreatCost && card.retreatCost > 0) {
                retreatHtml = `<div class="retreat"><span class="stat-label">Retreat:</span> ${'<i class="fas fa-star" style="color:silver;margin-right:2px;"></i>'.repeat(card.retreatCost)}</div>`;
            }

            const statsHtml = (weaknessesHtml || resistancesHtml || retreatHtml) ? `<div class="pokemon-stats">${weaknessesHtml}${resistancesHtml}${retreatHtml}</div>` : '';
            extraDetailsHtml = attacksHtml + statsHtml;
        } else {
            detailsHtml = rarityBadgeHtml ? `<div class="item-rarity">${rarityBadgeHtml}</div>` : '';
        }

        const nameTag = isPokemon ? 'pokemon-name' : 'item-name';
        const cardTypeClass = isPokemon ? 'pokemon-card' : 'item-card';

        return `
            <div class="${cardTypeClass}" data-name="${escapeHtml(card.name.toLowerCase())}" data-holo="${card.holo}" data-rarity="${card.rarity ? card.rarity.toLowerCase() : ''}" ${isPokemon ? `data-stage="${card.stage.toLowerCase()}" data-hp="${card.hp}"` : ''}>
                ${qtyBadge}
                ${linkIcon}
                <img class="card-thumb" data-src="${imgSrc}" src="${PLACEHOLDER_SVG}" alt="${escapeHtml(card.name)}" loading="lazy">
                <div class="${nameTag}">
                    ${escapeHtml(card.name)} ${holoTag}
                </div>
                ${detailsHtml}
                ${extraDetailsHtml ? `<div class="pokemon-extra">${extraDetailsHtml}</div>` : ''}
            </div>
        `;
    };

    const getVisibleCards = () => {
        return Array.from(document.querySelectorAll('.item-card, .pokemon-card')).filter(card => card.style.display !== 'none');
    };

    const updateModalContent = () => {
        if (!currentCardElement) return;
        const img = currentCardElement.querySelector('.card-thumb');
        if (img && img.src) {
            modalImg.src = img.src;
        }
        const nameDiv = currentCardElement.querySelector('.pokemon-name, .item-name');
        let cardName = nameDiv ? nameDiv.childNodes[0]?.nodeValue?.trim() || nameDiv.innerText.split('H')[0].trim() : 'Card';
        cardName = cardName.replace(/H$/, '').trim();
        const qtySpan = currentCardElement.querySelector('.qty-badge');
        const qty = qtySpan ? qtySpan.innerText : '×1';
        modalCaption.innerText = `${cardName} ${qty}`;
    };

    const navigateModal = (direction) => {
        if (!currentCardElement) return;
        const visibleCards = getVisibleCards();
        if (visibleCards.length === 0) {
            closeModal();
            return;
        }
        const currentIdx = visibleCards.indexOf(currentCardElement);
        let newIdx = currentIdx + direction;
        if (newIdx < 0) newIdx = visibleCards.length - 1;
        if (newIdx >= visibleCards.length) newIdx = 0;
        if (newIdx === currentIdx) return;
        currentCardElement = visibleCards[newIdx];
        updateModalContent();
    };

    window.openLightbox = (cardElement) => {
        if (!cardElement) return;
        currentCardElement = cardElement;

        const cardImg = currentCardElement.querySelector('.card-thumb');
        if (cardImg && cardImg.dataset.src && (cardImg.src === PLACEHOLDER_SVG || !cardImg.complete)) {
            modalImg.src = cardImg.dataset.src;
        } else if (cardImg) {
            modalImg.src = cardImg.src;
        }

        updateModalContent();
        modal.style.display = 'flex';
        history.pushState({modal: true}, '');
    };

    window.closeModal = (skipHistoryBack = false) => {
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
            currentCardElement = null;
            if (!skipHistoryBack) history.back();
        }
    };

    const onKeyDown = (e) => {
        if (modal.style.display !== 'flex') return;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateModal(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigateModal(1);
        } else if (e.key === 'Escape') {
            closeModal();
        }
    };

    modalPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateModal(-1);
    });
    modalNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateModal(1);
    });
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('popstate', () => {
        if (modal.style.display === 'flex') window.closeModal(true);
    });

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.item-card, .pokemon-card');
        if (!card) return;
        if (card.style.display === 'none') return;
        if (e.target.closest('.card-link-icon')) return;
        e.preventDefault();
        window.openLightbox(card);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    const renderItems = (container, items) => {
        container.innerHTML = items.map(item => createCardHTML(item, false)).join('');
        observeImages(container);
    };

    const renderPokemon = (pokemonByType) => {
        pokemonTypeContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();
        for (const [type, mons] of Object.entries(pokemonByType)) {
            const typeLower = type.toLowerCase();
            const displayType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
            const icon = TYPE_ICON_MAP[typeLower] || 'paw';
            const sectionDiv = document.createElement('div');
            sectionDiv.classList.add('pokemon-type-block');
            sectionDiv.innerHTML = `<h3 class="subsection-title"><i class="fas fa-${icon}"></i> ${escapeHtml(displayType)}</h3>`;
            const grid = document.createElement('div');
            grid.className = 'card-grid';
            mons.forEach(p => {
                const cardHTML = createCardHTML(p, true);
                grid.insertAdjacentHTML('beforeend', cardHTML);
            });
            sectionDiv.appendChild(grid);
            fragment.appendChild(sectionDiv);
        }
        pokemonTypeContainer.appendChild(fragment);
        observeImages(pokemonTypeContainer);
    };

    const initLazyObserver = () => {
        if (lazyObserver) lazyObserver.disconnect();
        lazyObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src && img.src !== img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.01
        });
    };

    const observeImages = (container) => {
        if (!lazyObserver) initLazyObserver();
        const images = container.querySelectorAll('.card-thumb[data-src]');
        images.forEach(img => lazyObserver.observe(img));
    };

    const observeAllImages = () => {
        if (!lazyObserver) initLazyObserver();
        const images = document.querySelectorAll('.card-thumb[data-src]');
        images.forEach(img => lazyObserver.observe(img));
    };

    const updateSectionVisibility = () => {
        const countVisibleInGrid = (grid) => grid ? Array.from(grid.children).filter(card => card.style.display !== 'none').length : 0;

        if (energySection && energyContainer) {
            energySection.style.display = countVisibleInGrid(energyContainer) > 0 ? 'block' : 'none';
        }

        let anyTrainerVisible = false;
        trainerSubsections.forEach(sub => {
            const grid = sub.querySelector('.card-grid');
            const visibleCount = countVisibleInGrid(grid);
            sub.style.display = visibleCount > 0 ? 'block' : 'none';
            if (visibleCount > 0) anyTrainerVisible = true;
        });
        if (trainersSection) trainersSection.style.display = anyTrainerVisible ? 'block' : 'none';

        let anyPokemonVisible = false;
        pokemonTypeBlocks.forEach(block => {
            const grid = block.querySelector('.card-grid');
            const visibleCount = countVisibleInGrid(grid);
            block.style.display = visibleCount > 0 ? 'block' : 'none';
            if (visibleCount > 0) anyPokemonVisible = true;
        });
        if (pokemonSection) pokemonSection.style.display = anyPokemonVisible ? 'block' : 'none';

        const totalVisible = allCards.filter(card => card.style.display !== 'none').length;
        noResultsDiv.style.display = totalVisible === 0 ? 'block' : 'none';

        if (modal.style.display === 'flex' && currentCardElement) {
            if (currentCardElement.style.display === 'none') {
                closeModal(true);
            }
        }
    };

    const parseSearchTokens = (term) => {
        const tokens = term.toLowerCase().split(/\s+/).filter(t => t);
        const conditions = {holo: null, stage: null, hp: null, rarity: null, nameTokens: []};
        const keywords = new Set(['holo', 'stage', 'hp', 'rarity']);
        let i = 0;
        while (i < tokens.length) {
            const token = tokens[i];
            if (token === 'holo') {
                conditions.holo = true;
                i++;
            } else if (token === 'stage' || token === 'hp' || token === 'rarity') {
                const keyword = token;
                i++;
                let valueParts = [];
                while (i < tokens.length && !keywords.has(tokens[i]) && !tokens[i].includes(':')) valueParts.push(tokens[i++]);
                const valueStr = valueParts.join(' ');
                if (keyword === 'stage') conditions.stage = valueStr;
                else if (keyword === 'hp') {
                    const hpVal = parseInt(valueStr, 10);
                    if (!isNaN(hpVal)) conditions.hp = hpVal;
                } else if (keyword === 'rarity') conditions.rarity = valueStr;
            } else if (token.startsWith('stage:')) {
                conditions.stage = token.substring(6);
                i++;
            } else if (token.startsWith('hp:')) {
                const hpVal = parseInt(token.substring(3), 10);
                if (!isNaN(hpVal)) conditions.hp = hpVal;
                i++;
            } else if (token.startsWith('rarity:')) {
                let rarityValue = token.substring(7);
                i++;
                while (i < tokens.length && !keywords.has(tokens[i]) && !tokens[i].includes(':')) rarityValue += ' ' + tokens[i++];
                conditions.rarity = rarityValue;
            } else {
                conditions.nameTokens.push(token);
                i++;
            }
        }
        return conditions;
    };

    const matchesCard = (card, conditions) => {
        if (conditions.holo !== null && card.dataset.holo !== 'true') return false;
        if (conditions.stage !== null && !(card.dataset.stage || '').includes(conditions.stage)) return false;
        if (conditions.hp !== null && parseInt(card.dataset.hp, 10) !== conditions.hp) return false;
        if (conditions.rarity !== null && !(card.dataset.rarity || '').includes(conditions.rarity)) return false;
        if (conditions.nameTokens.length) {
            const cardName = card.dataset.name || '';
            for (let token of conditions.nameTokens) {
                if (!cardName.includes(token)) return false;
            }
        }
        return true;
    };

    let filterDebounceTimer = null;
    const filterCards = () => {
        if (filterDebounceTimer) clearTimeout(filterDebounceTimer);
        filterDebounceTimer = setTimeout(() => {
            const term = searchInput.value.trim();
            const conditions = term ? parseSearchTokens(term) : {
                holo: null,
                stage: null,
                hp: null,
                rarity: null,
                nameTokens: []
            };
            for (let card of allCards) {
                card.style.display = matchesCard(card, conditions) ? 'flex' : 'none';
            }
            updateSectionVisibility();
            filterDebounceTimer = null;
        }, 16);
    };

    const loadData = async () => {
        try {
            const response = await fetch('database.json');
            if (!response.ok) throw new Error('Failed to load cards data');
            const data = await response.json();
            const energies = [], supporters = [], items = [], tools = [], pokemonByType = {};

            if (data.ENERGY) {
                data.ENERGY.forEach(entry => {
                    const {name, count, holo, setPart, rarity} = entry;
                    energies.push({
                        name,
                        count: parseInt(count, 10),
                        holo: holo === true || holo === 'true',
                        url: buildUrlFromPart(setPart),
                        rarity
                    });
                });
            }

            if (data.SUPPORTER) {
                data.SUPPORTER.forEach(entry => {
                    const {name, count, holo, setPart, rarity} = entry;
                    supporters.push({
                        name,
                        count: parseInt(count, 10),
                        holo: holo === true || holo === 'true',
                        url: buildUrlFromPart(setPart),
                        rarity
                    });
                });
            }

            if (data.ITEM) {
                data.ITEM.forEach(entry => {
                    const {name, count, holo, setPart, rarity} = entry;
                    items.push({
                        name,
                        count: parseInt(count, 10),
                        holo: holo === true || holo === 'true',
                        url: buildUrlFromPart(setPart),
                        rarity
                    });
                });
            }

            if (data.TOOL) {
                data.TOOL.forEach(entry => {
                    const {name, count, holo, setPart, rarity} = entry;
                    tools.push({
                        name,
                        count: parseInt(count, 10),
                        holo: holo === true || holo === 'true',
                        url: buildUrlFromPart(setPart),
                        rarity
                    });
                });
            }

            if (data.POKEMON) {
                data.POKEMON.forEach(entry => {
                    const {
                        name,
                        hp,
                        stage,
                        count,
                        type,
                        holo,
                        setPart,
                        rarity,
                        attacks,
                        weakness,
                        resistance,
                        retreatCost
                    } = entry;
                    if (!pokemonByType[type]) pokemonByType[type] = [];
                    pokemonByType[type].push({
                        name,
                        hp: parseInt(hp, 10),
                        stage,
                        type,
                        count: parseInt(count, 10),
                        holo: holo === true || holo === 'true',
                        url: buildUrlFromPart(setPart),
                        rarity,
                        attacks: attacks || [],
                        weakness: weakness || [],
                        resistance: resistance,
                        retreatCost: retreatCost || 0
                    });
                });
            }

            renderItems(energyContainer, energies);
            renderItems(supportersContainer, supporters);
            renderItems(itemsContainer, items);
            renderItems(toolsContainer, tools);
            renderPokemon(pokemonByType);

            energySection = document.getElementById('energies');
            trainersSection = document.getElementById('trainers');
            pokemonSection = document.getElementById('pokemon');
            trainerSubsections = Array.from(document.querySelectorAll('.trainer-subsection'));
            pokemonTypeBlocks = Array.from(document.querySelectorAll('.pokemon-type-block'));

            const itemCards = Array.from(document.querySelectorAll('.item-card'));
            const pokemonCards = Array.from(document.querySelectorAll('.pokemon-card'));
            allCards = [...itemCards, ...pokemonCards];

            observeAllImages();
            updateSectionVisibility();

            searchInput.addEventListener('input', filterCards);
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                filterCards();
                searchInput.focus();
            });
        } catch (error) {
            console.error('Error loading cards:', error);
            const errorMsg = '<p style="color: red;">Failed to load cards data.</p>';
            energyContainer.innerHTML = errorMsg;
            supportersContainer.innerHTML = errorMsg;
            itemsContainer.innerHTML = errorMsg;
            toolsContainer.innerHTML = errorMsg;
            pokemonTypeContainer.innerHTML = errorMsg;
        }
    };

    loadData();
})();