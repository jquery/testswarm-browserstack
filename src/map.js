/**
 * We need to map the ua IDs that TestSwarm uses to browser descriptors for BrowserStack.
 *
 * Sources:
 * - TestSwarm useragents.ini: https://github.com/jquery/testswarm/blob/master/config/useragents.ini
 * - BrowserStack API:
 *   https://github.com/browserstack/api
 *   http://api.browserstack.com/1/browsers (requires authentication)
 */
var map = {
	'Chrome|17': {
		browser: 'chrome',
		version: '17.0',
		os: 'win'
	},
	'Chrome|18': {
		browser: 'chrome',
		version: '18.0',
		os: 'win'
	},
	'Chrome|19': {
		browser: 'chrome',
		version: '19.0',
		os: 'win'
	},
	'Chrome|20': {
		browser: 'chrome',
		version: '20.0',
		os: 'win'
	},
	'Chrome|21': {
		browser: 'chrome',
		version: '21.0',
		os: 'win'
	},
	'Chrome|22': {
		browser: 'chrome',
		version: '22.0',
		os: 'win'
	},
	'Chrome|23': {
		browser: 'chrome',
		version: '23.0',
		os: 'win'
	},
	'Firefox|3|0': {
		browser: 'firefox',
		version: '3.0',
		os: 'win'
	},
	// 'Firefox|3|5': Not in browserstack anymore
	'Firefox|3|6': {
		browser: 'firefox',
		version: '3.6',
		os: 'win'
	},
	'Firefox|4': {
		browser: 'firefox',
		version: '4.0',
		os: 'win'
	},
	'Firefox|5': {
		browser: 'firefox',
		version: '5.0',
		os: 'win'
	},
	'Firefox|6': {
		browser: 'firefox',
		version: '6.0',
		os: 'win'
	},
	'Firefox|7': {
		browser: 'firefox',
		version: '7.0',
		os: 'win'
	},
	'Firefox|8': {
		browser: 'firefox',
		version: '8.0',
		os: 'win'
	},
	'Firefox|9': {
		browser: 'firefox',
		version: '9.0',
		os: 'win'
	},
	'Firefox|10': {
		browser: 'firefox',
		version: '10.0',
		os: 'win'
	},
	'Firefox|11': {
		browser: 'firefox',
		version: '11.0',
		os: 'win'
	},
	'Firefox|12': {
		browser: 'firefox',
		version: '12.0',
		os: 'win'
	},
	'Firefox|13': {
		browser: 'firefox',
		version: '13.0',
		os: 'win'
	},
	'Firefox|14': {
		browser: 'firefox',
		version: '14.0',
		os: 'win'
	},
	'Firefox|15': {
		browser: 'firefox',
		version: '15.0',
		os: 'win'
	},
	'Firefox|16': {
		browser: 'firefox',
		version: '16.0',
		os: 'win'
	},
	'IE|6': {
		browser: 'ie',
		version: '6.0',
		os: 'win'
	},
	'IE|7': {
		browser: 'ie',
		version: '7.0',
		os: 'win'
	},
	'IE|8': {
		browser: 'ie',
		version: '8.0',
		os: 'win'
	},
	'IE|9': {
		browser: 'ie',
		version: '9.0',
		os: 'win'
	},
	'IE|10': {
		browser: 'ie',
		version: '10.0',
		os: 'win'
	},
	'Opera|11|10': {
		browser: 'opera',
		version: '11.1',
		os: 'win'
	},
	'Opera|11|50': {
		browser: 'opera',
		version: '11.5',
		os: 'win'
	},
	'Opera|11|60': {
		browser: 'opera',
		version: '11.6',
		os: 'win'
	},
	'Opera|12|0': {
		browser: 'opera',
		version: '12.0',
		os: 'win'
	},
	'Opera|12|5': {
		browser: 'opera',
		version: '12.5',
		os: 'win'
	},
	'Safari|4': {
		browser: 'safari',
		version: '4.0',
		os: 'mac'
	},
	'Safari|5|0': {
		browser: 'safari',
		version: '5.0',
		os: 'mac'
	},
	'Safari|5|1': {
		browser: 'safari',
		version: '5.1',
		os: 'mac'
	},
	'Safari|6|0': {
		browser: 'safari',
		version: '6.0',
		os: 'mac'
	},
	'Android|1|5': {
		device: 'HTC Hero',
		version: '1.5',
		os: 'android'
	},
	'Android|1|6': {
		device: 'Sony Xperia X10',
		version: '1.6',
		os: 'android'
	},
	'Android|2|1': {
		device: 'Samsung Galaxy S',
		version: '2.1',
		os: 'android'
	},
	'Android|2|2': {
		device: 'HTC Wildfire',
		version: '2.2',
		os: 'android'
	},
	'Android|2|3': {
		device: 'Samsung Galaxy S II',
		version: '2.3',
		os: 'android'
	},

	'iPhone|3|0': {
		device: 'iPhone 3GS',
		version: '3.0',
		os: 'ios'
	},
	'iPhone|4|0': {
		device: 'iPhone 4',
		version: '4.0',
		os: 'ios'
	},
	'iPhone|5|1': {
		device: 'iPhone 4S',
		version: '5.1',
		os: 'ios'
	},
	'iPhone|6|0': {
		device: 'iPhone 5',
		version: '6.0',
		os: 'ios'
	},
	'iPad|3|2': {
		device: 'iPad',
		version: '3.2',
		os: 'ios'
	},
	'iPad|4|3': {
		device: 'iPad 2',
		version: '4.3.2',
		os: 'ios'
	},
	'iPad|5|0': {
		device: 'iPad 2 (5.0)',
		version: '5.0',
		os: 'ios'
	},
	'iPad|5|1': {
		device: 'iPad 3rd',
		version: '5.1',
		os: 'ios'
	},
	'iPad|6|0': {
		device: 'iPad 3rd (6.0)',
		version: '6.0',
		os: 'ios'
	}

 	// TODO: Most of the following ua's are supported by BrowserStack.
 	// However we need support for it via the API

	// 'Fennec|4': {},
	// 'Opera Mobile': {},
	// 'Opera Mini|2': {},
	// 'Palm Web|1': {},
	// 'Palm Web|2': {},
	// 'IEMobile|7': {}
};

module.exports = map;
