# Sparql Iterator

[![Build Status](https://travis-ci.org/e-e-e/sparql-iterator.svg?branch=master)](https://travis-ci.org/e-e-e/sparql-iterator)

A fast and simple sparql interface for [Linked Data Fragments](http://linkeddatafragments.org) and [hyper-graph-db](https://github.com/e-e-e/hyper-graph-db).

Note: This is a fork of [Linked Data Fragments Client](https://github.com/LinkedDataFragments/Client.js) which includes only the code for the sparql interator. It has been modified to accept hyper-graph-db as a client.

## Installation

```
npm install sparql-iterator
```

## Simple Use

First, create or connect to a `HyperGraph` representation of a dataset.
<br>
Then create a `SparqlIterator` to evaluate SPARQL queries on that dataset.

```JavaScript
var SparqlIterator = require('sparql-iterator');
var hypergraph = require('hyper-graph-db');

var graph = new hypergraph(storage, key);
var query = 'SELECT * { ?s ?p <http://dbpedia.org/resource/Belgium>. ?s ?p ?o } LIMIT 100',
    results = new SparqlIterator(query, { hypergraph: graph });
results.on('data', function (result) { console.log(result); });
```

## API

#### var stream = new SparqlIterator(query, options);

Returns a new stream of results. Expects query to be a valid SPARQL query as a string or an object representing a parsed query (refer to [SPARQL.js](https://www.npmjs.com/package/sparqljs)).

Expects `options` argument to be an object passing in the client to use.
Either:
```js
{
  hypergraph: instance of HyperGraph,
}
```
or:
```js
{
  fragmentsClient: an instance of LinkedDataFragementsClient,
}
```

#### stream.on('data', cb)

A `data` event is fired for each new result that matches the SPARQL query.

#### stream.on('end', cb)

A `end` event is fired when the query has completed.

#### stream.on('error', cb)

A `error` event is fired when an error has occurred.
