var util = require( 'util' );
var nock = require( 'nock' );
var tsbs = require( '../src/testswarm-browserstack' );

QUnit.module( 'testswarm-browserstack', hooks => {
  var instance;

  hooks.before( async() => {
    require( './fixtures/swarmstate-01.js' )( nock );
    require( './fixtures/browsers-v4-200.js' )( nock );
    tsbs.extendConfig( require( './fixtures/config-01.json' ) );
    instance = await util.promisify( tsbs.init )();
  } );

  QUnit.test( 'getConfig() inherits defaults', async assert => {
    assert.propContains( instance.getConfig(), {
      browserstack: {
        user: 'foobar-testswarm',
        pass: '0000000',
        project: 'testswarm',
        workerTimeout: 900,
        dryRun: false,
        totalLimit: 10,
        eqLimit: 2
      },
      testswarm: {
        root: 'http://swarm.example',
        runUrl: 'https://swarm.example/run/foobar?run_token=0000000'
      },
      verbose: false
    } );
  } );

  QUnit.test.each( 'getBrowserFromUaID', [
    [ 'chrome_97', {
      os: 'Windows',
      os_version: '7',
      browser: 'chrome',
      browser_version: '97.0'
    } ],
    [ 'android_8_0', {
      os: 'android',
      os_version: '8.0',
      browser: 'Android Browser',
      browser_version: null
    } ],
    [ 'edge_18', {
      os: 'Windows',
      os_version: '10',
      browser: 'edge',
      browser_version: '18.0'
    } ],
    [ 'edge_96', {
      os: 'Windows',
      os_version: '7',
      browser: 'edge',
      browser_version: '96.0'
    } ],
    [ 'firefox_48', {
      os: 'Windows',
      os_version: 'XP',
      browser: 'firefox',
      browser_version: '48.0'
    } ],
    [ 'firefox_94', {
      os: 'Windows',
      os_version: '7',
      browser: 'firefox',
      browser_version: '94.0'
    } ],
    [ 'ie_8', {
      os: 'Windows',
      os_version: 'XP',
      browser: 'ie',
      browser_version: '8.0'
    } ],
    [ 'ie_11', {
      os: 'Windows',
      os_version: '7',
      browser: 'ie',
      browser_version: '11.0'
    } ],
    [ 'opera_81', {
      os: 'Windows',
      os_version: '7',
      browser: 'opera',
      browser_version: '81.0'
    } ],
    [ 'safari_5_1', {
      os: 'Windows',
      os_version: 'XP',
      browser: 'safari',
      browser_version: '5.1'
    } ],
    [ 'safari_15', {
      os: 'OS X',
      os_version: 'Monterey',
      browser: 'safari',
      browser_version: '15.1'
    } ]
  ], ( assert, [ uaID, expected ] ) => {
    assert.propContains( instance.getBrowserFromUaID( uaID ), expected, uaID );
  } );

  QUnit.test.each( 'getUaIdFromWorker', [
    [ {
      os: 'Windows',
      os_version: '7',
      browser: 'chrome',
      browser_version: '97.0',
      device: null,
      real_mobile: null
    }, 'chrome_97' ],
    [ {
      os: 'android',
      os_version: '8.0',
      browser: 'Android Browser',
      browser_version: null,
      device: 'Samsung Galaxy S9',
      real_mobile: true
    }, 'android_8_0' ],
    [ {
      os: 'android',
      os_version: '8.0',
      browser: 'Android Browser',
      browser_version: null,
      device: 'Google Pixel 2',
      real_mobile: true
    }, 'android_8_0' ],
    [ {
      os: 'Windows',
      os_version: 'XP',
      browser: 'safari',
      browser_version: '5.1',
      device: null,
      real_mobile: null
    }, 'safari_5_1' ],
    [ {
      os: 'OS X',
      os_version: 'Snow Leopard',
      browser: 'safari',
      browser_version: '5.1',
      device: null,
      real_mobile: null
    }, 'safari_5_1' ],
    [ {
      os: 'OS X',
      os_version: 'Monterey',
      browser: 'safari',
      browser_version: '15.1',
      device: null,
      real_mobile: null
    }, 'safari_15' ]
  ], ( assert, [ browser, expected ] ) => {
    assert.strictEqual( instance.getUaIdFromWorker( { browser: browser } ), expected );
  } );
} );
