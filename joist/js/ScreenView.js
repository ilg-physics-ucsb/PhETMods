// Copyright 2013-2020, University of Colorado Boulder

/**
 * The view portion of a Screen, specifies the layout strategy for the visual view.
 *
 * For the PDOM view, this type creates  the three organizing elements associated with each screen:
 * - The `ScreenSummaryNode` is introductory description that outlines the screen and sets the scene for the user.
 * - The `PlayAreaNode` holds content that is considered the main interaction and pedagogy to be learned from the screen.
 * - The `ControlAreaNode` houses controls and other content that is secondary to the main interaction. Ideally the user
 *       would encounter this after exploring the PlayAreaNode.
 * The screenSummaryNode instance is not available on the ScreenView, instead content can be added to it via a constructor
 * option or `ScreenView.setScreenSummaryContent`. This is because some accessible descriptions in the screen summary
 * are the same throughout all simulations. The playAreaNode and controlAreaNode instances are public, read-only Nodes
 * that are meant to have their accessibleOrder and children set to achieve the proper PDOM structure. Do not set
 * `accessibleOrder` directly on the ScreenView, as ScreenView set's its own accessibleOrder
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property from '../../axon/js/Property.js';
import Bounds2 from '../../dot/js/Bounds2.js';
import inherit from '../../phet-core/js/inherit.js';
import merge from '../../phet-core/js/merge.js';
import ControlAreaNode from '../../scenery-phet/js/accessibility/nodes/ControlAreaNode.js';
import PlayAreaNode from '../../scenery-phet/js/accessibility/nodes/PlayAreaNode.js';
import ScreenSummaryNode from '../../scenery-phet/js/accessibility/nodes/ScreenSummaryNode.js';
import Node from '../../scenery/js/nodes/Node.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import joist from './joist.js';

/*
 * Default width and height for iPad2, iPad3, iPad4 running Safari with default tabs and decorations
 * These bounds were added in Sep 2014 and are based on a screenshot from a non-Retina iPad, in Safari, iOS7.
 * It therefore accounts for the nav bar on the bottom and the space consumed by the browser on the top.
 * As of this writing, this is the resolution being used by PhET's sim designers for their mockups.
 * For more information see https://github.com/phetsims/joist/issues/126
 */
const DEFAULT_LAYOUT_BOUNDS = new Bounds2( 0, 0, 1024, 618 );

function ScreenView( options ) {

  options = merge( {

    // {Bounds2} the bounds that are safe to draw in on all supported platforms
    layoutBounds: DEFAULT_LAYOUT_BOUNDS.copy(),

    // Node options
    layerSplit: true, // so we're not in the same layer as the navbar, etc.
    excludeInvisible: true, // so we don't keep invisible screens in the SVG tree

    // phet-io options
    tandem: Tandem.OPTIONAL,

    // a11y options
    containerTagName: 'article',
    tagName: 'div',
    labelTagName: 'h1',

    // {Node|null} the Node with screen summary content to be added to the ScreenSummaryNode, and into PDOM above
    // the Play Area. This Node is added as a child to the ScreenSummaryNode.
    screenSummaryContent: null,

    // {boolean} whether or not to add the screen summay, play area, and control area Nodes to the PDOM
    includePDOMNodes: true
  }, options );

  // @public (read-only) {Bounds2} - the bounds the confine the layout of the view.
  assert && assert( options.layoutBounds instanceof Bounds2, 'invalid layoutBounds' );
  this.layoutBounds = options.layoutBounds;

  PhetioObject.mergePhetioComponentOptions( { visibleProperty: { phetioState: false } }, options );

  Node.call( this, options );

  // The visible bounds of the ScreenView in ScreenView coordinates.  This includes top/bottom or left/right margins
  // depending on the aspect ratio of the screen.
  // Initialize to defaults, then update as soon as layout() is called, which is before the ScreenView is displayed
  // @public (read-only)
  this.visibleBoundsProperty = new Property( options.layoutBounds );

  // @public (read-only) - add children and set accessible order to these to organize and structure the PDOM.
  this.pdomPlayAreaNode = new PlayAreaNode();
  this.pdomControlAreaNode = new ControlAreaNode();

  // @private
  // a11y - this Node is suffixed "container" because it is added to with sim specific screen summary content, often
  // called {Sim}ScreenSummaryNode. This container has the intro "{sim} is an interactive sim, it changes as you . . ."
  this.pdomScreenSummaryNode = new ScreenSummaryNode();

  // @private {Node|null} - keep track of the content added to the summary Node, so that if it is set more than once,
  // the previous one can be removed.
  this.screenSummaryContent = null;

  // at the Node from options in the same way that can be done at any time
  options.screenSummaryContent && this.setScreenSummaryContent( options.screenSummaryContent );

  // @private
  this.pdomParent = new Node( {
    children: options.includePDOMNodes ? [
      this.pdomScreenSummaryNode,
      this.pdomPlayAreaNode,
      this.pdomControlAreaNode
    ] : []
  } );
  this.addChild( this.pdomParent );
}

joist.register( 'ScreenView', ScreenView );

export default inherit( Node, ScreenView, {

    /**
     * Override to make sure that setting children doesn't blow away Nodes set by ScreenView.
     * @override
     * @param {Node[]} children
     */
    setChildren( children ) {
      Node.prototype.setChildren.call( this, children );
      if ( !this.hasChild( this.pdomParent ) ) {
        this.addChild( this.pdomParent );
        this.pdomParent.moveToBack();
      }
    },

    /**
     * Get the scale to use for laying out the sim components and the navigation bar, so its size will track
     * with the sim size
     * @param {number} width
     * @param {number} height
     * @returns {number}
     * @public (joist-internal)
     */
    getLayoutScale: function( width, height ) {
      return Math.min( width / this.layoutBounds.width, height / this.layoutBounds.height );
    },

    /**
     * Default layout function uses the layoutWidth and layoutHeight to scale the content (based on whichever is more limiting: width or height)
     * and centers the content in the screen vertically and horizontally
     * This function can be replaced by subclasses that wish to perform their own custom layout.
     * @param {number} width
     * @param {number} height
     * @public (joist-internal)
     */
    layout: function( width, height ) {
      this.resetTransform();

      const scale = this.getLayoutScale( width, height );
      this.setScaleMagnitude( scale );

      let dx = 0;
      let dy = 0;

      //center vertically
      if ( scale === width / this.layoutBounds.width ) {
        dy = ( height / scale - this.layoutBounds.height ) / 2;
      }

      //center horizontally
      else if ( scale === height / this.layoutBounds.height ) {
        dx = ( width / scale - this.layoutBounds.width ) / 2;
      }

      this.translate( dx, dy );

      this.visibleBoundsProperty.set( new Bounds2( -dx, -dy, width / scale - dx, height / scale - dy ) );
    },

    /**
     * Make screen view eligible for garbage collection.
     * @public
     */
    dispose: function() {
      Node.prototype.dispose.call( this );
      this.disposeScreenView();
    },

    /**
     * Set the screen summary Node for the PDOM of this Screen View. Prefer passing in a screen summary Node via
     * constructor options, but this method can be used directly when necessary.
     * @param {Node} node
     * @public
     */
    setScreenSummaryContent: function( node ) {
      assert && assert( node instanceof Node );
      assert && assert( node !== this.screenSummaryContent, 'this is already the screen summary Node content' );

      this.screenSummaryContent && this.pdomScreenSummaryNode.removeChild( this.screenSummaryContent );

      this.screenSummaryContent = node;
      this.pdomScreenSummaryNode.addChild( node );
    },

    /**
     * Set the screen summary Node intro string
     * @param {string} simName
     * @param {number} numberOfScreens
     * @public (joist-internal)
     */
    setScreenSummaryIntroString: function( simName, numberOfScreens ) {
      this.pdomScreenSummaryNode.setIntroString( simName, numberOfScreens );
    },

    set accessibleOrder( order ) { throw new Error( 'should not need to set accessible order on the screen view' ); }
  },

  //statics
  {
    // @public
    DEFAULT_LAYOUT_BOUNDS: DEFAULT_LAYOUT_BOUNDS
  }
);