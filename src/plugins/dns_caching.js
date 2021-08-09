const http = require('http');
const https = require('https');
const dns = require('dns');
const cache = {};

/**
 * Mimics the dns.resolve4 resolver with intermediate caching.
 *
 * @param {String} hostname
 * @param {Object} options
 * @param {Function} callback
 */
function cached_lookup(hostname, options, callback) {
    // Hit cache layer
    if (cache[hostname]) {
        // Check cache validity based on expiry
        if (cache[hostname].expiry < Date.now()) {
            // Delete expired cache value
            delete cache[hostname];
        } else {
            // Retrieve and iterate through all cached addresses
            let cache_object = cache[hostname];
            cache_object.last_used++;
            if (cache_object.last_used >= cache_object.addresses.length) cache_object.last_used = 0;

            // Resolve current address as an IPv4
            return callback(null, cache_object.addresses[cache_object.last_used], 4);
        }
    }

    // Hit DNS resolver for fresh lookup
    options.ttl = true;
    dns.resolve4(hostname, options, (error, addresses) => {
        // Pass through any errors through callback as Node.js DNS Spec
        if (error || addresses.length == 0) return callback(error, null, null);

        // Create template cache object
        let cache_object = {
            expiry: 0, // expiry timestamp in milliseconds
            addresses: [], // resolved addresses
            last_used: 0, // cursor used to determine last used address for round robin
        };

        // Parse all addresses and use lowest TTL of expiry for caching
        let lowest_ttl = addresses[0].ttl;
        addresses.forEach((address) => {
            cache_object.addresses.push(address.address);
            if (address.ttl < lowest_ttl) lowest_ttl = address.ttl;
        });

        // Determine expiry timestamp based on TTL in seconds
        cache_object.expiry = Date.now() + lowest_ttl * 1000;

        // Cache and resolve lookup results
        cache[hostname] = cache_object;
        return callback(null, cache_object.addresses[0], 4);
    });
}

/**
 * Returns an agent pair for both HTTP/HTTPS.
 *
 * @param {Object} options
 * @returns
 */
function get_agent_pair(options) {
    options.lookup = cached_lookup;
    return {
        http: new http.Agent(options),
        https: new https.Agent(options),
    };
}

const CACHING_AGENTS = get_agent_pair({
    keepAlive: true,
});

/**
 * Returns appropriate protocol Agent with custom cached lookup.
 *
 * @param {Object} parsedURL
 * @returns {Agent}
 */
function get_cache_agent(parsedURL) {
    if (parsedURL.protocol == 'http:') {
        return CACHING_AGENTS.http;
    } else {
        return CACHING_AGENTS.https;
    }
}

/**
 * Binds DNS Caching agent to request if options.proxy is not specified.
 *
 * @param {Object} options
 */
function implement_dns_caching(options) {
    // Do not bind dns caching agent if explicitly disabled
    if (options.dns_caching === false) return;

    // We do not want to overwrite the agent for when options.proxy has been used
    if (options.agent === undefined) options.agent = (parsedURL) => get_cache_agent(parsedURL);
}

module.exports = implement_dns_caching;
