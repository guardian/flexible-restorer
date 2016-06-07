// Get the environment from the URL.
//
// Assumes the URL looks something like:
// 'https://restorer.local.dev-gutools.co.uk/' (test environment) or
// 'https://restorer.gutools.co.uk/' (production environment).
function getEnvironment() {
    var env = window.location.origin.split('.')[1];
    return env === 'gutools' ? 'production' : env;
}

// Get the URL to Composer within the same environment.
function getComposerUrl() {
    var env = getEnvironment();
    return env === 'production' ? 'https://composer.gutools.co.uk'
                                : 'https://composer.{{env}}.dev-gutools.co.uk'.replace('{{env}}', env);
}

// Get the URL to the Composer api within the same environment.
function getApiUrl() {
    return getComposerUrl() + '/api';
}

function restoreContentUrlFor(contentId) {
    return getApiUrl() + '/restorer/content/:contentId'.replace(':contentId', contentId);
}

exports.getEnvironment = getEnvironment;
exports.getComposerUrl = getComposerUrl;
exports.getApiUrl = getApiUrl;
exports.restoreContentUrlFor = restoreContentUrlFor;
