(function () {

'use strict';

	//Load controller
  	angular.module('surveyApp').controller('surveyController', ['$scope','$timeout','$location','activeData',function($scope,$timeout,$location,activeData) {

  		$scope.title = "Survey";
  		$scope.questions = [];
  		$scope.questionCounter = 0;
      $scope.answers = [];
      $scope.selectedAnswer = '';
      $scope.bodyPainAnswer = {location:"",intensity:""};
      $scope.surveyID = '';
      $scope.answeredCounter = 0;
      /*jshint -W030 */
      $scope.noPainRect;
      $scope.noPainCheck = false;
      $scope.isAnswered = false;

      $scope.$watch('selectedAnswer', function(value) {

        if($scope.questions[$scope.questionCounter].questionType === "multiChoiceSingleAnswer"){
          if(value !== '' && value !== undefined){
            $scope.isAnswered = true;
          }
          if($scope.isAnswered) {
            var currentQuesID = $scope.questions[$scope.questionCounter].quesID;
            var answerID = value;
            var today = new Date().getTime();

            $scope.saveAnswerToLocalStorage(currentQuesID,answerID,today);
            $scope.nextDisabled = false;
          }
        }
      });

      $scope.$watch('bodyPainAnswer.location', function(){
        $scope.bodyPainAnswerWatcher();
      });

      $scope.$watch('bodyPainAnswer.intensity', function(){
        $scope.bodyPainAnswerWatcher();
      });

      $scope.bodyPainAnswerWatcher = function(){
        console.log("Inside bodyPainAnswerWatcher");
        console.log($scope.bodyPainAnswer.location);
        console.log($scope.bodyPainAnswer.intensity);
        var answeredWithNoResponse = $scope.bodyPainAnswer.location === 'No Answer' && $scope.bodyPainAnswer.intensity === 0;
        var answeredWithResponse = ($scope.bodyPainAnswer.location !== 'No Answer' && $scope.bodyPainAnswer.location !== '') && $scope.bodyPainAnswer.intensity !== 0;
        if(answeredWithNoResponse || answeredWithResponse){
          $scope.isAnswered = true;
        }

        if($scope.isAnswered){
          $timeout(function () {
            $scope.$apply(function () {
              $scope.nextDisabled = false;
            });
          }, 10);
          var quesID = $scope.questions[$scope.questionCounter].quesID;

          var answer = '{"location":"' + $scope.bodyPainAnswer.location + '","intensity":"' + $scope.painIntensityValue + '"}';
          var today = new Date().getTime();
          $scope.saveAnswerToLocalStorage(quesID,answer,today);
        }else{

          $scope.nextDisabled = true;
        }
      };

      $scope.saveAnswerToLocalStorage = function(quesID,ansID,timeStamp){
        var surveyID = $scope.surveyID;
        localStorage.setItem(surveyID + ":" + quesID,ansID);
        localStorage.setItem("ansTs" + ":" + quesID,timeStamp);
      };

      $scope.checkFromLocalStorage = function(quesID){
        var surveyID = $scope.surveyID;
        if(localStorage.getItem(surveyID + ":" + quesID) !== null)
          return localStorage.getItem(surveyID + ":" + quesID);
        else
          return "not set";
      };

  		$scope.controllerInit = function(){
        $scope.prevDisabled = true;
        $scope.nextDisabled = true;
        if(activeData.getSurveyName() === ""){
          activeData.setSurveyID(localStorage.getItem("reloadBackupSurveyID"));
          activeData.setSurveyName(localStorage.getItem("reloadBackupSurveyName"));
          activeData.setSurveyQuestions(JSON.parse(localStorage.getItem("reloadBackupSurveyQuestions")));
        }

        $scope.title = activeData.getSurveyName();
        $scope.questions = activeData.getSurveyQuestions();
        $scope.surveyID = activeData.getSurveyID();
        console.log($scope.questions);

        if($scope.questionCounter === 0){
          $("#prev").hide();
          $scope.prevDisabled = true;
        }

  			$scope.populateQuestions();
        // set up event listeners for SVG
        for (var i = $scope.sliderElements.length - 1; i >= 0; i--) {
          document.getElementById($scope.sliderElements[i]).addEventListener("click",$scope.onSliderElementClick);
        }
        document.getElementById('noPainRect').addEventListener("click",$scope.noPainRectClick);

  		};

			$scope.setMood=function(val){
        $scope.isAnswered = false;
        $scope.noPainCheck = false;
        switch(val){
          case 0:
            $scope.bodyPainAnswer.location = 'Sad';
            //$scope.lastSelectedAnswer = 'sad';
            break;
          case 1:
            $scope.bodyPainAnswer.location = 'Happy';
            //$scope.lastSelectedAnswer = 'happy';
            break;
          case 2:
            $scope.bodyPainAnswer.location = 'Neutral';
            //$scope.lastSelectedAnswer = 'neutral';
            break;
          case 3:
            $scope.bodyPainAnswer.location = 'Angry';
            //$scope.lastSelectedAnswer = 'angry';
            break;
        }
          document.getElementById('noPainRect').style.fill="none";

			};

      $scope.onSliderElementClick = function(event){
        $scope.isAnswered = false;
          $timeout(function () {
            $scope.$apply(function () {

              $scope.nextDisabled = true;
            });
          }, 10);
          var id = event.target.id;
          var num = parseInt(id.substr(id.length-1));
          $scope.painIntensityValue = num+1;
          for(var i=0;i<$scope.sliderElements.length;i++){
            if(i<=num){
              document.getElementById($scope.sliderElements[i]).style.fill="#000000";
            }
            else{
              document.getElementById($scope.sliderElements[i]).style.fill="none";
            }
          }
          $scope.bodyPainAnswer.intensity = $scope.painIntensityValue;

          if($scope.noPainCheck){
            $scope.noPainCheck=false;
            document.getElementById('noPainRect').style.fill="none";
            //document.getElementById('bodyPartText').textContent="";
            $scope.bodyPainAnswer.location = '';
          }
      };

      $scope.noPainRectClick = function(){
        $scope.isAnswered = false;
        console.log($scope.noPainCheck);
        $timeout(function () {
            $scope.$apply(function () {
              $scope.nextDisabled = true;
            });
          }, 10);
        if(!$scope.noPainCheck){
          this.style.fill="#000000";
          $scope.noPainCheck=true;
          $scope.painIntensityValue=0;
          $scope.bodyPainAnswer.location = 'No Answer';
          $scope.bodyPainAnswer.intensity = $scope.painIntensityValue;

        }
        else{
          this.style.fill="none";
          $scope.noPainCheck=false;
          $scope.painIntensityValue=0;
          $scope.bodyPainAnswer.intensity = $scope.painIntensityValue;
          $scope.bodyPainAnswer.location = '';
        }
        for(var i=0;i<$scope.sliderElements.length;i++){
            document.getElementById($scope.sliderElements[i]).style.fill="none";
        }
      };

  		$scope.populateQuestions = function(){

        if(($scope.questions[$scope.questionCounter] === 0) || ($scope.questions[$scope.questionCounter].answerOptions === 0)){

          $scope.changePage('/error/'+$scope.questionCounter );
        }

  			console.log($scope.questions[$scope.questionCounter]);
  			var questionText = $scope.questions[$scope.questionCounter].questionText;
  			$scope.question = questionText;
        if($scope.questions[$scope.questionCounter].questionType === "multiChoiceSingleAnswer"){
          $("#optionsTwo").hide();
          $("#optionsThree").hide();
          $("#optionsOne").show();
        }
        else if($scope.questions[$scope.questionCounter].questionType === "multiChoiceMultipleCorrect"){
          $("#optionsOne").hide();
          $("#optionsTwo").hide();
          $("#optionsThree").show();
        }
        else if($scope.questions[$scope.questionCounter].questionType === "bodyPain"){
          $("#optionsOne").hide();
          $("#optionsThree").hide();
          $("#optionsTwo").show();
          $scope.bodyPainAnswerWatcher();
          //  $scope.checkForMoodAnswerStored();
        }
        $scope.populateAnswers();
  		};

      $scope.changePage = function(path){

        $location.path(path);
      };

      $scope.populateAnswers = function(){
        $scope.answers = [];
        var selectedAnswer = $scope.checkFromLocalStorage($scope.questions[$scope.questionCounter].quesID);
        console.log('Answers length:' + $scope.answers.length);
        angular.forEach($scope.questions[$scope.questionCounter].answerOptions, function(value, key) {

          $scope.answers.push(value);
          if( selectedAnswer !== 'not set'){
            console.log(selectedAnswer);
            if( parseInt(selectedAnswer) === parseInt(value.answerID)){
              console.log("here " + value.answerID);
              // $scope.selectedAnswer = JSON.stringify(value);
              // $scope.selectedAnswer = value.answerID;
              $timeout(function () {
                $scope.$apply(function () {
                  $scope.selectedAnswer = value.answerID;
                });
              }, 10);
              // console.log("here"  + $scope.selectedAnswer);
              // var id = $scope.selectedAnswer;
              // console.log(jQuery("#"+id));

              // $("#"+value.answerID).prop('checked',true);
            }
          }

        });
        // console.log($scope.answers);

      };

      $scope.goPrev = function(){
        //pooja add
        var ques = $scope.questionCounter;
        //pooja end
        $scope.questionCounter--;
        if($scope.questionCounter === 0){
          $("#prev").hide();
          $scope.prevDisabled = true;
          $scope.nextDisabled = true;
        }
        //pooja add
        var today = new Date().getTime();
        localStorage.setItem("prev" + ":" + $scope.questions[ques].quesID,today);
        // pooja end
        $scope.populateQuestions();
        $scope.isAnswered = false;
      };


      $scope.goNext = function(){
        //pooja add
        var ques = $scope.questionCounter;
        var today = new Date().getTime();
        //pooja end
        if($scope.questionCounter === $scope.questions.length-1){
          //pooja add
          localStorage.setItem("next" + ":" + $scope.questions[ques].quesID,today);
          // pooja end
          $scope.changePage('/surveyEnd');
        }else{
          $scope.questionCounter++;
          if($scope.questionCounter > 0){

            $scope.prevDisabled = false;
          }
          if($scope.questionCounter === $scope.questions.length-1)
          {

            $scope.nextDisabled = true;
          }

          if($scope.selectedAnswer === ''){

            $scope.nextDisabled = true;
          }
          //pooja add

           localStorage.setItem("next" + ":" + $scope.questions[ques].quesID,today);
          // pooja end
          $scope.populateQuestions();
          $scope.selectedAnswer = '';
          $scope.nextDisabled = true;

          if($scope.questionCounter === 1) {
            $("#prev").show();
          }
          $scope.isAnswered = false;
        }
      };

      $scope.changePage = function(path){
          $location.path(path);
      };

      $scope.getAnswered = function (){
        var temp = $scope.questionCounter+1;
        return temp;
      };

      $scope.getTotal = function(){
        return $scope.questions.length;
      };

      $scope.getPercentage = function(){
        return ($scope.getAnswered()/$scope.getTotal())*100;
      };

      $scope.painIntensityValue = 0;

      $scope.sliderElements=["sliderElem0","sliderElem1","sliderElem2","sliderElem3","sliderElem4","sliderElem5","sliderElem6","sliderElem7","sliderElem8","sliderElem9"];
  		$scope.controllerInit();

      // window refresh event
      window.onbeforeunload = function (event) {
        if(window.location.hash === "#/survey"){
          localStorage.setItem("reloadBackupSurveyName",activeData.getSurveyName());
          localStorage.setItem("reloadBackupSurveyQuestions",JSON.stringify(activeData.getSurveyQuestions()));
          localStorage.setItem("reloadBackupSurveyID",activeData.getSurveyID());
          var message = 'If you leave this page you will have to start over again, are you sure you want to leave?';
          if (typeof event == 'undefined') {
            event = window.event;
          }
          if (event) {
            event.returnValue = message;
          }
          return message;
        } else
          return;
      };

      $scope.$on('$destroy', function() {
        delete window.onbeforeunload;
      });



    }
  ]);

})();
