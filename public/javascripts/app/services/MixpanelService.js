import angular from 'angular';
import mediator from '../utils/mediator';
import UserServiceMod from './UserService';
import mixpanel from 'mixpanel';
import md5 from 'md5';

// TODO - restore after jspm update
// const hash = md5.md5;

var MixpanelServiceMod = angular.module('MixpanelServiceMod', ['UserServiceMod']);

MixpanelServiceMod.service('MixpanelService', [
  '$q',
  'UserService',
  function($q, UserService){
    //setup mixpanel
    var mixpanel = window.mixpanel;
    //The api_host forces the use of the mixpanel https endpoints
    mixpanel.init('7008e860730c1d848e998faa5e779490', {
      api_host: "https://api.mixpanel.com"
    }, 'restorer');

    //get the current user so that we can register it with mixpanel
    var hasUser = $q((resolve, reject)=>{
      const userMaybe = UserService.get();

      userMaybe
        .then((user)=> {
          //setup a user profile on mixpanel
          // TODO - restore this after jspm update?
          //var userID = hash(user.email);
          mixpanel.restorer.identify(user.email);
          //setup the user
          mixpanel.restorer.people.set({
            '$first_name': user.firstName,
            '$last_name': user.lastName,
            '$email': user.email
          });
          //resolve so we can track
          resolve(user)
        })
        .catch((err) => {
          //send the error via the mediator
          mediator.publish('error', err);
          reject(err);
        });
    });

    mediator.subscribe('mixpanel:view-snapshot', (modelData)=>{
      hasUser.then(()=> {
        var trackingData = {
          'contentId': modelData.get('id'),
          'snapshotTime': modelData.get('timestamp')
        };
        mixpanel.restorer.track('view-snapshot', trackingData);
      });
    });

    mediator.subscribe('mixpanel:restore-snapshot', (modelData)=> {
      hasUser.then(() => {
        var trackingData = {
          'contentId': modelData.get('id'),
          'snapshotTime': modelData.get('timestamp')
        };
        mixpanel.restorer.track('restore-snapshot', trackingData);
      });
    });

    mediator.subscribe('mixpanel:copy-content', (content)=> {
      hasUser.then(() => {
        mixpanel.restorer.track('copy-content');
      });
    });
  }
]);

export default MixpanelServiceMod;
