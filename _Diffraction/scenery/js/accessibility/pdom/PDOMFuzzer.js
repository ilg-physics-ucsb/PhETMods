// Copyright 2018-2020, University of Colorado Boulder

/**
 * Runs a11y-tree-related scenery operations randomly (with assertions) to try to find any bugs.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Permutation from '../../../../dot/js/Permutation.js';
import Random from '../../../../dot/js/Random.js';
import arrayDifference from '../../../../phet-core/js/arrayDifference.js';
import inherit from '../../../../phet-core/js/inherit.js';
import Display from '../../display/Display.js';
import Node from '../../nodes/Node.js';
import scenery from '../../scenery.js';
import PDOMTree from './PDOMTree.js';

/**
 * @constructor
 *
 * @param {number} nodeCount
 * @param {boolean} logToConsole
 * @param {number} [seed]
 */
function PDOMFuzzer( nodeCount, logToConsole, seed ) {
  assert && assert( nodeCount >= 2 );

  seed = seed || null;

  // @private {number}
  this.nodeCount = nodeCount;

  // @private {boolean}
  this.logToConsole = logToConsole;

  // @private {Array.<Node>}
  this.nodes = _.range( 0, nodeCount ).map( function() {
    return new Node();
  } );

  // @private {Display}
  this.display = new Display( this.nodes[ 0 ] );

  // @private {Random}
  this.random = new Random( { seed: seed } );

  // @private {Array.<Action>}
  this.actionsTaken = [];
}

scenery.register( 'PDOMFuzzer', PDOMFuzzer );

inherit( Object, PDOMFuzzer, {
  /**
   * Runs one action randomly (printing out the action and result).
   * @public
   */
  step: function() {
    const action = this.random.sample( this.enumerateActions() );
    this.logToConsole && console.log( action.text );
    this.actionsTaken.push( action );
    action.execute();
    this.display._rootAccessibleInstance.auditRoot();
    PDOMTree.auditAccessibleDisplays( this.display.rootNode );
    if ( this.logToConsole ) {
      for ( let i = 0; i < this.nodes.length; i++ ) {
        const node = this.nodes[ i ];
        console.log( i + '#' + node.id + ' ' + node.tagName + ' ch:' + PDOMTree.debugOrder( node.children ) + ' or:' + PDOMTree.debugOrder( node.accessibleOrder ) + ' vis:' + node.visible + ' avis:' + node.accessibleVisible );
      }
    }
  },

  /**
   * Find all of the possible actions that are legal.
   * @private
   *
   * @returns {Array.<Object>} - like { text: {string}, execute: {function} }
   */
  enumerateActions: function() {
    const self = this;
    const actions = [];

    this.nodes.forEach( function( a ) {
      actions.push( {
        text: '#' + a.id + '.visible = ' + !a.visible,
        execute: function() {
          a.visible = !a.visible;
        }
      } );
      actions.push( {
        text: '#' + a.id + '.accessibleVisible = ' + !a.accessibleVisible,
        execute: function() {
          a.accessibleVisible = !a.accessibleVisible;
        }
      } );
      [ 'span', 'div', null ].forEach( function( tagName ) {
        if ( a.tagName !== tagName ) {
          actions.push( {
            text: '#' + a.id + '.tagName = ' + tagName,
            execute: function() {
              a.tagName = tagName;
            }
          } );
        }
      } );

      self.powerSet( arrayDifference( self.nodes, [ a ] ).concat( [ null ] ) ).forEach( function( subset ) {
        Permutation.forEachPermutation( subset, function( order ) {
          // TODO: Make sure it's not the CURRENT order?
          if ( self.isAccessibleOrderChangeLegal( a, order ) ) {
            actions.push( {
              text: '#' + a.id + '.accessibleOrder = ' + PDOMTree.debugOrder( order ),
              execute: function() {
                a.accessibleOrder = order;
              }
            } );
          }
        } );
      } );

      self.nodes.forEach( function( b ) {
        if ( self.isAddChildLegal( a, b ) ) {
          _.range( 0, a.children.length + 1 ).forEach( function( i ) {
            actions.push( {
              text: '#' + a.id + '.insertChild(' + i + ',#' + b.id + ')',
              execute: function() {
                a.insertChild( i, b );
              }
            } );
          } );
        }
        if ( a.hasChild( b ) ) {
          actions.push( {
            text: '#' + a.id + '.removeChild(#' + b.id + ')',
            execute: function() {
              a.removeChild( b );
            }
          } );
        }
      } );
    } );

    return actions;
  },

  /**
   * Checks whether the child can be added (as a child) to the parent.
   * @private
   *
   * @param {Node} parent
   * @param {Node} child
   * @returns {boolean}
   */
  isAddChildLegal: function( parent, child ) {
    return !parent.hasChild( child ) && this.isAcyclic( parent, child );
  },

  /**
   * Returns the power set of a set (all subsets).
   * @private
   *
   * @param {Array.<*>} list
   * @returns {Array.<Array.<*>>}
   */
  powerSet: function( list ) {
    if ( list.length === 0 ) {
      return [ [] ];
    }
    else {
      const lists = this.powerSet( list.slice( 1 ) );
      return lists.concat( lists.map( function( subList ) {
        return [ list[ 0 ] ].concat( subList );
      } ) );
    }
  },

  /**
   * Returns whether an accessible order change is legal.
   * @private
   *
   * @param {Node} node
   * @param {Array.<Node|null>|null} order
   */
  isAccessibleOrderChangeLegal: function( node, order ) {
    const self = this;

    // remap for equivalence, so it's an array of nodes
    if ( order === null ) { order = []; }
    order = order.filter( function( n ) { return n !== null; } );

    if ( _.includes( order, node ) ||
         _.uniq( order ).length < order.length ) {
      return false;
    }

    // Can't include nodes that are included in other accessible orders
    for ( let i = 0; i < order.length; i++ ) {
      if ( order[ i ]._accessibleParent && order[ i ]._accessibleParent !== node ) {
        return false;
      }
    }

    const hasConnection = function( a, b ) {
      if ( a === node ) {
        return a.hasChild( b ) || _.includes( order, b );
      }
      else {
        return a.hasChild( b ) || ( !!a.accessibleOrder && _.includes( a.accessibleOrder, b ) );
      }
    };

    const effectiveChildren = node.children.concat( order );
    return _.every( effectiveChildren, function( child ) {
      return self.isAcyclic( node, child, hasConnection );
    } );
  },

  /**
   * Checks whether a connection (parent-child or accessible order) is legal (doesn't cause a cycle).
   * @private
   *
   * @param {Node} parent
   * @param {Node} child
   * @param {function} hasConnection - determines whether there is a parent-child-style relationship between params
   * @returns {boolean}
   */
  isAcyclic: function( parent, child, hasConnection ) {
    if ( parent === child ) {
      return false;
    }

    const nodes = child.children.concat( child.accessibleOrder ).filter( function( n ) {
      return n !== null;
    } ); // super defensive

    while ( nodes.length ) {
      var node = nodes.pop();
      if ( node === parent ) {
        return false;
      }

      if ( hasConnection ) {
        this.nodes.forEach( function( potentialChild ) {
          if ( hasConnection( node, potentialChild ) ) {
            nodes.push( potentialChild );
          }
        } );
      }
      else {
        // Add in children and accessible children (don't worry about duplicates since perf isn't critical)
        Array.prototype.push.apply( nodes, node.children );
        if ( node.accessibleOrder ) {
          Array.prototype.push.apply( nodes, node.accessibleOrder.filter( function( n ) { return n !== null; } ) );
        }
      }
    }

    return true;
  }
} );

export default PDOMFuzzer;