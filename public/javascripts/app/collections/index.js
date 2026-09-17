import angular from 'angular';

// The snapshot version list is now fetched by the React components via RTK Query
// (see components/store/api.ts), so this module no longer registers any Angular
// collections. Kept as an empty module to preserve the app's module graph.
var collections = angular.module('restorerCollections', []);

export default collections;
