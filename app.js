

var wApp = angular.module('weatherApp', ['ngRoute', 'ngResource', 'ui.bootstrap','ngCookies']);

wApp.config(['$routeProvider', function ($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: 'pages/main.html',
			controller: 'mainCtrl'
		})
		.when('/forecast', {
			templateUrl: 'pages/forecast.html',
			controller: 'forecastCtrl'
		})
		.when('/login', {
			templateUrl: 'pages/login.html',
			controller: 'loginCtrl'
		})
		.otherwise({
			redirectTo: '/login'
		});
}]);

wApp.run(['$rootScope', '$location', '$cookieStore', '$http',
    function ($rootScope, $location, $cookieStore, $http) {
        // keep user logged in after page refresh
        $rootScope.globals = $cookieStore.get('globals') || {};
        if ($rootScope.globals.currentUser) {
			
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; // jshint ignore:line
        }
 
        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            // redirect to login page if not logged in
            if ($location.path() !== '/login' && !$rootScope.globals.currentUser) {
                $location.path('/login');
            }
        });
    }]);


wApp.service('userDetails', function () {
	var self = this;
	this.user = {};
});

wApp.controller('mainCtrl', ['$scope', '$resource', 'userDetails', function ($scope, $resource, userDetails) {

	$scope.result = $resource('http://jsonplaceholder.typicode.com/users').query();



	$scope.setPcode = function (site) {
		userDetails.user = site;

	};

	$scope.$watch('user', function () {
		userDetails.user = $scope.user;
	});

}]);
wApp.controller('forecastCtrl', ['$scope', 'userDetails', function ($scope, userDetails) {

	$scope.user = userDetails.user;



}]);

wApp.controller('loginCtrl', ['$scope', '$rootScope', '$location', 'AuthenticationService',
    function ($scope, $rootScope, $location, AuthenticationService) {
		// reset login status
		AuthenticationService.ClearCredentials();
		
		$scope.login = function () {
			$scope.dataLoading = true;
			AuthenticationService.Login($scope.username, $scope.password, function (response) {
				if (response.status === "success") {
					
					$scope.authdata = response.data.user.user_token;
					AuthenticationService.SetCredentials($scope.username, $scope.password, $scope.authdata);
					$location.path('/');
					
				} else {
					$scope.error = response.data.message;

					$scope.dataLoading = false;
				}
			});
		};
    }]);

wApp.factory('AuthenticationService', ['$http', '$cookieStore', '$rootScope', '$timeout',
    function ($http, $cookieStore, $rootScope, $timeout) {
		var service = {};

		service.Login = function (username, password, callback) {

			/* Dummy authentication for testing, uses $timeout to simulate api call
			 ----------------------------------------------*/
			/* $timeout(function(){
                var response = { success: username === 'test' && password === 'test' };
                if(!response.success) {
                    response.message = 'Username or password is incorrect';
                }
				console.log(response);
                callback(response);
            }, 1000);*/


			/* Use this for real authentication
			 ----------------------------------------------*/
			$http.post('http://localhost/plan-et-php/public/v2/login', {
					username: username,
					password: password,
					is_business: '1'
				})
				.success(function (response) {
					console.log(response);
					callback(response);
				});

		};

		service.SetCredentials = function (username, password, token) {
			// var authdata = Base64.encode(username + ':' + password);
			var authdata = token;
			$rootScope.globals = {
				currentUser: {
					username: username,
					authdata: authdata
				},
				loginStatus: true
			};

			$http.defaults.headers.common['Authorization'] = 'Basic ' + authdata; // jshint ignore:line
			$cookieStore.put('globals', $rootScope.globals);
		};

		service.ClearCredentials = function () {
			$rootScope.globals = {};
			$cookieStore.remove('globals');
			$http.defaults.headers.common.Authorization = 'Basic ';
		};

		return service;
    }]);