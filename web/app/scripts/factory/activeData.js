(function () {

'use strict';
	
	//Load controller
  	angular.module('surveyApp').service('activeData', function(){
  		
      this.questions = [];
      this.surveyID = '';
      this.surveyCompleted = false;
      this.surveyName = '';
      this.error = '';
      
      this.setSurveyQuestions = function(questions){
        this.questions = questions;
      };     
  		
      this.getSurveyQuestions = function(){
        return this.questions;
      };

      this.setSurveyID = function(id){
        this.surveyID = id;
      };

      this.getSurveyID = function(){
        return this.surveyID;
      };

      this.getSurveyName = function(){
        return this.surveyName;
      };

      this.setSurveyName = function(name){
        this.surveyName = name;
      };

      this.setSurveyCompleted = function(val){
        this.surveyCompleted = val;
      };

      this.getSurveyCompleted = function(){
        return this.surveyCompleted;
      };  

      this.getError = function(){
        return this.error;
      };    

  		this.setError = function(text){
        this.error = text;
      };
      
  	});

})();