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
	'Windows': 'Windows',
	'OS X': 'Mac OS X',
	'android': 'Android',
	'ios': 'iOS',
	// BrowserStack puts device version inside device family.
	// Normalise them here, we use OS version instead.
	'iPad 2 (5.0)': 'iPad',
	'iPad 2': 'iPad',
	'iPad 3rd (6.0)': 'iPad',
	'iPad 3rd (7.0)': 'iPad',
	'iPad 3rd': 'iPad',
	'iPad 4th Gen': 'iPad',
	'iPad Air': 'iPad',
	'iPad mini Retina': 'iPad',
	'iPad Mini': 'iPad',
	'iPhone 3GS': 'iPhone',
	'iPhone 4': 'iPhone',
	'iPhone 4S (6.0)': 'iPhone',
	'iPhone 4S': 'iPhone',
	'iPhone 5': 'iPhone',
	'iPhone 5C': 'iPhone',
	'iPhone 5S': 'iPhone'
};

module.exports = {
	browserstack: browserstack
};
