'use strict';

describe('Service: startTerritory', function () {

  // load the service's module
  beforeEach(module('frontsApp'));

  // instantiate service
  var startTerritory;
  beforeEach(inject(function (_startTerritory_) {
    startTerritory = _startTerritory_;
  }));

  it('should do something', function () {
    expect(!!startTerritory).toBe(true);
  });

});
