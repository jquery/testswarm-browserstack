/**
 * We need to map identifiers between TestSwarm and BrowserStack.
 *
 * Sources:
 * - TestSwarm: https://github.com/jquery/testswarm/blob/master/inc/BrowserInfo.php
 * - ua-parser: https://github.com/ua-parser/uap-core
 * - BrowserStack:
 *   https://github.com/browserstack/api
 *   http://api.browserstack.com/3/browsers (requires authentication)
 */

// These are in the direction testswarm (ua-parser) -> browserstack.
module.exports = {
	browserFamily: {
		'Yandex Browser': 'yandex',
		'Android': 'Android Browser',
		'Chrome Mobile': 'Android Browser'
	},
	osFamily: {
		'Windows': 'Windows',
		'Mac OS X': 'OS X',
		'Android': 'android',
		'iOS': 'ios'
	},

	// BrowserStack puts device version inside device family.
	// Normalise them here, we use OS version instead.
	deviceFamily: {
		// Match "iPad 2", "iPad 3rd (6.0)", "iPad Air 2", etc.
		'iPad': /^iPad\b/,
		// Match "iPhone 4", "iPhone 4S (6.0)", "iPhone 6S Plus", etc.
		'iPhone': /^iPhone\b/
	}
};
