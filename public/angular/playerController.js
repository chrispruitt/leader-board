var leaderBoard = angular.module("LeaderBoard", ["ngRoute"]);

leaderBoard.controller("PlayerCtrl", [ "$http", "$location",
    function($http, $location) {
        var vm = this;
        vm.activeMenu = "";
        vm.testy = "hello";

        $http.get('http://pru.servequake.com:3000/player').
            success(function(data, status, headers, config) {
                vm.playerList = data;
                console.log(vm.playerList);
            }).
            error(function(data, status, headers, config) {
                alert(status + ": " + data);
            });

        vm.isActive = function(route) {
            vm.testy = $location.path();
            return route === $location.path();
        }

        vm.menuSelect = function(menuItem) {
            vm.activeMenu = menuItem;
        }

    }]);
