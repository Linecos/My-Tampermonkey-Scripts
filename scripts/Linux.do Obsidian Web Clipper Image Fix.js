// ==UserScript==
// @name         Linux.do Obsidian Web Clipper Image Fix
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动修复 Linux.do 帖子中的 lightbox-wrapper，以便 Obsidian Web Clipper 正确剪藏图片为标准的 ![](url) 格式。
// @author       Linecos
// @match        *://linux.do/*
// @match        *://*.linux.do/*
// @grant        none
// @license      MIT
// @run-at       document-start
// @updateURL    https://cdn.jsdelivr.net/gh/Linecos/My-Tampermonkey-Scripts@main/scripts/Linux.do Obsidian Web Clipper Image Fix.js
// @downloadURL  https://cdn.jsdelivr.net/gh/Linecos/My-Tampermonkey-Scripts@main/scripts/Linux.do Obsidian Web Clipper Image Fix.js
// ==/UserScript==

(function() {
    'use strict';

    function processLightbox(wrapper) {
        if (!wrapper || wrapper.dataset.fixed === 'true') return;
        wrapper.dataset.fixed = 'true';

        const a = wrapper.querySelector('a.lightbox');
        const img = wrapper.querySelector('img');

        // 优先从 a 标签获取原图链接，其次从 img 获取
        const url = a ? a.href : (img ? img.src : '');

        if (url) {
            const newImg = document.createElement('img');
            newImg.src = url;
            newImg.alt = img ? (img.alt || 'image') : 'image';

            newImg.style.maxWidth = '100%';
            newImg.style.height = 'auto';
            newImg.style.display = 'block';

            wrapper.replaceWith(newImg);
        }
    }

    // 1. 处理页面初始加载时已存在的节点
    function init() {
        document.querySelectorAll('.lightbox-wrapper').forEach(processLightbox);
    }

    // 2. 使用 MutationObserver 监听 DOM 变化（应对 Discourse 的 SPA 路由切换和滚动懒加载）
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // 1 表示 Element 节点
                        if (node.classList && node.classList.contains('lightbox-wrapper')) {
                            processLightbox(node);
                        } else {
                            // 检查新加入的节点内部是否包含 lightbox-wrapper
                            const wrappers = node.querySelectorAll('.lightbox-wrapper');
                            if (wrappers.length > 0) {
                                wrappers.forEach(processLightbox);
                            }
                        }
                    }
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
