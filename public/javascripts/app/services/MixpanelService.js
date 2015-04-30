import angular from 'angular';
import mediator from '../utils/mediator';
import UserServiceMod from './UserService';
import mixpanel from 'mixpanel';
import md5 from 'md5';

const hash = md5.md5;

console.log('-----------------------');
console.log(hash);
console.log('-----------------------');


var MixpanelServiceMod = angular.module('MixpanelServiceMod', ['UserServiceMod']);

MixpanelServiceMod.service('MixpanelService', [
  '$q',
  'UserService',
  function($q, UserService){
    //setup mixpanel
    var mixpanel = window.mixpanel;
    mixpanel.init('7008e860730c1d848e998faa5e779490', {}, 'restorer');

    //get the current user so that we can register it with mixpanel
    var hasUser = $q((resolve, reject)=>{
      UserService
        .get()
        .success((user)=> {
          //setup a user profile on mixpanel
          var userID = hash(user.email);
          mixpanel.restorer.identify(userID);
          //setup the user
          mixpanel.restorer.peoplei.set({
            '$first_name': user.firstName,
            '$last_name': user.lastName,
            '$email': user.email
          });
          //resolve so we can track
          resolve(user)
        })
        .error((err) => {
          //send the error via the mediator
          mediator.publish('error', err);
          reject(err);
        });
    });

    mediator.subscribe('mixpanel:view-snapshot', (modelData)=>{
      hasUser.then(()=> {
        mixpanel.restorer.track('view-snapshot', modelData);
      });
    });

    mediator.subscribe('mixpanel:restore-snapshot', (modelData)=> {
      hasUser.then(() => {
        mixpanel.restorer.track('restore-snapshot', modelData);
      });
    });

    mediator.subscribe('mixpanel:copy-content', (content)=> {
      hasUser.then(() => {
        mixpanel.restorer.track('copy-content', content);
      });
    });
  }
]);

export default MixpanelServiceMod;
