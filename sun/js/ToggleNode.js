// Copyright 2013-2020, University of Colorado Boulder

/**
 * Display one of N nodes based on a given Property.  Maintains the bounds of the union of children for layout.
 * Supports null and undefined as possible values.  Will not work correctly if the children are changed externally
 * after instantiation (manages its own children and their visibility).
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import inherit from '../../phet-core/js/inherit.js';
import merge from '../../phet-core/js/merge.js';
import Node from '../../scenery/js/nodes/Node.js';
import Tandem from '../../tandem/js/Tandem.js';
import sun from './sun.js';

/**
 * @param {Property.<Object>} valueProperty
 * @param {Object[]} elements - each element has {value:{*}, node:{Node}}
 * @param {Object} [options]
 * @constructor
 */
function ToggleNode( valueProperty, elements, options ) {

  assert && assert( Array.isArray( elements ), 'elements should be an array' );
  if ( assert ) {
    elements.forEach( function( element ) {
      const keys = _.keys( element );
      assert( keys.length === 2, 'each element should have two keys' );
      assert( keys[ 0 ] === 'value' || keys[ 1 ] === 'value', 'element should have a value key' );
      assert( element.node instanceof Node, 'element.node should be a node' );
    } );
  }

  options = merge( {

    // {function} determines the relative layout of element Nodes. See below for pre-defined layout.
    alignChildren: ToggleNode.CENTER,
    tandem: Tandem.OPTIONAL
  }, options );

  const valueListener = function( value ) {
    let matchCount = 0;
    for ( let i = 0; i < elements.length; i++ ) {
      const element = elements[ i ];
      const visible = element.value === value;
      element.node.visible = visible;
      if ( visible ) {
        matchCount++;
      }
    }
    assert && assert( matchCount === 1, 'Wrong number of matches: ' + matchCount );
  };
  valueProperty.link( valueListener );

  options.children = _.map( elements, 'node' );
  options.alignChildren( options.children );
  Node.call( this, options );

  // this.addLinkedElement( valueProperty, {
  //   tandem: options.tandem.createTandem( 'valueProperty' )
  // } );

  // @private
  this.disposeToggleNode = function() {
    valueProperty.unlink( valueListener );
  };
}

sun.register( 'ToggleNode', ToggleNode );

export default inherit( Node, ToggleNode, {

  /**
   * Make eligible for garbage collection.
   * @public
   */
  dispose: function() {
    this.disposeToggleNode();
    Node.prototype.dispose.call( this );
  }
}, {

  /**
   * Center the latter nodes on the x,y center of the first node.
   * @param {Node[]} children
   * @public
   * @static
   */
  CENTER: function( children ) {
    for ( let i = 1; i < children.length; i++ ) {
      children[ i ].center = children[ 0 ].center;
    }
  },

  /**
   * Center the latter nodes on the x center of the first node.
   * @param {Node[]} children
   * @public
   * @static
   */
  CENTER_X: function( children ) {
    for ( let i = 1; i < children.length; i++ ) {
      children[ i ].centerX = children[ 0 ].centerX;
    }
  },

  /**
   * Center the latter nodes on the y center of the first node.
   * @param {Node[]} children
   * @public
   * @static
   */
  CENTER_Y: function( children ) {
    for ( let i = 1; i < children.length; i++ ) {
      children[ i ].centerY = children[ 0 ].centerY;
    }
  },

  /**
   * Left align nodes on the left of the first node.
   * @param {Node[]} children
   * @public
   * @static
   */
  LEFT: function( children ) {
    for ( let i = 1; i < children.length; i++ ) {
      children[ i ].left = children[ 0 ].left;
    }
  },

  /**
   * Align nodes on the bottom of the first node.
   * @param {Node[]} children
   * @public
   * @static
   */
  BOTTOM: function( children ) {
    for ( let i = 1; i < children.length; i++ ) {
      children[ i ].bottom = children[ 0 ].bottom;
    }
  },

  /**
   * Align nodes on the bottom of the first node.
   * @param {Node[]} children
   * @public
   * @static
   */
  CENTER_BOTTOM: function( children ) {
    for ( let i = 1; i < children.length; i++ ) {
      children[ i ].centerBottom = children[ 0 ].centerBottom;
    }
  },

  /**
   * Right align nodes on the right of the first node.
   * @param {Node[]} children
   * @public
   * @static
   */
  RIGHT: function( children ) {
    for ( let i = 1; i < children.length; i++ ) {
      children[ i ].right = children[ 0 ].right;
    }
  },

  /**
   * No alignment is performed
   * @param {Node[]} children
   * @public
   * @static
   */
  NONE: function( children ) {
  }
} );