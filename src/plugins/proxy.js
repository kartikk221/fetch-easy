const HttpProxyAgent = require('http-proxy-agent');
const HttpsProxyAgent = require('https-proxy-agent');

/**
 * Returns proxy in HTTP format for proxy agent.
 *
 * @param {Object} options Supported: [https, host, port, username, password]
 * @returns
 */
function proxy_to_string({ https = false, host, port, username, password }) {
    let protocol = https === true ? 'https' : 'http';
    let credentials = username && password ? `${username}:${password}@` : '';
    return `${protocol}://${credentials}${host}:${port}`;
}

/**
 * Returns appropriate Agent based on parsedURL object.
 *
 * @param {Object} parsedURL
 * @param {String} proxy
 * @returns {Agent} HTTP/HTTPS Agent
 */
function get_proxy_agent(parsedURL, proxy) {
    if (parsedURL.protocol === 'http:') {
        return new HttpProxyAgent(proxy);
    } else {
        return new HttpsProxyAgent(proxy);
    }
}

/**
 * Injects appropriate proxy agent based on options.proxy
 *
 * @param {Object} options
 */
function implement_proxy(options) {
    // Convert object based proxy format to string
    if (options.proxy && typeof options.proxy == 'object')
        options.proxy = proxy_to_string(options.proxy);

    // Enforce string type for proxy parameter
    if (typeof options.proxy !== 'string') return;

    // Bind proxy agent resolver for node-fetch
    options.agent = (parsedURL) => get_proxy_agent(parsedURL, options.proxy);
}

module.exports = implement_proxy;
