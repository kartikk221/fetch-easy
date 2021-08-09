const fetch = require('node-fetch');
const implement_timeout = require('./src/plugins/timeout.js');
const implement_proxy = require('./src/plugins/proxy.js');
const implement_dns_caching = require('./src/plugins/dns_caching.js');

/**
 * Wrapper for fetch implementing all functions of superFetch.
 *
 * @param {String} url
 * @param {Object} options
 */
function easyFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        // Implements options.timeout
        let request_timeout = implement_timeout(options);

        // Implements options.proxy
        implement_proxy(options);

        // Implements DNS Caching | Disable using options.dns_caching = false
        implement_dns_caching(options);

        // Initiate fetch request
        fetch(url, options)
            .then(resolve)
            .catch(reject)
            .finally(() => {
                // Remove any pending request timeout
                if (request_timeout) clearTimeout(request_timeout);
            });
    });
}

module.exports = easyFetch;
