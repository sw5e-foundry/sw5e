(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.MiniSearch = factory());
})(this, (function () { 'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    /** @ignore */
    var ENTRIES = 'ENTRIES';
    /** @ignore */
    var KEYS = 'KEYS';
    /** @ignore */
    var VALUES = 'VALUES';
    /** @ignore */
    var LEAF = '';
    /**
     * @private
     */
    var TreeIterator = /** @class */ (function () {
        function TreeIterator(set, type) {
            var node = set._tree;
            var keys = Array.from(node.keys());
            this.set = set;
            this._type = type;
            this._path = keys.length > 0 ? [{ node: node, keys: keys }] : [];
        }
        TreeIterator.prototype.next = function () {
            var value = this.dive();
            this.backtrack();
            return value;
        };
        TreeIterator.prototype.dive = function () {
            if (this._path.length === 0) {
                return { done: true, value: undefined };
            }
            var _a = last$1(this._path), node = _a.node, keys = _a.keys;
            if (last$1(keys) === LEAF) {
                return { done: false, value: this.result() };
            }
            var child = node.get(last$1(keys));
            this._path.push({ node: child, keys: Array.from(child.keys()) });
            return this.dive();
        };
        TreeIterator.prototype.backtrack = function () {
            if (this._path.length === 0) {
                return;
            }
            var keys = last$1(this._path).keys;
            keys.pop();
            if (keys.length > 0) {
                return;
            }
            this._path.pop();
            this.backtrack();
        };
        TreeIterator.prototype.key = function () {
            return this.set._prefix + this._path
                .map(function (_a) {
                var keys = _a.keys;
                return last$1(keys);
            })
                .filter(function (key) { return key !== LEAF; })
                .join('');
        };
        TreeIterator.prototype.value = function () {
            return last$1(this._path).node.get(LEAF);
        };
        TreeIterator.prototype.result = function () {
            switch (this._type) {
                case VALUES: return this.value();
                case KEYS: return this.key();
                default: return [this.key(), this.value()];
            }
        };
        TreeIterator.prototype[Symbol.iterator] = function () {
            return this;
        };
        return TreeIterator;
    }());
    var last$1 = function (array) {
        return array[array.length - 1];
    };

    /**
     * @ignore
     */
    var fuzzySearch = function (node, query, maxDistance) {
        var results = new Map();
        if (query === undefined)
            return results;
        // Number of columns in the Levenshtein matrix.
        var n = query.length + 1;
        // Matching terms can never be longer than N + maxDistance.
        var m = n + maxDistance;
        // Fill first matrix row and column with numbers: 0 1 2 3 ...
        var matrix = new Uint8Array(m * n).fill(maxDistance + 1);
        for (var j = 0; j < n; ++j)
            matrix[j] = j;
        for (var i = 1; i < m; ++i)
            matrix[i * n] = i;
        recurse(node, query, maxDistance, results, matrix, 1, n, '');
        return results;
    };
    // Modified version of http://stevehanov.ca/blog/?id=114
    // This builds a Levenshtein matrix for a given query and continuously updates
    // it for nodes in the radix tree that fall within the given maximum edit
    // distance. Keeping the same matrix around is beneficial especially for larger
    // edit distances.
    //
    //           k   a   t   e   <-- query
    //       0   1   2   3   4
    //   c   1   1   2   3   4
    //   a   2   2   1   2   3
    //   t   3   3   2   1  [2]  <-- edit distance
    //   ^
    //   ^ term in radix tree, rows are added and removed as needed
    var recurse = function (node, query, maxDistance, results, matrix, m, n, prefix) {
        var e_1, _a;
        var offset = m * n;
        try {
            key: for (var _b = __values(node.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var key = _c.value;
                if (key === LEAF) {
                    // We've reached a leaf node. Check if the edit distance acceptable and
                    // store the result if it is.
                    var distance = matrix[offset - 1];
                    if (distance <= maxDistance) {
                        results.set(prefix, [node.get(key), distance]);
                    }
                }
                else {
                    // Iterate over all characters in the key. Update the Levenshtein matrix
                    // and check if the minimum distance in the last row is still within the
                    // maximum edit distance. If it is, we can recurse over all child nodes.
                    var i = m;
                    for (var pos = 0; pos < key.length; ++pos, ++i) {
                        var char = key[pos];
                        var thisRowOffset = n * i;
                        var prevRowOffset = thisRowOffset - n;
                        // Set the first column based on the previous row, and initialize the
                        // minimum distance in the current row.
                        var minDistance = matrix[thisRowOffset];
                        var jmin = Math.max(0, i - maxDistance - 1);
                        var jmax = Math.min(n - 1, i + maxDistance);
                        // Iterate over remaining columns (characters in the query).
                        for (var j = jmin; j < jmax; ++j) {
                            var different = char !== query[j];
                            // It might make sense to only read the matrix positions used for
                            // deletion/insertion if the characters are different. But we want to
                            // avoid conditional reads for performance reasons.
                            var rpl = matrix[prevRowOffset + j] + +different;
                            var del = matrix[prevRowOffset + j + 1] + 1;
                            var ins = matrix[thisRowOffset + j] + 1;
                            var dist = matrix[thisRowOffset + j + 1] = Math.min(rpl, del, ins);
                            if (dist < minDistance)
                                minDistance = dist;
                        }
                        // Because distance will never decrease, we can stop. There will be no
                        // matching child nodes.
                        if (minDistance > maxDistance) {
                            continue key;
                        }
                    }
                    recurse(node.get(key), query, maxDistance, results, matrix, i, n, prefix + key);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };

    /**
     * A class implementing the same interface as a standard JavaScript
     * [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
     * with string keys, but adding support for efficiently searching entries with
     * prefix or fuzzy search. This class is used internally by [[MiniSearch]] as
     * the inverted index data structure. The implementation is a radix tree
     * (compressed prefix tree).
     *
     * Since this class can be of general utility beyond _MiniSearch_, it is
     * exported by the `minisearch` package and can be imported (or required) as
     * `minisearch/SearchableMap`.
     *
     * @typeParam T  The type of the values stored in the map.
     */
    var SearchableMap = /** @class */ (function () {
        /**
         * The constructor is normally called without arguments, creating an empty
         * map. In order to create a [[SearchableMap]] from an iterable or from an
         * object, check [[SearchableMap.from]] and [[SearchableMap.fromObject]].
         *
         * The constructor arguments are for internal use, when creating derived
         * mutable views of a map at a prefix.
         */
        function SearchableMap(tree, prefix) {
            if (tree === void 0) { tree = new Map(); }
            if (prefix === void 0) { prefix = ''; }
            this._size = undefined;
            this._tree = tree;
            this._prefix = prefix;
        }
        /**
         * Creates and returns a mutable view of this [[SearchableMap]], containing only
         * entries that share the given prefix.
         *
         * ### Usage:
         *
         * ```javascript
         * let map = new SearchableMap()
         * map.set("unicorn", 1)
         * map.set("universe", 2)
         * map.set("university", 3)
         * map.set("unique", 4)
         * map.set("hello", 5)
         *
         * let uni = map.atPrefix("uni")
         * uni.get("unique") // => 4
         * uni.get("unicorn") // => 1
         * uni.get("hello") // => undefined
         *
         * let univer = map.atPrefix("univer")
         * univer.get("unique") // => undefined
         * univer.get("universe") // => 2
         * univer.get("university") // => 3
         * ```
         *
         * @param prefix  The prefix
         * @return A [[SearchableMap]] representing a mutable view of the original Map at the given prefix
         */
        SearchableMap.prototype.atPrefix = function (prefix) {
            var e_1, _a;
            if (!prefix.startsWith(this._prefix)) {
                throw new Error('Mismatched prefix');
            }
            var _b = __read(trackDown(this._tree, prefix.slice(this._prefix.length)), 2), node = _b[0], path = _b[1];
            if (node === undefined) {
                var _c = __read(last(path), 2), parentNode = _c[0], key = _c[1];
                try {
                    for (var _d = __values(parentNode.keys()), _e = _d.next(); !_e.done; _e = _d.next()) {
                        var k = _e.value;
                        if (k !== LEAF && k.startsWith(key)) {
                            var node_1 = new Map();
                            node_1.set(k.slice(key.length), parentNode.get(k));
                            return new SearchableMap(node_1, prefix);
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            return new SearchableMap(node, prefix);
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/clear
         */
        SearchableMap.prototype.clear = function () {
            this._size = undefined;
            this._tree.clear();
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/delete
         * @param key  Key to delete
         */
        SearchableMap.prototype.delete = function (key) {
            this._size = undefined;
            return remove(this._tree, key);
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/entries
         * @return An iterator iterating through `[key, value]` entries.
         */
        SearchableMap.prototype.entries = function () {
            return new TreeIterator(this, ENTRIES);
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach
         * @param fn  Iteration function
         */
        SearchableMap.prototype.forEach = function (fn) {
            var e_2, _a;
            try {
                for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                    fn(key, value, this);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
        };
        /**
         * Returns a Map of all the entries that have a key within the given edit
         * distance from the search key. The keys of the returned Map are the matching
         * keys, while the values are two-element arrays where the first element is
         * the value associated to the key, and the second is the edit distance of the
         * key to the search key.
         *
         * ### Usage:
         *
         * ```javascript
         * let map = new SearchableMap()
         * map.set('hello', 'world')
         * map.set('hell', 'yeah')
         * map.set('ciao', 'mondo')
         *
         * // Get all entries that match the key 'hallo' with a maximum edit distance of 2
         * map.fuzzyGet('hallo', 2)
         * // => Map(2) { 'hello' => ['world', 1], 'hell' => ['yeah', 2] }
         *
         * // In the example, the "hello" key has value "world" and edit distance of 1
         * // (change "e" to "a"), the key "hell" has value "yeah" and edit distance of 2
         * // (change "e" to "a", delete "o")
         * ```
         *
         * @param key  The search key
         * @param maxEditDistance  The maximum edit distance (Levenshtein)
         * @return A Map of the matching keys to their value and edit distance
         */
        SearchableMap.prototype.fuzzyGet = function (key, maxEditDistance) {
            return fuzzySearch(this._tree, key, maxEditDistance);
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get
         * @param key  Key to get
         * @return Value associated to the key, or `undefined` if the key is not
         * found.
         */
        SearchableMap.prototype.get = function (key) {
            var node = lookup(this._tree, key);
            return node !== undefined ? node.get(LEAF) : undefined;
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has
         * @param key  Key
         * @return True if the key is in the map, false otherwise
         */
        SearchableMap.prototype.has = function (key) {
            var node = lookup(this._tree, key);
            return node !== undefined && node.has(LEAF);
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/keys
         * @return An `Iterable` iterating through keys
         */
        SearchableMap.prototype.keys = function () {
            return new TreeIterator(this, KEYS);
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/set
         * @param key  Key to set
         * @param value  Value to associate to the key
         * @return The [[SearchableMap]] itself, to allow chaining
         */
        SearchableMap.prototype.set = function (key, value) {
            if (typeof key !== 'string') {
                throw new Error('key must be a string');
            }
            this._size = undefined;
            var node = createPath(this._tree, key);
            node.set(LEAF, value);
            return this;
        };
        Object.defineProperty(SearchableMap.prototype, "size", {
            /**
             * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/size
             */
            get: function () {
                if (this._size) {
                    return this._size;
                }
                /** @ignore */
                this._size = 0;
                var iter = this.entries();
                while (!iter.next().done)
                    this._size += 1;
                return this._size;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Updates the value at the given key using the provided function. The function
         * is called with the current value at the key, and its return value is used as
         * the new value to be set.
         *
         * ### Example:
         *
         * ```javascript
         * // Increment the current value by one
         * searchableMap.update('somekey', (currentValue) => currentValue == null ? 0 : currentValue + 1)
         * ```
         *
         * If the value at the given key is or will be an object, it might not require
         * re-assignment. In that case it is better to use `fetch()`, because it is
         * faster.
         *
         * @param key  The key to update
         * @param fn  The function used to compute the new value from the current one
         * @return The [[SearchableMap]] itself, to allow chaining
         */
        SearchableMap.prototype.update = function (key, fn) {
            if (typeof key !== 'string') {
                throw new Error('key must be a string');
            }
            this._size = undefined;
            var node = createPath(this._tree, key);
            node.set(LEAF, fn(node.get(LEAF)));
            return this;
        };
        /**
         * Fetches the value of the given key. If the value does not exist, calls the
         * given function to create a new value, which is inserted at the given key
         * and subsequently returned.
         *
         * ### Example:
         *
         * ```javascript
         * const map = searchableMap.fetch('somekey', () => new Map())
         * map.set('foo', 'bar')
         * ```
         *
         * @param key  The key to update
         * @param defaultValue  A function that creates a new value if the key does not exist
         * @return The existing or new value at the given key
         */
        SearchableMap.prototype.fetch = function (key, initial) {
            if (typeof key !== 'string') {
                throw new Error('key must be a string');
            }
            this._size = undefined;
            var node = createPath(this._tree, key);
            var value = node.get(LEAF);
            if (value === undefined) {
                node.set(LEAF, value = initial());
            }
            return value;
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/values
         * @return An `Iterable` iterating through values.
         */
        SearchableMap.prototype.values = function () {
            return new TreeIterator(this, VALUES);
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/@@iterator
         */
        SearchableMap.prototype[Symbol.iterator] = function () {
            return this.entries();
        };
        /**
         * Creates a [[SearchableMap]] from an `Iterable` of entries
         *
         * @param entries  Entries to be inserted in the [[SearchableMap]]
         * @return A new [[SearchableMap]] with the given entries
         */
        SearchableMap.from = function (entries) {
            var e_3, _a;
            var tree = new SearchableMap();
            try {
                for (var entries_1 = __values(entries), entries_1_1 = entries_1.next(); !entries_1_1.done; entries_1_1 = entries_1.next()) {
                    var _b = __read(entries_1_1.value, 2), key = _b[0], value = _b[1];
                    tree.set(key, value);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (entries_1_1 && !entries_1_1.done && (_a = entries_1.return)) _a.call(entries_1);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return tree;
        };
        /**
         * Creates a [[SearchableMap]] from the iterable properties of a JavaScript object
         *
         * @param object  Object of entries for the [[SearchableMap]]
         * @return A new [[SearchableMap]] with the given entries
         */
        SearchableMap.fromObject = function (object) {
            return SearchableMap.from(Object.entries(object));
        };
        return SearchableMap;
    }());
    var trackDown = function (tree, key, path) {
        var e_4, _a;
        if (path === void 0) { path = []; }
        if (key.length === 0 || tree == null) {
            return [tree, path];
        }
        try {
            for (var _b = __values(tree.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var k = _c.value;
                if (k !== LEAF && key.startsWith(k)) {
                    path.push([tree, k]); // performance: update in place
                    return trackDown(tree.get(k), key.slice(k.length), path);
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        path.push([tree, key]); // performance: update in place
        return trackDown(undefined, '', path);
    };
    var lookup = function (tree, key) {
        var e_5, _a;
        if (key.length === 0 || tree == null) {
            return tree;
        }
        try {
            for (var _b = __values(tree.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var k = _c.value;
                if (k !== LEAF && key.startsWith(k)) {
                    return lookup(tree.get(k), key.slice(k.length));
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
    };
    // Create a path in the radix tree for the given key, and returns the deepest
    // node. This function is in the hot path for indexing. It avoids unnecessary
    // string operations and recursion for performance.
    var createPath = function (node, key) {
        var e_6, _a;
        var keyLength = key.length;
        outer: for (var pos = 0; node && pos < keyLength;) {
            try {
                for (var _b = (e_6 = void 0, __values(node.keys())), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var k = _c.value;
                    // Check whether this key is a candidate: the first characters must match.
                    if (k !== LEAF && key[pos] === k[0]) {
                        var len = Math.min(keyLength - pos, k.length);
                        // Advance offset to the point where key and k no longer match.
                        var offset = 1;
                        while (offset < len && key[pos + offset] === k[offset])
                            ++offset;
                        var child_1 = node.get(k);
                        if (offset === k.length) {
                            // The existing key is shorter than the key we need to create.
                            node = child_1;
                        }
                        else {
                            // Partial match: we need to insert an intermediate node to contain
                            // both the existing subtree and the new node.
                            var intermediate = new Map();
                            intermediate.set(k.slice(offset), child_1);
                            node.set(key.slice(pos, pos + offset), intermediate);
                            node.delete(k);
                            node = intermediate;
                        }
                        pos += offset;
                        continue outer;
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_6) throw e_6.error; }
            }
            // Create a final child node to contain the final suffix of the key.
            var child = new Map();
            node.set(key.slice(pos), child);
            return child;
        }
        return node;
    };
    var remove = function (tree, key) {
        var _a = __read(trackDown(tree, key), 2), node = _a[0], path = _a[1];
        if (node === undefined) {
            return;
        }
        node.delete(LEAF);
        if (node.size === 0) {
            cleanup(path);
        }
        else if (node.size === 1) {
            var _b = __read(node.entries().next().value, 2), key_1 = _b[0], value = _b[1];
            merge(path, key_1, value);
        }
    };
    var cleanup = function (path) {
        if (path.length === 0) {
            return;
        }
        var _a = __read(last(path), 2), node = _a[0], key = _a[1];
        node.delete(key);
        if (node.size === 0) {
            cleanup(path.slice(0, -1));
        }
        else if (node.size === 1) {
            var _b = __read(node.entries().next().value, 2), key_2 = _b[0], value = _b[1];
            if (key_2 !== LEAF) {
                merge(path.slice(0, -1), key_2, value);
            }
        }
    };
    var merge = function (path, key, value) {
        if (path.length === 0) {
            return;
        }
        var _a = __read(last(path), 2), node = _a[0], nodeKey = _a[1];
        node.set(nodeKey + key, value);
        node.delete(nodeKey);
    };
    var last = function (array) {
        return array[array.length - 1];
    };

    var _a;
    var OR = 'or';
    var AND = 'and';
    var AND_NOT = 'and_not';
    /**
     * [[MiniSearch]] is the main entrypoint class, implementing a full-text search
     * engine in memory.
     *
     * @typeParam T  The type of the documents being indexed.
     *
     * ### Basic example:
     *
     * ```javascript
     * const documents = [
     *   {
     *     id: 1,
     *     title: 'Moby Dick',
     *     text: 'Call me Ishmael. Some years ago...',
     *     category: 'fiction'
     *   },
     *   {
     *     id: 2,
     *     title: 'Zen and the Art of Motorcycle Maintenance',
     *     text: 'I can see by my watch...',
     *     category: 'fiction'
     *   },
     *   {
     *     id: 3,
     *     title: 'Neuromancer',
     *     text: 'The sky above the port was...',
     *     category: 'fiction'
     *   },
     *   {
     *     id: 4,
     *     title: 'Zen and the Art of Archery',
     *     text: 'At first sight it must seem...',
     *     category: 'non-fiction'
     *   },
     *   // ...and more
     * ]
     *
     * // Create a search engine that indexes the 'title' and 'text' fields for
     * // full-text search. Search results will include 'title' and 'category' (plus the
     * // id field, that is always stored and returned)
     * const miniSearch = new MiniSearch({
     *   fields: ['title', 'text'],
     *   storeFields: ['title', 'category']
     * })
     *
     * // Add documents to the index
     * miniSearch.addAll(documents)
     *
     * // Search for documents:
     * let results = miniSearch.search('zen art motorcycle')
     * // => [
     * //   { id: 2, title: 'Zen and the Art of Motorcycle Maintenance', category: 'fiction', score: 2.77258 },
     * //   { id: 4, title: 'Zen and the Art of Archery', category: 'non-fiction', score: 1.38629 }
     * // ]
     * ```
     */
    var MiniSearch = /** @class */ (function () {
        /**
         * @param options  Configuration options
         *
         * ### Examples:
         *
         * ```javascript
         * // Create a search engine that indexes the 'title' and 'text' fields of your
         * // documents:
         * const miniSearch = new MiniSearch({ fields: ['title', 'text'] })
         * ```
         *
         * ### ID Field:
         *
         * ```javascript
         * // Your documents are assumed to include a unique 'id' field, but if you want
         * // to use a different field for document identification, you can set the
         * // 'idField' option:
         * const miniSearch = new MiniSearch({ idField: 'key', fields: ['title', 'text'] })
         * ```
         *
         * ### Options and defaults:
         *
         * ```javascript
         * // The full set of options (here with their default value) is:
         * const miniSearch = new MiniSearch({
         *   // idField: field that uniquely identifies a document
         *   idField: 'id',
         *
         *   // extractField: function used to get the value of a field in a document.
         *   // By default, it assumes the document is a flat object with field names as
         *   // property keys and field values as string property values, but custom logic
         *   // can be implemented by setting this option to a custom extractor function.
         *   extractField: (document, fieldName) => document[fieldName],
         *
         *   // tokenize: function used to split fields into individual terms. By
         *   // default, it is also used to tokenize search queries, unless a specific
         *   // `tokenize` search option is supplied. When tokenizing an indexed field,
         *   // the field name is passed as the second argument.
         *   tokenize: (string, _fieldName) => string.split(SPACE_OR_PUNCTUATION),
         *
         *   // processTerm: function used to process each tokenized term before
         *   // indexing. It can be used for stemming and normalization. Return a falsy
         *   // value in order to discard a term. By default, it is also used to process
         *   // search queries, unless a specific `processTerm` option is supplied as a
         *   // search option. When processing a term from a indexed field, the field
         *   // name is passed as the second argument.
         *   processTerm: (term, _fieldName) => term.toLowerCase(),
         *
         *   // searchOptions: default search options, see the `search` method for
         *   // details
         *   searchOptions: undefined,
         *
         *   // fields: document fields to be indexed. Mandatory, but not set by default
         *   fields: undefined
         *
         *   // storeFields: document fields to be stored and returned as part of the
         *   // search results.
         *   storeFields: []
         * })
         * ```
         */
        function MiniSearch(options) {
            if ((options === null || options === void 0 ? void 0 : options.fields) == null) {
                throw new Error('MiniSearch: option "fields" must be provided');
            }
            this._options = __assign(__assign(__assign({}, defaultOptions), options), { searchOptions: __assign(__assign({}, defaultSearchOptions), (options.searchOptions || {})), autoSuggestOptions: __assign(__assign({}, defaultAutoSuggestOptions), (options.autoSuggestOptions || {})) });
            this._index = new SearchableMap();
            this._documentCount = 0;
            this._documentIds = new Map();
            // Fields are defined during initialization, don't change, are few in
            // number, rarely need iterating over, and have string keys. Therefore in
            // this case an object is a better candidate than a Map to store the mapping
            // from field key to ID.
            this._fieldIds = {};
            this._fieldLength = new Map();
            this._avgFieldLength = [];
            this._nextId = 0;
            this._storedFields = new Map();
            this.addFields(this._options.fields);
        }
        /**
         * Adds a document to the index
         *
         * @param document  The document to be indexed
         */
        MiniSearch.prototype.add = function (document) {
            var e_1, _a, e_2, _b, e_3, _c;
            var _d = this._options, extractField = _d.extractField, tokenize = _d.tokenize, processTerm = _d.processTerm, fields = _d.fields, idField = _d.idField;
            var id = extractField(document, idField);
            if (id == null) {
                throw new Error("MiniSearch: document does not have ID field \"".concat(idField, "\""));
            }
            var shortDocumentId = this.addDocumentId(id);
            this.saveStoredFields(shortDocumentId, document);
            try {
                for (var fields_1 = __values(fields), fields_1_1 = fields_1.next(); !fields_1_1.done; fields_1_1 = fields_1.next()) {
                    var field = fields_1_1.value;
                    var fieldValue = extractField(document, field);
                    if (fieldValue == null)
                        continue;
                    var tokens = tokenize(fieldValue.toString(), field);
                    var fieldId = this._fieldIds[field];
                    var uniqueTerms = new Set(tokens).size;
                    this.addFieldLength(shortDocumentId, fieldId, this._documentCount - 1, uniqueTerms);
                    try {
                        for (var tokens_1 = (e_2 = void 0, __values(tokens)), tokens_1_1 = tokens_1.next(); !tokens_1_1.done; tokens_1_1 = tokens_1.next()) {
                            var term = tokens_1_1.value;
                            var processedTerm = processTerm(term, field);
                            if (Array.isArray(processedTerm)) {
                                try {
                                    for (var processedTerm_1 = (e_3 = void 0, __values(processedTerm)), processedTerm_1_1 = processedTerm_1.next(); !processedTerm_1_1.done; processedTerm_1_1 = processedTerm_1.next()) {
                                        var t = processedTerm_1_1.value;
                                        this.addTerm(fieldId, shortDocumentId, t);
                                    }
                                }
                                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                                finally {
                                    try {
                                        if (processedTerm_1_1 && !processedTerm_1_1.done && (_c = processedTerm_1.return)) _c.call(processedTerm_1);
                                    }
                                    finally { if (e_3) throw e_3.error; }
                                }
                            }
                            else if (processedTerm) {
                                this.addTerm(fieldId, shortDocumentId, processedTerm);
                            }
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (tokens_1_1 && !tokens_1_1.done && (_b = tokens_1.return)) _b.call(tokens_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (fields_1_1 && !fields_1_1.done && (_a = fields_1.return)) _a.call(fields_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        };
        /**
         * Adds all the given documents to the index
         *
         * @param documents  An array of documents to be indexed
         */
        MiniSearch.prototype.addAll = function (documents) {
            var e_4, _a;
            try {
                for (var documents_1 = __values(documents), documents_1_1 = documents_1.next(); !documents_1_1.done; documents_1_1 = documents_1.next()) {
                    var document_1 = documents_1_1.value;
                    this.add(document_1);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (documents_1_1 && !documents_1_1.done && (_a = documents_1.return)) _a.call(documents_1);
                }
                finally { if (e_4) throw e_4.error; }
            }
        };
        /**
         * Adds all the given documents to the index asynchronously.
         *
         * Returns a promise that resolves (to `undefined`) when the indexing is done.
         * This method is useful when index many documents, to avoid blocking the main
         * thread. The indexing is performed asynchronously and in chunks.
         *
         * @param documents  An array of documents to be indexed
         * @param options  Configuration options
         * @return A promise resolving to `undefined` when the indexing is done
         */
        MiniSearch.prototype.addAllAsync = function (documents, options) {
            var _this = this;
            if (options === void 0) { options = {}; }
            var _a = options.chunkSize, chunkSize = _a === void 0 ? 10 : _a;
            var acc = { chunk: [], promise: Promise.resolve() };
            var _b = documents.reduce(function (_a, document, i) {
                var chunk = _a.chunk, promise = _a.promise;
                chunk.push(document);
                if ((i + 1) % chunkSize === 0) {
                    return {
                        chunk: [],
                        promise: promise
                            .then(function () { return new Promise(function (resolve) { return setTimeout(resolve, 0); }); })
                            .then(function () { return _this.addAll(chunk); })
                    };
                }
                else {
                    return { chunk: chunk, promise: promise };
                }
            }, acc), chunk = _b.chunk, promise = _b.promise;
            return promise.then(function () { return _this.addAll(chunk); });
        };
        /**
         * Removes the given document from the index.
         *
         * The document to delete must NOT have changed between indexing and deletion,
         * otherwise the index will be corrupted. Therefore, when reindexing a document
         * after a change, the correct order of operations is:
         *
         *   1. remove old version
         *   2. apply changes
         *   3. index new version
         *
         * @param document  The document to be removed
         */
        MiniSearch.prototype.remove = function (document) {
            var e_5, _a, e_6, _b, e_7, _c, e_8, _d;
            var _e = this._options, tokenize = _e.tokenize, processTerm = _e.processTerm, extractField = _e.extractField, fields = _e.fields, idField = _e.idField;
            var id = extractField(document, idField);
            if (id == null) {
                throw new Error("MiniSearch: document does not have ID field \"".concat(idField, "\""));
            }
            try {
                for (var _f = __values(this._documentIds), _g = _f.next(); !_g.done; _g = _f.next()) {
                    var _h = __read(_g.value, 2), shortId = _h[0], longId = _h[1];
                    if (id === longId) {
                        try {
                            for (var fields_2 = (e_6 = void 0, __values(fields)), fields_2_1 = fields_2.next(); !fields_2_1.done; fields_2_1 = fields_2.next()) {
                                var field = fields_2_1.value;
                                var fieldValue = extractField(document, field);
                                if (fieldValue == null)
                                    continue;
                                var tokens = tokenize(fieldValue.toString(), field);
                                var fieldId = this._fieldIds[field];
                                var uniqueTerms = new Set(tokens).size;
                                this.removeFieldLength(shortId, fieldId, this._documentCount, uniqueTerms);
                                try {
                                    for (var tokens_2 = (e_7 = void 0, __values(tokens)), tokens_2_1 = tokens_2.next(); !tokens_2_1.done; tokens_2_1 = tokens_2.next()) {
                                        var term = tokens_2_1.value;
                                        var processedTerm = processTerm(term, field);
                                        if (Array.isArray(processedTerm)) {
                                            try {
                                                for (var processedTerm_2 = (e_8 = void 0, __values(processedTerm)), processedTerm_2_1 = processedTerm_2.next(); !processedTerm_2_1.done; processedTerm_2_1 = processedTerm_2.next()) {
                                                    var t = processedTerm_2_1.value;
                                                    this.removeTerm(fieldId, shortId, t);
                                                }
                                            }
                                            catch (e_8_1) { e_8 = { error: e_8_1 }; }
                                            finally {
                                                try {
                                                    if (processedTerm_2_1 && !processedTerm_2_1.done && (_d = processedTerm_2.return)) _d.call(processedTerm_2);
                                                }
                                                finally { if (e_8) throw e_8.error; }
                                            }
                                        }
                                        else if (processedTerm) {
                                            this.removeTerm(fieldId, shortId, processedTerm);
                                        }
                                    }
                                }
                                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                                finally {
                                    try {
                                        if (tokens_2_1 && !tokens_2_1.done && (_c = tokens_2.return)) _c.call(tokens_2);
                                    }
                                    finally { if (e_7) throw e_7.error; }
                                }
                            }
                        }
                        catch (e_6_1) { e_6 = { error: e_6_1 }; }
                        finally {
                            try {
                                if (fields_2_1 && !fields_2_1.done && (_b = fields_2.return)) _b.call(fields_2);
                            }
                            finally { if (e_6) throw e_6.error; }
                        }
                        this._storedFields.delete(shortId);
                        this._documentIds.delete(shortId);
                        this._fieldLength.delete(shortId);
                        this._documentCount -= 1;
                        return;
                    }
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_g && !_g.done && (_a = _f.return)) _a.call(_f);
                }
                finally { if (e_5) throw e_5.error; }
            }
            throw new Error("MiniSearch: cannot remove document with ID ".concat(id, ": it is not in the index"));
        };
        /**
         * Removes all the given documents from the index. If called with no arguments,
         * it removes _all_ documents from the index.
         *
         * @param documents  The documents to be removed. If this argument is omitted,
         * all documents are removed. Note that, for removing all documents, it is
         * more efficient to call this method with no arguments than to pass all
         * documents.
         */
        MiniSearch.prototype.removeAll = function (documents) {
            var e_9, _a;
            if (documents) {
                try {
                    for (var documents_2 = __values(documents), documents_2_1 = documents_2.next(); !documents_2_1.done; documents_2_1 = documents_2.next()) {
                        var document_2 = documents_2_1.value;
                        this.remove(document_2);
                    }
                }
                catch (e_9_1) { e_9 = { error: e_9_1 }; }
                finally {
                    try {
                        if (documents_2_1 && !documents_2_1.done && (_a = documents_2.return)) _a.call(documents_2);
                    }
                    finally { if (e_9) throw e_9.error; }
                }
            }
            else if (arguments.length > 0) {
                throw new Error('Expected documents to be present. Omit the argument to remove all documents.');
            }
            else {
                this._index = new SearchableMap();
                this._documentCount = 0;
                this._documentIds = new Map();
                this._fieldLength = new Map();
                this._avgFieldLength = [];
                this._storedFields = new Map();
                this._nextId = 0;
            }
        };
        /**
         * Search for documents matching the given search query.
         *
         * The result is a list of scored document IDs matching the query, sorted by
         * descending score, and each including data about which terms were matched and
         * in which fields.
         *
         * ### Basic usage:
         *
         * ```javascript
         * // Search for "zen art motorcycle" with default options: terms have to match
         * // exactly, and individual terms are joined with OR
         * miniSearch.search('zen art motorcycle')
         * // => [ { id: 2, score: 2.77258, match: { ... } }, { id: 4, score: 1.38629, match: { ... } } ]
         * ```
         *
         * ### Restrict search to specific fields:
         *
         * ```javascript
         * // Search only in the 'title' field
         * miniSearch.search('zen', { fields: ['title'] })
         * ```
         *
         * ### Field boosting:
         *
         * ```javascript
         * // Boost a field
         * miniSearch.search('zen', { boost: { title: 2 } })
         * ```
         *
         * ### Prefix search:
         *
         * ```javascript
         * // Search for "moto" with prefix search (it will match documents
         * // containing terms that start with "moto" or "neuro")
         * miniSearch.search('moto neuro', { prefix: true })
         * ```
         *
         * ### Fuzzy search:
         *
         * ```javascript
         * // Search for "ismael" with fuzzy search (it will match documents containing
         * // terms similar to "ismael", with a maximum edit distance of 0.2 term.length
         * // (rounded to nearest integer)
         * miniSearch.search('ismael', { fuzzy: 0.2 })
         * ```
         *
         * ### Combining strategies:
         *
         * ```javascript
         * // Mix of exact match, prefix search, and fuzzy search
         * miniSearch.search('ismael mob', {
         *  prefix: true,
         *  fuzzy: 0.2
         * })
         * ```
         *
         * ### Advanced prefix and fuzzy search:
         *
         * ```javascript
         * // Perform fuzzy and prefix search depending on the search term. Here
         * // performing prefix and fuzzy search only on terms longer than 3 characters
         * miniSearch.search('ismael mob', {
         *  prefix: term => term.length > 3
         *  fuzzy: term => term.length > 3 ? 0.2 : null
         * })
         * ```
         *
         * ### Combine with AND:
         *
         * ```javascript
         * // Combine search terms with AND (to match only documents that contain both
         * // "motorcycle" and "art")
         * miniSearch.search('motorcycle art', { combineWith: 'AND' })
         * ```
         *
         * ### Combine with AND_NOT:
         *
         * There is also an AND_NOT combinator, that finds documents that match the
         * first term, but do not match any of the other terms. This combinator is
         * rarely useful with simple queries, and is meant to be used with advanced
         * query combinations (see later for more details).
         *
         * ### Filtering results:
         *
         * ```javascript
         * // Filter only results in the 'fiction' category (assuming that 'category'
         * // is a stored field)
         * miniSearch.search('motorcycle art', {
         *   filter: (result) => result.category === 'fiction'
         * })
         * ```
         *
         * ### Advanced combination of queries:
         *
         * It is possible to combine different subqueries with OR, AND, and AND_NOT,
         * and even with different search options, by passing a query expression
         * tree object as the first argument, instead of a string.
         *
         * ```javascript
         * // Search for documents that contain "zen" and ("motorcycle" or "archery")
         * miniSearch.search({
         *   combineWith: 'AND',
         *   queries: [
         *     'zen',
         *     {
         *       combineWith: 'OR',
         *       queries: ['motorcycle', 'archery']
         *     }
         *   ]
         * })
         *
         * // Search for documents that contain ("apple" or "pear") but not "juice" and
         * // not "tree"
         * miniSearch.search({
         *   combineWith: 'AND_NOT',
         *   queries: [
         *     {
         *       combineWith: 'OR',
         *       queries: ['apple', 'pear']
         *     },
         *     'juice',
         *     'tree'
         *   ]
         * })
         * ```
         *
         * Each node in the expression tree can be either a string, or an object that
         * supports all `SearchOptions` fields, plus a `queries` array field for
         * subqueries.
         *
         * Note that, while this can become complicated to do by hand for complex or
         * deeply nested queries, it provides a formalized expression tree API for
         * external libraries that implement a parser for custom query languages.
         *
         * @param query  Search query
         * @param options  Search options. Each option, if not given, defaults to the corresponding value of `searchOptions` given to the constructor, or to the library default.
         */
        MiniSearch.prototype.search = function (query, searchOptions) {
            var e_10, _a;
            if (searchOptions === void 0) { searchOptions = {}; }
            var combinedResults = this.executeQuery(query, searchOptions);
            var results = [];
            try {
                for (var combinedResults_1 = __values(combinedResults), combinedResults_1_1 = combinedResults_1.next(); !combinedResults_1_1.done; combinedResults_1_1 = combinedResults_1.next()) {
                    var _b = __read(combinedResults_1_1.value, 2), docId = _b[0], _c = _b[1], score = _c.score, terms = _c.terms, match = _c.match;
                    // Final score takes into account the number of matching QUERY terms.
                    // The end user will only receive the MATCHED terms.
                    var quality = terms.length;
                    var result = {
                        id: this._documentIds.get(docId),
                        score: score * quality,
                        terms: Object.keys(match),
                        match: match
                    };
                    Object.assign(result, this._storedFields.get(docId));
                    if (searchOptions.filter == null || searchOptions.filter(result)) {
                        results.push(result);
                    }
                }
            }
            catch (e_10_1) { e_10 = { error: e_10_1 }; }
            finally {
                try {
                    if (combinedResults_1_1 && !combinedResults_1_1.done && (_a = combinedResults_1.return)) _a.call(combinedResults_1);
                }
                finally { if (e_10) throw e_10.error; }
            }
            results.sort(byScore);
            return results;
        };
        /**
         * Provide suggestions for the given search query
         *
         * The result is a list of suggested modified search queries, derived from the
         * given search query, each with a relevance score, sorted by descending score.
         *
         * By default, it uses the same options used for search, except that by
         * default it performs prefix search on the last term of the query, and
         * combine terms with `'AND'` (requiring all query terms to match). Custom
         * options can be passed as a second argument. Defaults can be changed upon
         * calling the `MiniSearch` constructor, by passing a `autoSuggestOptions`
         * option.
         *
         * ### Basic usage:
         *
         * ```javascript
         * // Get suggestions for 'neuro':
         * miniSearch.autoSuggest('neuro')
         * // => [ { suggestion: 'neuromancer', terms: [ 'neuromancer' ], score: 0.46240 } ]
         * ```
         *
         * ### Multiple words:
         *
         * ```javascript
         * // Get suggestions for 'zen ar':
         * miniSearch.autoSuggest('zen ar')
         * // => [
         * //  { suggestion: 'zen archery art', terms: [ 'zen', 'archery', 'art' ], score: 1.73332 },
         * //  { suggestion: 'zen art', terms: [ 'zen', 'art' ], score: 1.21313 }
         * // ]
         * ```
         *
         * ### Fuzzy suggestions:
         *
         * ```javascript
         * // Correct spelling mistakes using fuzzy search:
         * miniSearch.autoSuggest('neromancer', { fuzzy: 0.2 })
         * // => [ { suggestion: 'neuromancer', terms: [ 'neuromancer' ], score: 1.03998 } ]
         * ```
         *
         * ### Filtering:
         *
         * ```javascript
         * // Get suggestions for 'zen ar', but only within the 'fiction' category
         * // (assuming that 'category' is a stored field):
         * miniSearch.autoSuggest('zen ar', {
         *   filter: (result) => result.category === 'fiction'
         * })
         * // => [
         * //  { suggestion: 'zen archery art', terms: [ 'zen', 'archery', 'art' ], score: 1.73332 },
         * //  { suggestion: 'zen art', terms: [ 'zen', 'art' ], score: 1.21313 }
         * // ]
         * ```
         *
         * @param queryString  Query string to be expanded into suggestions
         * @param options  Search options. The supported options and default values
         * are the same as for the `search` method, except that by default prefix
         * search is performed on the last term in the query, and terms are combined
         * with `'AND'`.
         * @return  A sorted array of suggestions sorted by relevance score.
         */
        MiniSearch.prototype.autoSuggest = function (queryString, options) {
            var e_11, _a, e_12, _b;
            if (options === void 0) { options = {}; }
            options = __assign(__assign({}, this._options.autoSuggestOptions), options);
            var suggestions = new Map();
            try {
                for (var _c = __values(this.search(queryString, options)), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var _e = _d.value, score = _e.score, terms = _e.terms;
                    var phrase = terms.join(' ');
                    var suggestion = suggestions.get(phrase);
                    if (suggestion != null) {
                        suggestion.score += score;
                        suggestion.count += 1;
                    }
                    else {
                        suggestions.set(phrase, { score: score, terms: terms, count: 1 });
                    }
                }
            }
            catch (e_11_1) { e_11 = { error: e_11_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_11) throw e_11.error; }
            }
            var results = [];
            try {
                for (var suggestions_1 = __values(suggestions), suggestions_1_1 = suggestions_1.next(); !suggestions_1_1.done; suggestions_1_1 = suggestions_1.next()) {
                    var _f = __read(suggestions_1_1.value, 2), suggestion = _f[0], _g = _f[1], score = _g.score, terms = _g.terms, count = _g.count;
                    results.push({ suggestion: suggestion, terms: terms, score: score / count });
                }
            }
            catch (e_12_1) { e_12 = { error: e_12_1 }; }
            finally {
                try {
                    if (suggestions_1_1 && !suggestions_1_1.done && (_b = suggestions_1.return)) _b.call(suggestions_1);
                }
                finally { if (e_12) throw e_12.error; }
            }
            results.sort(byScore);
            return results;
        };
        Object.defineProperty(MiniSearch.prototype, "documentCount", {
            /**
             * Number of documents in the index
             */
            get: function () {
                return this._documentCount;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Deserializes a JSON index (serialized with `JSON.stringify(miniSearch)`)
         * and instantiates a MiniSearch instance. It should be given the same options
         * originally used when serializing the index.
         *
         * ### Usage:
         *
         * ```javascript
         * // If the index was serialized with:
         * let miniSearch = new MiniSearch({ fields: ['title', 'text'] })
         * miniSearch.addAll(documents)
         *
         * const json = JSON.stringify(miniSearch)
         * // It can later be deserialized like this:
         * miniSearch = MiniSearch.loadJSON(json, { fields: ['title', 'text'] })
         * ```
         *
         * @param json  JSON-serialized index
         * @param options  configuration options, same as the constructor
         * @return An instance of MiniSearch deserialized from the given JSON.
         */
        MiniSearch.loadJSON = function (json, options) {
            if (options == null) {
                throw new Error('MiniSearch: loadJSON should be given the same options used when serializing the index');
            }
            return MiniSearch.loadJS(JSON.parse(json), options);
        };
        /**
         * Returns the default value of an option. It will throw an error if no option
         * with the given name exists.
         *
         * @param optionName  Name of the option
         * @return The default value of the given option
         *
         * ### Usage:
         *
         * ```javascript
         * // Get default tokenizer
         * MiniSearch.getDefault('tokenize')
         *
         * // Get default term processor
         * MiniSearch.getDefault('processTerm')
         *
         * // Unknown options will throw an error
         * MiniSearch.getDefault('notExisting')
         * // => throws 'MiniSearch: unknown option "notExisting"'
         * ```
         */
        MiniSearch.getDefault = function (optionName) {
            if (defaultOptions.hasOwnProperty(optionName)) {
                return getOwnProperty(defaultOptions, optionName);
            }
            else {
                throw new Error("MiniSearch: unknown option \"".concat(optionName, "\""));
            }
        };
        /**
         * @ignore
         */
        MiniSearch.loadJS = function (js, options) {
            var e_13, _a, e_14, _b;
            var index = js.index, documentCount = js.documentCount, nextId = js.nextId, documentIds = js.documentIds, fieldIds = js.fieldIds, fieldLength = js.fieldLength, averageFieldLength = js.averageFieldLength, storedFields = js.storedFields, serializationVersion = js.serializationVersion;
            if (serializationVersion !== 1 && serializationVersion !== 2) {
                throw new Error('MiniSearch: cannot deserialize an index created with an incompatible version');
            }
            var miniSearch = new MiniSearch(options);
            miniSearch._documentCount = documentCount;
            miniSearch._nextId = nextId;
            miniSearch._documentIds = objectToNumericMap(documentIds);
            miniSearch._fieldIds = fieldIds;
            miniSearch._fieldLength = objectToNumericMap(fieldLength);
            miniSearch._avgFieldLength = averageFieldLength;
            miniSearch._storedFields = objectToNumericMap(storedFields);
            miniSearch._index = new SearchableMap();
            try {
                for (var index_1 = __values(index), index_1_1 = index_1.next(); !index_1_1.done; index_1_1 = index_1.next()) {
                    var _c = __read(index_1_1.value, 2), term = _c[0], data = _c[1];
                    var dataMap = new Map();
                    try {
                        for (var _d = (e_14 = void 0, __values(Object.keys(data))), _e = _d.next(); !_e.done; _e = _d.next()) {
                            var fieldId = _e.value;
                            var indexEntry = data[fieldId];
                            // Version 1 used to nest the index entry inside a field called ds
                            if (serializationVersion === 1) {
                                indexEntry = indexEntry.ds;
                            }
                            dataMap.set(parseInt(fieldId, 10), objectToNumericMap(indexEntry));
                        }
                    }
                    catch (e_14_1) { e_14 = { error: e_14_1 }; }
                    finally {
                        try {
                            if (_e && !_e.done && (_b = _d.return)) _b.call(_d);
                        }
                        finally { if (e_14) throw e_14.error; }
                    }
                    miniSearch._index.set(term, dataMap);
                }
            }
            catch (e_13_1) { e_13 = { error: e_13_1 }; }
            finally {
                try {
                    if (index_1_1 && !index_1_1.done && (_a = index_1.return)) _a.call(index_1);
                }
                finally { if (e_13) throw e_13.error; }
            }
            return miniSearch;
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.executeQuery = function (query, searchOptions) {
            var _this = this;
            if (searchOptions === void 0) { searchOptions = {}; }
            if (typeof query !== 'string') {
                var options_1 = __assign(__assign(__assign({}, searchOptions), query), { queries: undefined });
                var results_1 = query.queries.map(function (subquery) { return _this.executeQuery(subquery, options_1); });
                return this.combineResults(results_1, query.combineWith);
            }
            var _a = this._options, tokenize = _a.tokenize, processTerm = _a.processTerm, globalSearchOptions = _a.searchOptions;
            var options = __assign(__assign({ tokenize: tokenize, processTerm: processTerm }, globalSearchOptions), searchOptions);
            var searchTokenize = options.tokenize, searchProcessTerm = options.processTerm;
            var terms = searchTokenize(query)
                .flatMap(function (term) { return searchProcessTerm(term); })
                .filter(function (term) { return !!term; });
            var queries = terms.map(termToQuerySpec(options));
            var results = queries.map(function (query) { return _this.executeQuerySpec(query, options); });
            return this.combineResults(results, options.combineWith);
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.executeQuerySpec = function (query, searchOptions) {
            var e_15, _a, e_16, _b;
            var options = __assign(__assign({}, this._options.searchOptions), searchOptions);
            var boosts = (options.fields || this._options.fields).reduce(function (boosts, field) {
                var _a;
                return (__assign(__assign({}, boosts), (_a = {}, _a[field] = getOwnProperty(boosts, field) || 1, _a)));
            }, options.boost || {});
            var boostDocument = options.boostDocument, weights = options.weights, maxFuzzy = options.maxFuzzy;
            var _c = __assign(__assign({}, defaultSearchOptions.weights), weights), fuzzyWeight = _c.fuzzy, prefixWeight = _c.prefix;
            var data = this._index.get(query.term);
            var results = this.termResults(query.term, query.term, 1, data, boosts, boostDocument);
            var prefixMatches;
            var fuzzyMatches;
            if (query.prefix) {
                prefixMatches = this._index.atPrefix(query.term);
            }
            if (query.fuzzy) {
                var fuzzy = (query.fuzzy === true) ? 0.2 : query.fuzzy;
                var maxDistance = fuzzy < 1 ? Math.min(maxFuzzy, Math.round(query.term.length * fuzzy)) : fuzzy;
                if (maxDistance)
                    fuzzyMatches = this._index.fuzzyGet(query.term, maxDistance);
            }
            if (prefixMatches) {
                try {
                    for (var prefixMatches_1 = __values(prefixMatches), prefixMatches_1_1 = prefixMatches_1.next(); !prefixMatches_1_1.done; prefixMatches_1_1 = prefixMatches_1.next()) {
                        var _d = __read(prefixMatches_1_1.value, 2), term = _d[0], data_1 = _d[1];
                        var distance = term.length - query.term.length;
                        if (!distance) {
                            continue;
                        } // Skip exact match.
                        // Delete the term from fuzzy results (if present) if it is also a
                        // prefix result. This entry will always be scored as a prefix result.
                        fuzzyMatches === null || fuzzyMatches === void 0 ? void 0 : fuzzyMatches.delete(term);
                        // Weight gradually approaches 0 as distance goes to infinity, with the
                        // weight for the hypothetical distance 0 being equal to prefixWeight.
                        // The rate of change is much lower than that of fuzzy matches to
                        // account for the fact that prefix matches stay more relevant than
                        // fuzzy matches for longer distances.
                        var weight = prefixWeight * term.length / (term.length + 0.3 * distance);
                        this.termResults(query.term, term, weight, data_1, boosts, boostDocument, results);
                    }
                }
                catch (e_15_1) { e_15 = { error: e_15_1 }; }
                finally {
                    try {
                        if (prefixMatches_1_1 && !prefixMatches_1_1.done && (_a = prefixMatches_1.return)) _a.call(prefixMatches_1);
                    }
                    finally { if (e_15) throw e_15.error; }
                }
            }
            if (fuzzyMatches) {
                try {
                    for (var _e = __values(fuzzyMatches.keys()), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var term = _f.value;
                        var _g = __read(fuzzyMatches.get(term), 2), data_2 = _g[0], distance = _g[1];
                        if (!distance) {
                            continue;
                        } // Skip exact match.
                        // Weight gradually approaches 0 as distance goes to infinity, with the
                        // weight for the hypothetical distance 0 being equal to fuzzyWeight.
                        var weight = fuzzyWeight * term.length / (term.length + distance);
                        this.termResults(query.term, term, weight, data_2, boosts, boostDocument, results);
                    }
                }
                catch (e_16_1) { e_16 = { error: e_16_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_16) throw e_16.error; }
                }
            }
            return results;
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.combineResults = function (results, combineWith) {
            if (combineWith === void 0) { combineWith = OR; }
            if (results.length === 0) {
                return new Map();
            }
            var operator = combineWith.toLowerCase();
            return results.reduce(combinators[operator]) || new Map();
        };
        /**
         * Allows serialization of the index to JSON, to possibly store it and later
         * deserialize it with `MiniSearch.loadJSON`.
         *
         * Normally one does not directly call this method, but rather call the
         * standard JavaScript `JSON.stringify()` passing the `MiniSearch` instance,
         * and JavaScript will internally call this method. Upon deserialization, one
         * must pass to `loadJSON` the same options used to create the original
         * instance that was serialized.
         *
         * ### Usage:
         *
         * ```javascript
         * // Serialize the index:
         * let miniSearch = new MiniSearch({ fields: ['title', 'text'] })
         * miniSearch.addAll(documents)
         * const json = JSON.stringify(miniSearch)
         *
         * // Later, to deserialize it:
         * miniSearch = MiniSearch.loadJSON(json, { fields: ['title', 'text'] })
         * ```
         *
         * @return A plain-object serializeable representation of the search index.
         */
        MiniSearch.prototype.toJSON = function () {
            var e_17, _a, e_18, _b;
            var index = [];
            try {
                for (var _c = __values(this._index), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var _e = __read(_d.value, 2), term = _e[0], fieldIndex = _e[1];
                    var data = {};
                    try {
                        for (var fieldIndex_1 = (e_18 = void 0, __values(fieldIndex)), fieldIndex_1_1 = fieldIndex_1.next(); !fieldIndex_1_1.done; fieldIndex_1_1 = fieldIndex_1.next()) {
                            var _f = __read(fieldIndex_1_1.value, 2), fieldId = _f[0], freqs = _f[1];
                            data[fieldId] = Object.fromEntries(freqs);
                        }
                    }
                    catch (e_18_1) { e_18 = { error: e_18_1 }; }
                    finally {
                        try {
                            if (fieldIndex_1_1 && !fieldIndex_1_1.done && (_b = fieldIndex_1.return)) _b.call(fieldIndex_1);
                        }
                        finally { if (e_18) throw e_18.error; }
                    }
                    index.push([term, data]);
                }
            }
            catch (e_17_1) { e_17 = { error: e_17_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_17) throw e_17.error; }
            }
            return {
                documentCount: this._documentCount,
                nextId: this._nextId,
                documentIds: Object.fromEntries(this._documentIds),
                fieldIds: this._fieldIds,
                fieldLength: Object.fromEntries(this._fieldLength),
                averageFieldLength: this._avgFieldLength,
                storedFields: Object.fromEntries(this._storedFields),
                index: index,
                serializationVersion: 2
            };
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.termResults = function (sourceTerm, derivedTerm, termWeight, fieldTermData, fieldBoosts, boostDocumentFn, results) {
            var e_19, _a, e_20, _b, _c;
            if (results === void 0) { results = new Map(); }
            if (fieldTermData == null)
                return results;
            try {
                for (var _d = __values(Object.keys(fieldBoosts)), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var field = _e.value;
                    var fieldBoost = fieldBoosts[field];
                    var fieldId = this._fieldIds[field];
                    var fieldTermFreqs = fieldTermData.get(fieldId);
                    if (fieldTermFreqs == null)
                        continue;
                    var matchingFields = fieldTermFreqs.size;
                    var avgFieldLength = this._avgFieldLength[fieldId];
                    try {
                        for (var _f = (e_20 = void 0, __values(fieldTermFreqs.keys())), _g = _f.next(); !_g.done; _g = _f.next()) {
                            var docId = _g.value;
                            var docBoost = boostDocumentFn ? boostDocumentFn(this._documentIds.get(docId), derivedTerm) : 1;
                            if (!docBoost)
                                continue;
                            var termFreq = fieldTermFreqs.get(docId);
                            var fieldLength = this._fieldLength.get(docId)[fieldId];
                            // NOTE: The total number of fields is set to the number of documents
                            // `this._documentCount`. It could also make sense to use the number of
                            // documents where the current field is non-blank as a normalisation
                            // factor. This will make a difference in scoring if the field is rarely
                            // present. This is currently not supported, and may require further
                            // analysis to see if it is a valid use case.
                            var rawScore = calcBM25Score(termFreq, matchingFields, this._documentCount, fieldLength, avgFieldLength);
                            var weightedScore = termWeight * fieldBoost * docBoost * rawScore;
                            var result = results.get(docId);
                            if (result) {
                                result.score += weightedScore;
                                assignUniqueTerm(result.terms, sourceTerm);
                                var match = getOwnProperty(result.match, derivedTerm);
                                if (match) {
                                    match.push(field);
                                }
                                else {
                                    result.match[derivedTerm] = [field];
                                }
                            }
                            else {
                                results.set(docId, {
                                    score: weightedScore,
                                    terms: [sourceTerm],
                                    match: (_c = {}, _c[derivedTerm] = [field], _c)
                                });
                            }
                        }
                    }
                    catch (e_20_1) { e_20 = { error: e_20_1 }; }
                    finally {
                        try {
                            if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                        }
                        finally { if (e_20) throw e_20.error; }
                    }
                }
            }
            catch (e_19_1) { e_19 = { error: e_19_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                }
                finally { if (e_19) throw e_19.error; }
            }
            return results;
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.addTerm = function (fieldId, documentId, term) {
            var indexData = this._index.fetch(term, createMap);
            var fieldIndex = indexData.get(fieldId);
            if (fieldIndex == null) {
                fieldIndex = new Map();
                fieldIndex.set(documentId, 1);
                indexData.set(fieldId, fieldIndex);
            }
            else {
                var docs = fieldIndex.get(documentId);
                fieldIndex.set(documentId, (docs || 0) + 1);
            }
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.removeTerm = function (fieldId, documentId, term) {
            if (!this._index.has(term)) {
                this.warnDocumentChanged(documentId, fieldId, term);
                return;
            }
            var indexData = this._index.fetch(term, createMap);
            var fieldIndex = indexData.get(fieldId);
            if (fieldIndex == null || fieldIndex.get(documentId) == null) {
                this.warnDocumentChanged(documentId, fieldId, term);
            }
            else if (fieldIndex.get(documentId) <= 1) {
                if (fieldIndex.size <= 1) {
                    indexData.delete(fieldId);
                }
                else {
                    fieldIndex.delete(documentId);
                }
            }
            else {
                fieldIndex.set(documentId, fieldIndex.get(documentId) - 1);
            }
            if (this._index.get(term).size === 0) {
                this._index.delete(term);
            }
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.warnDocumentChanged = function (shortDocumentId, fieldId, term) {
            var e_21, _a;
            try {
                for (var _b = __values(Object.keys(this._fieldIds)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var fieldName = _c.value;
                    if (this._fieldIds[fieldName] === fieldId) {
                        this._options.logger('warn', "MiniSearch: document with ID ".concat(this._documentIds.get(shortDocumentId), " has changed before removal: term \"").concat(term, "\" was not present in field \"").concat(fieldName, "\". Removing a document after it has changed can corrupt the index!"), 'version_conflict');
                        return;
                    }
                }
            }
            catch (e_21_1) { e_21 = { error: e_21_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_21) throw e_21.error; }
            }
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.addDocumentId = function (documentId) {
            var shortDocumentId = this._nextId;
            this._documentIds.set(shortDocumentId, documentId);
            this._documentCount += 1;
            this._nextId += 1;
            return shortDocumentId;
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.addFields = function (fields) {
            for (var i = 0; i < fields.length; i++) {
                this._fieldIds[fields[i]] = i;
            }
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.addFieldLength = function (documentId, fieldId, count, length) {
            var fieldLengths = this._fieldLength.get(documentId);
            if (fieldLengths == null)
                this._fieldLength.set(documentId, fieldLengths = []);
            fieldLengths[fieldId] = length;
            var averageFieldLength = this._avgFieldLength[fieldId] || 0;
            var totalFieldLength = (averageFieldLength * count) + length;
            this._avgFieldLength[fieldId] = totalFieldLength / (count + 1);
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.removeFieldLength = function (documentId, fieldId, count, length) {
            var totalFieldLength = (this._avgFieldLength[fieldId] * count) - length;
            this._avgFieldLength[fieldId] = totalFieldLength / (count - 1);
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.saveStoredFields = function (documentId, doc) {
            var e_22, _a;
            var _b = this._options, storeFields = _b.storeFields, extractField = _b.extractField;
            if (storeFields == null || storeFields.length === 0) {
                return;
            }
            var documentFields = this._storedFields.get(documentId);
            if (documentFields == null)
                this._storedFields.set(documentId, documentFields = {});
            try {
                for (var storeFields_1 = __values(storeFields), storeFields_1_1 = storeFields_1.next(); !storeFields_1_1.done; storeFields_1_1 = storeFields_1.next()) {
                    var fieldName = storeFields_1_1.value;
                    var fieldValue = extractField(doc, fieldName);
                    if (fieldValue !== undefined)
                        documentFields[fieldName] = fieldValue;
                }
            }
            catch (e_22_1) { e_22 = { error: e_22_1 }; }
            finally {
                try {
                    if (storeFields_1_1 && !storeFields_1_1.done && (_a = storeFields_1.return)) _a.call(storeFields_1);
                }
                finally { if (e_22) throw e_22.error; }
            }
        };
        return MiniSearch;
    }());
    var getOwnProperty = function (object, property) {
        return Object.prototype.hasOwnProperty.call(object, property) ? object[property] : undefined;
    };
    var combinators = (_a = {},
        _a[OR] = function (a, b) {
            var e_23, _a;
            try {
                for (var _b = __values(b.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var docId = _c.value;
                    var existing = a.get(docId);
                    if (existing == null) {
                        a.set(docId, b.get(docId));
                    }
                    else {
                        var _d = b.get(docId), score = _d.score, terms = _d.terms, match = _d.match;
                        existing.score = existing.score + score;
                        existing.match = Object.assign(existing.match, match);
                        assignUniqueTerms(existing.terms, terms);
                    }
                }
            }
            catch (e_23_1) { e_23 = { error: e_23_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_23) throw e_23.error; }
            }
            return a;
        },
        _a[AND] = function (a, b) {
            var e_24, _a;
            var combined = new Map();
            try {
                for (var _b = __values(b.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var docId = _c.value;
                    var existing = a.get(docId);
                    if (existing == null)
                        continue;
                    var _d = b.get(docId), score = _d.score, terms = _d.terms, match = _d.match;
                    assignUniqueTerms(existing.terms, terms);
                    combined.set(docId, {
                        score: existing.score + score,
                        terms: existing.terms,
                        match: Object.assign(existing.match, match)
                    });
                }
            }
            catch (e_24_1) { e_24 = { error: e_24_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_24) throw e_24.error; }
            }
            return combined;
        },
        _a[AND_NOT] = function (a, b) {
            var e_25, _a;
            try {
                for (var _b = __values(b.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var docId = _c.value;
                    a.delete(docId);
                }
            }
            catch (e_25_1) { e_25 = { error: e_25_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_25) throw e_25.error; }
            }
            return a;
        },
        _a);
    // https://en.wikipedia.org/wiki/Okapi_BM25
    // https://opensourceconnections.com/blog/2015/10/16/bm25-the-next-generation-of-lucene-relevation/
    var k = 1.2; // Term frequency saturation point. Recommended values are between 1.2 and 2.
    var b = 0.7; // Length normalization impact. Recommended values are around 0.75.
    var d = 0.5; // BM25+ frequency normalization lower bound. Recommended values are between 0.5 and 1.
    var calcBM25Score = function (termFreq, matchingCount, totalCount, fieldLength, avgFieldLength) {
        var invDocFreq = Math.log(1 + (totalCount - matchingCount + 0.5) / (matchingCount + 0.5));
        return invDocFreq * (d + termFreq * (k + 1) / (termFreq + k * (1 - b + b * fieldLength / avgFieldLength)));
    };
    var termToQuerySpec = function (options) { return function (term, i, terms) {
        var fuzzy = (typeof options.fuzzy === 'function')
            ? options.fuzzy(term, i, terms)
            : (options.fuzzy || false);
        var prefix = (typeof options.prefix === 'function')
            ? options.prefix(term, i, terms)
            : (options.prefix === true);
        return { term: term, fuzzy: fuzzy, prefix: prefix };
    }; };
    var defaultOptions = {
        idField: 'id',
        extractField: function (document, fieldName) { return document[fieldName]; },
        tokenize: function (text, fieldName) { return text.split(SPACE_OR_PUNCTUATION); },
        processTerm: function (term, fieldName) { return term.toLowerCase(); },
        fields: undefined,
        searchOptions: undefined,
        storeFields: [],
        logger: function (level, message, code) { return console != null && console.warn != null && console[level](message); }
    };
    var defaultSearchOptions = {
        combineWith: OR,
        prefix: false,
        fuzzy: false,
        maxFuzzy: 6,
        boost: {},
        weights: { fuzzy: 0.45, prefix: 0.375 }
    };
    var defaultAutoSuggestOptions = {
        combineWith: AND,
        prefix: function (term, i, terms) {
            return i === terms.length - 1;
        }
    };
    var assignUniqueTerm = function (target, term) {
        // Avoid adding duplicate terms.
        if (!target.includes(term))
            target.push(term);
    };
    var assignUniqueTerms = function (target, source) {
        var e_26, _a;
        try {
            for (var source_1 = __values(source), source_1_1 = source_1.next(); !source_1_1.done; source_1_1 = source_1.next()) {
                var term = source_1_1.value;
                // Avoid adding duplicate terms.
                if (!target.includes(term))
                    target.push(term);
            }
        }
        catch (e_26_1) { e_26 = { error: e_26_1 }; }
        finally {
            try {
                if (source_1_1 && !source_1_1.done && (_a = source_1.return)) _a.call(source_1);
            }
            finally { if (e_26) throw e_26.error; }
        }
    };
    var byScore = function (_a, _b) {
        var a = _a.score;
        var b = _b.score;
        return b - a;
    };
    var createMap = function () { return new Map(); };
    var objectToNumericMap = function (object) {
        var e_27, _a;
        var map = new Map();
        try {
            for (var _b = __values(Object.keys(object)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var key = _c.value;
                map.set(parseInt(key, 10), object[key]);
            }
        }
        catch (e_27_1) { e_27 = { error: e_27_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_27) throw e_27.error; }
        }
        return map;
    };
    // This regular expression matches any Unicode space or punctuation character
    // Adapted from https://unicode.org/cldr/utility/list-unicodeset.jsp?a=%5Cp%7BZ%7D%5Cp%7BP%7D&abb=on&c=on&esc=on
    var SPACE_OR_PUNCTUATION = /[\n\r -#%-*,-/:;?@[-\]_{}\u00A0\u00A1\u00A7\u00AB\u00B6\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]+/u;

    return MiniSearch;

}));
//# sourceMappingURL=index.js.map
