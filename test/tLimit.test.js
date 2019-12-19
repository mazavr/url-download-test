import test from 'ava';
import timeSpan from 'time-span';
import inRange from 'in-range';
import delay from 'delay';

import tLimit from '../tLimit'

function getEnd(ms) {
    return {start: ms, end: ms + 40}
}

test('just works', t => {
    let limit = tLimit(10);

    return limit(() => {
    }).then(() => t.pass())
});

test('concurrency: 1', t => {
    let limit = tLimit(1);
    let end = timeSpan();

    return Promise.all([100, 200, 300].map(ms => limit(() => delay(ms, {value: ms})))).then(res => {
        let ended = end();
        t.true(inRange(ended, getEnd(600)));
        t.deepEqual(res, [100, 200, 300])
    })
});

test('concurrency: 2', t => {
    let limit = tLimit(2);
    let end = timeSpan();

    return Promise.all([100, 200, 300].map(ms => limit(() => delay(ms, {value: ms})))).then(res => {
        t.deepEqual(res, [100, 200, 300]);
        let ended = end();
        console.log(ended);
        t.true(inRange(ended, getEnd(400)));
    })
});

test('concurrency: 2,  similar by time tasks', t => {
    let limit = tLimit(2);
    let end = timeSpan();

    return Promise.all([100, 100, 200, 200, 300, 300].map(ms => limit(() => delay(ms, {value: ms})))).then(res => {
        t.deepEqual(res, [100, 100, 200, 200, 300, 300]);
        let ended = end();
        console.log(ended);
        t.true(inRange(ended, getEnd(600)));
    })
});

test('concurrency: 2, changed order', t => {
    let limit = tLimit(2);
    let end = timeSpan();

    return Promise.all([100, 400, 200].map(ms => limit(() => delay(ms, {value: ms})))).then(res => {
        t.deepEqual(res, [100, 400, 200]);
        let ended = end();
        console.log(ended);
        t.true(inRange(ended, getEnd(400)));
    })
});

test('rejected promise', t => {
    let limit = tLimit(1);
    let end = timeSpan();

    return Promise.all([100, 200, 0, 300].map(ms => limit(() => {
        return ms
            ? delay(ms, {value: ms})
            : Promise.reject('rejected')
    }))).then(res => {
        t.fail()
    }, e => {
        t.is('rejected', e)
    })
});

test('rejected promise dont stop execution', t => {
    let limit = tLimit(1);
    let end = timeSpan();

    return Promise.all([100, 200, 0, 300].map(ms => limit(() => {
        return ms
            ? delay(ms, {value: ms})
            : Promise.reject('rejected')
    }).then(r => r, e => e))).then(res => {
        t.deepEqual(res, [100, 200, 'rejected', 300]);
        let ended = end();
        console.log(ended);
        t.true(inRange(ended, getEnd(600)));
    })
});
