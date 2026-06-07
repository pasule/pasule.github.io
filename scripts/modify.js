'use strict';
const cheerio = require('cheerio');

/**
 * 在页面插入新顶部图
 * @param {cheerio.Root} $ Root
 */
function insertTopImg($) {
    let header = $('#page-header');
    if (header.length === 0) return;
    let background = header.css('background-image');
    if (!background) return;
    $('#post, #page, #archive, #tag, #category').prepend(`<div class="top-img" style="background-image: ${background};"></div>`);
}

function cleanPostExcerpt(raw, title) {
    if (!raw) return '';

    let text = String(raw)
        .replace(/[\u{1f300}-\u{1faff}\u{2600}-\u{27bf}]/gu, ' ')
        .replace(/graph\s+(TB|LR|TD|BT|RL)\b.*$/i, ' ')
        .replace(/\b(subgraph|end|-->|-\.->|==>|A\[|B\[|C\[|D\[|E\[|F\[).*$/i, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (title) {
        const normalizedTitle = String(title).replace(/\s+/g, ' ').trim();
        if (normalizedTitle && text.startsWith(normalizedTitle)) {
            text = text.slice(normalizedTitle.length).trim();
        }
    }

    text = text
        .replace(/^(本文将带你深入了解|这篇文章关注的不是|本文想解决的问题|适合这篇文章的人|并发编程核心要点|目录概览)\s*/g, '')
        .replace(/\s*(目录概览|核心特征)\s*.*$/g, '')
        .replace(/[|｜]\s*本文.*$/g, '')
        .trim();

    if (text.length > 78) {
        text = `${text.slice(0, 78).replace(/[，。；、\s]+$/g, '')}...`;
    }

    return text;
}

function polishRecentPostCards($) {
    $('#recent-posts .recent-post-item').each((_, item) => {
        const card = $(item);
        const title = card.find('.article-title').text().replace(/\s+/g, ' ').trim();
        const content = card.find('.content');
        const excerpt = cleanPostExcerpt(content.text(), title);
        if (excerpt) content.text(excerpt);
        card.attr('data-pasule-post-card', 'true');
    });
}

hexo.extend.filter.register('after_render:html', function(str, data) {
    let $ = cheerio.load(str, {
        decodeEntities: false
    });
    insertTopImg($);
    polishRecentPostCards($);
    // 确保 modify.css 被加载（绕过 inject fragment cache 问题）
    if ($('link[href="/css/modify.css"]').length === 0) {
        $('head').append('<link rel="stylesheet" href="/css/modify.css">');
    }
    return $.html();
});
