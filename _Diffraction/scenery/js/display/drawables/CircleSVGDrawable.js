// Copyright 2016-2020, University of Colorado Boulder

/**
 * SVG drawable for Circle nodes.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Poolable from '../../../../phet-core/js/Poolable.js';
import inherit from '../../../../phet-core/js/inherit.js';
import scenery from '../../scenery.js';
import svgns from '../../util/svgns.js';
import SVGSelfDrawable from '../SVGSelfDrawable.js';
import CircleStatefulDrawable from './CircleStatefulDrawable.js';

// TODO: change this based on memory and performance characteristics of the platform
const keepSVGCircleElements = true; // whether we should pool SVG elements for the SVG rendering states, or whether we should free them when possible for memory

/**
 * A generated SVGSelfDrawable whose purpose will be drawing our Circle. One of these drawables will be created
 * for each displayed instance of a Circle.
 * @public (scenery-internal)
 * @constructor
 * @extends SVGSelfDrawable
 * @mixes CircleStatefulDrawable
 * @mixes Paintable.PaintableStatefulDrawable
 * @mixes SelfDrawable.Poolable
 *
 * @param {number} renderer - Renderer bitmask, see Renderer's documentation for more details.
 * @param {Instance} instance
 */
function CircleSVGDrawable( renderer, instance ) {
  // Super-type initialization
  this.initializeSVGSelfDrawable( renderer, instance, true, keepSVGCircleElements ); // usesPaint: true

  // @protected {SVGCircleElement} - Sole SVG element for this drawable, implementing API for SVGSelfDrawable
  this.svgElement = this.svgElement || document.createElementNS( svgns, 'circle' );
}

scenery.register( 'CircleSVGDrawable', CircleSVGDrawable );

inherit( SVGSelfDrawable, CircleSVGDrawable, {
  /**
   * Updates the SVG elements so that they will appear like the current node's representation.
   * @protected
   *
   * Implements the interface for SVGSelfDrawable (and is called from the SVGSelfDrawable's update).
   */
  updateSVGSelf: function() {
    const circle = this.svgElement;

    if ( this.dirtyRadius ) {
      circle.setAttribute( 'r', this.node._radius );
    }

    // Apply any fill/stroke changes to our element.
    this.updateFillStrokeStyle( circle );
  }
} );

// Include Circle's stateful trait (used for dirty flags)
CircleStatefulDrawable.mixInto( CircleSVGDrawable );

Poolable.mixInto( CircleSVGDrawable );

export default CircleSVGDrawable;