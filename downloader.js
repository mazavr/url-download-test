let pLimit = require('./pLimit.js');

function downloadAndSaveFake(url) {
  const ms = url.split('#')[1];

  return new Promise((resolve, reject) => {
    ms
      ? setTimeout(() => resolve(url), ms)
      : reject(url)
  });
}

function getDomain(url) {
  try {
    url = new URL(url);
    return `${url.protocol}//${url.host}`;
  } catch (e) {
    return undefined;
  }
}

function download(urls, queueConcurrency = 1, maxConcurrency = 1) {
  const baseLimiter = pLimit(maxConcurrency);
  const domainLimiters = {};

  const getDomainLimiter = domain => {
    domainLimiters[domain] = domainLimiters[domain] || pLimit(queueConcurrency);
    return domainLimiters[domain];
  };

  return Promise.all(
    urls.map(url => {
      const limiter = getDomainLimiter(getDomain(url));
      return limiter(() => baseLimiter(() => downloadAndSaveFake(url)));
    })
  );
}

module.exports = {
  download
};
