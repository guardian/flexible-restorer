import angular from 'angular';
import mediator from '../utils/mediator';
import UserServiceMod from './UserService';
import mixpanel from 'mixpanel';

console.log('-----------------------');
console.log(mixpanel);
console.log('-----------------------');

var MixpanelServiceMod = angular.module('MixpanelServiceMod', ['UserServiceMod']);

MixpanelServiceMod.service('MixpanelService', [
  '$q',
  'UserService',
  function($q, UserService){
    var user;
    var hasUser = $q((resolve, reject)=>{
      UserService
        .get()
        .success((user)=> {
          console.log('got user');
          resolve(user)
        })
        .error((err) => {
          //send the error via the mediatoe
          reject(err);
        });
    });

    mediator.subscribe('mixpanel:view-snapshot', (modelData)=>{
      hasUser.then(()=> {
        console.log('viewed model', modelData);
      });
    });

    mediator.subscribe('mixpanel:restore-snapshot', (modelData)=> {
      hasUser.then(() => {
        console.log('restores model', modelData);
      });
    });

    mediator.subscribe('mixpanel:copy-content', (content)=> {
      hasUser.then(() => {
        console.log('restores model', content);
      });
    });
  }
]);

export default MixpanelServiceMod;
