angular.module('cnNavbar', [])

    .directive('cnNavbar', [
      '$stateParams', 'Api', 'ReportsQuery', '$location', 'cnSession', '$window', '$rootScope', 'EVENTS', '$state', 'VENDOR_BASE_URL', 'ReportUrlBuilder',
      function($stateParams, Api, ReportsQuery, $location, cnSession, $window, $rootScope, EVENTS, $state, VENDOR_BASE_URL, ReportUrlBuilder) {
        return {
          restrict: 'E',
          replace: true,
          templateUrl: VENDOR_BASE_URL + 'angular-navbar/cn-navbar.html',
          link: function($scope, elem) {
            $scope.logout = function() {
              Api.logout()
                  .success(function() {
                    // ensure a refresh of page
                    $window.location = '/';
                    cnSession.destroy();
                  })
                  .error(function(response) {
                    log('ERROR: ' + response);
                  })
            };

            if($stateParams.groupId) {
              Api.getGroup($stateParams.groupId).then(function(group) {
                $scope.group = group;
              });
            }

            function setupCompanies() {
//          console.log('$scope.user.companyList:', $scope.user.companyList);

              $scope.companies = [
                $scope.user.Company
              ].concat($scope.user.companyList);

              $scope.currentCompany = cnSession.getCompany();
            }

            function getRecentReports() {
              ReportsQuery.getUsersRecentReports().then(function(reports) {
                reports.forEach(function(report) {
                  report.is_template = report.isTemplate;
                  report.user_data = JSON.parse(report.userData);
                  report.url = ReportUrlBuilder.build(report);
                })
                $scope.recentReports = reports;
              })
            }

            if($scope.user) {
              setupCompanies();
              getRecentReports();
            }

            $scope.changeCompany = function(company) {
              cnSession.setCompany(company);
              $scope.currentCompany = company;
            };

            $scope.$watch('group.companyId', function() {
              if($scope.group && $scope.group.companyId && $scope.group.companyId !== $scope.currentCompany.id) {
                $scope.viewingCompany = _.find($scope.companies, {id: $scope.group.companyId});

                if(!$scope.viewingCompany) {
                  Api.getCompany($scope.group.companyId).then(function(company) {
                    company.readOnly = true;
                    $scope.viewingCompany = company;
                  });
                }
              }
              else {
                $scope.viewingCompany = null;
              }
            });

            $scope.isCompanyDisabled = function(company) {
              return $scope.viewingCompany
                  && $scope.viewingCompany.id !== company.id;
            };

            $scope.search = function(q) {
              return Api.universalSearch(q);
            };

            $scope.globalNavTo = function(dest) {
              if(dest.campaignName) {
                $state.go('adSets', {groupId: dest.groupId, campaignId: dest.id});
              }
              else {
                $state.go('campaigns', {groupId: dest.id});
              }
            };

            $scope.analyze = function() {
              var url = '/quicksight/#/analytics';

              if($stateParams.groupId) {
                // @todo
              }

              if($stateParams.campaignId) {
                // @todo
              }

              $window.location = url;
            }

            $rootScope.$on(EVENTS.loginSuccess, function() {
              $scope.user = cnSession.getUser();
              setupCompanies();
              getRecentReports();
            });
          }
        }
      }
    ]);