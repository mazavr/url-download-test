let promiseQueues = require('./promise-queues');

function findDomain(url) {
    try {
        url = new URL(url);
        return `${url.protocol}//${url.host}`;
    } catch (e) {
        return undefined;
    }
}

function splitByDomain(urls) {
    let domains = {};

    urls.forEach(url => {
        let domain = findDomain(url);

        if (domain) {
            domains[domain] = domains[domain] || [];
            domains[domain].push(url);
        } else {
            throw new Error('URL with wrong domain')
        }

    });

    return Object.values(domains);
}

function downloadAndSaveFake(url) {
    let ms = url.split('#')[1];

    return new Promise((resolve, reject) => {
        ms
            ? setTimeout(() => resolve(url), ms)
            : reject(url)
    });
}

function download(urls, queueConcurrency = 2, concurrency = 4) {
    let domainGroups = splitByDomain(urls);
    let queues = domainGroups.map(urls => {
        return urls.map(url => () => downloadAndSaveFake(url))
    });

    return promiseQueues(queues, {
        queueConcurrency,
        concurrency
    })
}

module.exports = download;
