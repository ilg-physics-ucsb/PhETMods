// Copyright 2013-2020, University of Colorado Boulder

/**
 * The Home button that appears in the navigation bar.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property from '../../axon/js/Property.js';
import Shape from '../../kite/js/Shape.js';
import inherit from '../../phet-core/js/inherit.js';
import merge from '../../phet-core/js/merge.js';
import FocusHighlightPath from '../../scenery/js/accessibility/FocusHighlightPath.js';
import Node from '../../scenery/js/nodes/Node.js';
import Rectangle from '../../scenery/js/nodes/Rectangle.js';
import ButtonInteractionState from '../../sun/js/buttons/ButtonInteractionState.js';
import FontAwesomeNode from '../../sun/js/FontAwesomeNode.js';
import joist from './joist.js';
import joistStrings from './joistStrings.js';
import JoistButton from './JoistButton.js';

// constants
const homeString = joistStrings.a11y.home;
const homeScreenString = joistStrings.a11y.homeScreen;
const homeScreenDescriptionString = joistStrings.a11y.homeScreenDescription;

/**
 * @param {number} navBarHeight
 * @param {Property.<string>} navigationBarFillProperty - the color of the navbar, as a string.
 * @param {Tandem} tandem
 * @param {Object} [options]
 * @constructor
 */
function HomeButton( navBarHeight, navigationBarFillProperty, tandem, options ) {

  options = merge( {
    highlightExtensionWidth: 4,
    listener: null,

    // pdom,
    tagName: 'button',
    innerContent: homeString,
    containerTagName: 'li',
    descriptionContent: homeScreenDescriptionString,
    appendDescription: true
  }, options );

  const homeIcon = new FontAwesomeNode( 'home' );
  // scale so that the icon is slightly taller than screen button icons, value determined empirically, see joist#127
  homeIcon.setScaleMagnitude( 0.48 * navBarHeight / homeIcon.height );

  // transparent background, size determined empirically so that highlight is the same size as highlight on screen buttons
  const background = new Rectangle( 0, 0, homeIcon.width + 12, navBarHeight );
  homeIcon.center = background.center;

  const content = new Node( { children: [ background, homeIcon ] } );

  JoistButton.call( this, content, navigationBarFillProperty, tandem, options );

  // pdom - Pass a shape to the focusHighlight to prevent dilation, then tweak the bottom up just a hair so it
  // isn't off the screen.
  const highlightLineWidth = FocusHighlightPath.getOuterLineWidthFromNode( this );
  this.focusHighlight = Shape.bounds( this.bounds.setMaxY( this.bounds.maxY - highlightLineWidth / 2 ) );

  // pdom - add the role description for the HomeButton
  this.setAccessibleAttribute( 'aria-roledescription', homeScreenString );

  Property.multilink( [ this.interactionStateProperty, navigationBarFillProperty ], function( interactionState, navigationBarFill ) {
    if ( navigationBarFill === 'black' ) {
      homeIcon.fill = interactionState === ButtonInteractionState.PRESSED ? 'gray' : 'white';
    }
    else {
      homeIcon.fill = interactionState === ButtonInteractionState.PRESSED ? '#444' : '#222';
    }
  } );
}

joist.register( 'HomeButton', HomeButton );

inherit( JoistButton, HomeButton );
export default HomeButton;