'use strict';

describe('Directive: nodetree', function () {

  // load the directive's module
  beforeEach(module('frontsApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<nodetree></nodetree>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the nodetree directive');
  }));
});
