function pLimit(limit) {
  const resolvers = [];
  let concurrency = 0;

  const createResolver = (resolveFn, fn) =>
    () => {
      resolveFn(fn());
    };

  function resolveNext() {
    if (concurrency < limit && resolvers.length > 0) {
      concurrency++;
      resolvers.shift()();
    }
  }

  return fn => {
    const pr = new Promise(resolve => {
      resolvers.push(createResolver(resolve, fn))
    });

    pr
      .then(() => concurrency--, () => concurrency--)
      .then(resolveNext, resolveNext);

    resolveNext();

    return pr;
  }
}

module.exports = pLimit;
