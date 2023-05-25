type LeafType = '' & {
    readonly __tag: unique symbol;
};
interface RadixTree<T> extends Map<string, T | RadixTree<T>> {
    get(key: LeafType): T | undefined;
    get(key: string): RadixTree<T> | undefined;
    set(key: LeafType, value: T): this;
    set(key: string, value: RadixTree<T>): this;
}
type Entry<T> = [string, T];

interface Iterators<T> {
    ENTRIES: Entry<T>;
    KEYS: string;
    VALUES: T;
}
type Kind<T> = keyof Iterators<T>;
type Result<T, K extends keyof Iterators<T>> = Iterators<T>[K];
type IteratorPath<T> = {
    node: RadixTree<T>;
    keys: string[];
}[];
type IterableSet<T> = {
    _tree: RadixTree<T>;
    _prefix: string;
};
/**
 * @private
 */
declare class TreeIterator<T, K extends Kind<T>> implements Iterator<Result<T, K>> {
    set: IterableSet<T>;
    _type: K;
    _path: IteratorPath<T>;
    constructor(set: IterableSet<T>, type: K);
    next(): IteratorResult<Result<T, K>>;
    dive(): IteratorResult<Result<T, K>>;
    backtrack(): void;
    key(): string;
    value(): T;
    result(): Result<T, K>;
    [Symbol.iterator](): this;
}

type FuzzyResult<T> = [T, number];
type FuzzyResults<T> = Map<string, FuzzyResult<T>>;

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
declare class SearchableMap<T = any> {
    /**
     * @internal
     */
    _tree: RadixTree<T>;
    /**
     * @internal
     */
    _prefix: string;
    private _size;
    /**
     * The constructor is normally called without arguments, creating an empty
     * map. In order to create a [[SearchableMap]] from an iterable or from an
     * object, check [[SearchableMap.from]] and [[SearchableMap.fromObject]].
     *
     * The constructor arguments are for internal use, when creating derived
     * mutable views of a map at a prefix.
     */
    constructor(tree?: RadixTree<T>, prefix?: string);
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
    atPrefix(prefix: string): SearchableMap<T>;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/clear
     */
    clear(): void;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/delete
     * @param key  Key to delete
     */
    delete(key: string): void;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/entries
     * @return An iterator iterating through `[key, value]` entries.
     */
    entries(): TreeIterator<T, "ENTRIES">;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach
     * @param fn  Iteration function
     */
    forEach(fn: (key: string, value: T, map: SearchableMap) => void): void;
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
    fuzzyGet(key: string, maxEditDistance: number): FuzzyResults<T>;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get
     * @param key  Key to get
     * @return Value associated to the key, or `undefined` if the key is not
     * found.
     */
    get(key: string): T | undefined;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has
     * @param key  Key
     * @return True if the key is in the map, false otherwise
     */
    has(key: string): boolean;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/keys
     * @return An `Iterable` iterating through keys
     */
    keys(): TreeIterator<T, "KEYS">;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/set
     * @param key  Key to set
     * @param value  Value to associate to the key
     * @return The [[SearchableMap]] itself, to allow chaining
     */
    set(key: string, value: T): SearchableMap<T>;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/size
     */
    get size(): number;
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
    update(key: string, fn: (value: T | undefined) => T): SearchableMap<T>;
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
    fetch(key: string, initial: () => T): T;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/values
     * @return An `Iterable` iterating through values.
     */
    values(): TreeIterator<T, "VALUES">;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/@@iterator
     */
    [Symbol.iterator](): TreeIterator<T, "ENTRIES">;
    /**
     * Creates a [[SearchableMap]] from an `Iterable` of entries
     *
     * @param entries  Entries to be inserted in the [[SearchableMap]]
     * @return A new [[SearchableMap]] with the given entries
     */
    static from<T = any>(entries: Iterable<Entry<T>> | Entry<T>[]): SearchableMap<any>;
    /**
     * Creates a [[SearchableMap]] from the iterable properties of a JavaScript object
     *
     * @param object  Object of entries for the [[SearchableMap]]
     * @return A new [[SearchableMap]] with the given entries
     */
    static fromObject<T = any>(object: {
        [key: string]: T;
    }): SearchableMap<any>;
}

/**
 * Search options to customize the search behavior.
 */
type SearchOptions = {
    /**
     * Names of the fields to search in. If omitted, all fields are searched.
     */
    fields?: string[];
    /**
     * Function used to filter search results, for example on the basis of stored
     * fields. It takes as argument each search result and should return a boolean
     * to indicate if the result should be kept or not.
     */
    filter?: (result: SearchResult) => boolean;
    /**
     * Key-value object of field names to boosting values. By default, fields are
     * assigned a boosting factor of 1. If one assigns to a field a boosting value
     * of 2, a result that matches the query in that field is assigned a score
     * twice as high as a result matching the query in another field, all else
     * being equal.
     */
    boost?: {
        [fieldName: string]: number;
    };
    /**
     * Relative weights to assign to prefix search results and fuzzy search
     * results. Exact matches are assigned a weight of 1.
     */
    weights?: {
        fuzzy: number;
        prefix: number;
    };
    /**
     * Function to calculate a boost factor for documents. It takes as arguments
     * the document ID, and a term that matches the search in that document, and
     * should return a boosting factor.
     */
    boostDocument?: (documentId: any, term: string) => number;
    /**
     * Controls whether to perform prefix search. It can be a simple boolean, or a
     * function.
     *
     * If a boolean is passed, prefix search is performed if true.
     *
     * If a function is passed, it is called upon search with a search term, the
     * positional index of that search term in the tokenized search query, and the
     * tokenized search query. The function should return a boolean to indicate
     * whether to perform prefix search for that search term.
     */
    prefix?: boolean | ((term: string, index: number, terms: string[]) => boolean);
    /**
     * Controls whether to perform fuzzy search. It can be a simple boolean, or a
     * number, or a function.
     *
     * If a boolean is given, fuzzy search with a default fuzziness parameter is
     * performed if true.
     *
     * If a number higher or equal to 1 is given, fuzzy search is performed, with
     * a maximum edit distance (Levenshtein) equal to the number.
     *
     * If a number between 0 and 1 is given, fuzzy search is performed within a
     * maximum edit distance corresponding to that fraction of the term length,
     * approximated to the nearest integer. For example, 0.2 would mean an edit
     * distance of 20% of the term length, so 1 character in a 5-characters term.
     * The calculated fuzziness value is limited by the `maxFuzzy` option, to
     * prevent slowdown for very long queries.
     *
     * If a function is passed, the function is called upon search with a search
     * term, a positional index of that term in the tokenized search query, and
     * the tokenized search query. It should return a boolean or a number, with
     * the meaning documented above.
     */
    fuzzy?: boolean | number | ((term: string, index: number, terms: string[]) => boolean | number);
    /**
     * Controls the maximum fuzziness when using a fractional fuzzy value. This is
     * set to 6 by default. Very high edit distances usually don't produce
     * meaningful results, but can excessively impact search performance.
     */
    maxFuzzy?: number;
    /**
     * The operand to combine partial results for each term. By default it is
     * "OR", so results matching _any_ of the search terms are returned by a
     * search. If "AND" is given, only results matching _all_ the search terms are
     * returned by a search.
     */
    combineWith?: string;
    /**
     * Function to tokenize the search query. By default, the same tokenizer used
     * for indexing is used also for search.
     */
    tokenize?: (text: string) => string[];
    /**
     * Function to process or normalize terms in the search query. By default, the
     * same term processor used for indexing is used also for search.
     */
    processTerm?: (term: string) => string | string[] | null | undefined | false;
};
type SearchOptionsWithDefaults = SearchOptions & {
    boost: {
        [fieldName: string]: number;
    };
    weights: {
        fuzzy: number;
        prefix: number;
    };
    prefix: boolean | ((term: string, index: number, terms: string[]) => boolean);
    fuzzy: boolean | number | ((term: string, index: number, terms: string[]) => boolean | number);
    maxFuzzy: number;
    combineWith: string;
};
/**
 * Configuration options passed to the [[MiniSearch]] constructor
 *
 * @typeParam T  The type of documents being indexed.
 */
type Options<T = any> = {
    /**
     * Names of the document fields to be indexed.
     */
    fields: string[];
    /**
     * Name of the ID field, uniquely identifying a document.
     */
    idField?: string;
    /**
     * Names of fields to store, so that search results would include them. By
     * default none, so resuts would only contain the id field.
     */
    storeFields?: string[];
    /**
     * Function used to extract the value of each field in documents. By default,
     * the documents are assumed to be plain objects with field names as keys,
     * but by specifying a custom `extractField` function one can completely
     * customize how the fields are extracted.
     *
     * The function takes as arguments the document, and the name of the field to
     * extract from it. It should return the field value as a string.
     */
    extractField?: (document: T, fieldName: string) => string;
    tokenize?: (text: string, fieldName?: string) => string[];
    /**
     * Function used to process a term before indexing or search. This can be
     * used for normalization (such as stemming). By default, terms are
     * downcased, and otherwise no other normalization is performed.
     *
     * The function takes as arguments a term to process, and the name of the
     * field it comes from. It should return the processed term as a string, or a
     * falsy value to reject the term entirely.
     *
     * It can also return an array of strings, in which case each string in the
     * returned array is indexed as a separate term.
     */
    processTerm?: (term: string, fieldName?: string) => string | string[] | null | undefined | false;
    /**
     * Function called to log messages. Arguments are a log level ('debug',
     * 'info', 'warn', or 'error'), a log message, and an optional string code
     * that identifies the reason for the log.
     *
     * The default implementation uses `console`, if defined.
     */
    logger?: (level: LogLevel, message: string, code?: string) => void;
    /**
     * Default search options (see the [[SearchOptions]] type and the
     * [[MiniSearch.search]] method for details)
     */
    searchOptions?: SearchOptions;
    /**
     * Default auto suggest options (see the [[SearchOptions]] type and the
     * [[MiniSearch.autoSuggest]] method for details)
     */
    autoSuggestOptions?: SearchOptions;
};
type OptionsWithDefaults<T = any> = Options<T> & {
    storeFields: string[];
    idField: string;
    extractField: (document: T, fieldName: string) => string;
    tokenize: (text: string, fieldName: string) => string[];
    processTerm: (term: string, fieldName: string) => string | string[] | null | undefined | false;
    logger: (level: LogLevel, message: string, code?: string) => void;
    searchOptions: SearchOptionsWithDefaults;
    autoSuggestOptions: SearchOptions;
};
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
/**
 * The type of auto-suggestions
 */
type Suggestion = {
    /**
     * The suggestion
     */
    suggestion: string;
    /**
     * Suggestion as an array of terms
     */
    terms: string[];
    /**
     * Score for the suggestion
     */
    score: number;
};
/**
 * Match information for a search result. It is a key-value object where keys
 * are terms that matched, and values are the list of fields that the term was
 * found in.
 */
type MatchInfo = {
    [term: string]: string[];
};
/**
 * Type of the search results. Each search result indicates the document ID, the
 * terms that matched, the match information, the score, and all the stored
 * fields.
 */
type SearchResult = {
    /**
     * The document ID
     */
    id: any;
    /**
     * List of terms that matched
     */
    terms: string[];
    /**
     * Score of the search results
     */
    score: number;
    /**
     * Match information, see [[MatchInfo]]
     */
    match: MatchInfo;
    /**
     * Stored fields
     */
    [key: string]: any;
};
/**
 * @ignore
 */
type AsPlainObject = {
    documentCount: number;
    nextId: number;
    documentIds: {
        [shortId: string]: any;
    };
    fieldIds: {
        [fieldName: string]: number;
    };
    fieldLength: {
        [shortId: string]: number[];
    };
    averageFieldLength: number[];
    storedFields: {
        [shortId: string]: any;
    };
    index: [string, {
        [fieldId: string]: SerializedIndexEntry;
    }][];
    serializationVersion: number;
};
type QueryCombination = SearchOptions & {
    queries: Query[];
};
/**
 * Search query expression, either a query string or an expression tree
 * combining several queries with a combination of AND or OR.
 */
type Query = QueryCombination | string;
type DocumentTermFreqs = Map<number, number>;
type FieldTermData = Map<number, DocumentTermFreqs>;
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
declare class MiniSearch<T = any> {
    protected _options: OptionsWithDefaults<T>;
    protected _index: SearchableMap<FieldTermData>;
    protected _documentCount: number;
    protected _documentIds: Map<number, any>;
    protected _fieldIds: {
        [key: string]: number;
    };
    protected _fieldLength: Map<number, number[]>;
    protected _avgFieldLength: number[];
    protected _nextId: number;
    protected _storedFields: Map<number, Record<string, unknown>>;
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
    constructor(options: Options<T>);
    /**
     * Adds a document to the index
     *
     * @param document  The document to be indexed
     */
    add(document: T): void;
    /**
     * Adds all the given documents to the index
     *
     * @param documents  An array of documents to be indexed
     */
    addAll(documents: T[]): void;
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
    addAllAsync(documents: T[], options?: {
        chunkSize?: number;
    }): Promise<void>;
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
    remove(document: T): void;
    /**
     * Removes all the given documents from the index. If called with no arguments,
     * it removes _all_ documents from the index.
     *
     * @param documents  The documents to be removed. If this argument is omitted,
     * all documents are removed. Note that, for removing all documents, it is
     * more efficient to call this method with no arguments than to pass all
     * documents.
     */
    removeAll(documents?: T[]): void;
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
    search(query: Query, searchOptions?: SearchOptions): SearchResult[];
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
    autoSuggest(queryString: string, options?: SearchOptions): Suggestion[];
    /**
     * Number of documents in the index
     */
    get documentCount(): number;
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
    static loadJSON<T = any>(json: string, options: Options<T>): MiniSearch<T>;
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
    static getDefault(optionName: string): any;
    /**
     * @ignore
     */
    static loadJS<T = any>(js: AsPlainObject, options: Options<T>): MiniSearch<T>;
    /**
     * @ignore
     */
    private executeQuery;
    /**
     * @ignore
     */
    private executeQuerySpec;
    /**
     * @ignore
     */
    private combineResults;
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
    toJSON(): AsPlainObject;
    /**
     * @ignore
     */
    private termResults;
    /**
     * @ignore
     */
    private addTerm;
    /**
     * @ignore
     */
    private removeTerm;
    /**
     * @ignore
     */
    private warnDocumentChanged;
    /**
     * @ignore
     */
    private addDocumentId;
    /**
     * @ignore
     */
    private addFields;
    /**
     * @ignore
     */
    private addFieldLength;
    /**
     * @ignore
     */
    private removeFieldLength;
    /**
     * @ignore
     */
    private saveStoredFields;
}
interface SerializedIndexEntry {
    [key: string]: number;
}

export { AsPlainObject, MatchInfo, Options, Query, QueryCombination, SearchOptions, SearchResult, Suggestion, MiniSearch as default };
