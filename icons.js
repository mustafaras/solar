// ============================================================
// SOLAR 3D · ICON SYSTEM
// A single curated set of monoline icons (24×24, 1.6px stroke,
// currentColor) shared by BOTH React roots (#ui-root + #addons-root)
// via window.__ICONS. No emoji anywhere — every glyph is a precise,
// consistent vector that inherits the surrounding text colour.
// ============================================================
(function () {
  window.__ICONS = {
    // ── navigation / view ──
    search:    '<circle cx="11" cy="11" r="6.5"/><path d="M21 21l-5.2-5.2"/>',
    list:      '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/>',
    library:   '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/><path d="M9 7h6"/>',
    measure:   '<rect x="2.6" y="8.4" width="18.8" height="7.2" rx="1.2"/><path d="M7 8.4v2.4M11 8.4v3.2M15 8.4v2.4M19 8.4v3.2"/>',
    compare:   '<path d="M6.5 7.5h11M17.5 7.5l-3-3M17.5 7.5l-3 3"/><path d="M17.5 16.5h-11M6.5 16.5l3-3M6.5 16.5l3 3"/>',
    topdown:   '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.6"/><path d="M12 2v3.2M12 18.8V22M2 12h3.2M18.8 12H22"/>',
    reset:     '<path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4"/><path d="M4.2 4.4v3.6h3.6"/>',
    photo:     '<path d="M4 8.5A1.8 1.8 0 0 1 5.8 6.7h2.1l1.1-1.7A1 1 0 0 1 10.8 4.5h2.4a1 1 0 0 1 .8.5l1.1 1.7h2.1A1.8 1.8 0 0 1 19 8.5v8.2a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 16.7z"/><circle cx="11.5" cy="12.4" r="3.1"/>',
    share:     '<circle cx="6" cy="12" r="2.4"/><circle cx="17" cy="6" r="2.4"/><circle cx="17" cy="18" r="2.4"/><path d="M8.2 11 14.8 7.1M8.2 13l6.6 3.9"/>',
    play:      '<path d="M8 5.4v13.2l11-6.6z"/>',
    pause:     '<path d="M9 5v14M15 5v14"/>',
    stop:      '<rect x="6" y="6" width="12" height="12" rx="1.4"/>',
    close:     '<path d="M6 6l12 12M18 6L6 18"/>',
    chevron:   '<path d="M6 9l6 6 6-6"/>',
    target:    '<circle cx="12" cy="12" r="7.2"/><path d="M12 2.3v3.3M12 18.4V21.7M2.3 12h3.3M18.4 12h3.3"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    calendar:  '<rect x="4" y="5.2" width="16" height="15" rx="2"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4"/>',
    link:      '<path d="M9.5 14.5l5-5"/><path d="M11 7.6 12.4 6.2a3.4 3.4 0 0 1 4.8 4.8l-1.4 1.4"/><path d="M13 16.4l-1.4 1.4a3.4 3.4 0 0 1-4.8-4.8l1.4-1.4"/>',
    download:  '<path d="M12 4v10.5M12 14.5l-3.6-3.6M12 14.5l3.6-3.6"/><path d="M5 18.5h14"/>',
    // ── add-on dock + layers ──
    clock:     '<circle cx="12" cy="12" r="7.6"/><path d="M12 7.3v5l3.4 2"/>',
    balance:   '<path d="M12 4v16M7.5 20h9"/><path d="M4.5 8.2h15M12 4.6 4.5 8.2M12 4.6 19.5 8.2"/><path d="M4.5 8.2 2.4 13a2.1 2.1 0 0 0 4.2 0zM19.5 8.2 17.4 13a2.1 2.1 0 0 0 4.2 0z"/>',
    planet:    '<circle cx="12" cy="11" r="5"/><ellipse cx="12" cy="11.4" rx="9.3" ry="3.1" transform="rotate(-22 12 11.4)"/>',
    quiz:      '<circle cx="12" cy="12" r="7.8"/><path d="M9.7 9.6a2.4 2.4 0 1 1 3.4 2.2c-.9.4-1.2 1-1.2 1.8"/><circle cx="11.9" cy="16.2" r="0.7" fill="currentColor" stroke="none"/>',
    orbits:    '<circle cx="12" cy="12" r="1.9"/><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)"/>',
    comet:     '<circle cx="15.5" cy="8.5" r="2.9"/><path d="M13.2 10.6 4 20M8.6 9.2 4.6 10.4M11 13.4 9.6 17.6"/>',
    star4:     '<path d="M12 3.2l1.7 6.6 6.6 1.7-6.6 1.7L12 20.8l-1.7-6.6L3.7 12.5l6.6-1.7z"/>',
    speaker:   '<path d="M5 9.3v5.4h3.1l4.3 3.4V5.9L8.1 9.3z"/><path d="M16 9.7a3.8 3.8 0 0 1 0 4.6M18.4 7.4a7 7 0 0 1 0 9.2"/>',
    device:    '<rect x="8" y="3.4" width="8" height="17.2" rx="2"/><path d="M4.6 9.2A7 7 0 0 1 7.4 6M19.4 14.8a7 7 0 0 1-2.8 3.2"/>',
    // ── achievement badges (monoline, tier colour from caller) ──
    launch:    '<path d="M12 3.2l4.4 6.2h-2.9v8.4h-3V9.4H7.6z"/>',
    bolt:      '<path d="M13.2 3 5.4 13.2h5l-1 7.8 7.8-11h-5z"/>',
    book:      '<path d="M12 6.2c-2-1.5-5.2-1.5-7.2 0v11.2c2-1.5 5.2-1.5 7.2 0 2-1.5 5.2-1.5 7.2 0V6.2c-2-1.5-5.2-1.5-7.2 0z"/><path d="M12 6.2v11.2"/>',
    medal:     '<circle cx="12" cy="14.2" r="5.2"/><path d="M9.4 9.6 7.2 3.2M14.6 9.6l2.2-6.4"/><path d="M12 12.1l1 2 .2.4-1.6 1.2.6 2-1.2-1-1.2 1 .6-2-1.6-1.2 2-.4z" fill="currentColor" stroke="none"/>',
    moon:      '<path d="M15.6 4.4a8 8 0 1 0 0 15.2 6.4 6.4 0 0 1 0-15.2z"/>',
    probe:     '<rect x="9.5" y="9.5" width="5" height="5" rx="0.8" transform="rotate(45 12 12)"/><path d="M6 6l2.5 2.5M18 6l-2.5 2.5M6 18l2.5-2.5M18 18l-2.5-2.5"/>',
    flag:      '<path d="M6 21V4M6 4.5h11l-2.2 3.5L17 11.5H6"/>',
  };
})();
