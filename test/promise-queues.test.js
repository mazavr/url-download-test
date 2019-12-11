import test from 'ava';
import timeSpan from 'time-span';
import delay from 'delay';
import inRange from 'in-range';

import promiseQueues from '../promise-queues'

function getEnd(ms) {
    return {start: ms, end: ms + 35}
}

test('should just works', t => {
    return promiseQueues([[1, 2, 3], [4, 5]]).then(result => {
        t.deepEqual(result, [[1, 2, 3], [4, 5]])
    })
});

test('should work with empty queues', t => {
    return promiseQueues([]).then(result => {
        t.deepEqual(result, [])
    })
});

test('should work with empty single queue', t => {
    return promiseQueues([[]]).then(result => {
        t.deepEqual(result, [[]])
    })
});

test('should work with several single queues', t => {
    return promiseQueues([[], [1], []]).then(result => {
        t.deepEqual(result, [[], [1], []])
    })
});

test('should work with async functions', t => {
    let end = timeSpan();

    return promiseQueues([[() => delay(100), 1, 2, () => delay(100)]]).then(() => {
        let ended = end();
        t.log(ended);
        t.true(inRange(ended, getEnd(100)))
    })
});

test('should work with promises', t => {
    let end = timeSpan();
    let queues = [
        [delay(100, {value: 1}), delay(200, {value: 2}), delay(400, {value: 4})],
        [delay(300, {value: 3})]
    ];

    return promiseQueues(queues, {queueConcurrency: 1, concurrency: 1}).then(result => {
        let ended = end();
        t.true(inRange(ended, getEnd(400)));
        t.deepEqual(result, [[1, 2, 4], [3]])
    })
});

test('should work with no concurrency', t => {
    let end = timeSpan();
    let queues = [
        [() => delay(100, {value: 1}), () => delay(200, {value: 2})],
        [() => delay(300, {value: 3})]
    ];

    return promiseQueues(queues, {queueConcurrency: 1, concurrency: 1}).then(result => {
        t.true(inRange(end(), getEnd(600)));
        t.deepEqual(result, [[1, 2], [3]])
    })
});

test('should work with concurrency between queues', t => {
    let end = timeSpan();
    let queues = [
        [() => delay(300, {value: 3}), () => delay(200, {value: 2})],
        [() => delay(100, {value: 1})]
    ];

    return promiseQueues(queues, {queueConcurrency: 1, concurrency: 2}).then(() => {
        let ended = end();
        t.true(inRange(ended, getEnd(500)))
    })
});

test('should use concurrency first and then queue concurrency', t => {
    let end = timeSpan();
    let queues = [
        [() => delay(300, {value: 3}), () => delay(200, {value: 2})],
        [() => delay(100, {value: 1})]
    ];

    return promiseQueues(queues, {queueConcurrency: 10, concurrency: 1}).then(() => {
        let ended = end();
        t.true(inRange(ended, getEnd(600)))
    })
});

test('should work with lowConcurrency strategy', t => {
    let way = '';
    let queues = [
        [() => delay(100).then(() => way += 1), () => delay(100).then(() => way += 3)],
        [() => delay(100).then(() => way += 2)]
    ];

    return promiseQueues(queues, {queueConcurrency: 2, concurrency: 2, takeNextStrategy: 'lowConcurrency'}).then(() => {
        t.is(way, '123')
    })
});

test('should work with firstPossible strategy', t => {
    let way = '';
    let queues = [
        [() => delay(100).then(() => way += 1), () => delay(100).then(() => way += 2)],
        [() => delay(100).then(() => way += 3)]
    ];

    return promiseQueues(queues, {queueConcurrency: 2, concurrency: 2, takeNextStrategy: 'firstPossible'}).then(() => {
        t.is(way, '123')
    })
});

test('should reject on error', t => {
    let queues = [
        [() => {
            throw 'Test error'
        }, () => delay(500).then(() => t.log('2'))],
        [() => delay(100).then(() => t.log('3'))]
    ];

    return promiseQueues(queues, {queueConcurrency: 2, concurrency: 2}).then(() => {
        t.fail('Should not be success')
    }, err => t.is(err, 'Test error'))
});

test('should reject on unexpected takeNextStrategy value', t => {
    let queues = [
        [() => delay(500).then(() => t.log('2')), () => delay(500).then(() => t.log('2'))],
        [() => delay(100).then(() => t.log('3'))]
    ];

    try {
        promiseQueues(queues, {queueConcurrency: 2, concurrency: 2, takeNextStrategy: 'unexpected'})
        t.fail('Should not be success')
    } catch (err) {
        t.is(err.message, 'Unexpected strategy')
    }
});

test('should reject on error and execute all possible', t => {
    let queues = [
        [() => {
            throw 'Test error'
        }, () => delay(200).then(() => t.log('2'))],
        [() => delay(100).then(() => t.log('3')), () => {
            throw 'Test error2'
        }, () => new Promise((_, reject) => reject('Reject from promise'))]
    ];

    return promiseQueues(queues, {queueConcurrency: 2, concurrency: 2, continueOnError: true}).then(() => {
        t.fail('Should not be success')
    }, err => {
        t.deepEqual(err, ['Test error', 'Test error2', 'Reject from promise'])
    })
});
