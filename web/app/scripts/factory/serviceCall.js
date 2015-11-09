(function () {

'use strict';
	
	//Load controller
  	angular.module('surveyApp').factory('serviceCall', function($http){

  		var url = {};
      
  		// constructor to set up certain defaults

  		function serviceCall(serviceName,callMethod){  		
        /*jshint validthis: true */	
        
  			this.url = {
  				domain : localStorage.surveyAppServerSettings,
  				method : callMethod,
  				name : serviceName 
  			};  			
  		}

  		serviceCall.prototype.call = function(payload,successCallback,errorCallback,mockURL){
  			var serviceURL = mockURL || this.url.domain + "/" + this.url.name;  			
  			console.log(serviceURL);
  			console.log(this.url.method);
  			console.log(JSON.parse(payload));    
        console.log(payload);            
        var params = JSON.parse(payload);
        console.log(params);
        if(this.url.method === "POST"){
          $http(
          { 
            method: this.url.method,          
            url: serviceURL,
            data: params,
            headers: {'Content-Type': 'application/json'},
          }
          ).
          success(function(data, status, headers, config) {              
              successCallback(data, status, headers, config);
          }).
          error(function(data, status, headers, config) {              
              errorCallback(data, status, headers, config);
          });                  
        }else{
          $http(
          { 
            method: this.url.method,          
            url: serviceURL,
            params: params
          }
          ).
          success(function(data, status, headers, config) {
              successCallback(data, status, headers, config);
          }).
          error(function(data, status, headers, config) {
              errorCallback(data, status, headers, config);
          }); 
        }
  			
  		};

  		return serviceCall;
  	});

})();