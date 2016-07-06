import angular from 'angular'

import clockActive      from './svg/clock-active.svg!text';
import clockDisabled    from './svg/clock-disabled.svg!text';
import infoActive       from './svg/info-active.svg!text';
import infoDisabled     from './svg/info-disabled.svg!text';
import publishActive    from './svg/publish-active.svg!text';
import publishDisabled  from './svg/publish-disabled.svg!text';
import previewActive    from './svg/preview-active.svg!text';
import arrowDown        from './svg/arrow-down.svg!text';
import composerIcon     from './svg/composer-icon.svg!text';
import wrenchActive     from './svg/wrench-active.svg!text';
import wrenchDisabled   from './svg/wrench-disabled.svg!text';
import expandActive     from './svg/expand-active.svg!text';
import expandDisabled   from './svg/expand-disabled.svg!text';

var templates = {
    'clock-active': clockActive,
    'clock-disabled': clockDisabled,
    'info-active': infoActive,
    'info-disabled': infoDisabled,
    'publish-active': publishActive,
    'publish-disabled': publishDisabled,
    'preview-active': previewActive,
    'arrow-down': arrowDown,
    'composer-icon': composerIcon,
    'wrench-active': wrenchActive,
    'wrench-disabled': wrenchDisabled,
    'expand-active': expandActive,
    'expand-disabled': expandDisabled
};

var icons = angular.module('guIcons', []);

icons.directive('guIcon', function icons() {
    return {
        restrict: 'E',
        template: (el, attrs) => templates[attrs.variant]
    }
});

export default icons;
