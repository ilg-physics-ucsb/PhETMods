// Copyright 2013-2020, University of Colorado Boulder

/**
 * Button for a single screen in the navigation bar, shows the text and the navigation bar icon.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Malley (PixelZoom, Inc.)
 */

import DerivedProperty from '../../axon/js/DerivedProperty.js';
import Property from '../../axon/js/Property.js';
import Utils from '../../dot/js/Utils.js';
import Shape from '../../kite/js/Shape.js';
import inherit from '../../phet-core/js/inherit.js';
import merge from '../../phet-core/js/merge.js';
import StringUtils from '../../phetcommon/js/util/StringUtils.js';
import PhetColorScheme from '../../scenery-phet/js/PhetColorScheme.js';
import PhetFont from '../../scenery-phet/js/PhetFont.js';
import FocusHighlightPath from '../../scenery/js/accessibility/FocusHighlightPath.js';
import Node from '../../scenery/js/nodes/Node.js';
import Rectangle from '../../scenery/js/nodes/Rectangle.js';
import Text from '../../scenery/js/nodes/Text.js';
import VBox from '../../scenery/js/nodes/VBox.js';
import PushButtonModel from '../../sun/js/buttons/PushButtonModel.js';
import Tandem from '../../tandem/js/Tandem.js';
import HighlightNode from './HighlightNode.js';
import joist from './joist.js';
import joistStrings from './joist-strings.js';

// constants
const HIGHLIGHT_SPACING = 4;

// a11y strings
const simScreenString = joistStrings.a11y.simScreen;
const screenNameStringPatternString = joistStrings.a11y.screenNumberPattern;

/**
 * Create a nav bar.  Layout assumes all of the screen widths are the same.
 * @param {Property.<string>} navigationBarFillProperty - the color of the navbar, as a string.
 * @param {Property<Screen>} screenProperty
 * @param {Screen} screen
 * @param {number} simScreenIndex - the index (within sim screens only) of the screen corresponding to this button
 * @param {number} navBarHeight
 * @param {Object} [options]
 * @constructor
 */
function NavigationBarScreenButton( navigationBarFillProperty, screenProperty, screen, simScreenIndex, navBarHeight, options ) {

  assert && assert( screen.name, 'name is required for screen ' + simScreenIndex );
  assert && assert( screen.navigationBarIcon, 'navigationBarIcon is required for screen ' + screen.name );

  function clicked() {
    screenProperty.value = screen;
  }

  options = merge( {
    cursor: 'pointer',
    tandem: Tandem.REQUIRED,
    phetioDocumentation: 'Button in the navigation bar that selects the \'' + screen.tandem.name + '\' screen',
    maxButtonWidth: null, // {number|null} the maximum width of the button, causes text and/or icon to be scaled down if necessary

    // a11y
    tagName: 'button',
    containerTagName: 'li',
    descriptionContent: screen.descriptionContent,
    appendDescription: true,
    innerContent: StringUtils.fillIn( screenNameStringPatternString, {
      number: simScreenIndex + 1 // convert from index to display number
    } )
  }, options );

  Node.call( this );

  // icon
  const icon = new Node( {
    children: [ screen.navigationBarIcon ], // wrap in case this icon is used in multiple place (eg, home screen and navbar)
    maxHeight: 0.625 * navBarHeight,
    tandem: options.tandem.createTandem( 'icon' )
  } );

  // frame around the icon
  const iconFrame = new Rectangle( 0, 0, icon.width, icon.height );

  const iconParent = new Node( {
    children: [ icon, iconFrame ]
  } );

  // Is this button's screen selected?
  const selectedProperty = new DerivedProperty( [ screenProperty ], currentScreen => {
    return currentScreen === screen;
  } );

  // @public (phet-io) - create the button model, needs to be public so that PhET-iO wrappers can hook up to it if needed
  // Note it shares a tandem with this, so the emitter will be instrumented as a child of the button
  // Note that this buttonModel will always be phetioReadOnly false despite the parent value
  this.buttonModel = new PushButtonModel( {
    listener: clicked,
    tandem: options.tandem,

    // Navigation bar screen buttons by default do not have a featured enabledProperty.
    enabledPropertyOptions: { phetioFeatured: false }
  } );

  // Hook up the input listener
  const pressListener = this.buttonModel.createListener( {
    tandem: options.tandem.createTandem( 'pressListener' ),
    phetioDocumentation: 'Indicates when the screen button has been pressed or released'
  } );

  this.addInputListener( pressListener );

  const text = new Text( screen.name, {
    font: new PhetFont( 10 ),
    tandem: options.tandem.createTandem( 'text' )
  } );

  const box = new VBox( {
    children: [ iconParent, text ],
    pickable: false,
    spacing: Math.max( 0, 12 - text.height ), // see https://github.com/phetsims/joist/issues/143
    usesOpacity: true, // hint, since we change its opacity
    maxHeight: navBarHeight
  } );

  // add a transparent overlay for input handling and to size touchArea/mouseArea
  const overlay = new Rectangle( 0, 0, box.width, box.height, { center: box.center } );

  // highlights
  const highlightWidth = overlay.width + ( 2 * HIGHLIGHT_SPACING );
  const brightenHighlight = new HighlightNode( highlightWidth, overlay.height, {
    center: box.center,
    fill: 'white'
  } );
  const darkenHighlight = new HighlightNode( highlightWidth, overlay.height, {
    center: box.center,
    fill: 'black'
  } );

  this.addChild( box );
  this.addChild( overlay );
  this.addChild( brightenHighlight );
  this.addChild( darkenHighlight );

  // manage interaction feedback
  Property.multilink( [
    selectedProperty,
    this.buttonModel.looksPressedProperty,
    this.buttonModel.overProperty,
    navigationBarFillProperty
  ], function update( selected, looksPressed, over, navigationBarFill ) {

    const useDarkenHighlights = ( navigationBarFill !== 'black' );

    // Color match yellow with the PhET Logo
    const selectedTextColor = useDarkenHighlights ? 'black' : PhetColorScheme.BUTTON_YELLOW;
    const unselectedTextColor = useDarkenHighlights ? 'gray' : 'white';

    text.fill = selected ? selectedTextColor : unselectedTextColor;
    box.opacity = selected ? 1.0 : ( looksPressed ? 0.65 : 0.5 );
    brightenHighlight.visible = !useDarkenHighlights && ( over || looksPressed );
    darkenHighlight.visible = useDarkenHighlights && ( over || looksPressed );

    // Put a frame around the screen icon, depending on the navigation bar background color.
    let iconFrameStroke = null;
    if ( screen.showScreenIconFrameForNavigationBarFill === 'black' && navigationBarFill === 'black' ) {
      iconFrameStroke = PhetColorScheme.SCREEN_ICON_FRAME;
    }
    else if ( screen.showScreenIconFrameForNavigationBarFill === 'white' && navigationBarFill === 'white' ) {
      iconFrameStroke = 'black'; // black frame on a white navbar
    }
    iconFrame.stroke = iconFrameStroke;
  } );

  // Constrain text and icon width, if necessary
  if ( options.maxButtonWidth && ( this.width > options.maxButtonWidth ) ) {

    text.maxWidth = icon.maxWidth = options.maxButtonWidth - ( this.width - box.width );

    // adjust the overlay
    overlay.setRect( 0, 0, box.width, overlay.height );
    overlay.center = box.center;

    // adjust the highlights
    brightenHighlight.spacing = darkenHighlight.spacing = overlay.width + ( 2 * HIGHLIGHT_SPACING );
    brightenHighlight.center = darkenHighlight.center = box.center;

    assert && assert( Utils.toFixed( this.width, 0 ) === Utils.toFixed( options.maxButtonWidth, 0 ) );
  }
  else {

    // Don't allow the text to grow larger than the icon if changed later on using PhET-iO, see #438
    // Text is allowed to go beyond the bounds of the icon, hence we use `this.width` instead of `icon.width`
    text.maxWidth = this.width;
  }

  // a11y - set the role description for the button
  this.setAccessibleAttribute( 'aria-roledescription', simScreenString );

  // a11y - Pass a shape to the focusHighlight to prevent dilation, then tweak the top up just a hair.
  const highlightLineWidth = FocusHighlightPath.getOuterLineWidthFromNode( this );
  this.focusHighlight = Shape.bounds( this.bounds.setMinY( this.bounds.minY - highlightLineWidth / 2 ) );

  this.mutate( options );
}

joist.register( 'NavigationBarScreenButton', NavigationBarScreenButton );

inherit( Node, NavigationBarScreenButton );
export default NavigationBarScreenButton;