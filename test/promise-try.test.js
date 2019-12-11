import test from 'ava';

import promiseTry from '../promise-try'

test('works sync', t => {
    return promiseTry(() => 4).then(r => {
        t.is(r, 4)
    }, () => {
        t.fail()
    })
});

test('reject on throw', t => {
    return promiseTry(() => {
        throw 'Error during function execution'
    }).then(() => {
        t.fail()
    }, e => {
        t.is(e, 'Error during function execution')
    })
});

test('work with Promise.resolve()', t => {
    return promiseTry(() => {
        return Promise.resolve(4)
    }).then(r => {
        t.is(r, 4)
    }, () => {
        t.fail()
    })
});

test('work with promise resolve', t => {
    return promiseTry(() => {
        return new Promise(resolve => setTimeout(() => resolve(4), 100))
    }).then(r => {
        t.is(r, 4)
    }, () => {
        t.fail()
    })
});

test('work with promise reject', t => {
    return promiseTry(() => {
        return new Promise((_, reject) => setTimeout(() => reject(4), 100))
    }).then(() => {
        t.fail()
    }, e => {
        t.is(e, 4)
    })
});
