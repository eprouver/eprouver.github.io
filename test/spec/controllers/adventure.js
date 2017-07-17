'use strict';

describe('Controller: AdventureCtrl', function () {

  // load the controller's module
  beforeEach(module('frontsApp'));

  var AdventureCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AdventureCtrl = $controller('AdventureCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(AdventureCtrl.awesomeThings.length).toBe(3);
  });
});
