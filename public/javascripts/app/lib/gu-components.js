import angular      from 'angular';
import icons        from './icons/index';
import box          from './box/index';
import dropdown     from './dropdown/index';
import grid         from './grid/index';
import btn          from './btn/index';
import status       from './status/index';
import pageLabel    from './page-label/index';
import loadingBars  from './loading-bars/index';
import accordion    from './accordion/index';

var components = angular.module('guComponents', [
  'guIcons',
  'guGrid',
  'guBtn',
  'guStatus',
  'guBox',
  'guDropdown',
  'guPageLabel',
  'guLoadingBars',
  'guAccordion'
]);


export default components;
