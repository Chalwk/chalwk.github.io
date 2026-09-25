// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.
//
// shapes.js - draws every scene object as plain SVG markup, centred on its
// own (0,0) so the caller only needs `<g transform="translate(x y) scale(s)">`.

function starPoints(spikes, outerR, innerR) {
    const pts = [];
    const step = Math.PI / spikes;
    let rot = -Math.PI / 2;
    for (let i = 0; i < spikes; i++) {
        pts.push(`${(Math.cos(rot) * outerR).toFixed(1)},${(Math.sin(rot) * outerR).toFixed(1)}`);
        rot += step;
        pts.push(`${(Math.cos(rot) * innerR).toFixed(1)},${(Math.sin(rot) * innerR).toFixed(1)}`);
        rot += step;
    }
    return pts.join(' ');
}

function drawObjectShape(typeId, color) {
    switch (typeId) {
        case 'sun': {
            let rays = '';
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const x1 = Math.cos(a) * 12, y1 = Math.sin(a) * 12;
                const x2 = Math.cos(a) * 19, y2 = Math.sin(a) * 19;
                rays += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
            }
            return `${rays}<circle r="10" fill="${color}"/>`;
        }
        case 'cloud':
            return `<ellipse cx="-8" cy="2" rx="10" ry="8" fill="${color}"/><ellipse cx="6" cy="0" rx="12" ry="10" fill="${color}"/><ellipse cx="-1" cy="7" rx="14" ry="7" fill="${color}"/>`;
        case 'tree':
            return `<rect x="-3" y="4" width="6" height="14" fill="#7c4a24"/><circle cx="0" cy="-4" r="14" fill="${color}"/><circle cx="-9" cy="4" r="9" fill="${color}"/><circle cx="9" cy="4" r="9" fill="${color}"/>`;
        case 'mushroom':
            return `<rect x="-4" y="0" width="8" height="12" rx="2" fill="#fde8cf"/><path d="M -14 0 Q 0 -20 14 0 Z" fill="${color}"/><circle cx="-6" cy="-8" r="2" fill="#ffffff" opacity="0.85"/><circle cx="5" cy="-11" r="2.4" fill="#ffffff" opacity="0.85"/><circle cx="1" cy="-4" r="1.6" fill="#ffffff" opacity="0.7"/>`;
        case 'star':
            return `<polygon points="${starPoints(5, 16, 7)}" fill="${color}"/>`;
        case 'heart':
            return `<path d="M0 14 C -16 2 -14 -12 -2 -12 C 2 -12 0 -6 0 -6 C 0 -6 -2 -12 2 -12 C 14 -12 16 2 0 14 Z" fill="${color}"/>`;
        case 'moon':
            return `<path d="M10 -14 A 14 14 0 1 0 10 14 A 11 11 0 1 1 10 -14 Z" fill="${color}"/>`;
        case 'flower': {
            let petals = '';
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                const x = Math.cos(a) * 9, y = Math.sin(a) * 9;
                const deg = (a * 180 / Math.PI + 90).toFixed(1);
                petals += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="9" transform="rotate(${deg} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${color}"/>`;
            }
            return `${petals}<circle r="5.5" fill="#fde68a"/>`;
        }
        case 'gem':
            return `<polygon points="0,-16 12,-4 8,14 -8,14 -12,-4" fill="${color}"/><polygon points="0,-16 12,-4 0,-4" fill="#ffffff" opacity="0.35"/>`;
        case 'ghost':
            return `<path d="M -12 12 L -12 -4 A 12 12 0 0 1 12 -4 L 12 12 L 8 8 L 4 12 L 0 8 L -4 12 L -8 8 Z" fill="${color}"/><circle cx="-4" cy="-3" r="1.8" fill="#1f2937"/><circle cx="4" cy="-3" r="1.8" fill="#1f2937"/>`;
        case 'balloon':
            return `<line x1="0" y1="12" x2="0" y2="20" stroke="#6b7280" stroke-width="1.4"/><ellipse cx="0" cy="-2" rx="11" ry="14" fill="${color}"/><polygon points="-3,11 3,11 0,16" fill="${color}"/>`;
        case 'fish':
            return `<polygon points="14,0 -10,-10 -6,0 -10,10" fill="${color}"/><polygon points="-10,-10 -18,-14 -14,-2" fill="${color}" opacity="0.8"/><circle cx="7" cy="-2" r="1.6" fill="#1f2937"/>`;
        default:
            return `<circle r="10" fill="${color}"/>`;
    }
}
