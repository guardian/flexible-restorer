// Stub for non-JS assets (svg/images/styles) imported by components. Webpack's
// asset loaders handle these in the real build; under jest they resolve to a
// harmless string so component tests can import the modules.
module.exports = "test-file-stub";
