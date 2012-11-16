/**
 * We need to map keys and values between TestSwarm and BrowserStack.
 *
 * Sources:
 * - TestSwarm: https://github.com/jquery/testswarm/blob/master/inc/BrowserInfo.php
 * - BrowserStack:
 *   https://github.com/browserstack/api
 *   http://api.browserstack.com/2/browsers (requires authentication)
 */
var browserstack, testswarm;

// These are in the direction: browserstack -> testswarm-mapped.
browserstack = {
	'win': 'Windows',
	'mac': 'Mac OS X',
	'android': 'Android',
	'ios': 'iOS',
	// BrowserStack puts device version inside device family.
	// Normalise them here, we use OS version instead.
	'iPad 2': 'iPad',
	'iPad 2 (5.0)': 'iPad',
	'iPad 3rd': 'iPad',
	'iPad 3rd (6.0)': 'iPad',
	'iPhone 3GS': 'iPhone',
	'iPhone 4': 'iPhone',
	'iPhone 4S': 'iPhone',
	'iPhone 4S (6.0)': 'iPhone',
	'iPhone 5': 'iPhone'
};

// These are in the direction: testswarm -> browsertack-mapped.
testswarm = {
	// BrowserStack API (v2) doesn't give different windows versions,
	// so we'll have to use that for now. This is probably fine since
	// BrowserStack does have different windows versions internally
	// (e.g. IE 6 is WinXP, IE 10 is on Win8).
	// This is needed to make "Safari 5.1 on Windows XP" in TestSwarm work.
	'Windows XP': 'Windows',
	'Windows Vista': 'Windows',
	'Windows 7': 'Windows',
	'Windows 8': 'Windows'
};

module.exports = {
	browserstack: browserstack,
	testswarm: testswarm
};
