import angular from 'angular'

import clockActive      from '!!raw-loader!./svg/clock-active.svg';
import clockDisabled    from '!!raw-loader!./svg/clock-disabled.svg';
import infoActive       from '!!raw-loader!./svg/info-active.svg';
import infoDisabled     from '!!raw-loader!./svg/info-disabled.svg';
import publishActive    from '!!raw-loader!./svg/publish-active.svg';
import publishDisabled  from '!!raw-loader!./svg/publish-disabled.svg';
import previewActive    from '!!raw-loader!./svg/preview-active.svg';
import arrowDown        from '!!raw-loader!./svg/arrow-down.svg';
import composerIcon     from '!!raw-loader!./svg/composer-icon.svg';
import wrenchActive     from '!!raw-loader!./svg/wrench-active.svg';
import wrenchDisabled   from '!!raw-loader!./svg/wrench-disabled.svg';
import expandActive     from '!!raw-loader!./svg/expand-active.svg';
import expandDisabled   from '!!raw-loader!./svg/expand-disabled.svg';

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
