import angular      from 'angular';
import icons        from './icons/index';
import box          from './box/index';
import dropdown     from './dropdown/index';
import grid         from './grid/index';
import indexList     from './index-list/index';
import btn          from './btn/index';
import status       from './status/index';
import pageLabel    from './page-label/index';
import loadingBars  from './loading-bars/index';
import accordion    from './accordion/index';
import modal        from './modal/index';

var components = angular.module('guComponents', [
  'guIcons',
  'guGrid',
  'guBtn',
  'guStatus',
  'guBox',
  'guDropdown',
  'guPageLabel',
  'guIndexList',
  'guLoadingBars',
  'guModal',
  'guAccordion'
]);


export default components;
