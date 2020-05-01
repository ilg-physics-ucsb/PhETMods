// Copyright 2016-2020, University of Colorado Boulder

/**
 * A trait for drawables for Line that does not store the line's state, as it just needs to track dirtyness overall.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import inheritance from '../../../../phet-core/js/inheritance.js';
import scenery from '../../scenery.js';
import SelfDrawable from '../SelfDrawable.js';
import PaintableStatelessDrawable from './PaintableStatelessDrawable.js';

const LineStatelessDrawable = {
  mixInto: function( drawableType ) {
    assert && assert( _.includes( inheritance( drawableType ), SelfDrawable ) );

    const proto = drawableType.prototype;

    // initializes, and resets (so we can support pooled states)
    proto.initializeLineStateless = function() {
      // @protected {boolean} - Flag marked as true if ANY of the drawable dirty flags are set (basically everything except for transforms, as we
      //                        need to accelerate the transform case.
      this.paintDirty = true;
      return this; // allow for chaining
    };

    /**
     * A "catch-all" dirty method that directly marks the paintDirty flag and triggers propagation of dirty
     * information. This can be used by other mark* methods, or directly itself if the paintDirty flag is checked.
     * @public (scenery-internal)
     *
     * It should be fired (indirectly or directly) for anything besides transforms that needs to make a drawable
     * dirty.
     */
    proto.markPaintDirty = function() {
      this.paintDirty = true;
      this.markDirty();
    };

    proto.markDirtyLine = function() {
      this.markPaintDirty();
    };

    proto.markDirtyP1 = function() {
      this.markPaintDirty();
    };

    proto.markDirtyP2 = function() {
      this.markPaintDirty();
    };

    proto.markDirtyX1 = function() {
      this.markPaintDirty();
    };

    proto.markDirtyY1 = function() {
      this.markPaintDirty();
    };

    proto.markDirtyX2 = function() {
      this.markPaintDirty();
    };

    proto.markDirtyY2 = function() {
      this.markPaintDirty();
    };

    // TODO: egad! mixing in the wrong drawable???
    PaintableStatelessDrawable.mixInto( drawableType );
  }
};

scenery.register( 'LineStatelessDrawable', LineStatelessDrawable );

export default LineStatelessDrawable;