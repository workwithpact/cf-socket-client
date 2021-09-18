#/bin/sh
echo '(function(){ var module = {exports: {}}; var require = null; var exports = {};' > dist/client.browser.js
echo '' >> dist/client.browser.js
cat dist/client.js >> dist/client.browser.js
echo '' >> dist/client.browser.js
echo 'window.PactSocket = window.PactSocket || {};' >> dist/client.browser.js
echo 'window.PactSocket.SocketClient = exports.default;})()' >> dist/client.browser.js