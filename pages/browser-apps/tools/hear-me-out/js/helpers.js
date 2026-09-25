// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

export function isUrl(str) {
    if (!str) return false;
    if (str.startsWith('data:')) return true;

    try {
        const u = new URL(str);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

export function isImageSource(str) {
    if (!str) return false;
    return str.startsWith('data:image/') || isUrl(str);
}