import Orbit from 'orbit/core';
import MemorySource from 'orbit/sources/memory_source';
import Transaction from 'orbit/transaction';
import RSVP from 'rsvp';

var source;

///////////////////////////////////////////////////////////////////////////////

module("Unit - Transaction", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;

    var schema = {
      idField: '__id',
      models: {
        planet: {
        }
      }
    };

    source = new MemorySource(schema);
  },

  teardown: function() {
    source = null;
    Orbit.Promise = null;
  }
});

test("can track operations when records are added to an empty source", function() {
  expect(4);

  var transaction = new Transaction(source);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  RSVP.all([
    source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    source.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true}),
    source.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})
  ]).then(function() {
    start();
    equal(source.length('planet'), 3, 'source should contain 3 records');
    transaction.commit();
    equal(transaction.ops.length, 3, 'transaction should contain operations');
    equal(transaction.inverseOps.length, 3, 'transaction should contain inverse operations');
  });
});

test("can track and invert operations when records are added to an empty source", function() {
  expect(5);

  var transaction = new Transaction(source);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  RSVP.all([
    source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    source.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true}),
    source.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})
  ]).then(function() {
    equal(source.length('planet'), 3, 'source should contain 3 records');
    equal(transaction.ops.length, 3, 'transaction should contain operations');
    equal(transaction.inverseOps.length, 3, 'transaction should contain inverse operations');

    transaction.rollback().then(function() {
      start();
      equal(source.length('planet'), 0, 'source should be empty');
    });
  });
});

test("can track and invert operations performed after records are already present in a source", function() {
  expect(6);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  RSVP.all([
    source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    source.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true}),
    source.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})
  ]).then(function() {
    equal(source.length('planet'), 3, 'source should contain 3 records');

    var transaction = new Transaction(source);

    RSVP.all([
      source.add('planet', {name: 'Saturn', classification: 'gas giant', atmosphere: true}),
      source.add('planet', {name: 'Mars', classification: 'terrestrial', atmosphere: false})
    ]).then(function() {
      equal(source.length('planet'), 5, 'source should contain records');
      equal(transaction.ops.length, 2, 'transaction should contain operations');
      equal(transaction.inverseOps.length, 2, 'transaction should contain inverse operations');

      transaction.rollback().then(function() {
        start();
        equal(source.length('planet'), 3, 'source should contain records added before transaction began');
      });
    });
  });
});
