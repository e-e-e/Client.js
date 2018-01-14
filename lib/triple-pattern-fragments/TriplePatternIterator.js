/*! @license MIT ©2014-2016 Ruben Verborgh, Ghent University - imec */
/* A TriplePatternIterator builds bindings by reading matches for a triple pattern. */

var AsyncIterator = require('asynciterator'),
    MultiTransformIterator = AsyncIterator.MultiTransformIterator,
    rdf = require('../util/RdfUtil'),
    Logger = require('../util/ExecutionLogger')('TriplePatternIterator');

function TriplePatternIterator(parent, pattern, options) {
  if (!(this instanceof TriplePatternIterator))
    return new TriplePatternIterator(parent, pattern, options);
  MultiTransformIterator.call(this, parent, options);

  this._pattern = pattern;
  this._hyper = !!(options && options.hypergraph);
  this._client = options && (options.fragmentsClient || options.hypergraph);
}

MultiTransformIterator.subclass(TriplePatternIterator);

// Creates a transformer that extends upstream bindings with matches for the triple pattern.
// For example, if the iterator's triple pattern is '?s rdf:type ?o',
// and the upstream sends a binding { ?o: dbpedia-owl:City' },
// then we return an iterator for [{ ?o: dbpedia-owl:City', ?s: dbpedia:Ghent' }, …].
TriplePatternIterator.prototype._createTransformer = function (bindings, options) {
  var isHyper = this._hyper;
  var client = this._client;
  // Apply the upstream bindings to the iterator's triple pattern.
  // example: apply { ?o: dbpedia-owl:City } to '?s rdf:type ?o'
  var pattern = this._pattern,
      boundPattern = rdf.applyBindings(bindings, pattern);

  // Retrieve the fragment that corresponds to the bound pattern.
  // example: retrieve the fragment for '?s rdf:type dbpedia-owl:City'
  var fragment;
  if (isHyper) {
    var newQuery = Object.assign({}, boundPattern);
    Object.keys(boundPattern).forEach(function (key) {
      var variable = boundPattern[key];
      if (variable && variable.charAt(0) === '?')
        newQuery[key] = client.v(variable);
    });
    fragment = AsyncIterator.wrap(client.searchStream([newQuery]));
  }
  else fragment = client.getFragmentByPattern(boundPattern);
  Logger.logFragment(this, fragment, bindings);
  fragment.on('error', function (error) { Logger.warning(error.message); });

  // Transform the fragment's triples into bindings for the triple pattern.
  // example: [{ ?o: dbpedia-owl:City', ?s: dbpedia:Ghent' }, …]
  return fragment.map(function (triple) {
    if (isHyper)
      triple = rdf.applyBindings(triple, boundPattern);
    try {
      var newBindings = rdf.extendBindings(bindings, pattern, triple);
      return newBindings;
    }
    // If the triple conflicted with the bindings (e.g., non-data triple), skip it.
    catch (error) {
      return null;
    }
  });
};

// Generates a textual representation of the iterator
TriplePatternIterator.prototype.toString = function () {
  return '[' + this.constructor.name +
         ' {' + rdf.toQuickString(this._pattern) + ')}' +
         '\n  <= ' + this.getSourceString();
};

module.exports = TriplePatternIterator;
