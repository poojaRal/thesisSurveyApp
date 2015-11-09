(function () {

'use strict';

	//Load controller
  	angular.module('surveyApp').controller('settingsController', ['$scope','$location','serviceCall',function($scope,$location,serviceCall) {

  		$scope.title = "Settings";
      $scope.dataSource = "remote";
      $scope.reminderTime = 1;
      $scope.saveStateTime = 4;
      $scope.protocolSettings = "https";


      // Error Handling
      $scope.error = {};
      /*jshint -W030 */
      $scope.error.message;

      $scope.initModels = function(){
        if(localStorage.surveyAppPin){
          $scope.pin = localStorage.surveyAppPin;
        }
        if(localStorage.surveyAppServerSettings){
          $scope.serverSettings = localStorage.surveyAppServerSettings;

          if(($scope.serverSettings.indexOf("://") > -1)){
            var address = $scope.serverSettings.split("://",2);
            $scope.serverSettings = address[1];
          }

        }
        if(localStorage.dataSource){
          $scope.dataSource = localStorage.dataSource;
        }else{
          localStorage.dataSource = $scope.dataSource;
        }
        if(localStorage.reminderTime){
          $scope.reminderTime = localStorage.reminderTime;
        }else{
          localStorage.reminderTime = $scope.reminderTime;
        }
        if(localStorage.saveStateTime){
          $scope.saveStateTime = localStorage.saveStateTime;
        }else{
          localStorage.saveStateTime = $scope.saveStateTime;
        }
        if(localStorage.protocolSettings){
          $scope.protocolSettings = localStorage.protocolSettings;
        }else{
          localStorage.protocolSettings = $scope.protocolSettings;
        }
        /*jshint newcap: false */
        var getReleaseInfo = new serviceCall("release_info","GET");
        getReleaseInfo.call("{}",$scope.releaseInfoCallSuccess,$scope.releaseInfoCallError,"config.json");
      };

  		$scope.changePage = function(path){
      		$location.path(path);
  		};

      $scope.releaseInfoCallSuccess = function(data) {
        console.log(data.config.release);
        $("#releaseInfo").text(data.config.release);
      };

      $scope.releaseInfoCallError = function() {
        console.log("Unable to get release number from local config.");
      };

  		$scope.saveSettings = function(){
          var goodToGo;
          if($scope.pin !== undefined){
            goodToGo = false;
            var regPin = /^\d+$/;
            if(!regPin.test($scope.pin)){
              $scope.error.message = 'PIN should contain numbers only.';
            }
            else{
              $scope.error.message = '';
              localStorage.surveyAppPin = $scope.pin;
              goodToGo = true;
            }
          }
          if($scope.serverSettings !== undefined){
            goodToGo = false;

            if(($scope.serverSettings.indexOf("://") > -1)){
              alert('The server address must be entered without http or https');
            }
            else{

              $scope.serverSettings = $scope.protocolSettings + '://' + $scope.serverSettings;
              localStorage.surveyAppServerSettings = $scope.serverSettings;
              goodToGo = true;
            }

            // var regServerAddress = /^\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b$/;
            // if(!regServerAddress.test($scope.serverSettings)){
            //   $scope.error.message = 'Server Address is of the form xxx.xxx.xxx.xxx';
            // }else{
            //   $scope.error.message = '';

            // }
          }
          if(goodToGo){
            var platform = $scope.getMobileOperatingSystem();
            if(platform === 'iOS'){
              // ios
              var standalone = window.navigator.standalone;
              var userAgent = window.navigator.userAgent.toLowerCase();
              var safari = /safari/.test( userAgent );
              if ( !standalone && safari ) {
                //browser
                // do nothing
              } else if (userAgent.indexOf("painreport") > -1){
                // custom uiwebview
                window.location = 'jsHandler://updateSettings?serverAddress='+localStorage.surveyAppServerSettings+'&pin='+localStorage.surveyAppPin+'&intervalTime='+localStorage.reminderTime+'&stateTime='+localStorage.saveStateTime;

              } else if ( !standalone && !safari ) {
                //uiwebview
                window.location = 'jsHandler://updateSettings?serverAddress='+localStorage.surveyAppServerSettings+'&pin='+localStorage.surveyAppPin+'&intervalTime='+localStorage.reminderTime+'&stateTime='+localStorage.saveStateTime;
              }
            }
            else if(platform === 'Android'){
              // android
              if($scope.testNativeAndroidAppUA()){
                //webview
                  jsHandler.updateSettings(localStorage.surveyAppServerSettings,localStorage.surveyAppPin,localStorage.reminderTime,localStorage.saveStateTime);
              } else {
                //browser
                // do nothing
              }
            }
            // change page after handling mobile specific settings update
            $scope.changePage('/home');
          }
  		};

      $scope.testNativeAndroidAppUA = function(){
        return /painreport/.test(navigator.userAgent);
      };

      $scope.getMobileOperatingSystem = function(){
        var userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if( userAgent.match( /iPad/i ) || userAgent.match( /iPhone/i ) || userAgent.match( /iPod/i ) ){
          return 'iOS';
        }
        else if( userAgent.match( /Android/i ) ){
          return 'Android';
        }
        else {
          return 'unknown';
        }
      };

      $scope.saveAdvancedSettings = function(){
        console.log($scope.dataSource);
        console.log($scope.reminderTime);
        console.log($scope.saveStateTime);
        console.log($scope.protocolSettings);
        localStorage.dataSource = $scope.dataSource;
        localStorage.reminderTime = $scope.reminderTime;
        localStorage.saveStateTime = $scope.saveStateTime;
        localStorage.protocolSettings = $scope.protocolSettings;


        $("#advancedSettings").modal("hide");
      };

      $scope.initModels();

  	}
  ]);

})();
