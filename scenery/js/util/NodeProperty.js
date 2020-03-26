// Copyright 2018-2020, University of Colorado Boulder

/**
 * An axon Property for a Node.  When the specified trigger event (like 'pickability') occurs, the Property value
 * changes according to the getter (like 'pickable'), which may have any type.  This relies on guards in both Property
 * and Node to prevent cycles--if we detect an infinite loop for a case, we will need to add an epsilon tolerance
 * in the corresponding Node setter to short circuit the lop.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Property from '../../../axon/js/Property.js';
import merge from '../../../phet-core/js/merge.js';
import scenery from '../scenery.js';

class NodeProperty extends Property {

  /**
   * @param {Node} node
   * @param {string} trigger - the Node trigger that will cause this NodeProperty to update, such as 'bounds', or 'opacity'
   *                         - TODO: 'bounds' support doesn't work right now because the Node bounds instance mutates
   *                         - and hence notifications are not sent, see https://github.com/phetsims/scenery/issues/1028
   * @param {string} attribute - for example 'left' or 'centerBottom' or 'visible' or 'pickable'
   * @param {Object} [options]
   */
  constructor( node, trigger, attribute, options ) {
    assert && assert( typeof attribute === 'string', 'wrong type for getLocation' );

    options = merge( {

      // If changing the property shouldn't propagate back to the Node
      readOnly: false
    }, options );

    // Read-only Property that describes a part relative to the bounds of the node.
    super( node[ attribute ], options );

    // @private {Node}
    this.node = node;

    // @private {string} - for disposal
    this.trigger = trigger;

    // @private {string}
    this.attribute = attribute;

    // @private
    this.nodePropertyReadOnly = options.readOnly;

    // @private {function} - When the node event is triggered, get the new value and set it to this Property
    this.changeListener = () => this.set( node[ attribute ] );

    // onStatic (as opposed to 'on') avoids array allocation, but means the listener cannot cause disposal of this node.
    node.onStatic( trigger, this.changeListener );
  }

  /**
   * Unlinks listeners when disposed.  Must be called before the corresponding Node is disposed.
   * @public
   */
  dispose() {
    assert && assert( !this.node.isDisposed, 'NodeProperty should be disposed before corresponding Node is disposed' );
    this.node.offStatic( this.trigger, this.changeListener );
    super.dispose();
    this.node = null;
  }

  /**
   * Updates the value of this node, overridden to update the Node value
   * @override
   * @param {*} value - the new value this Property will take, which is different than the previous value.
   * @protected - can be overridden.
   */
  setPropertyValue( value ) {
    if ( !this.nodePropertyReadOnly ) {

      // Set the node value first, as if it was the first link listener.
      this.node[ this.attribute ] = value;
    }
    super.setPropertyValue( value );
  }
}

scenery.register( 'NodeProperty', NodeProperty );
export default NodeProperty;