// Copyright 2013-2020, University of Colorado Boulder

/**
 * Tracks a stylus ('pen') or something with tilt and pressure information
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import inherit from '../../../phet-core/js/inherit.js';
import scenery from '../scenery.js';
import Pointer from './Pointer.js'; // extends Pointer

/**
 * @extends Pointer
 *
 * @param {number} id
 * @param {Vector2} point
 * @param {Event} event
 * @constructor
 */
function Pen( id, point, event ) {
  Pointer.call( this, point, true, 'pen' ); // true: pen pointers always start in the down state

  // @public {number} - For tracking which pen is which
  this.id = id;

  sceneryLog && sceneryLog.Pointer && sceneryLog.Pointer( 'Created ' + this.toString() );
}

scenery.register( 'Pen', Pen );

inherit( Pointer, Pen, {

  /**
   * Sets information in this Pen for a given move.
   * @public (scenery-internal)
   *
   * @param {Vector2} point
   * @param {Event} event
   * @returns {boolean} - Whether the point changed
   */
  move: function( point, event ) {
    const pointChanged = this.hasPointChanged( point );

    this.point = point;
    return pointChanged;
  },

  /**
   * Sets information in this Pen for a given end.
   * @public (scenery-internal)
   *
   * @param {Vector2} point
   * @param {Event} event
   * @returns {boolean} - Whether the point changed
   */
  end: function( point, event ) {
    const pointChanged = this.hasPointChanged( point );

    this.point = point;
    this.isDown = false;
    return pointChanged;
  },

  /**
   * Sets information in this Pen for a given cancel.
   * @public (scenery-internal)
   *
   * @param {Vector2} point
   * @param {Event} event
   * @returns {boolean} - Whether the point changed
   */
  cancel: function( point, event ) {
    const pointChanged = this.hasPointChanged( point );

    this.point = point;
    this.isDown = false;
    return pointChanged;
  },

  /**
   * Returns an improved string representation of this object.
   * @public
   * @override
   *
   * @returns {string}
   */
  toString: function() {
    return 'Pen#' + this.id;
  }
} );

export default Pen;