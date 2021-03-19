

exports.getNested = (obj, ...args) => {
    return args.reduce((inQuestion, level) => inQuestion && inQuestion[level], obj);
}

