'use strict';

describe('Controller: StoryCtrl', function () {

  // load the controller's module
  beforeEach(module('frontsApp'));

  var StoryCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    StoryCtrl = $controller('StoryCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(StoryCtrl.awesomeThings.length).toBe(3);
  });
});
