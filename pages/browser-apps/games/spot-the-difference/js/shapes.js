// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.
//
// Each object is drawn centred on its own (0,0). The caller wraps it in
// a translate and scale group.

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
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * Math.PI * 2;
                const x1 = Math.cos(a) * 12, y1 = Math.sin(a) * 12;
                const x2 = Math.cos(a) * 20, y2 = Math.sin(a) * 20;
                rays += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>`;
            }
            return `${rays}<circle r="11" fill="${color}"/><circle cx="-3.5" cy="-2" r="1.5" fill="#78350f"/><circle cx="3.5" cy="-2" r="1.5" fill="#78350f"/><path d="M -4 2 Q 0 5 4 2" fill="none" stroke="#78350f" stroke-width="1.4" stroke-linecap="round"/>`;
        }
        case 'cloud':
            return `<ellipse cx="-9" cy="3" rx="9" ry="7" fill="${color}"/><ellipse cx="7" cy="1" rx="11" ry="9" fill="${color}"/><ellipse cx="0" cy="7" rx="15" ry="7" fill="${color}"/><ellipse cx="-2" cy="-3" rx="8" ry="6" fill="#ffffff" opacity="0.4"/>`;
        case 'tree':
            return `<rect x="-3" y="6" width="6" height="16" rx="1.5" fill="#7c4a24"/><rect x="-1" y="8" width="1.2" height="12" fill="#5c3616" opacity="0.6"/><circle cx="0" cy="-6" r="13" fill="${color}"/><circle cx="-10" cy="2" r="9" fill="${color}"/><circle cx="10" cy="2" r="9" fill="${color}"/><circle cx="-4" cy="-10" r="5" fill="#ffffff" opacity="0.18"/>`;
        case 'mushroom':
            return `<rect x="-4" y="0" width="8" height="13" rx="2.5" fill="#fde8cf"/><path d="M -15 0 Q 0 -21 15 0 Z" fill="${color}"/><circle cx="-7" cy="-8" r="2.2" fill="#ffffff" opacity="0.9"/><circle cx="6" cy="-11" r="2.6" fill="#ffffff" opacity="0.9"/><circle cx="1" cy="-4" r="1.7" fill="#ffffff" opacity="0.75"/><circle cx="-10" cy="-3" r="1.4" fill="#ffffff" opacity="0.7"/>`;
        case 'star':
            return `<polygon points="${starPoints(5, 17, 7.5)}" fill="${color}"/><polygon points="${starPoints(5, 10, 4.6)}" fill="#ffffff" opacity="0.25"/>`;
        case 'heart':
            return `<path d="M0 14 C -16 2 -14 -12 -2 -12 C 2 -12 0 -6 0 -6 C 0 -6 -2 -12 2 -12 C 14 -12 16 2 0 14 Z" fill="${color}"/><ellipse cx="-5" cy="-6" rx="2.5" ry="1.8" fill="#ffffff" opacity="0.35"/>`;
        case 'moon':
            return `<path d="M10 -14 A 14 14 0 1 0 10 14 A 11 11 0 1 1 10 -14 Z" fill="${color}"/><circle cx="1" cy="-4" r="1.8" fill="#94a3b8" opacity="0.5"/><circle cx="5" cy="4" r="1.2" fill="#94a3b8" opacity="0.5"/>`;
        case 'flower': {
            let petals = '';
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                const x = Math.cos(a) * 9, y = Math.sin(a) * 9;
                const deg = (a * 180 / Math.PI + 90).toFixed(1);
                petals += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="9" transform="rotate(${deg} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${color}"/>`;
            }
            return `${petals}<circle r="5.5" fill="#fde68a"/><circle r="2.8" fill="#f59e0b"/>`;
        }
        case 'gem':
            return `<polygon points="0,-16 12,-4 8,14 -8,14 -12,-4" fill="${color}"/><polygon points="0,-16 12,-4 0,-4" fill="#ffffff" opacity="0.4"/><polygon points="0,-16 -12,-4 0,-4" fill="#ffffff" opacity="0.15"/><polygon points="0,-4 8,14 -8,14" fill="#000000" opacity="0.15"/>`;
        case 'ghost':
            return `<path d="M -12 12 L -12 -4 A 12 12 0 0 1 12 -4 L 12 12 L 8 8 L 4 12 L 0 8 L -4 12 L -8 8 Z" fill="${color}"/><circle cx="-4" cy="-3" r="1.8" fill="#1f2937"/><circle cx="4" cy="-3" r="1.8" fill="#1f2937"/><path d="M -3 2 Q 0 4 3 2" fill="none" stroke="#1f2937" stroke-width="1" stroke-linecap="round"/>`;
        case 'balloon':
            return `<line x1="0" y1="12" x2="0" y2="22" stroke="#6b7280" stroke-width="1.2"/><ellipse cx="0" cy="-2" rx="11" ry="14" fill="${color}"/><ellipse cx="-3" cy="-6" rx="3" ry="5" fill="#ffffff" opacity="0.35"/><polygon points="-3,11 3,11 0,16" fill="${color}"/>`;
        case 'fish':
            return `<polygon points="14,0 -10,-10 -6,0 -10,10" fill="${color}"/><polygon points="-10,-10 -18,-14 -14,-2" fill="${color}" opacity="0.85"/><polygon points="-10,10 -18,14 -14,2" fill="${color}" opacity="0.85"/><circle cx="7" cy="-2" r="1.8" fill="#1f2937"/><circle cx="7.5" cy="-2.5" r="0.55" fill="#ffffff"/>`;
        case 'bird':
            return `<ellipse cx="0" cy="2" rx="10" ry="7" fill="${color}"/><circle cx="7" cy="-3" r="5" fill="${color}"/><polygon points="11,-3 16,-2 11,-1" fill="#fb923c"/><circle cx="8" cy="-4" r="1.1" fill="#1f2937"/><path d="M -3 0 Q -8 -5 -12 -1 Q -8 1 -3 2 Z" fill="${color}" opacity="0.85"/><line x1="-2" y1="8" x2="-2" y2="12" stroke="#78350f" stroke-width="1.4"/><line x1="2" y1="8" x2="2" y2="12" stroke="#78350f" stroke-width="1.4"/>`;
        case 'bush':
            return `<ellipse cx="-9" cy="4" rx="10" ry="9" fill="${color}"/><ellipse cx="9" cy="4" rx="10" ry="9" fill="${color}"/><ellipse cx="0" cy="-2" rx="12" ry="11" fill="${color}"/><circle cx="-4" cy="-6" r="2" fill="#ffffff" opacity="0.18"/>`;
        default:
            return `<circle r="10" fill="${color}"/>`;
    }
}