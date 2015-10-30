/**
 * We need to map keys and values between TestSwarm and BrowserStack.
 *
 * Sources:
 * - TestSwarm: https://github.com/jquery/testswarm/blob/master/inc/BrowserInfo.php
 * - BrowserStack:
 *   https://github.com/browserstack/api
 *   http://api.browserstack.com/2/browsers (requires authentication)
 */
var browserstack;

// These are in the direction: browserstack -> testswarm-mapped.
browserstack = {
	// Browser
	'yandex': 'Yandex Browser',
	'Android Browser': 'Android',

	// OS
	'Windows': 'Windows',
	'OS X': 'Mac OS X',
	'android': 'Android',
	'ios': 'iOS',

	// BrowserStack puts device version inside device family.
	// Normalise them here, we use OS version instead.
	'iPad': 'iPad',
	'iPad 2': 'iPad',
	'iPad 2 (5.0)': 'iPad',
	'iPad 3rd': 'iPad',
	'iPad 3rd (6.0)': 'iPad',
	'iPad 4th': 'iPad',
	'iPad Air': 'iPad',
	'iPad Air 2': 'iPad',
	'iPad Mini': 'iPad',
	'iPad Mini 2': 'iPad',
	'iPad Mini 4': 'iPad',
	'iPhone 3GS': 'iPhone',
	'iPhone 4': 'iPhone',
	'iPhone 4S': 'iPhone',
	'iPhone 4S (6.0)': 'iPhone',
	'iPhone 5': 'iPhone',
	'iPhone 5C': 'iPhone',
	'iPhone 5S': 'iPhone',
	'iPhone 6': 'iPhone',
	'iPhone 6 Plus': 'iPhone',
	'iPhone 6S': 'iPhone',
	'iPhone 6S Plus': 'iPhone'
};

module.exports = {
	browserstack: browserstack
};
