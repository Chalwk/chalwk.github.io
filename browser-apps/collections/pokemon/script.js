(function(){
    const BASE_URL = "https://www.pokemon.com/us/pokemon-tcg/pokemon-cards/series/";
    const IMAGE_BASE = "images/";
    const RARITY_MAP = new Map([
        ['common','common'],['uncommon','uncommon'],['rare','rare'],
        ['double rare','double-rare'],['ultra rare','ultra-rare'],['illustration rare','illustration-rare'],
        ['special illustration rare','special-illustration-rare'],['hyper rare','hyper-rare'],
        ['shiny rare','shiny-rare'],['shiny ultra rare','shiny-ultra-rare'],['ace spec rare','ace-spec-rare'],
        ['promo','promo']
    ]);

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

    const getImagePath = (name) => `${IMAGE_BASE}${encodeURIComponent(name)}.jpg`;
    const buildUrl = (parts, index) => {
        const shortUrl = parts.length > index ? parts[index].trim() : '';
        return shortUrl ? BASE_URL + shortUrl.replace(/\/?$/, '/') : '';
    };

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
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
            return c;
        });
    };

    const createCardHTML = (card, isPokemon = false, stage = '', hp = '') => {
        const imgSrc = getImagePath(card.name);
        const escapedImgSrc = imgSrc.replace(/'/g, "\\'");
        const holoTag = card.holo ? '<span class="holo-indicator">H</span>' : '';
        const linkIcon = card.url ? `<a href="${card.url}" target="_blank" rel="noopener" class="card-link-icon" title="View on Pokémon Database"><i class="fas fa-external-link-alt"></i></a>` : '';
        const rarityBadgeHtml = getRarityBadge(card.rarity);
        const qtyBadge = `<span class="qty-badge">×${card.count}</span>`;

        let detailsHtml = '';
        if (isPokemon) {
            detailsHtml = `
                    <div class="pokemon-details">
                        <span><i class="fas fa-arrow-up"></i> ${escapeHtml(stage)}</span>
                        <span class="hp-value">${hp} HP</span>
                        ${rarityBadgeHtml}
                    </div>
                `;
        } else {
            detailsHtml = rarityBadgeHtml ? `<div class="item-rarity">${rarityBadgeHtml}</div>` : '';
        }

        const nameTag = isPokemon ? 'pokemon-name' : 'item-name';
        const cardTypeClass = isPokemon ? 'pokemon-card' : 'item-card';

        return `
                <div class="${cardTypeClass}" data-name="${escapeHtml(card.name.toLowerCase())}" data-holo="${card.holo}" data-rarity="${card.rarity ? card.rarity.toLowerCase() : ''}" ${isPokemon ? `data-stage="${stage.toLowerCase()}" data-hp="${hp}"` : ''}>
                    ${qtyBadge}
                    ${linkIcon}
                    <img class="card-thumb" src="${imgSrc}" alt="${escapeHtml(card.name)}" onclick="openLightbox(this.parentElement)" loading="lazy">
                    <div class="${nameTag}">
                        ${escapeHtml(card.name)} ${holoTag}
                    </div>
                    ${detailsHtml}
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
        updateModalContent();
        modal.style.display = 'flex';
        history.pushState({ modal: true }, '');
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
    window.addEventListener('popstate', () => { if (modal.style.display === 'flex') window.closeModal(true); });

    const renderItems = (container, items) => {
        container.innerHTML = items.map(item => createCardHTML(item, false)).join('');
    };

    const renderPokemon = (pokemonByType) => {
        pokemonTypeContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();
        for (const [type, mons] of Object.entries(pokemonByType)) {
            const typeLower = type.toLowerCase();
            const sectionDiv = document.createElement('div');
            sectionDiv.classList.add('pokemon-type-block');
            sectionDiv.innerHTML = `<h3 class="subsection-title"><i class="fas fa-${typeLower === 'dragon' ? 'dragon' : 'paw'}"></i> ${escapeHtml(type)}</h3>`;
            const grid = document.createElement('div');
            grid.className = 'card-grid';
            mons.forEach(p => {
                const cardHTML = createCardHTML(p, true, p.stage, p.hp);
                grid.insertAdjacentHTML('beforeend', cardHTML);
            });
            sectionDiv.appendChild(grid);
            fragment.appendChild(sectionDiv);
        }
        pokemonTypeContainer.appendChild(fragment);
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
        const conditions = { holo: null, stage: null, hp: null, rarity: null, nameTokens: [] };
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
                else if (keyword === 'hp') { const hpVal = parseInt(valueStr, 10); if (!isNaN(hpVal)) conditions.hp = hpVal; }
                else if (keyword === 'rarity') conditions.rarity = valueStr;
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
            const conditions = term ? parseSearchTokens(term) : { holo: null, stage: null, hp: null, rarity: null, nameTokens: [] };
            for (let card of allCards) {
                card.style.display = matchesCard(card, conditions) ? 'flex' : 'none';
            }
            updateSectionVisibility();
            filterDebounceTimer = null;
        }, 16);
    };

    const loadData = async () => {
        try {
            const response = await fetch('pokemon.txt');
            if (!response.ok) throw new Error('Failed to load cards data');
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim() !== '');

            const energies = [], supporters = [], items = [], tools = [], pokemonByType = {};

            for (const line of lines) {
                const parts = line.split(';').map(s => s.trim());
                if (parts.length < 2) continue;
                const category = parts[0];

                switch(category) {
                    case 'ENERGY': {
                        const [ , name, countStr, holoStr ] = parts;
                        energies.push({ name, count: parseInt(countStr,10), holo: holoStr?.toLowerCase() === 'true', url: buildUrl(parts,4), rarity: parts[5] || '' });
                        break;
                    }
                    case 'SUPPORTER': {
                        const [ , name, countStr, holoStr ] = parts;
                        supporters.push({ name, count: parseInt(countStr,10), holo: holoStr?.toLowerCase() === 'true', url: buildUrl(parts,4), rarity: parts[5] || '' });
                        break;
                    }
                    case 'ITEM': {
                        const [ , name, countStr, holoStr ] = parts;
                        items.push({ name, count: parseInt(countStr,10), holo: holoStr?.toLowerCase() === 'true', url: buildUrl(parts,4), rarity: parts[5] || '' });
                        break;
                    }
                    case 'TOOL': {
                        const [ , name, countStr, holoStr ] = parts;
                        tools.push({ name, count: parseInt(countStr,10), holo: holoStr?.toLowerCase() === 'true', url: buildUrl(parts,4), rarity: parts[5] || '' });
                        break;
                    }
                    case 'POKEMON': {
                        const [ , name, stage, hpStr, countStr, type, holoStr ] = parts;
                        const hp = parseInt(hpStr,10);
                        if (!pokemonByType[type]) pokemonByType[type] = [];
                        pokemonByType[type].push({ name, stage, hp, count: parseInt(countStr,10), holo: holoStr?.toLowerCase() === 'true', url: buildUrl(parts,7), rarity: parts[8] || '' });
                        break;
                    }
                    default: break;
                }
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