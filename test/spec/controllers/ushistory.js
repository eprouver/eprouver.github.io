'use strict';

describe('Controller: UshistoryCtrl', function () {

  // load the controller's module
  beforeEach(module('chartsApp'));

  var UshistoryCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    UshistoryCtrl = $controller('UshistoryCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(UshistoryCtrl.awesomeThings.length).toBe(3);
  });
});
