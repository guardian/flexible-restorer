import angular from 'angular';
import mediator from '../utils/mediator';
import safeApply from 'composer-components/lib/utils/safe-apply';

var ModalCtrlMod = angular.module('ModalCtrlMod', []);

ModalCtrlMod.controller('ModalCtrl', [
  '$scope',
  '$element',
  '$timeout',
  function($scope, $element, $timeout){
    //SETUP
    $scope.isActive = false;

    //remove the inline style which prevents a flash of content
    //if we dont use a timeout the inline style is removed after the scope is parsed
    //this leads to a flash of the modal
    $timeout(()=>$element.attr('style', {display: 'block'}), 50);

    //APPLICATION EVENTS
    var showModal = this.showModal = function showModal(){
      window.scroll(0, 0);
      safeApply($scope, () => {
        $scope.isActive = true;
        //LOCK THE BODY ELEMENT SO A USER CANNOT
        //SCROLL DOWN THE PAGE WHILST THE MODAL IS OPEN
        angular.element(document.body).css({ overflow: 'hidden' });
      });
    };

    var closeModal = this.closeModal = function closeModal(){
      safeApply($scope, () => {
        $scope.isActive = false;
        // UNLOCK THE BODY ELEMENT
        angular.element(document.body).css({ height: '100%', overflow: 'visible' });
        mediator.publish('snapshot-list:hidden-modal', showModal);
      });
    };

    //SYSTEM EVENTS
    mediator.subscribe('snapshot-list:display-modal', showModal);
    mediator.subscribe('snapshot-list:close-modal',   closeModal);
    //close the modal when any error occurs
    mediator.subscribe('error',   closeModal);

    //DOM EVENTS
    window.addEventListener('keydown', function modalOnKeyDown(e){
      //IF A USER PRESSES ESCAPE WE WANT TO CLOSE THE MODAL
      if ($scope.isActive && e.keyCode === 27) {
        closeModal();
      }
    });

  }
]);

export default ModalCtrlMod;
