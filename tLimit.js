function tLimit(concurrency = 1) {
    let currentConcurrency = 0;
    let queue = [];

    let run = () => {
        if (currentConcurrency < concurrency && queue.length > 0) {
            currentConcurrency++;
            let [task, resolve, reject] = queue.shift();

            Promise.resolve(task())
                .then(resolve, reject)
                .then(() => {
                    currentConcurrency--;
                    run();
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
