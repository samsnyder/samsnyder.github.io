// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'ngCordova', 'starter.controllers'])


    .factory("$yelpAPI", function($http) {
        return {
            "search": function(extraParams, callback) {
                var method = 'GET';
                var url = 'http://api.yelp.com/v2/search';
                var params = {
                    oauth_consumer_key: '1X_4XV_iu-0iFJE3sNpZJw', //Consumer Key
                    oauth_token: 'Ie_CJtB_DUu6plSmTTK2S9Om1EOYSEvd', //Token
                    oauth_signature_method: "HMAC-SHA1",
                    oauth_timestamp: new Date().getTime(),
                    oauth_nonce: randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
                };
                for (var attrname in extraParams) { params[attrname] = extraParams[attrname]; }
                var consumerSecret = 'vTG1CUSS10-KfhEtWQcpD0keTuQ'; //Consumer Secret
                var tokenSecret = 'Job-lVnHG2V2hWbiz4sbaUflHZw'; //Token Secret
                var signature = oauthSignature.generate(method, url, params, consumerSecret, tokenSecret, { encodeSignature: false});
                params['oauth_signature'] = signature;
                $http.get(url, {params: params}).then(function(resp){
                    callback(resp.data);
                });
            }
        }
    })

.factory('$speech', function() {

    return {
        start: function() {
            console.log("AAA", window.cordova, navigator);
        }
    }
})

    .run(function($ionicPlatform) {
        $ionicPlatform.ready(function() {
            if(window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                // Don't remove this line unless you know what you are doing. It stops the viewport
                // from snapping when text inputs are focused. Ionic handles this internally for
                // a much nicer keyboard experience.
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if(window.StatusBar) {
                StatusBar.styleDefault();
            }
        });
    })


function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}
