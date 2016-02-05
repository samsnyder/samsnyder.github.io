angular.module('starter.controllers', ['ngAnimate'])
    .controller('MainCtrl', function(
        $scope,
        $timeout,
        $ionicScrollDelegate,
        $http,
        $yelpAPI,
        $ionicModal,
        $ionicPlatform,
        $cordovaPreferences,
        $cordovaContacts,
        $sce) {

        $scope.$http = new HTTP($http);
        $scope.$cordovaContacts = $cordovaContacts;
        $scope.$ionicPlatform = $ionicPlatform;
        $scope.$yelpAPI = $yelpAPI;
        $scope.$timeout = $timeout;

        var that = this;
        window.mainScope = $scope;

        // var hue = jsHue();
        // var bridge = hue.bridge('127.0.0.1:8083');

        // // create user account (requires link button to be pressed)
        // bridge.createUser('foo application', function(data) {
        //     // extract bridge-generated username from returned data
        //     console.log(data);
        //     var username = data[0].success.username;

        //     console.log('New username:', username);

        //     // instantiate user object with username
        //     var user = bridge.user(username);
        // }); 

        var load = function(){
            $scope.settings.load();
        };


        if(window.device){
            document.addEventListener("deviceready", load, false);
        }else{
            $ionicPlatform.ready(function() {
                $timeout(load, 50);
                // $scope.settings.load();
            });
        }

        $scope.mainItems = [];

        // $ionicModal.fromTemplateUrl('templates/iframe.html', {
        //     scope: $scope
        // }).then(function(modal) {
        //     $scope.iFrameModal = modal;
        // });

        $ionicModal.fromTemplateUrl('templates/settings.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.settingsModal = modal;
        });

        $scope.openSettings = function(){
            $scope.settingsModal.show();
            // $cordovaPreferences.show()
            //     .success(function(value) {
            //         $timeout(function(){
            //             $scope.updatePrefs();
            //         }, 0);
            //     })
            //     .error(function(error) {
            //         alert("Error: " + error);
            //     })
        }

        $scope.saveSettings = function(){
            $scope.settings.save();
            $scope.settingsModal.hide();
        }

        $scope.cancelSettings = function(){
            $scope.settings.load();
            $scope.settingsModal.hide();
        }

        $scope.trustSrc = function(src) {
            console.log("AA", src);
            return $sce.trustAsResourceUrl(src);
        }

        $scope.addItem = function(item, dontScroll, cb){
            var newId = Math.floor(Math.random() * 99999);
            item.id = newId;
            $scope.mainItems.push(item);
            if(!dontScroll){
                $timeout(function() {
                    var el = document.getElementById(newId);
                    if(el != null){
                        var scrollPos = el.offsetTop;
                        $('#mainContent ').animate({
                            scrollTop: scrollPos
                        }, 300);
                    }
                    if(cb){
                        cb(el);
                    }
                    // $ionicScrollDelegate.scrollTo(0, scrollPos, true);
                }, 0);
            }
        }

        $scope.removeItem = function(item){
            var index = $scope.mainItems.indexOf(item);
            if(index >= 0){
                $scope.mainItems.splice(index, 1);
            }
        }

        $scope.startListen = function() {
            that.voiceRecognition.getSpeech(function(data){
                if(data.localeCompare("talking") == 0){
                    $(".footerButMain").addClass("mictalking");
                }else{
                    $(".footerButMain").removeClass("mictalking");
                }
            }, function(q){
                $scope.gotQuestion(q);
            }, function(err){
                $timeout(function(){
                    // $scope.gotQuestion("test");
                }, 300);
            })
        };

        $scope.catchQuestion = null;
        $scope.gotQuestion = function(question, dontShowQ){
            if(!dontShowQ){
                that.uiHandler.printString(question, null, {
                    isQues: true,
                    say: false,
                    translate: false
                });
            }
            if($scope.catchQuestion != null){
                $scope.catchQuestion(question);
                $scope.catchQuestion = null;
            }else{
                that.apiHandler.handleQuestion(question, function(busy){
                    if(busy != true && $scope.settings.prefs.conversationMode){
                        $timeout(function(){
                            $scope.startListen();
                        }, 500);
                    }
                });
            }
        }

        $scope.startKeyboard = function(){
            var newId = Math.floor(Math.random() * 99999);
            $scope.addItem({
                type: 'input',
                inputId: newId
            });
            $timeout(function(){
                console.log(newId);
                document.getElementById(newId).focus();
                if(window.cordova && window.cordova.plugins.Keyboard){
                    // window.cordova.plugins.Keyboard.show();
                }
                document.getElementById(newId).onkeypress = function(e){
                    if (!e) e = window.event;
                    var keyCode = e.keyCode || e.which;
                    if (keyCode == '13'){
                        $scope.gotQuestion(this.innerHTML, true);
                        this.contentEditable = false;
                        $(this).blur();
                        if(window.cordova && window.cordova.plugins.Keyboard){
                            window.cordova.plugins.Keyboard.close();
                        }
                        return false;
                    }
                }
            }, 500);
        }

        $scope.optionClicked = function(){
            that.uiHandler.optionClicked(this.option);
        }

        this.uiHandler = new UIHandler($scope);
        this.apiHandler = new APIHandler(this.uiHandler, $scope);
        $scope.settings = new SettingsController($cordovaPreferences);
        this.voiceRecognition = new VoiceRecognition($scope);

    });

function a(query){
    window.mainScope.gotQuestion(query);
}
