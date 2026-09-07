---
layout: null
---
// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const CACHE_NAME = 'social-script-builder-{{ site.github.build_revision | default: site.time | date: "%s" }}';

importScripts('/assets/js/sw-core.js?v={{ site.github.build_revision | default: site.time | date: "%s" }}');
