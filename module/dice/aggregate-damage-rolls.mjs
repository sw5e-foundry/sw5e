/**
 * Parse the provided rolls, splitting parts based on damage types & properties, taking flavor into account.
 * @param {DamageRoll[]} rolls                   Evaluated damage rolls to aggregate.
 * @param {object} [options={}]
 * @param {boolean} [options.respectProperties]  Should damage properties also affect grouping?
 * @returns {DamageRoll[]}
 */
export default function aggregateDamageRolls( rolls, { respectProperties }={} ) {
  const makeHash = ( type, properties=[] ) => [type, ...( respectProperties ? Array.from( properties ).sort() : [] )].join();

  // Split rolls into new sets of terms based on damage type & properties
  const types = new Map();
  for ( const roll of rolls ) {
    if ( !roll._evaluated ) throw new Error( "Only evaluated rolls can be aggregated." );
    for ( const chunk of chunkTerms( roll.terms, roll.options.type ) ) {
      const key = makeHash( chunk.type, roll.options.properties );
      if ( !types.has( key ) ) types.set( key, { type: chunk.type, properties: new Set(), terms: [] } );
      const data = types.get( key );
      data.terms.push( new OperatorTerm( { operator: chunk.negative ? "-" : "+" } ), ...chunk.terms );
      if ( roll.options.properties ) data.properties = data.properties.union( new Set( roll.options.properties ) );
    }
  }

  // Create new damage rolls based on the aggregated terms
  const newRolls = [];
  for ( const type of types.values() ) {
    const roll = new CONFIG.Dice.DamageRoll();
    roll.terms = type.terms;
    roll._total = roll._evaluateTotal();
    roll._evaluated = true;
    roll.options = { type: type.type, properties: Array.from( type.properties ) };
    roll.resetFormula();
    newRolls.push( roll );
  }

  return newRolls;
}

/* -------------------------------------------- */

/**
 * Split terms into groups based on operators. Addition & subtraction will split groups while multiplication and
 * division will keep groups together. These groups also contain information on contained types written in flavor
 * and whether they are negative.
 * @param {RollTerm[]} terms  Terms to chunk.
 * @param {string} type       Type specified in the roll as a whole.
 * @returns {{ terms: RollTerm[], negative: boolean, type: string }[]}
 */
function chunkTerms( terms, type ) {
  const pushChunk = () => {
    currentChunk.type ??= type;
    chunks.push( currentChunk );
    currentChunk = null;
    negative = false;
  };
  const isValidType = t => ( ( t in CONFIG.SW5E.damageTypes ) || ( t in CONFIG.SW5E.healingTypes ) );
  const chunks = [];
  let currentChunk;
  let negative = false;

  for ( let term of terms ) {
    // Plus or minus operators split chunks
    if ( ( term instanceof OperatorTerm ) && ["+", "-"].includes( term.operator ) ) {
      if ( currentChunk ) pushChunk();
      if ( term.operator === "-" ) negative = !negative;
      continue;
    }

    // All other terms get added to the current chunk
    term = RollTerm.fromData( foundry.utils.deepClone( term.toJSON() ) );
    currentChunk ??= { terms: [], negative, type: null };
    currentChunk.terms.push( term );
    const flavor = term.flavor?.toLowerCase().trim();
    if ( isValidType( flavor ) ) {
      currentChunk.type ??= flavor;
      term.options.flavor = "";
    }
  }

  if ( currentChunk ) pushChunk();
  return chunks;
}
