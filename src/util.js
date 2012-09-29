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
 * Generate an object keyed by the JSON representation
 * of the object values with the key as its value.
 */
function generateReverseMap(map) {
	var key, rev = {};
	for (key in map) {
		rev[JSON.stringify(map[key])] = key;
	}
	return rev;
}

module.exports = {
	extendObject: extendObject,
	copy: copy,
	generateReverseMap: generateReverseMap
};
