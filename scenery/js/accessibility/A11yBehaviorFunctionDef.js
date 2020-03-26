// Copyright 2018-2020, University of Colorado Boulder

/**
 * "definition" type for generalized type of accessibility option. A "behavior function" takes in options, and mutates
 * them to achieve the correct accessible behavior for that node in the PDOM.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import scenery from '../scenery.js';

/**
 * @name a11yBehaviorFunction
 * A function that will mutate given options object to achieve the correct a11y structure in the PDOM.
 * @function
 * @param {Node} node - the node that the a11y behavior is being applied to
 * @param {Object} [options] - options to mutate within the function
 * @param {string} value - the value that you are setting the behavior of, like the accessibleName
 * @returns {Object} - the options that have been mutated by the behavior function.
 */
const A11yBehaviorFunctionDef = {

  /**
   * Will assert out if the behavior function doesn't match the expected features of A11yBehaviorFunction
   * @param {function} behaviorFunction
   */
  validateA11yBehaviorFunctionDef: function( behaviorFunction ) {
    assert && assert( typeof behaviorFunction === 'function' );
    assert && assert( behaviorFunction.length === 3, 'behavior function should take three args' );
    assert && assert( typeof behaviorFunction( new scenery.Node(), {}, '' ) === 'object',
      'behavior function should return an object' );
  }
};

scenery.register( 'A11yBehaviorFunctionDef', A11yBehaviorFunctionDef );

export default A11yBehaviorFunctionDef;