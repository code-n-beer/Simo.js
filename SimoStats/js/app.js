var app = angular.module("simoStats", ["firebase"]);

app.controller("cmdCtrl", ['$scope', '$firebase',
    function($scope, $firebase) {
        var ref = new Firebase("https://simocmds.firebaseio.com");
        var sync = $firebase(ref);
        $scope.datas = sync.$asObject();


        $scope.datas.$loaded().then(function() {
            $scope.chartData = [];

            function shapeIt() {
                $scope.barData = {};
                $scope.barData["key"] = "Komentoja ebin";
                $scope.chartData = [];

                angular.forEach($scope.datas, function(val, key) {
                    var objToAdd = {};
                    objToAdd["label"] = key;
                    objToAdd["value"] = val;
                    this.push(objToAdd);
                }, $scope.chartData);

                $scope.barData["values"] = $scope.chartData;
            };

            function retBarData() {
                return [$scope.barData];
            };

            function barIt() {
                nv.addGraph(function() {
                    var chart = nv.models.discreteBarChart()
                        .x(function(d) { return d.label })
                        .y(function(d) { return d.value })
                        .staggerLabels(true)
                        .tooltips(false)
                        .showValues(true);

                    d3.select('#chart svg')
                        .datum(retBarData())
                        .transition().duration(350)
                        .call(chart);
                    nv.utils.windowResize(chart.update);
                    return chart;
                });
            };


            $scope.$watch('datas', function(n, o) {
                shapeIt();
                barIt();
            }, true);


        });
    }
]);