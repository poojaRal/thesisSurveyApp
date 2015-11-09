(function () {

	'use strict';

	//Load controller
	angular.module('surveyApp').controller('errorController',['$scope', '$routeParams','activeData','$location', function($scope, $routeParams, activeData, $location) {

		$scope.title = "Error";

		$scope.controllerInit = function(){
			$scope.errorMessage = "Oops!! Looks like some error occurred while taking the survey.";
			$scope.question_no = $routeParams.questionId;
			$scope.surveyId = activeData.getSurveyID();
			$scope.questions = JSON.stringify(activeData.getSurveyQuestions());
		};

		$scope.changePage = function(path){   
        
        	$location.path(path);
      	};
		
		$scope.controllerInit();
		
	}
	
]);

})();