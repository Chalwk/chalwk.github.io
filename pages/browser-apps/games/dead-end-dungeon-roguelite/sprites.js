// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.
//
// sprites.js - tiny pixel-art SVG sprites for the dungeon board.
// Each sprite is an array of equal-length strings; characters map through
// PALETTE below. "." means transparent. `sprite()` merges horizontal runs
// into <rect>s so the output SVG is compact and shape-rendering: crispEdges
// keeps it looking like pixel art at any cell size.

(function () {
    const PALETTE = {
        '.': null,
        K: '#0a0a0f', // outline / near-black
        k: '#1f2430', // dark shade
        W: '#ffffff', // white
        w: '#e5e7eb', // off-white / silver
        s: '#9ca3af', // silver grey
        d: '#4b5563', // dark grey
        r: '#ef4444', // red
        R: '#7f1d1d', // dark red
        o: '#f97316', // orange
        y: '#fbbf24', // gold
        Y: '#fef3c7', // pale gold
        b: '#92400e', // brown
        B: '#451a03', // dark brown
        n: '#22c55e', // green
        N: '#14532d', // dark green
        l: '#a3e635', // lime
        p: '#c084fc', // purple
        P: '#6b21a8', // dark purple
        c: '#67e8f9', // cyan
        C: '#0e7490', // dark cyan
        u: '#60a5fa', // blue
        U: '#1e40af', // dark blue
        f: '#fcd5b4', // flesh
        m: '#ec4899', // magenta
        v: '#a855f7', // violet
    };

    function sprite(rows) {
        const h = rows.length;
        const w = rows[0].length;
        let body = '';
        for (let y = 0; y < h; y++) {
            const row = rows[y];
            let x = 0;
            while (x < w) {
                const color = PALETTE[row[x]];
                if (!color) { x++; continue; }
                let run = 1;
                while (x + run < w && PALETTE[row[x + run]] === color) run++;
                body += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${color}"/>`;
                x += run;
            }
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" class="sprite" aria-hidden="true">${body}</svg>`;
    }

    window.GameSprites = {
        // --- player ---
        player: sprite([
            '................',
            '.....KKyyyyKK...',
            '....KyyWyyK.....',
            '...KyyyyyyyyK...',
            '...KyKffffKuyK..',
            '...KyKfWffKuK...',
            '...KyyyffuuK....',
            '....KyyyyuK.....',
            '...KKKuuuuKK....',
            '..KuuuuuuuuuuK..',
            '..KuuKuuuuKuuK..',
            '..KuuuCCuuuUuK..',
            '...KuuCCCCuuK...',
            '....KBBKKBBK....',
            '...KBBBBKBBBBK..',
            '....KKKKKKKK....',
        ]),

        // --- rat ---
        rat: sprite([
            '................',
            '................',
            '................',
            '....KK......K...',
            '...KBBK....KBB..',
            '..KBbBK..KKbBK..',
            '.KbbbbBKKbbbbK..',
            'KbbbbbbbbbbbbBK.',
            'KbbKbbbbbbbbKbbK',
            'KbbbbbbbbbbbbbbK',
            '.KbbbbbbbbbbbbK.',
            '..KKbbbbbbbbKK..',
            '...KBbBBBBbBK...',
            '...KBB....BBK...',
            '....KK....KK....',
            '................',
        ]),

        // --- goblin ---
        goblin: sprite([
            '................',
            '....K......K....',
            '...KnK....KnK...',
            '...KnnnnnnnnK...',
            '..KnKnnnnnnKnK..',
            '.KnnnKnnnnKnnnK.',
            '.KnnnnnnnnnnnnK.',
            '..KnnKrrKnKnnK..',
            '..KnnnnnnnnnnK..',
            '...KnnnnnnnnKrr.',
            '..KKnnnnnnnKKrr.',
            '..KnnnnnnnnnK...',
            '...KnnnnnnnnK...',
            '....KKnnnnKK....',
            '.....KBBK.......',
            '....KKKK........',
        ]),

        // --- skeleton ---
        skeleton: sprite([
            '................',
            '......KKKK......',
            '.....KwwwwK.....',
            '....KwsKKswK....',
            '....KwKkkKwK....',
            '....KwKkkKwK....',
            '....KwWwwWwK....',
            '.....KwwwwK.....',
            '.....KKwwKK.....',
            '...KKwwwwwwKK...',
            '..KwwKwwwwKwwK..',
            '..KwwKwwwwKwwK..',
            '..KKKwwwwKKKKK..',
            '...KwwKwwKwwK...',
            '....KKK..KKK....',
            '................',
        ]),

        // --- orc ---
        orc: sprite([
            '................',
            '....KKKKKKKK....',
            '...KNNNNNNNNK...',
            '..KNNNNNNNNNNK..',
            '..KNNKwwKNNNK...',
            '.KNNNNNNNNNNNNK.',
            '.KNNKrrKNNNrrNK.',
            '.KNNNNNNNNNNNNK.',
            '..KNNNNNNNNNNK..',
            '.KKNNNNNNNNNNKK.',
            'KNNNNNNNNNNNNNNK',
            'KNNKNNNNNNNNKNNK',
            'KNNNNNNWWNNNNNNK',
            '.KNNNNNNNNNNNNK.',
            '..KBBK....KBBK..',
            '...KKKK..KKKK...',
        ]),

        // --- wraith ---
        wraith: sprite([
            '................',
            '......KvvK......',
            '.....KvvvvK.....',
            '....KvvccvvK....',
            '...KvvccccvvK...',
            '...KvvcKKcvvK...',
            '...KvvccccvvK...',
            '....KvvccvvK....',
            '....KKvvvvKK....',
            '...KvvvvvvvvK...',
            '..KvvvvvvvvvvK..',
            '..KvvKvvvvKvvK..',
            '...KvvvvvvvvK...',
            '....KvvvKvvK....',
            '.....KvK.KvK....',
            '......K...K.....',
        ]),

        // --- spider ---
        spider: sprite([
            '................',
            '..K..K....K..K..',
            '..K.KK....KK.K..',
            '...KKKKKKKKKK...',
            '..K.KssssK.K....',
            '.KKKddddddddKK..',
            'KddddddddddddddK',
            '.KdddssssdddddK.',
            '..KddrrddddddK..',
            '..KddddddddddK..',
            '..KKddddddddKK..',
            '...KddddddddK...',
            '..K..KddddK..K..',
            '.K...KddddK...K.',
            'K....KK..KK....K',
            '................',
        ]),

        // --- boss ---
        boss: sprite([
            '................',
            '..y.K.y.K.y.K...',
            '..KyKyKyKyKyK...',
            '...KyyyyyyyK....',
            '.....KKKKK......',
            '...KKPPPPPPKK...',
            '..KPpPPPPPPpPK..',
            '.KPPppccccppPPK.',
            '.KPPpKccccKpPPK.',
            'KKPPPPccccPPPPKK',
            'KPPPPPPPPPPPPPPK',
            'KPPKPPPPPPKPPPK.',
            'KPPPPKPPPPKPPPK.',
            '.KKPPPPPPPPPPKK.',
            '..KBBK....KBBK..',
            '...KKKK..KKKK...',
        ]),

        // --- gold ---
        gold: sprite([
            '................',
            '................',
            '....KyyyyK......',
            '...KyyYyyyK.....',
            '..KyyyyyyyyK....',
            '.KyyyyyyyyyyK...',
            '.KyyKyyyyKyyK...',
            'KyyKyYyyyyKyKyy.',
            'KyKyyyyyyyyyKyK.',
            'KyyyyyyyyyyyyyyK',
            '.KyyyyyyyyyyyyK.',
            '..KKyyyyyyyyKK..',
            '...KKKKKKKKKK...',
            '................',
            '................',
            '................',
        ]),

        // --- gem ---
        gem: sprite([
            '................',
            '.......KK.......',
            '......KccK......',
            '.....KcWccK.....',
            '....KccWcccK....',
            '...KccccccccK...',
            '..KccWccccccK...',
            '..KccccccccccK..',
            '...KccccccccK...',
            '....KccccccK....',
            '.....KccccK.....',
            '......KccK......',
            '.......KK.......',
            '................',
            '................',
            '................',
        ]),

        // --- potion ---
        potion: sprite([
            '................',
            '......KKKK......',
            '......KwwK......',
            '.....KKwwKK.....',
            '.....KnnnnK.....',
            '....KnnYnnnK....',
            '...KnnnnnnnnK...',
            '...KnnnWnnnnK...',
            '...KnnnnnnnnK...',
            '...KnnnnnnnnK...',
            '...KnnnnnnnnK...',
            '....KnnnnnnK....',
            '.....KKnnKK.....',
            '......KKKK......',
            '................',
            '................',
        ]),

        // --- redKey ---
        redKey: sprite([
            '................',
            '.....KKKKK......',
            '....KrrrrrK.....',
            '...KrrKrrrK.....',
            '...KrKrrrKrK....',
            '....KrrrrrK.....',
            '.....KrrrK......',
            '......KrK.......',
            '......KrK.......',
            '......KrKKK.....',
            '......KrK.rK....',
            '......KrKKK.....',
            '......KrK.......',
            '......KKK.......',
            '................',
            '................',
        ]),

        // --- goldKey ---
        goldKey: sprite([
            '................',
            '.....KKKKK......',
            '....KyyyyyK.....',
            '...KyyKyyyK.....',
            '...KyKyyyKyK....',
            '....KyyyyyK.....',
            '.....KyyyK......',
            '......KyK.......',
            '......KyK.......',
            '......KyKKK.....',
            '......KyK.YK....',
            '......KyKKK.....',
            '......KyK.......',
            '......KKK.......',
            '................',
            '................',
        ]),

        // --- weaponFists ---
        weaponFists: sprite([
            '................',
            '......KKKK......',
            '.....KffffK.....',
            '....KfKffKfK....',
            '....KffffffK....',
            '...KffKffffK....',
            '...KfffffffK....',
            '....KffffKKK....',
            '.....KKbbKK.....',
            '......KbbK......',
            '......KbbK......',
            '......KKKK......',
            '................',
            '................',
            '................',
            '................',
        ]),

        // --- weaponDagger ---
        weaponDagger: sprite([
            '................',
            '.......KK.......',
            '......KWWK......',
            '......KwwK......',
            '.....KwwwwK.....',
            '.....KwwwwK.....',
            '......KwwK......',
            '......KyyK......',
            '.....KKyyKK.....',
            '......KbbK......',
            '......KbbK......',
            '......KbbK......',
            '......KbBK......',
            '......KKKK......',
            '................',
            '................',
        ]),

        // --- weaponSword ---
        weaponSword: sprite([
            '................',
            '.......KK.......',
            '......KWWK......',
            '......KwwwK.....',
            '......KwwK......',
            '.....KwwwwK.....',
            '.....KwwwwK.....',
            '......KwwK......',
            '......KyyK......',
            '.....KKyyKK.....',
            '.....KbbBBK.....',
            '......KbbK......',
            '......KbbK......',
            '......KbBK......',
            '......KKKK......',
            '................',
        ]),

        // --- weaponAxe ---
        weaponAxe: sprite([
            '................',
            '...KKKKKK.......',
            '..KwwwwwwK......',
            '.KwwWWwwwwK.....',
            '.KwwwwwwwwK.....',
            '.KwwwwwwKK......',
            '..KKKwwK........',
            '.....KbK........',
            '.....KbbK.......',
            '.....KbbK.......',
            '.....KbbK.......',
            '.....KbbK.......',
            '.....KbBK.......',
            '.....KKKK.......',
            '................',
            '................',
        ]),

        // --- weaponHammer ---
        weaponHammer: sprite([
            '................',
            '..KKKKKKKKK.....',
            '..KwwWWwwwK.....',
            '..KwwwwwwwK.....',
            '..KwwwwwwwK.....',
            '..KwwWWwwwK.....',
            '..KKKKbKKKK.....',
            '.....KbbK.......',
            '.....KbbK.......',
            '.....KbbK.......',
            '.....KbbK.......',
            '.....KbbK.......',
            '.....KbBK.......',
            '.....KKKK.......',
            '................',
            '................',
        ]),

        // --- door ---
        door: sprite([
            '................',
            '...KKKKKKKKK....',
            '..KBbbbbbbBK....',
            '..KbBbbbbBbK....',
            '..KbbbbBbbbK....',
            '..KbbBbbbBbK....',
            '..KbbbbbbbbK....',
            '..KbbbyybBbK....',
            '..KbbbyybBbK....',
            '..KbbbbbbbbK....',
            '..KbbBbbbBbK....',
            '..KbBbbbbBbK....',
            '..KbbbbbbbbbK...',
            '..KBbbbbbbBbK...',
            '...KKKKKKKKK....',
            '................',
        ]),

        // --- doorRed ---
        doorRed: sprite([
            '................',
            '...KKKKKKKKK....',
            '..KRRrrrrRRK....',
            '..KrRrRRrRrK....',
            '..KRRrRrRRRK....',
            '..KrrRRRRrrK....',
            '..KRRRyyrRRK....',
            '..KRRryyRRRK....',
            '..KRRryKyRRK....',
            '..KRRrrrrRRK....',
            '..KRRRRRRRRK....',
            '..KRRrRrRrrK....',
            '..KRRRRRRRRK....',
            '..KRRrrrrRRK....',
            '...KKKKKKKKK....',
            '................',
        ]),

        // --- doorGold ---
        doorGold: sprite([
            '................',
            '...KKKKKKKKK....',
            '..KyyYYYYyyK....',
            '..KyYyyyyYyK....',
            '..KyyyyYyyyK....',
            '..KyyYYYYyyK....',
            '..KyyyyyyyyK....',
            '..KyyYKyyYyK....',
            '..KyyYKKYyyK....',
            '..KyyyyyyyyK....',
            '..KyyYYYYyyK....',
            '..KyyyyYyyyK....',
            '..KyyyyyyyyK....',
            '..KyyYYYYyyK....',
            '...KKKKKKKKK....',
            '................',
        ]),

        // --- stairs ---
        stairs: sprite([
            '................',
            '...KKKKKKKKK....',
            '...KWWWWWWWK....',
            '...KKKKKKKKK....',
            '...KwwwwwwwK....',
            '...KKKKKKKKK....',
            '...KsssssssK....',
            '...KKKKKKKKK....',
            '...KdddddddK....',
            '...KKKKKKKKK....',
            '...KkkkkkkkK....',
            '...KKKKKKKKK....',
            '....KCCCCCCK....',
            '.....KCCCCK.....',
            '......KCCK......',
            '.......KCK......',
        ]),
    };
})();