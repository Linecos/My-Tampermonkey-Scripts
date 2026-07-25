// ==UserScript==
// @name         小黑盒帖子图片批量打包下载
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  下载小黑盒帖子原图并按顺序打包ZIP
// @author       Linecos
// @match        https://www.xiaoheihe.cn/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @license      MIT
// @connect      *
// @updateURL    https://cdn.jsdelivr.net/gh/Linecos/My-Tampermonkey-Scripts@main/scripts/HeyBox Image Packing.js
// @downloadURL  https://cdn.jsdelivr.net/gh/Linecos/My-Tampermonkey-Scripts@main/scripts/HeyBox Image Packing.js
// ==/UserScript==


(function () {
    'use strict';

    function loadJSZip() {
        return new Promise(resolve => {
            if (window.JSZip) {
                resolve();
                return;
            }

            let script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    function createButton() {
        let btn = document.createElement("button");
        btn.id = "xh-download-btn";
        btn.innerText = "打包图片";
        btn.onclick = async () => {
            btn.innerText = "正在打包...";
            try {
                await downloadImages();
            } catch (e) {
                console.error(e);
                alert(
                    "下载失败，请查看控制台"
                );
            }
            btn.innerText = "打包图片";
        };
        document.body.appendChild(btn);
    }

    GM_addStyle(`
#xh-download-btn {
    position: fixed;
    right: 30px;
    bottom: 80px;
    z-index: 999999;
    height: 38px;
    padding: 0 20px;
    background: #25262b;
    color: #ffffff;
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    line-height: 38px;
    letter-spacing: .3px;
    box-shadow:
        0 4px 12px rgba(0,0,0,.35);
    transition:
        background .2s ease,
        transform .15s ease,
        box-shadow .2s ease;
}

#xh-download-btn:hover {
    background: #303238;
    box-shadow:
        0 6px 16px rgba(0,0,0,.45);
}

#xh-download-btn:active {
    transform:
        scale(.96);
}
`);

    function getTitle() {
        let title = document.querySelector(
            ".section-title__content"
        )?.innerText;

        if (!title) {
            title = document.querySelector("h1")
                ?.innerText;
        }

        if (!title) {
            title = document.title;
        }

        if (!title) {
            title = "小黑盒帖子";
        }

        return cleanName(
            title.trim()
        );
    }


    function cleanName(name) {
        return name
            .replace(/\s+/g, " ")
            .replace(
                /[\\/:*?"<>|]/g,
                "_"
            )
            .trim();
    }

    function getImages() {
        let imgs = [];

        let indicator = document.querySelector(
            ".header-image__indicator"
        );
        let maxCount = 999;

        if (indicator) {
            let text = indicator.innerText.trim();

            let match = text.match(
                /\/(\d+)/
            );

            if (match) {
                maxCount = parseInt(
                    match[1]
                );
            }
        }

        console.log(
            "帖子图片数量:",
            maxCount
        );

        /*
            找到帖子图片区域

            从 indicator 向上寻找
            包含足够图片的父元素
        */
        
        let container = document;

        if (indicator) {
            let parent = indicator.parentElement;

            while (parent) {
                let count = parent.querySelectorAll(
                    "img"
                ).length;

                if (count >= maxCount) {
                    container = parent;
                    break;
                }

                parent = parent.parentElement;
            }
        }

        container
            .querySelectorAll("img")
            .forEach(img => {
                let src = img.dataset.src
                    || img.dataset.original
                    || img.src;

                if (!src)
                    return;

                src = convertOriginal(src);

                if (
                    !imgs.includes(src)
                ) {
                    imgs.push(src);
                }
            });

        return imgs.slice(
            0,
            maxCount
        );
    }

    function convertOriginal(url) {
        try {
            let u = new URL(url);

            [
                "imageView2",
                "x-oss-process",
                "watermark",
                "resize"
            ]
                .forEach(k => {
                    u.searchParams.delete(k);
                });

            return u.href;
        } catch (e) {
            return url;
        }
    }


    function fetchImage(url) {
        return new Promise(
            (resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    responseType: "arraybuffer",
                    onload: r => {
                        resolve(
                            r.response
                        );
                    },
                    onerror: reject
                });
            });
    }

    async function downloadImages() {
        await loadJSZip();

        let title = getTitle();

        let images = getImages();

        if (images.length === 0) {
            alert(
                "没有找到帖子图片"
            );
            return;
        }

        console.log(
            "图片列表:",
            images
        );

        let zip = new JSZip();

        for (
            let i = 0;
            i < images.length;
            i++
        ) {
            let url = images[i];

            try {
                console.log(
                    "下载:",
                    i + 1,
                    url
                );
                let data = await fetchImage(url);

                let ext = "jpg";

                if (
                    url.includes(".png")
                ) {
                    ext = "png";
                } else if (
                    url.includes(".webp")
                ) {
                    ext = "webp";
                }

                zip.file(
                    `${title}-${i + 1}.${ext}`,
                    data
                );
            } catch (e) {
                console.warn(
                    "下载失败:",
                    url
                );
            }
        }

        let blob = await zip.generateAsync({
            type: "blob"
        });

        let a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${title}.zip`;
        a.click();

        setTimeout(() => {
            URL.revokeObjectURL(
                a.href
            );
        }, 1000);
    }

    setTimeout(() => {
        createButton();
    }, 2000);

})();