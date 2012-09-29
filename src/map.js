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
		name: 'chrome',
		version: '17.0'
	},
	'Chrome|18': {
		name: 'chrome',
		version: '18.0'
	},
	'Chrome|19': {
		name: 'chrome',
		version: '19.0'
	},
	'Chrome|20': {
		name: 'chrome',
		version: '20.0'
	},
	'Chrome|21': {
		name: 'chrome',
		version: '21.0'
	},
	'Chrome|22': {
		name: 'chrome',
		version: '22.0'
	},
	'Chrome|23': {
		name: 'chrome',
		version: '23.0'
	},
	'Firefox|3|0': {
		name: 'firefox',
		version: '3.0'
	},
	// 'Firefox|3|5': Not in browserstack anymore
	'Firefox|3|6': {
		name: 'firefox',
		version: '3.6'
	},
	'Firefox|4': {
		name: 'firefox',
		version: '4.0'
	},
	'Firefox|5': {
		name: 'firefox',
		version: '5.0'
	},
	'Firefox|6': {
		name: 'firefox',
		version: '6.0'
	},
	'Firefox|7': {
		name: 'firefox',
		version: '7.0'
	},
	'Firefox|8': {
		name: 'firefox',
		version: '8.0'
	},
	'Firefox|9': {
		name: 'firefox',
		version: '9.0'
	},
	'Firefox|10': {
		name: 'firefox',
		version: '10.0'
	},
	'Firefox|11': {
		name: 'firefox',
		version: '11.0'
	},
	'Firefox|12': {
		name: 'firefox',
		version: '12.0'
	},
	'Firefox|13': {
		name: 'firefox',
		version: '13.0'
	},
	'Firefox|14': {
		name: 'firefox',
		version: '14.0'
	},
	'Firefox|15': {
		name: 'firefox',
		version: '15.0'
	},
	'Firefox|16': {
		name: 'firefox',
		version: '16.0'
	},
	'IE|6': {
		name: 'ie',
		version: '6.0'
	},
	'IE|7': {
		name: 'ie',
		version: '7.0'
	},
	'IE|8': {
		name: 'ie',
		version: '8.0'
	},
	'IE|9': {
		name: 'ie',
		version: '9.0'
	},
	'IE|10': {
		name: 'ie',
		version: '10.0'
	},
	'Opera|11|10': {
		name: 'opera',
		version: '11.1'
	},
	'Opera|11|50': {
		name: 'opera',
		version: '11.5'
	},
	'Opera|11|60': {
		name: 'opera',
		version: '11.6'
	},
	'Opera|12|0': {
		name: 'opera',
		version: '12.0'
	},
	// 'Opera|12|5': Not yet supported by browscap
	'Safari|4': {
		name: 'safari',
		version: '4.0'
	},
	'Safari|5|0': {
		name: 'safari',
		version: '5.0'
	},
	'Safari|5|1': {
		name: 'safari',
		version: '5.1'
	}

	// 'Safari|6|0': Safari 6 is Mac-only, and the BrowserStack v1 API is Windows-only

	// TODO: Most of the following ua's are supported by BrowserStack.
	// However we need to switch to BrowserStack API v2 in order for those to
	// work. the v1 API is desktop-only for compatibility reasons (issue #19)

	// 'Android|1|5': {},
	// 'Android|1|6': {},
	// 'Android|2|1': {},
	// 'Android|2|2': {},
	// 'Android|2|3': {},
	// 'Fennec|4': {},
	// 'iPhone|3|2': {},
	// 'iPhone|4|3': {},
	// 'iPhone|5': {},
	// 'iPad|3|2': {},
	// 'iPad|4|3': {},
	// 'iPad|5': {},
	// 'Opera Mobile': {},
	// 'Opera Mini|2': {},
	// 'Palm Web|1': {},
	// 'Palm Web|2': {},
	// 'IEMobile|7': {}
};

module.exports = map;
