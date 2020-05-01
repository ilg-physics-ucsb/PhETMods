// Copyright 2016-2020, University of Colorado Boulder

/**
 * A trait for drawables for Paintable nodes that does not store the fill/stroke state, as it just needs to track
 * dirtyness overall.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import inheritance from '../../../../phet-core/js/inheritance.js';
import scenery from '../../scenery.js';
import Color from '../../util/Color.js';
import PaintObserver from '../PaintObserver.js';
import SelfDrawable from '../SelfDrawable.js';

const PaintableStatelessDrawable = {
  mixInto: function( drawableType ) {
    assert && assert( _.includes( inheritance( drawableType ), SelfDrawable ) );

    const proto = drawableType.prototype;

    proto.initializePaintableStateless = function( renderer, instance ) {
      this.fillCallback = this.fillCallback || this.markDirtyFill.bind( this );
      this.strokeCallback = this.strokeCallback || this.markDirtyStroke.bind( this );
      this.fillObserver = this.fillObserver || new PaintObserver( this.fillCallback );
      this.strokeObserver = this.strokeObserver || new PaintObserver( this.strokeCallback );

      this.fillObserver.setPrimary( instance.node._fill );
      this.strokeObserver.setPrimary( instance.node._stroke );

      return this;
    };

    proto.disposePaintableStateless = function() {
      this.fillObserver.clean();
      this.strokeObserver.clean();
    };

    proto.markDirtyFill = function() {
      assert && Color.checkPaint( this.instance.node._fill );

      this.markPaintDirty();
      this.fillObserver.setPrimary( this.instance.node._fill );
      // TODO: look into having the fillObserver be notified of Node changes as our source
    };

    proto.markDirtyStroke = function() {
      assert && Color.checkPaint( this.instance.node._stroke );

      this.markPaintDirty();
      this.strokeObserver.setPrimary( this.instance.node._stroke );
      // TODO: look into having the strokeObserver be notified of Node changes as our source
    };

    proto.markDirtyLineWidth = function() {
      this.markPaintDirty();
    };

    proto.markDirtyLineOptions = function() {
      this.markPaintDirty();
    };

    proto.markDirtyCachedPaints = function() {
      this.markPaintDirty();
    };
  }
};

scenery.register( 'PaintableStatelessDrawable', PaintableStatelessDrawable );

export default PaintableStatelessDrawable;