assert = require('assert')
JSOG = require('../lib/JSOG')
moment = require('moment')

describe 'leaving original object alone', ->
	foo = {}
	JSOG.encode(foo)

	it 'should not have added an id', ->
		assert !(foo['$id']?)

describe 'duplicate references', ->
	inside = { name: 'thing' }

	outside =
		inside1: inside
		inside2: inside

	encoded = JSOG.encode(outside)
	decoded = JSOG.decode(encoded)

	console.log "Encoded is:"
	console.log JSON.stringify(encoded, undefined, 4)
	console.log "Outside after encoding is:"
	console.log JSON.stringify(outside, undefined, 4)
	console.log "Decoded is:"
	console.log JSON.stringify(decoded, undefined, 4)

	roundtrip = JSOG.parse(JSOG.stringify(outside))
	console.log "Roundtrip is:"
	console.log JSON.stringify(roundtrip, undefined, 4)

	it 'inside1 and inside2 should be equal', ->
		assert decoded.inside1 == decoded.inside2
	it 'should have inside1.name', ->
		assert decoded.inside1.name == 'thing'
	it 'should not have an __ksId', ->
		assert !(decoded['__ksId']?)

describe 'cyclic references', ->
	circular = {}
	circular.me = circular

	encoded = JSOG.encode(circular)
	decoded = JSOG.decode(encoded)
	console.log "Encoded: " + JSON.stringify(encoded, undefined, 4)

	it 'should have an encoded id', ->
		assert encoded['__ksId']?
	it 'should have resolved references', ->
		assert encoded.me['__ksRef'] == encoded['__ksId']
	it 'me is decoded', ->
		assert decoded.me is decoded
	it 'is not circular', ->
		assert !(circular['__ksId']?)

describe 'nulls', ->
	it 'should leave null by itself alone', ->
		assert JSOG.encode(null) == null

	it 'should leave null in an object alone', ->
		foo = { foo: null }
		encoded = JSOG.encode(foo)

		assert encoded['__ksId']?
		assert encoded.foo == null

describe 'arrays', ->
	it 'should encode arrays properly', ->
		foo = { bar: true }
		array = [foo, foo]

		encoded = JSOG.encode(array)

		assert encoded[0]['__ksId']?
		assert encoded[0]['__ksId'] == encoded[1]['__ksRef']

describe 'custom json serialization', ->
	it 'should leave objects with toJSON methods alone', ->
		foo = { foo: moment() }
		encoded = JSOG.encode(foo)
		assert encoded.foo == foo.foo

describe 'custom references', ->
	duplicate = { lorem: 'ipsum' }

	outside =
		one: duplicate
		two: duplicate

	encoded = JSOG.encode(outside, '@MyId', '@MyRef')
	decoded = JSOG.decode(encoded, '@MyId', '@MyRef')

	console.log "Encoded is:"
	console.log JSON.stringify(encoded, undefined, 4)

	console.log "Decoded is:"
	console.log JSON.stringify(decoded, undefined, 4)

	it 'should be encoded properly when using custom references', ->
		assert encoded['@MyId']?
		assert !(encoded['@Id'])?

	it 'should be decoded properly when using custom references', ->
		assert !(decoded['@MyId'])?
		assert !(decoded['@Id'])?