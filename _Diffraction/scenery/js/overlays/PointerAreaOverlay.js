// Copyright 2013-2020, University of Colorado Boulder

/**
 * Displays mouse and touch areas when they are customized. Expensive to display!
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Shape from '../../../kite/js/Shape.js';
import inherit from '../../../phet-core/js/inherit.js';
import scenery from '../scenery.js';
import Trail from '../util/Trail.js';
import ShapeBasedOverlay from './ShapeBasedOverlay.js';

function PointerAreaOverlay( display, rootNode ) {
  ShapeBasedOverlay.call( this, display, rootNode, 'mouseTouchAreaOverlay' );
}

scenery.register( 'PointerAreaOverlay', PointerAreaOverlay );

inherit( ShapeBasedOverlay, PointerAreaOverlay, {
  // @override
  addShapes: function() {
    const self = this;

    new Trail( this.rootNode ).eachTrailUnder( function( trail ) {
      const node = trail.lastNode();
      if ( !node.isVisible() ) {
        // skip this subtree if the node is invisible
        return true;
      }
      if ( ( node.mouseArea || node.touchArea ) && trail.isVisible() ) {
        const transform = trail.getTransform();

        if ( node.mouseArea ) {
          self.addShape( transform.transformShape( node.mouseArea.isBounds ? Shape.bounds( node.mouseArea ) : node.mouseArea ), 'rgba(0,0,255,0.8)', true );
        }
        if ( node.touchArea ) {
          self.addShape( transform.transformShape( node.touchArea.isBounds ? Shape.bounds( node.touchArea ) : node.touchArea ), 'rgba(255,0,0,0.8)', false );
        }
      }
    } );
  }
} );

export default PointerAreaOverlay;