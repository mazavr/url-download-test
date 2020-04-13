import test from 'ava';
import timeSpan from 'time-span';
import inRange from 'in-range';

import {download} from '../downloader'

function getEnd(ms) {
    return {start: ms, end: ms + 80}
}

test('work with []', t => {
    return download([]).then(t.pass, t.fail)
});

test('concurrency: 1', t => {
    let end = timeSpan();
    let urls = [
        'http://a.a/#200',
        'http://a.a/a#200',
        'http://a.a/b#200',
        'http://a.b/#200',
        'http://a.b/a#200',
        'http://a.b/b#200',
    ];
    return download(urls, 1, 1).then((res) => {
        let ended = end();
        t.log(ended);
        t.true(inRange(ended, getEnd(1200)));
    })
});

test('concurrency: 1, queue concurrency: 2', t => {
    let end = timeSpan();
    let urls = [
        'http://a.a/#200',
        'http://a.a/a#200',
        'http://a.a/b#200',
        'http://a.b/#200',
        'http://a.b/a#200',
        'http://a.b/b#200',
    ];
    return download(urls, 2, 1).then(() => {
        let ended = end();
        t.true(inRange(ended, getEnd(1200)));
    })
});

test('concurrency: 2, queue concurrency: 2', t => {
    let end = timeSpan();
    let urls = [
        'http://a.a/#200',
        'http://a.a/a#200',
        'http://a.a/b#200',
        'http://a.b/#200',
        'http://a.b/a#200',
        'http://a.b/b#200',
    ];
    return download(urls, 2, 2).then(() => {
        let ended = end();
        t.true(inRange(ended, getEnd(600)));
    })
});


test('concurrency: 2, queue concurrency: 1', t => {
    let end = timeSpan();
    let urls = [
        'http://a.a/#200',
        'http://a.a/a#200',
        'http://a.a/b#200',
        'http://a.b/#200',
        'http://a.b/a#200',
        'http://a.b/b#200',
    ];
    return download(urls, 1, 2).then(() => {
        let ended = end();
        t.true(inRange(ended, getEnd(600)));
    })
});
