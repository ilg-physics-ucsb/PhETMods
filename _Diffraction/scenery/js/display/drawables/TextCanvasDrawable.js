// Copyright 2016-2020, University of Colorado Boulder

/**
 * Canvas drawable for Text nodes.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import inherit from '../../../../phet-core/js/inherit.js';
import Poolable from '../../../../phet-core/js/Poolable.js';
import scenery from '../../scenery.js';
import CanvasSelfDrawable from '../CanvasSelfDrawable.js';
import PaintableStatelessDrawable from './PaintableStatelessDrawable.js';

/**
 * A generated CanvasSelfDrawable whose purpose will be drawing our Text. One of these drawables will be created
 * for each displayed instance of a Text node.
 * @constructor
 *
 * @param {number} renderer - Renderer bitmask, see Renderer's documentation for more details.
 * @param {Instance} instance
 */
function TextCanvasDrawable( renderer, instance ) {
  this.initializeCanvasSelfDrawable( renderer, instance );
  this.initializePaintableStateless( renderer, instance );
}

scenery.register( 'TextCanvasDrawable', TextCanvasDrawable );

inherit( CanvasSelfDrawable, TextCanvasDrawable, {
  /**
   * Paints this drawable to a Canvas (the wrapper contains both a Canvas reference and its drawing context).
   * @public
   *
   * Assumes that the Canvas's context is already in the proper local coordinate frame for the node, and that any
   * other required effects (opacity, clipping, etc.) have already been prepared.
   *
   * This is part of the CanvasSelfDrawable API required to be implemented for subtypes.
   *
   * @param {CanvasContextWrapper} wrapper - Contains the Canvas and its drawing context
   * @param {Node} node - Our node that is being drawn
   * @param {Matrix3} matrix - The transformation matrix applied for this node's coordinate system.
   */
  paintCanvas: function( wrapper, node, matrix ) {
    const context = wrapper.context;

    // extra parameters we need to set, but should avoid setting if we aren't drawing anything
    if ( node.hasFill() || node.hasPaintableStroke() ) {
      wrapper.setFont( node._font.getFont() );
      wrapper.setDirection( 'ltr' );
    }

    if ( node.hasFill() ) {
      node.beforeCanvasFill( wrapper ); // defined in Paintable
      context.fillText( node.renderedText, 0, 0 );
      node.afterCanvasFill( wrapper ); // defined in Paintable
    }
    if ( node.hasPaintableStroke() ) {
      node.beforeCanvasStroke( wrapper ); // defined in Paintable
      context.strokeText( node.renderedText, 0, 0 );
      node.afterCanvasStroke( wrapper ); // defined in Paintable
    }
  },

  // stateless dirty functions
  markDirtyText: function() { this.markPaintDirty(); },
  markDirtyFont: function() { this.markPaintDirty(); },
  markDirtyBounds: function() { this.markPaintDirty(); },

  /**
   * Disposes the drawable.
   * @public
   * @override
   */
  dispose: function() {
    CanvasSelfDrawable.prototype.dispose.call( this );
    this.disposePaintableStateless();
  }
} );

PaintableStatelessDrawable.mixInto( TextCanvasDrawable );

Poolable.mixInto( TextCanvasDrawable );

export default TextCanvasDrawable;