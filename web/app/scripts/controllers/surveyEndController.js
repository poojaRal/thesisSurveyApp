(function () {

'use strict';

	//Load controller
  	angular.module('surveyApp').controller('surveyEndController', ['$scope','$location','serviceCall','activeData',function($scope,$location,serviceCall,activeData) {
      $scope.title = "Submit";

      // Error Handling
	    $scope.error = {};
      /*jshint -W030 */
    	$scope.error.message;

      $scope.success = {};
      /*jshint -W030 */
      $scope.success.message;
      /*jshint -W030 */
      $scope.payloadForService;

    	$scope.submit = function(){
    		var reg = /^\d+$/;
            if(!reg.test($scope.pin)){
                if(angular.isUndefined($scope.pin) || $scope.pin === '' || $scope.pin === ' '){
                  $scope.error.message = 'PIN cannot be blank.';
                }else{
                  $scope.error.message = 'PIN should contain numbers only.';
                }
            }else{
            	$scope.error.message = '';
            	if(localStorage.surveyAppPin === $scope.pin){
            		console.log("matched");
                $scope.submitCall();
        			}else{
        				$scope.error.message = 'PIN mismatch. Please try again.';
        			}
          }
    	};

      $scope.submitCall = function(){
        $("#loader").show();
        $scope.surveyID = activeData.getSurveyID();
        var surveyResults = [];
        console.log("Inside submitCall");
        console.log(localStorage.length);
        angular.forEach(localStorage, function(value, key) {
          if(key.indexOf($scope.surveyID.toString()+":") > -1){
            var quesID = key.split(":")[1];
            var selectedOptions = [];
            var bodyPain = [];
            //pooja add
            var ansTimeStamp = 0;
            var prevTimeStamp = 0;
            var nextTimeStamp = 0;
            //pooja end
            if(value.indexOf("location") > -1){

              //body pain question
              // var pain = {"pain": JSON.parse(value)};
              bodyPain.push(JSON.parse(value));
            }else{
              //normal question
              selectedOptions.push(value);
            }
            //pooja add
            console.log("quesID is : ", quesID);
            if(localStorage.getItem("ansTs" + ":" + quesID) !== null){
              ansTimeStamp = localStorage.getItem("ansTs" + ":" + quesID);
            }
            if(localStorage.getItem("prev" + ":" + quesID) !== null){
              prevTimeStamp = localStorage.getItem("prev" + ":" + quesID);

            }
            if(localStorage.getItem("next" + ":" + quesID) !== null){
              nextTimeStamp = localStorage.getItem("next" + ":" + quesID);

            }
            //pooja end
            // var totalAnswer = '{"quesID":' + quesID +',"selectedOptions":[' + selectedOptions + '],"bodyPain":[' + bodyPain + ']}';
            var totalAnswer = { "quesID" : quesID,
                                "selectedOptions" : selectedOptions,
                                "bodyPain" : bodyPain,
                                "ansTimeStamp" : ansTimeStamp, // pooja added new param
                                "prevTimeStamp" : prevTimeStamp, // pooja added new param
                                "nextTimeStamp" : nextTimeStamp }; // pooja added new param
             surveyResults.push(totalAnswer);
          }
        });
        console.log("Survey Results");
         console.log(JSON.stringify(surveyResults));
        // var timeStamp = Date.now;
        var surveyID = $scope.surveyID.toString();
        var today = new Date().getTime();

        $scope.payloadForService = '{"surveyInstanceID":'+surveyID+',"timeStamp":'+today+',"surveyResults":'+JSON.stringify(surveyResults)+'}';
         /*jshint newcap: false */
        var surveySubmitCall = new serviceCall("submit_survey","POST");
        if(localStorage.dataSource == "remote"){
          surveySubmitCall.call($scope.payloadForService,$scope.submitCallSuccess,$scope.submitCallError);
        }
        if(localStorage.dataSource == "local"){
          surveySubmitCall.call($scope.payloadForService,$scope.submitCallSuccess,$scope.submitCallError,"json/submitSurvey.json");
        }
      };

      $scope.submitCallSuccess = function(data,status){
        console.log(activeData.getError());
        console.log(status);
        $("#loader").hide();
        console.log(data.message);
        if(data.message === "Success"){
          $scope.success.message = "Submitted successfully.";
          localStorage.surveyInProgress = -1;
          $("#submitBtn").hide();
          var platform = $scope.getMobileOperatingSystem();
          var surveyID = $scope.surveyID;
          if(platform === 'iOS'){
            // ios
            var standalone = window.navigator.standalone;
            var userAgent = window.navigator.userAgent.toLowerCase();
            var safari = /safari/.test( userAgent );
            if ( !standalone && safari ) {
              //browser
              // do nothing
            } else if (userAgent.indexOf("painreport") > -1){
              // custom webview
              $("#exitBtn").hide();
            } else if ( !standalone && !safari ) {
              //uiwebview
              $("#exitBtn").hide();
            }
          }
        }else{
          $scope.error.message = data.message;
          $scope.saveSubmissionToLocalStorage();
        }
        activeData.setSurveyCompleted(true);
        $scope.clearLocalStorage();
      };

      $scope.submitCallError = function(data,status){
        console.log(activeData.getError());
        $("#loader").hide();
        console.log("here");
        console.log(status);
        console.log(data);
        $scope.saveSubmissionToLocalStorage();
        if(activeData.getError() === "offline"){
          $scope.error.message = "Unable to submit. Please check internet connectivity.";
        } else if(activeData.getError() === "internalServerError"){
          $scope.error.message = "Unable to submit. There's a server error.";
        } else if(activeData.getError() === "notFound"){
          $scope.error.message = "Unable to submit. API not found on server. Incorrect route.";
        } else if(activeData.getError() === "unknownError"){
          $scope.error.message = "Unable to submit. Please check internet connectivity or contact administrator.";
        } else {
          $scope.error.message = 'Unable to submit. Please contact administrator.';
        }
        // if(!navigator.onLine){
        //   alert("Error! Unable to fetch data. Please check internet connectivity.");
        // } else if(status === 500){
        //   alert("Error! Unable to fetch data. There's a server error.");
        // } else if(status === 404){
        //   alert("Error! API not found on server. Incorrect route.");
        // } else{
        //   alert("Error! Unable to fetch data. Please check the internet connectivity or app settings or contact administrator.");
        // }
      };

      $scope.saveSubmissionToLocalStorage = function(){
        var surveyID = $scope.surveyID;
        var payload = $scope.payloadForService;
        console.log(surveyID + " : " + payload);
        localStorage[surveyID] = payload;
        $scope.callNativeSubmitErrorHandler();
      };

      $scope.clearLocalStorage = function(){
        console.log("here");
        var questions = activeData.getSurveyQuestions();
        $.each(questions,function(index,val){
          console.log($scope.surveyID+ ":" +val.quesID);
          localStorage.removeItem($scope.surveyID+ ":" +val.quesID);
        });
        localStorage.removeItem("reloadBackupSurveyID");
        localStorage.removeItem("reloadBackupSurveyName");
        localStorage.removeItem("reloadBackupSurveyQuestions");
      };

    	$scope.changePage = function(path){
      	$location.path(path);
  		};

      $scope.callNativeSubmitErrorHandler = function(){
        var platform = $scope.getMobileOperatingSystem();
        var surveyID = $scope.surveyID;
        console.log(platform);
        if(platform === 'iOS'){
          // ios
          var standalone = window.navigator.standalone;
          var userAgent = window.navigator.userAgent.toLowerCase();
          var safari = /safari/.test( userAgent );
          if ( !standalone && safari ) {
            //browser
            // do nothing
          } else if (userAgent.indexOf("painreport") > -1){
            // custom webview
            // call handler
            window.location = 'jsHandler://submitError?json='+localStorage[surveyID];
          } else if ( !standalone && !safari ) {
            //uiwebview
            // call handler
            window.location = 'jsHandler://submitError?json='+localStorage[surveyID];
          }
        }
        else if(platform === 'Android'){
          // android
          if($scope.testNativeAndroidAppUA()){
            //webview
            // call handler
            jsHandler.submitError(localStorage.surveyID);
          } else {
            //browser
            // do nothing
          }
        } else {
          // some other browser
          // do nothing
        }
      };

      $scope.closeApp = function(){
        // window.close();
        var platform = $scope.getMobileOperatingSystem();
        console.log(platform);
        if(platform === 'iOS'){
          // ios
          var standalone = window.navigator.standalone;
          var userAgent = window.navigator.userAgent.toLowerCase();
          var safari = /safari/.test( userAgent );
          if ( !standalone && safari ) {
            //browser
            $scope.changePage('/home');
          } else if (userAgent.indexOf("painreport") > -1){
            // custom webview
            window.location = 'jsHandler://killApp';
          } else if ( !standalone && !safari ) {
            //uiwebview
            window.location = 'jsHandler://killApp';
          }
        }
        else if(platform === 'Android'){
          // android
          if($scope.testNativeAndroidAppUA()){
            //webview
            jsHandler.killApp();
          } else {
            //browser
            $scope.changePage('/home');
          }
        } else {
          // some other browser
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

    }
  ]);

})();
