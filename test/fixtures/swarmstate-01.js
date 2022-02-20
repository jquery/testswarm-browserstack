/* eslint-disable max-len */
const response = {
  swarmstate: {
    userAgents: {
      chrome_97: {
        data: { browserFamily: 'Chrome', browserMajor: '97', browserMinor: '', browserPatch: '', osFamily: '', osMajor: '', osMinor: '', osPatch: '', deviceFamily: '' },
        stats: { onlineClients: 0, activeRuns: 0, pendingRuns: 0, pendingReRuns: 0 }
      },
      android_8_0: {
        data: { browserFamily: 'Chrome Mobile', browserMajor: '', browserMinor: '', browserPatch: '', osFamily: 'Android', osMajor: '8', osMinor: '0', osPatch: '', deviceFamily: '' },
        stats: { onlineClients: 0, activeRuns: 0, pendingRuns: 0, pendingReRuns: 0 }
      },
      edge_18: { data: { browserFamily: 'Edge', browserMajor: '18', browserMinor: '', browserPatch: '', osFamily: '', osMajor: '', osMinor: '', osPatch: '', deviceFamily: '' },
        stats: { onlineClients: 0, activeRuns: 0, pendingRuns: 1, pendingReRuns: 0 }
      },
      edge_96: { data: { browserFamily: 'Edge', browserMajor: '96', browserMinor: '', browserPatch: '', osFamily: '', osMajor: '', osMinor: '', osPatch: '', deviceFamily: '' },
        stats: { onlineClients: 0, activeRuns: 0, pendingRuns: 0, pendingReRuns: 0 }
      },
      firefox_48: { data: { browserFamily: 'Firefox', browserMajor: '48', browserMinor: '', browserPatch: '', osFamily: '', osMajor: '', osMinor: '', osPatch: '', deviceFamily: '' },
        stats: { onlineClients: 0, activeRuns: 0, pendingRuns: 0, pendingReRuns: 0 }
      },
      firefox_94: { data: { browserFamily: 'Firefox', browserMajor: '94', browserMinor: '', browserPatch: '', osFamily: '', osMajor: '', osMinor: '', osPatch: '', deviceFamily: '' },
        stats: { onlineClients: 0, activeRuns: 0, pendingRuns: 1, pendingReRuns: 0 }
      },
      ie_6: { data: { browserFamily: 'IE', browserMajor: '6', browserMinor: '', browserPatch: '', osFamily: '', osMajor: '', osMinor: '', osPatch: '', deviceFamily: '' },
        stats: { onlineClients: 0, activeRuns: 0, pendingRuns: 0, pendingReRuns: 0 }
      },
      ie_8: { data: { browserFamily: 'IE', browserMajor: '8', browserMinor: '', browserPatch: '', osFamily: '', osMajor: '', osMinor: '', osPatch: '', deviceFamily: '' },
        stats: { onlineClients: 0, activeRuns: 0, pendingRuns: 0, pendingReRuns: 0 }
      },
      ie_11: { data: { browserFamily: 'IE', browserMajor: '11', browserMinor: '', browserPatch: '', osFamily: '', osMajor: '', osMinor: '', osPatch: '', deviceFamily: '' },
        stats: { onlineClients: 0, activeRuns: 0, pendingRuns: 0, pendingReRuns: 0 }
      },
      opera_81: { data: { browserFamily: 'Opera', browserMajor: '81', browserMinor: '', browserPatch: '', osFamily: '', osMajor: '', osMinor: '', osPatch: '', deviceFamily: '' },
        stats: { onlineClients: 0, activeRuns: 0, pendingRuns: 0, pendingReRuns: 0 }
      },
      safari_5_1: { data: { browserFamily: 'Safari', browserMajor: '5', browserMinor: '1', browserPatch: '', osFamily: '', osMajor: '', osMinor: '', osPatch: '', deviceFamily: '' },
        stats: { onlineClients: 0, activeRuns: 0, pendingRuns: 0, pendingReRuns: 0 }
      },
      safari_15: { data: { browserFamily: 'Safari', browserMajor: '15', browserMinor: '', browserPatch: '', osFamily: '', osMajor: '', osMinor: '', osPatch: '', deviceFamily: '' },
        stats: { onlineClients: 0, activeRuns: 0, pendingRuns: 0, pendingReRuns: 0 }
      }
    }
  }
};

module.exports = function( nock ) {
  nock( 'http://swarm.example:80', { encodedQueryParams: true } )
    .get( '/api.php' )
    .query( { action: 'swarmstate' } )
    .reply( 200, response, [
      'Content-Type', 'application/json; charset=utf-8'
    ] );
};
