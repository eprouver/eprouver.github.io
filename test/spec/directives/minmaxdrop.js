'use strict';

describe('Directive: minmaxdrop', function () {

  // load the directive's module
  beforeEach(module('chartsApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<minmaxdrop></minmaxdrop>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the minmaxdrop directive');
  }));
});
