/* eslint-disable max-len */

module.exports = function( nock ) {
  nock( 'https://api.browserstack.com:443', { encodedQueryParams: true } )
    .get( '/4/browsers' )
    .query( { flat: 'true' } )
    .reply( 401, 'HTTP Basic: Access denied.\n', [
      'Content-Type', 'text/html; charset=utf-8'
    ] );
};
