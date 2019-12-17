import test from 'ava';
import timeSpan from 'time-span';
import inRange from 'in-range';
import delay from 'delay';

import {taskConcurrencyLimit} from '../download'

function getEnd(ms) {
    return {start: ms, end: ms + 40}
}

test('work with empty task', t => {
    let dispatch = taskConcurrencyLimit(
        task => {
            return [
                {type: 'maxConcurrency', concurrency: 1}
            ]
        }
    );

    return dispatch({
        func: () => {
        }
    }).then(() => {
        t.pass()
    });
});

test('work with concurrency: 2', t => {
    let dispatch = taskConcurrencyLimit(
        task => {
            return [
                {type: 'c', concurrency: 2}
            ]
        }
    );

    let way = '';
    let end = timeSpan();

    return Promise.all([100, 200, 300].map(ms => {
        return dispatch({
            func: () => delay(ms)
        }).then(() => way += ms)
    })).then(() => {
        t.is(way, '100200300');
        let ended = end();
        t.true(inRange(ended, getEnd(400)));
    })
});

test('work with skipped concurrency: 1', t => {
    let dispatch = taskConcurrencyLimit(
        ({data}) => {
            return data === 100
                ? []
                : [{type: 'c', concurrency: 1}]
        }
    );

    let way = '';
    let end = timeSpan();

    return Promise.all([201, 100, 202, 203].map(ms => {
        return dispatch({
            func: () => delay(ms, {value: ms}).then(ms => way += ms),
            data: ms
        })
    })).then(() => {
        t.is(way, '100201202203');
        let ended = end();
        t.true(inRange(ended, getEnd(600)));
    })
});

test('work with 2 limiters concurrency: 4, 2', t => {
    let dispatch = taskConcurrencyLimit(
        ({data}) => {
            return [{type: 'c', concurrency: 4}, {type: data, concurrency: 2}]
        }
    );

    let way = '';
    let end = timeSpan();

    return Promise.all([[200, 'a'], [200, 'b'], [200, 'a'], [200, 'b'], [200, 'b']].map(ms => {
        return dispatch({
            func: () => delay(ms[0], {value: ms[0]}).then(ms => way += ms),
            data: ms[1]
        })
    })).then(() => {
        // t.is(way, '100201202203');
        let ended = end();
        t.true(inRange(ended, getEnd(400)));
    })
});

