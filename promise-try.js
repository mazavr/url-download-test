function promiseTry(f) {
    return new Promise(resolve => {
        resolve(f())
    })
}

module.exports = promiseTry;
