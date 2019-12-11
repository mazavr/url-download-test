let promiseTry = require('./promise-try');

function getLowConcurrency(queues, queueConcurrency) {
    return queues
        .filter(queue => queue.items.length > 0 && queue.runningCount < queueConcurrency)
        .sort((d1, d2) => d1.runningCount - d2.runningCount)[0]
}

function getFirstPossible(queues, queueConcurrency) {
    return queues
        .filter(queue => queue.items.length > 0 && queue.runningCount < queueConcurrency)[0]
}

function getFunctionToTakeNextQueue(strategy) {
    switch (strategy) {
        case 'firstPossible':
            return getFirstPossible;
        case 'lowConcurrency':
            return getLowConcurrency;
        default:
            throw new Error('Unexpected strategy')
    }
}

function promiseQueues(queues, options) {
    options = Object.assign({}, {
        queueConcurrency: 10,
        concurrency: 10,
        continueOnError: false,
        takeNextStrategy: 'lowConcurrency'
    }, options);

    queues = queues
        .map(iterable => ({
            items: [...iterable],
            runningCount: 0,
            results: []
        }));

    let takeNextQueue = getFunctionToTakeNextQueue(options.takeNextStrategy);
    let countToResolve = queues.reduce((p, c) => p + c.items.length, 0);
    let runningCount = 0;
    let errors = [];

    return new Promise((resolve, reject) => {
        function next() {
            if (runningCount === options.concurrency) {
                return
            }

            if (countToResolve === 0) {
                options.continueOnError && errors.length !== 0
                    ? reject(errors)
                    : resolve(queues.map(queue => queue.results));
                return
            }

            let queueToContinue = takeNextQueue(queues, options.queueConcurrency);

            if (!queueToContinue) {
                return
            }

            let queueItem = queueToContinue.items.shift();
            runningCount++;
            queueToContinue.runningCount++;

            promiseTry(() => typeof queueItem === 'function' ? queueItem() : queueItem)
                .then(result => {
                    countToResolve--;
                    runningCount--;
                    queueToContinue.runningCount--;

                    queueToContinue.results.push(result);

                    next();
                }, error => {
                    if (options.continueOnError) {
                        countToResolve--;
                        runningCount--;
                        queueToContinue.runningCount--;

                        errors.push(error);

                        next()
                    } else {
                        reject(error)
                    }
                });

            return true
        }

        for (let i = 0; i < options.concurrency; i++) {
            if (!next()) {
                break
            }
        }
    })
}

module.exports = promiseQueues;
