/**
 * We need to map the useragent IDs that TestSwarm uses to browser definitions in BrowserStack.
 * TestSwarm useragents.ini: https://github.com/jquery/testswarm/blob/master/config/useragents.ini
 * BrowserStack API: https://github.com/browserstack/api , http://api.browserstack.com/1/browsers
 */
var map = {
    'Chrome':{
        name:'chrome',
        version:'18.0'
    },
    'Firefox|3|5':{
        name:'firefox',
        version:'3.5'
    },
    'Firefox|3|6':{
        name:'firefox',
        version:'3.6'
    },
    'Firefox|4':{
        name:'firefox',
        version:'4.0'
    },
    'Firefox|5':{
        name:'firefox',
        version:'5.0'
    },
    'Firefox|6':{
        name:'firefox',
        version:'6.0'
    },
    'Firefox|7':{
        name:'firefox',
        version:'7.0'
    },
    'Firefox|8':{
        name:'firefox',
        version:'8.0'
    },
    'Firefox|9':{
        name:'firefox',
        version:'9.0'
    },
    'Firefox|10':{
        name:'firefox',
        version:'10.0'
    },
    'Firefox|11':{
        name:'firefox',
        version:'11.0'
    },
    'IE|6':{
        name:'ie',
        version:'6.0'
    },
    'IE|7':{
        name:'ie',
        version:'7.0'
    },
    'IE|8':{
        name:'ie',
        version:'8.0'
    },
    'IE|9':{
        name:'ie',
        version:'9.0'
    },
    'IE|10':{
        name:'ie',
        version:'10.0'
    },
    'Opera|11|10':{
        name:'opera',
        version:'11.1'
    },
    'Safari|4':{
        name:'safari',
        version:'4.0'
    },
    'Safari|5':{
        name:'safari',
        version:'5.1'
    }
    // TODO: BrowserStack API doesn't support different platforms yet,
    // their API is a little behind on the GUI.
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
    // 'IEMobile|7': {},
};

module.exports = {
    map:map
};
