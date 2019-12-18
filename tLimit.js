function tLimit(concurrency = 1) {
    let currentConcurrency = 0;
    let queue = [];

    let run = () => {
        if (currentConcurrency < concurrency && queue.length > 0) {
            currentConcurrency++;
            let fromQueue = queue.shift();

            Promise.resolve(fromQueue[0]())
                .then(fromQueue[1], fromQueue[2])
                .then(result => {
                    currentConcurrency--;
                    run();
                    return result;
                })
        }
    };

    return task => {
        return new Promise((resolve, reject) => {
            queue.push([task, resolve, reject]);

            run()
        })
    }
}

module.exports = tLimit;
