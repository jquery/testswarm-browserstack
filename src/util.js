var _ = require('underscore'),
    colors = require('colors');
/**
 * Like typeof === 'object' but more accurate.
 * (null is not an object, arrays and functions are objects).
 */
function isObject(a) {
	return Object(a) === a;
}

/**
 * Extend a plain object with another plain object.
 */
function extendObject(target, options, deep) {
	var prop, option, targetValue;
	for (prop in options) {
		option = options[prop];
		if (deep && isObject(option)) {
			// If the target is not an object we need to clone it by extending
			// an empty object. If we would add `if isObject target[prop]` then
			// we would move original objects, which is very bad.
			targetValue = isObject(target[prop]) ? target[prop] : {};

			target[prop] = extendObject(targetValue, option);
		} else {
			target[prop] = option;
		}
	}

	return target;
}

/**
 * Recursively clone a plain object or an array.
 */
function copy(a) {
	var b, key, len;
	if (Array.isArray(a)) {
		b = [];
		for (key = 0, len = a.length; key < len; key += 1) {
			b[key] = isObject(a[key]) ? copy(a[key]) : a[key];
		}

	} else {
		b = {};
		for (key in a) {
			b[key] = isObject(a[key]) ? copy(a[key]) : a[key];
		}
	}
	return b;
}

/**
 * Generate a unique hash for an object's own keys and values.
 * Like JSON.stringify, except that it has a reliable property order.
 * So that { a: 1, b: 2 } equals { b: 2, a: 1 } (as one would expect).
 */
function getHash(val) {
	return JSON.stringify(val, getHash.replacer);
}

getHash.replacer = function (key, val) {
	var normalized, keys, i, len;
	if (!Array.isArray(val) && Object(val) === val) {
		// Only normalize objects when the key-order is ambiguous
		// (e.g. any object not an array).
		normalized = {};
		keys = Object.keys(val).sort();
		i = 0;
		len = keys.length;
		for (; i < len; i += 1) {
			normalized[keys[i]] = val[keys[i]];
		}
		return normalized;

	// Primitive values and arrays get stable hashes
	// by default. Lets those be stringified as-is.
	} else {
		return val;
	}
};

/**
 * Generate an object keyed by the JSON representation
 * of the object values with the key as its value.
 */
function generateReverseMap(map) {
	var key, rev = {};
	for (key in map) {
		rev[getHash(map[key])] = key;
	}
	return rev;
}

function log(data){
    var l = (new Date()) + ' : ';
    if(typeof data === 'string' || typeof data === 'number'){
        data = {
            message: data
        }
    }

    if(!data.action){
        data.action = 'unspecified'
    }

    for(i in data){
        var literal = data[i];
        if(_.isObject(literal)){
            literal = JSON.stringify(literal);
        }
        l+= i+'='+ literal +' ';
    }

    if(data.color){
        l[data.color];
    }

    console.log(l);
}

module.exports = {
	extendObject: extendObject,
	copy: copy,
	getHash: getHash,
	generateReverseMap: generateReverseMap,
    log: log
};
