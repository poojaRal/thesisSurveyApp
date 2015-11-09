(function () {

'use strict';
	
	//Load controller
  	angular.module('surveyApp').controller('homeController', ['$rootScope','$scope','$location','serviceCall','activeData',function($rootScope,$scope,$location,serviceCall,activeData) {      	

        $scope.title = "Home";
        $scope.nextDueSurveyID = "";    
        var okayToStart = false;      

        $scope.controllerInit = function(){            
          activeData.setSurveyCompleted(false);
          if(!localStorage.surveyInProgress){
            localStorage.surveyInProgress = -1;
          }              
        	if(!localStorage.surveyAppPin){
        		if(!localStorage.surveyAppServerSettings){
        			$scope.surveyMessage = "You don't have your PIN and server settings setup.";
        		}
        		else
          			$scope.surveyMessage = "You don't have your PIN setup.";
        	}
        	else if(!localStorage.surveyAppServerSettings){
          		$scope.surveyMessage = "You don't have your server settings setup.";
        	}    
        	else {        		
        		var userPIN = localStorage.surveyAppPin;
  				  var payloadForService = '{"userPIN":"'+userPIN+'"}';
            /*jshint newcap: false */
  				  var surveyIDCall = new serviceCall("check_surveys","GET");
            $('#loader').modal('show');            
            if(localStorage.dataSource == "remote"){
              surveyIDCall.call(payloadForService,$scope.surveyIDsuccess,$scope.serviceError);
            }
            if(localStorage.dataSource == "local"){
              surveyIDCall.call(payloadForService,$scope.surveyIDsuccess,$scope.serviceError,"json/getSurveyID.json");
            }
        	}    	  			
  		};

  		$scope.surveyIDsuccess = function(data, status, headers, config){        
        $('#loader').modal('hide');        
        // var dates = [];
        // var okayToStart = false; 
        if(data.message == "Success" && data.surveys.length !== 0){
          // angular.forEach(data.surveys, function(value,key){
          //   console.log(value.nextDueAt);
          //   dates.push(value.nextDueAt);
          // });
          // dates.sort(function(a, b){
          //   return Date.parse(a) - Date.parse(b);
          // });
          // console.log(dates);         
          // var nextDueAtFinal = dates[0];
          // var nextDueSurveyID = 0;
          // angular.forEach(data.surveys, function(value,key){
          //   if(value.nextDueAt == nextDueAtFinal){
          //     $scope.nextDueSurveyID = value.surveyInstanceID;
          //     $scope.nextDueSurveyTitle = value.surveyTitle;
          //   }
          // });
          var nextDueAtFinal = data.surveys[0].nextDueAt;
          $scope.nextDueSurveyID = data.surveys[0].surveyInstanceID;
          $scope.nextDueSurveyTitle = data.surveys[0].surveyTitle;
          okayToStart = data.surveys[0].okayToStart;
          console.log($scope.nextDueSurveyID);  
          activeData.setSurveyID($scope.nextDueSurveyID);
          var date = new Date(nextDueAtFinal);
          console.log(date);          
          var dd = date.getDate();
          var mm = date.getMonth()+1; //January is 0!
          var yyyy = date.getFullYear();
          if(dd<10) {
              dd='0'+dd;
          } 
          if(mm<10) {
              mm='0'+mm;
          }
          date = mm+'/'+dd+'/'+yyyy;
          console.log(date);          
          if(okayToStart){
            $("#startSurvey").removeClass("disabled");
          }          
          if(localStorage.surveyInProgress !== -1 && parseInt(localStorage.surveyInProgress) === $scope.nextDueSurveyID){
            $scope.surveyMessage = "You have a " + $scope.nextDueSurveyTitle + " in progress, due on " + date +". To begin survey, please click on the Start Survey button.";  
          } else {
            if(okayToStart){
              $scope.surveyMessage = "You have a " + $scope.nextDueSurveyTitle + " due on " + date +". To begin survey, please click on the Start Survey button.";              
            } else {
              $scope.surveyMessage = "You have a " + $scope.nextDueSurveyTitle + " due on " + date +". ";
            }          
          }          
        }
        else if(data.message == "You have no active surveys"){
          $scope.surveyMessage = "You have no surveys due. Please check in again later.";
        }
        else if(data.message == "Your PIN is not active"){
          $scope.surveyMessage = "Your PIN is not active. Please contact the administrator.";
        }
        else if(data.message == "The PIN is invalid"){
          $scope.surveyMessage = "Your PIN is invalid. Please contact the administrator.";
        }
        else if(data.message == "Unexpected Error"){
          $scope.surveyMessage = "Unexpected Error. Please contact the administrator.";
        } else if(data.surveys.length === 0){
          $scope.surveyMessage = "You don't have any surveys due at this time. Please check again later.";
        }
  		};      

  		$scope.serviceError = function(data, status, headers, config){
        $('#loader').modal('hide');        
  			console.log(status);
        console.log(activeData.getError());
        if(activeData.getError() === "offline"){
          $scope.surveyMessage = "Unable to fetch data. Please check internet connectivity.";          
        } else if(activeData.getError() === "internalServerError"){
          $scope.surveyMessage = "Unable to fetch data. There's a server error.";          
        } else if(activeData.getError() === "notFound"){
          $scope.surveyMessage = "Unable to fetch data. API not found on server. Incorrect route.";
        } else if(activeData.getError() === "unknownError"){
          $scope.surveyMessage = "Unable to fetch data. Please check internet connectivity or contact administrator.";
        } else {
          $scope.surveyMessage = 'Unable to fetch data. Please contact administrator.'; 
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

      $scope.getSurvey = function(){
        
        if(okayToStart){
           
            console.log($scope.nextDueSurveyID);
            var payloadForService = '{"surveyInstanceID":'+$scope.nextDueSurveyID+'}';
            console.log(payloadForService);
            /*jshint newcap: false */
            $('#loader').modal('show');
            var getSurveyCall = new serviceCall("get_survey","GET");
            if(localStorage.dataSource == "remote"){
              getSurveyCall.call(payloadForService,$scope.getSurveySuccess,$scope.serviceError);
            }
            if(localStorage.dataSource == "local"){
              getSurveyCall.call(payloadForService,$scope.getSurveySuccess,$scope.serviceError,"json/getSurvey.json");
            }         
        } 
      };

      $scope.getSurveySuccess = function(data, status, headers, config){      
        $('#loader').modal('hide');  
        console.log(data);
        console.log(data.surveyName);
        activeData.setSurveyName(data.surveyName);
        activeData.setSurveyQuestions(data.questions);
        localStorage.surveyInProgress = $scope.nextDueSurveyID;
        localStorage.surveyStartedAt = new Date().getTime();       
        $scope.changePage('/survey');
      };


      $scope.changePage = function(path){   
        // $("#loader").show();
      	$location.path(path);
  		};

  		// Date format conversion
  		Date.prototype.yyyymmdd = function() {
		    var yyyy = this.getFullYear().toString();
		    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
		    var dd  = this.getDate().toString();
		    // var hh = this.getHours().toString();
		    // var mi = this.getMinutes().toString();
		    // var ss = this.getSeconds().toString();		    
		    // return yyyy + "-" +(mm[1]?mm:"0"+mm[0]) + "-" + (dd[1]?dd:"0"+dd[0]) + " " + hh + ":" + (mi[1]?mi:"0"+mi[0]) + ":" + (ss[1]?ss:"0"+ss[0]); // padding
		    return yyyy + "-" +(mm[1]?mm:"0"+mm[0]) + "-" + (dd[1]?dd:"0"+dd[0]); // padding
	   	}; 

  		$scope.controllerInit();

    }
  ]);

})();