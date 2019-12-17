let pLimit = require('p-limit');

function findDomain(url) {
    try {
        url = new URL(url);
        return `${url.protocol}//${url.host}`;
    } catch (e) {
        return undefined;
    }
}

function downloadAndSaveFake(url) {
    let ms = url.split('#')[1];

    return new Promise((resolve, reject) => {
        ms
            ? setTimeout(() => resolve(url), ms)
            : reject(url)
    });
}

function taskConcurrencyLimit(getLimiterTypes = task => []) {
    let limiters = {};

    let getLimiters = task => {
        return getLimiterTypes(task).map(({type, concurrency}) => {
            limiters[type] = limiters[type] || pLimit(concurrency);

            return limiters[type];
        });
    };

    return task => {
        return getLimiters(task).reduce((f, limiter) => {
            return task => limiter(() => f(task))
        }, task => task.func())(task)
    }
}

function download(urls, queueConcurrency = 2, concurrency = 4) {
    let dispatch = taskConcurrencyLimit(
        task => {
            return [
                {type: 'maxConcurrency', concurrency},
                {type: findDomain(task.data), concurrency: queueConcurrency}
            ]
        }
    );

    return Promise.all(urls.map(url => {
        return dispatch({
            func: () => downloadAndSaveFake(url),
            data: url
        });
    }))
}

module.exports = {
    download,
    taskConcurrencyLimit
};
