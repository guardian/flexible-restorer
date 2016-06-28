import angular      from 'angular';
import icons        from './icons/index';
import box          from './box';
import dropdown     from './dropdown';
import grid         from './grid';
import indexList     from './index-list';
import btn          from './btn';
import status       from './status';
import pageLabel    from './page-label';
import loadingBars  from './loading-bars';
import accordion    from './accordion';
import modal        from './modal';

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
