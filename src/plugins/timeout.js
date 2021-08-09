const AbortController = require('abort-controller');

/**
 * Injects an abort controller signal based on options.timeout
 *
 * @param {Object} options
 * @returns {Number} timeoutID
 */
function implement_timeout(options) {
    // Check for a timeout parameter that is number type (milliseconds)
    if (typeof options.timeout == 'number') {
        // Create a new AbortController instance
        let controller = new AbortController();

        // Bind abort controller signal to options object for node-fetch
        options.signal = controller.signal;

        // Return timeout id for cancellation if request finishes before timeout
        return setTimeout((crl) => crl.abort(), options.timeout, controller);
    }
}

module.exports = implement_timeout;
