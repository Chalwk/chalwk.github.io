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
        e: '#fde047', // eye glow (bright yellow)
        i: '#dbeafe', // pale icy highlight (frost/glass/spectral shine)

        // --- terrain palette (walls + floors) ---
        g: '#0d1220', // mortar / grout (very dark)
        A: '#2a3142', // stone shadow (bottom of brick)
        a: '#48516b', // stone mid (brick face)
        G: '#6a7590', // stone highlight (top of brick / bevel)
        h: '#0f1524', // floor base
        H: '#1a2136', // floor light speckle
        j: '#080c14', // floor dark speckle
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
        // ------------------------------------------------------------------
        // TERRAIN - walls and floors.
        //
        // Walls use a running-bond brick layout. The top brick row (y0-7)
        // has vertical joints at x=0 and x=8; the bottom row (y8-15) is
        // offset so its joints sit at x=4 and x=12. That means when two
        // wall tiles sit side by side the joints continue naturally across
        // the seam - no grid line where the cells meet.
        //
        // Each brick face is beveled: highlight on the top row, mid stone
        // through the body, darker stone at the bottom for a shallow 3D
        // read. The variant letters differ only in a few chipped/scuffed
        // pixels, so large wall runs pick up subtle texture without looking
        // obviously repeating.
        // ------------------------------------------------------------------
        wallA: sprite([
            'gGGGGGGGgGGGGGGG',
            'gaaaaaaagaaaaaaa',
            'gaaaaaaagaaaaaaa',
            'gaaaaaaagaaaaaaa',
            'gaaaaaaagaaaaaaa',
            'gAaaaaaagAaaaaaa',
            'gAAAAAAAgAAAAAAA',
            'gggggggggggggggg',
            'GGGGgGGGGGGGgGGG',
            'aaaagaaaaaaagaaa',
            'aaaagaaaaaaagaaa',
            'aaaagaaaaaaagaaa',
            'aaaagaaaaaaagaaa',
            'AaaagAaaaaaagAaa',
            'AAAAgAAAAAAAgAAA',
            'gggggggggggggggg',
        ]),

        wallB: sprite([
            'gGGGGGGGgGGGGGGG',
            'gaaaaaaagaaaaaaa',
            'gaaajaaagaaaaaaa',
            'gaaaaaaagaaaajaa',
            'gaaaaaaagaaaaaaa',
            'gAajaaaagAaaaaaa',
            'gAAAAAAAgAAAAAAA',
            'gggggggggggggggg',
            'GGGGgGGGGGGGgGGG',
            'aaaagaaaaaaagaaa',
            'aaaagaaajaaagaaa',
            'aaajgaaaaaaagaaa',
            'aaaagaaaaaaagaaa',
            'AaaagAaaaaaagAaa',
            'AAAAgAAAAAAAgAAA',
            'gggggggggggggggg',
        ]),

        wallC: sprite([
            'gGGGGGGGgGGGGGGG',
            'gaajaaaagaaaaaaa',
            'gaaaaaaagaaaajaa',
            'gaaaaaaagaaaaaaa',
            'gaaaaaaagaaaaaaa',
            'gAaaaaaagAaaaaaa',
            'gAAjAAAAgAAAAAAA',
            'gggggggggggggggg',
            'GGGGgGGGGGGGgGGG',
            'aaaagaaaaaaagaaa',
            'aaaagaaajaaagaaa',
            'aaaagaaaaaaagaaa',
            'aaajgaaaaaaagaaa',
            'AaaagAaaaaaagAaa',
            'AAAAgAAAAAAAgAAA',
            'gggggggggggggggg',
        ]),

        floorA: sprite([
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
        ]),

        floorB: sprite([
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhHhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhjhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhH',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhjhhhhhhh',
            'hhhhhhhhhhhhhhhh',
        ]),

        floorC: sprite([
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhHhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhjhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhHhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
            'hhhhhhhhhhhhhhhh',
        ]),

        // --- player --- (faces right; CSS mirrors it for left movement, do not edit facing)
        player: sprite([
            '........r.......',
            '.......RRR......',
            '.....KKKKKK.....',
            '....KyYyyyyK....',
            '....KyyyyyyK....',
            '....KKKKKKKK....',
            '.....KKKKKKK....',
            '.....KffKffK....',
            '.....KfffffK....',
            '.KRR.KfkkkfK....',
            '.KRr..KKKKKUK...',
            '.KRrUUyyyyUwU...',
            '.KRrUUuuuuUUU...',
            '.KRrKuuuWuuuK...',
            '.KRRKBBByBBBK...',
            '......bb.bb.....',
        ]),

        // --- rat ---
        rat: sprite([
            '................',
            '................',
            '................',
            '...KK......KK...',
            '...ds......sd...',
            '...dd......dd...',
            '...KddddddddK...',
            '..KssddddddssK..',
            '..Kssrssssrsss..',
            '..KssssssssssKs.',
            '..KssssssssssKs.',
            '..KssKssssKsss..',
            '...dd.KKKK.dd...',
            '...dd.kkkk.dd...',
            '...KKKKKKKKKK...',
            '................',
        ]),

        // --- goblin ---
        goblin: sprite([
            '................',
            '................',
            '................',
            '................',
            '.....KKKKKK.....',
            '..KnKnKnnKnKnK..',
            '..nnKnynnynKnn..',
            '....KnnnnnnK....',
            '....KnNNNNnK.W..',
            '....KKKKKKKK.s..',
            '...KNNKKKKKKKs..',
            '...KNNnnnnnnKs..',
            '...KnnnnnnnnKs..',
            '...Knnnnnnnnb...',
            '...KBBBBBBBBK...',
            '.....kk..kk.....',
        ]),

        // --- skeleton ---
        skeleton: sprite([
            '................',
            '................',
            '.....KKKKKK.....',
            '....KwwwwwwK....',
            '....KwcKwcKK....',
            '....KwKKKKKK....',
            '....KwwwKwwK....',
            '......KssK......',
            '......Kssw......',
            '...KKKKKKKKKK...',
            '...wKssssssKw...',
            '...wKwKwKwKKw...',
            '...wKssssssKw...',
            '...KKKKKKKKKK...',
            '....K.KKKKKK....',
            '......w..w......',
        ]),

        // --- orc ---
        orc: sprite([
            '................',
            '................',
            '.....KKKKKK.....',
            '....KnKnnKnK....',
            '....KNrNNrNK....',
            '....KNnnnnNK....',
            '....KNnKKnNK....',
            '....KKWKKWKK....',
            '.KnnnKKKKKKnnnK.',
            '.KnnnNNNNNNnnnK.',
            '.KNNBBByyBBBNNK.',
            '.KNNNNNNNNNNNNK.',
            '...KNNNNNNNNK...',
            '...KNNNNNNNNK...',
            '...KKKKKKKKKK...',
            '....BBB..BBB....',
        ]),

        // --- wraith ---
        wraith: sprite([
            '................',
            '.....KKKKKK.....',
            '.......PPP......',
            '......KKKKP.....',
            '....KppppppK....',
            '....KPKKKKPK....',
            '....KPKccKPK....',
            '....KPKKKKPK....',
            '....KPPPPPPK....',
            '..KppppppppppK..',
            '..KKPPPPPPPPKK..',
            '..KKPPPPPPPPKK..',
            '..KKPPPPPPPPKK..',
            '....PpPccPpP....',
            '.....pCccCp.....',
            '......CccC......',
        ]),

        // --- spider ---
        spider: sprite([
            '................',
            '................',
            '................',
            'KK............KK',
            '.KK..........KK.',
            '..Kd.KKKKKK.dK..',
            '...dKKdrrdKKd...',
            '....KKddddKK....',
            '...KKKKKKKKKK...',
            '..dKdssdddddKd..',
            '.KdKddkrrkddKdK.',
            'KK.KdddrrdddK.KK',
            'K..KddddddddK..K',
            '...KKKKKKKKKK...',
            '................',
            '................',
        ]),

        // --- boss --- (the Crypt Warden)
        boss: sprite([
            '....y..y...y....',
            '...KKyyKyyyKK...',
            '...KKKKKKKKKK...',
            '.....KKKKKK.....',
            '....KiciiciK....',
            '....KiiiiiiK....',
            '....KKKKKKKK....',
            '....KKKKKKKK....',
            'KpppKKKKKKKKpppK',
            'KpppPPcWccPPpppK',
            'KPPPPPccWcPPPPPK',
            'KPKKKKKKKKKKKKPK',
            '.KPPPPPPPPPPPPK.',
            '.KPPPPPPPPPPPPK.',
            '.KPPPPPPPPPPPPK.',
            '..PK.PK..KP.KP..',
        ]),

        // --- gold ---
        gold: sprite([
            '................',
            '.....KKKKKK.....',
            '...KKyyyyyyKK...',
            '..KyyWWYYyyyyK..',
            '.KyyWWYYyyyyyyK.',
            '.KyyWYYyyyyyyyK.',
            'KyyyyYyyyyyyyyyK',
            'KyyyyyyyyyyyyyyK',
            'KyyyyyyyyyyyyyyK',
            'KyyyyyyyyyyyyyyK',
            '.KyyyyyyyyyyyyK.',
            '.KyyyyyyyyyyybK.',
            '..KyyyyyyyybbK..',
            '...KKyyyyyyKK...',
            '.....KKKKKK.....',
            '................',
        ]),

        // --- gem ---
        gem: sprite([
            '................',
            '................',
            '......KKKK......',
            '.....KWWWWK.....',
            '...KiiiiiiiiK...',
            '...KccccccccK...',
            '..KccccciccccK..',
            '..KccccWcccccK..',
            '..KccccccccccK..',
            '...KCCCCCCCCK...',
            '...KCCCCCCCCK...',
            '.....KCCCCK.....',
            '......KCCK......',
            '.......KK.......',
            '................',
            '................',
        ]),

        // --- potion ---
        potion: sprite([
            '................',
            '.......KK.......',
            '.......ww.......',
            '.......sK.......',
            '.......Ks.......',
            '.....KKKKKK.....',
            '...K.KnnnnK.K...',
            '...KnwnnnnnnK...',
            '...KnwlnnnnnK...',
            '...KnwnnnlnnK...',
            '...KnnnYYnnnK...',
            '...KnnnnnnnnK...',
            '...KKKKKKKKKK...',
            '...K.KKKKKK.K...',
            '................',
            '................',
        ]),

        // --- redKey ---
        redKey: sprite([
            '................',
            '................',
            '................',
            '...KKKK.........',
            '..KrrrrK........',
            '.KrWKKrKKKKKK...',
            '.KrKKKKrrrrrrK..',
            '.KrKKKKrrrrrrK..',
            '.KrrKKrKKKKrrrK.',
            '..KrrrrK.KKrrrK.',
            '...KKKK...KKKK..',
            '................',
            '................',
            '................',
            '................',
            '................',
        ]),

        // --- goldKey ---
        goldKey: sprite([
            '................',
            '................',
            '................',
            '...KKKK.........',
            '..KyyyyK........',
            '.KyYKKyKKKKKK...',
            '.KyKKKKyyyyyyK..',
            '.KyKKKKyyyyyyK..',
            '.KyyKKyKKKKyyyK.',
            '..KyyyyK.KKyyyK.',
            '...KKKK...KKKK..',
            '................',
            '................',
            '................',
            '................',
            '................',
        ]),

        // --- weaponFists ---
        weaponFists: sprite([
            '................',
            '................',
            '................',
            '................',
            '................',
            '....KKwwwwKK....',
            '....KfKfKKfK....',
            '....KfKfKKfK....',
            '..KKfffffffK....',
            '..KfffKKKKKK....',
            '..KKKKbbbbK.....',
            '.....KBBBBK.....',
            '.....KbbbbK.....',
            '.....KKKKKK.....',
            '................',
            '................',
        ]),

        // --- weaponDagger ---
        weaponDagger: sprite([
            '................',
            '........K.......',
            '.......KwK......',
            '......KWwK......',
            '......KWwK......',
            '......KWwK......',
            '.....KKKKKK.....',
            '....KyyyyyyK....',
            '......KBBK......',
            '......KBBK......',
            '......KBBK......',
            '......KBBK......',
            '......yyyy......',
            '......KKKK......',
            '................',
            '................',
        ]),

        // --- weaponSword ---
        weaponSword: sprite([
            '........K.......',
            '......KWwK......',
            '......KWwK......',
            '......KWwK......',
            '......KWwK......',
            '......KWwK......',
            '......KWwK......',
            '......KWwK......',
            '....KKKKKKKK....',
            '...KyyyyyyyyK...',
            '......KBBK......',
            '......KBBK......',
            '......KBBK......',
            '......yyyy......',
            '......KKKK......',
            '................',
        ]),

        // --- weaponAxe ---
        weaponAxe: sprite([
            '................',
            '................',
            '..KKKKKddK......',
            '.KswsssddK......',
            '.KswsssddK......',
            '.KswsssddK......',
            '.KswsssddK......',
            '..sssssdBB......',
            '.......KbBK.....',
            '.......KBBK.....',
            '.......KBBK.....',
            '.......KBBK.....',
            '.......KBBK.....',
            '.......KBBK.....',
            '.......KKKK.....',
            '................',
        ]),

        // --- weaponHammer ---
        weaponHammer: sprite([
            '................',
            '................',
            '..KddKKKKKKddK..',
            '..KddwwwwwwddK..',
            '..KddsskkssddK..',
            '..KddssssssddK..',
            '..KddKKKKKKddK..',
            '......KBBK......',
            '......KBBK......',
            '......KBBK......',
            '......KBBK......',
            '......KBBK......',
            '......KBBK......',
            '......KBBK......',
            '.......KKKK.....',
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
            '.yoy............',
            '.KBKKKKKKKKKKKK.',
            '.KYKKKKKKKKKKKK.',
            '.wwywwwwwwwwwww.',
            '.KKKKKKKKKKKKKK.',
            '.KssssssssssssK.',
            '.K.KKKKKKKKKK.K.',
            '.K.dddddddddd.K.',
            '.K..KKKKKKKK..K.',
            '.K..kkkkkkkk..K.',
            '.K...KKKKKK...K.',
            '.K...KKKKKK...K.',
            '.K....KKKK....K.',
            '.K....KKKK....K.',
            '................',
            '................',
        ]),
    };
})();