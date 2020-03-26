// Copyright 2014-2020, University of Colorado Boulder

/**
 * Radio buttons. See ButtonsView for example usage.
 *
 * This type creates a group of radio buttons in either a horizontal or vertical formation.
 * Each button inherits from RectangularButtonView, and can take a Scenery Node as its content.
 * A typical use case is when you want to have different modes of a view to select from. Typically,
 * RadioButtonGroup radio buttons display some kind of icon or image, but that is not mandatory.
 *
 * @author Aaron Davis (PhET Interactive Simulations)
 */

import Property from '../../../axon/js/Property.js';
import Shape from '../../../kite/js/Shape.js';
import InstanceRegistry from '../../../phet-core/js/documentation/InstanceRegistry.js';
import inherit from '../../../phet-core/js/inherit.js';
import merge from '../../../phet-core/js/merge.js';
import AccessiblePeer from '../../../scenery/js/accessibility/AccessiblePeer.js';
import FocusHighlightPath from '../../../scenery/js/accessibility/FocusHighlightPath.js';
import LayoutBox from '../../../scenery/js/nodes/LayoutBox.js';
import Rectangle from '../../../scenery/js/nodes/Rectangle.js';
import Color from '../../../scenery/js/util/Color.js';
import radioButtonSoundPlayerFactory from '../../../tambo/js/radioButtonSoundPlayerFactory.js';
import PhetioObject from '../../../tandem/js/PhetioObject.js';
import Tandem from '../../../tandem/js/Tandem.js';
import ColorConstants from '../ColorConstants.js';
import sun from '../sun.js';
import RadioButtonGroupAppearance from './RadioButtonGroupAppearance.js';
import RadioButtonGroupMember from './RadioButtonGroupMember.js';

// constants
const BUTTON_CONTENT_X_ALIGN_VALUES = [ 'center', 'left', 'right' ];
const BUTTON_CONTENT_Y_ALIGN_VALUES = [ 'center', 'top', 'bottom' ];
const CLASS_NAME = 'RadioButtonGroup'; // to prefix instanceCount in case there are different kinds of "groups"

// a11y - Unique ID for each instance if RadioButtonGroup, passed to individual buttons in the group. All buttons in
// the  radio button group must have the same name or else the browser will treat all inputs of type radio in the
// document as being in a single group.
let instanceCount = 0;

/**
 * RadioButtonGroup constructor.
 *
 * @param {Property} property
 * @param {Object[]} contentArray - an array of objects that have two keys each: "value" and "node", where the node
 * key holds a scenery Node that is the content for a given radio button and the value key holds the value that the
 * property takes on when the corresponding node is selected. Optionally, these objects can have an attribute 'label',
 * which is a {Node} used to label the button. You can also pass some specific a11y options.
 * (labelContent/descriptionContent) through, see "new RadioButtonGroupMember" construction.
 * @param {Object} [options]
 * @constructor
 */
function RadioButtonGroup( property, contentArray, options ) {
  options = merge( {

    // phet-io
    tandem: Tandem.REQUIRED,
    phetioComponentOptions: null, // filled in below with PhetioObject.mergePhetioComponentOptions()

    // {Playable[]|null} - sound generation for the radio buttons, null means to use the defaults, otherwise there
    // must be one for each element in contentArray
    soundPlayers: null,

    // a11y
    tagName: 'ul',
    labelTagName: 'h3',
    ariaRole: 'radiogroup',
    groupFocusHighlight: true
  }, options );

  // increment instance count
  instanceCount++;

  PhetioObject.mergePhetioComponentOptions( { visibleProperty: { phetioFeatured: true } }, options );

  assert && assert( !options.hasOwnProperty( 'children' ), 'Cannot pass in children to a RadioButtonGroup, ' +
                                                           'create siblings in the parent node instead' );

  // make sure every object in the content array has properties 'node' and 'value'
  assert && assert( _.every( contentArray, function( obj ) {
    return obj.hasOwnProperty( 'node' ) && obj.hasOwnProperty( 'value' );
  } ), 'contentArray must be an array of objects with properties "node" and "value"' );

  // make sure that if sound players are provided, there is one per radio button
  assert && assert( options.soundPlayers === null || options.soundPlayers.length === contentArray.length );

  let i; // for loops

  // make sure that each value passed into the contentArray is unique
  const uniqueValues = [];
  for ( i = 0; i < contentArray.length; i++ ) {
    if ( uniqueValues.indexOf( contentArray[ i ].value ) < 0 ) {
      uniqueValues.push( contentArray[ i ].value );
    }
    else {
      throw new Error( 'Duplicate value: "' + contentArray[ i ].value + '" passed into RadioButtonGroup.js' );
    }
  }

  // make sure that the property passed in currently has a value from the contentArray
  if ( uniqueValues.indexOf( property.get() ) === -1 ) {
    throw new Error( 'The property passed in to RadioButtonGroup has an illegal value "' + property.get() +
                     '" that is not present in the contentArray' );
  }

  const defaultOptions = {

    // LayoutBox options (super class of RadioButtonGroup)
    spacing: 10,
    orientation: 'vertical',

    enabledProperty: new Property( true ), // whether or not the set of radio buttons as a whole is enabled

    // The fill for the rectangle behind the radio buttons.  Default color is bluish color, as in the other button library.
    baseColor: ColorConstants.LIGHT_BLUE,
    disabledBaseColor: ColorConstants.LIGHT_GRAY,

    // Opacity can be set separately for the buttons and button content.
    selectedButtonOpacity: 1,
    deselectedButtonOpacity: 0.6,
    selectedContentOpacity: 1,
    deselectedContentOpacity: 0.6,
    overButtonOpacity: 0.8,
    overContentOpacity: 0.8,

    selectedStroke: 'black',
    deselectedStroke: new Color( 50, 50, 50 ),
    selectedLineWidth: 1.5,
    deselectedLineWidth: 1,

    // The following options specify highlight behavior overrides, leave as null to get the default behavior
    // Note that highlighting applies only to deselected buttons
    overFill: null,
    overStroke: null,
    overLineWidth: null,

    // These margins are *within* each button
    buttonContentXMargin: 5,
    buttonContentYMargin: 5,

    // alignment of the content nodes *within* each button
    buttonContentXAlign: 'center', // {string} see BUTTON_CONTENT_X_ALIGN_VALUES
    buttonContentYAlign: 'center', // {string} see BUTTON_CONTENT_Y_ALIGN_VALUES

    // TouchArea expansion
    touchAreaXDilation: 0,
    touchAreaYDilation: 0,

    // MouseArea expansion
    mouseAreaXDilation: 0,
    mouseAreaYDilation: 0,

    //The radius for each button
    cornerRadius: 4,

    // How far from the button the text label is (only applies if labels are passed in)
    labelSpacing: 0,

    // Which side of the button the label will appear, options are 'top', 'bottom', 'left', 'right'
    // (only applies if labels are passed in)
    labelAlign: 'bottom',

    // The default appearances use the color values specified above, but other appearances could be specified for more
    // customized behavior.  Generally setting the color values above should be enough to specify the desired look.
    buttonAppearanceStrategy: RadioButtonGroupAppearance.defaultRadioButtonsAppearance,
    contentAppearanceStrategy: RadioButtonGroupAppearance.contentAppearanceStrategy,

    // a11y - focus highlight expansion
    a11yHighlightXDilation: 0,
    a11yHighlightYDilation: 0
  };

  options = merge( _.clone( defaultOptions ), options );

  assert && assert( _.includes( BUTTON_CONTENT_X_ALIGN_VALUES, options.buttonContentXAlign ),
    'invalid buttonContentXAlign: ' + options.buttonContentXAlign );
  assert && assert( _.includes( BUTTON_CONTENT_Y_ALIGN_VALUES, options.buttonContentYAlign ),
    'invalid buttonContentYAlign: ' + options.buttonContentYAlign );

  // make a copy of the options to pass to individual buttons that includes all default options but not scenery options
  const buttonOptions = _.pick( options, _.keys( defaultOptions ) );

  // calculate the maximum width and height of the content so we can make all radio buttons the same size
  const widestContentWidth = _.maxBy( contentArray, function( content ) { return content.node.width; } ).node.width;
  const tallestContentHeight = _.maxBy( contentArray, function( content ) { return content.node.height; } ).node.height;

  // make sure all radio buttons are the same size and create the RadioButtons
  const buttons = [];
  let button;
  for ( i = 0; i < contentArray.length; i++ ) {
    const currentContent = contentArray[ i ];

    assert && assert( !currentContent.hasOwnProperty( 'phetioType' ), 'phetioType should be provided by ' +
                                                                      'the property passed to the ' +
                                                                      'RadioButtonGroup constructor' );

    assert && assert( !currentContent.tandem, 'content arrays should not have tandem instances, they should use ' +
                                              'tandemName instead' );

    const opts = merge( {
      content: currentContent.node,
      xMargin: options.buttonContentXMargin,
      yMargin: options.buttonContentYMargin,
      xAlign: options.buttonContentXAlign,
      yAlign: options.buttonContentYAlign,
      minWidth: widestContentWidth + 2 * options.buttonContentXMargin,
      minHeight: tallestContentHeight + 2 * options.buttonContentYMargin,
      phetioDocumentation: currentContent.phetioDocumentation || '',
      soundPlayer: options.soundPlayers ? options.soundPlayers[ i ] :
                   radioButtonSoundPlayerFactory.getRadioButtonSoundPlayer( i )
    }, buttonOptions );

    // Pass through the tandem given the tandemName, but also support uninstrumented simulations
    if ( currentContent.tandemName ) {
      opts.tandem = options.tandem.createTandem( currentContent.tandemName );
    }

    // a11y create the label for the radio button
    if ( currentContent.labelContent ) {
      opts.labelContent = currentContent.labelContent;
    }

    // a11y create description for radio button
    // use if block to prevent empty 'p' tag being added when no option is present
    if ( currentContent.descriptionContent ) {
      opts.descriptionContent = currentContent.descriptionContent;
    }

    const radioButton = new RadioButtonGroupMember( property, currentContent.value, opts );

    // a11y - so the browser recognizes these buttons are in the same group, see instanceCount for more info
    radioButton.setAccessibleAttribute( 'name', CLASS_NAME + instanceCount );

    // ensure the buttons don't resize when selected vs unselected by adding a rectangle with the max size
    const maxLineWidth = Math.max( options.selectedLineWidth, options.deselectedLineWidth );
    const maxButtonWidth = maxLineWidth + widestContentWidth + options.buttonContentXMargin * 2;
    const maxButtonHeight = maxLineWidth + tallestContentHeight + options.buttonContentYMargin * 2;
    const boundingRect = new Rectangle( 0, 0, maxButtonWidth, maxButtonHeight, {
      fill: 'rgba(0,0,0,0)',
      center: radioButton.center
    } );
    radioButton.addChild( boundingRect );

    // default bounds for focus highlight, will include label if one exists
    let defaultHighlightBounds = null;

    // if a label is given, the button becomes a LayoutBox with the label and button
    if ( currentContent.label ) {
      const label = currentContent.label;
      const labelOrientation = ( options.labelAlign === 'bottom' || options.labelAlign === 'top' ) ? 'vertical' : 'horizontal';
      const labelChildren = ( options.labelAlign === 'left' || options.labelAlign === 'top' ) ? [ label, radioButton ] : [ radioButton, label ];
      button = new LayoutBox( {
        children: labelChildren,
        spacing: options.labelSpacing,
        orientation: labelOrientation
      } );

      let xDilation = options.touchAreaXDilation;
      let yDilation = options.touchAreaYDilation;

      // override the touch and mouse areas defined in RectangularButtonView
      // extra width is added to the SingleRadioButtons so they don't change size if the line width changes,
      // that is why lineWidth is subtracted from the width and height when calculating these new areas
      radioButton.touchArea = Shape.rectangle(
        -xDilation,
        -yDilation,
        button.width + 2 * xDilation - maxLineWidth,
        button.height + 2 * yDilation - maxLineWidth
      );

      xDilation = options.mouseAreaXDilation;
      yDilation = options.mouseAreaYDilation;
      radioButton.mouseArea = Shape.rectangle(
        -xDilation,
        -yDilation,
        button.width + 2 * xDilation - maxLineWidth,
        button.height + 2 * yDilation - maxLineWidth
      );

      // make sure the label mouse and touch areas don't block the expanded button touch and mouse areas
      label.pickable = false;

      // use the same content appearance strategy for the labels that is used for the button content
      options.contentAppearanceStrategy( label, radioButton.interactionStateProperty, options );

      // a11y - include label in focus highlight
      defaultHighlightBounds = radioButton.mouseArea.bounds.dilated( 5 );
    }
    else {
      button = radioButton;
      defaultHighlightBounds = button.bounds.dilated( FocusHighlightPath.getDilationCoefficient( button ) );
    }

    // a11y - set the focus highlight, dilated by the optional expansion values
    const highlightBounds = defaultHighlightBounds.dilatedX( opts.a11yHighlightXDilation ).dilatedY( opts.a11yHighlightYDilation );
    radioButton.setFocusHighlight( Shape.bounds( highlightBounds ) );

    buttons.push( button );
  }

  // @private
  this.enabledProperty = options.enabledProperty;

  // super call
  options.children = buttons;
  LayoutBox.call( this, options );
  const self = this;

  // a11y - this node's primary sibling is aria-labelledby its own label so the label content is read whenever
  // a member of the group receives focus
  this.addAriaLabelledbyAssociation( {
    thisElementName: AccessiblePeer.PRIMARY_SIBLING,
    otherNode: this,
    otherElementName: AccessiblePeer.LABEL_SIBLING
  } );

  // When the entire RadioButtonGroup gets disabled, gray them out and make them unpickable (and vice versa)
  const enabledListener = function( isEnabled ) {
    self.pickable = isEnabled;

    for ( i = 0; i < contentArray.length; i++ ) {
      if ( buttons[ i ] instanceof LayoutBox ) {
        for ( let j = 0; j < 2; j++ ) {
          buttons[ i ].children[ j ].enabled = isEnabled;
        }
      }
      else {
        buttons[ i ].enabled = isEnabled;
      }
    }
  };
  this.enabledProperty.link( enabledListener );

  // make the unselected buttons pickable and have a pointer cursor
  const propertyListener = function( value ) {
    if ( self.enabledProperty.get() ) {
      for ( i = 0; i < contentArray.length; i++ ) {
        if ( contentArray[ i ].value === value ) {
          buttons[ i ].pickable = false;
          buttons[ i ].cursor = null;
        }
        else {
          buttons[ i ].pickable = true;
          buttons[ i ].cursor = 'pointer';
        }
      }
    }
  };
  property.link( propertyListener );

  // must be done after this instance is instrumented
  this.addLinkedElement( property, {
    tandem: options.tandem.createTandem( 'property' )
  } );

  // @private - remove listeners from buttons and make eligible for garbage collection
  this.disposeRadioButtonGroup = function() {
    self.enabledProperty.unlink( enabledListener );
    property.unlink( propertyListener );

    // dispose all buttons
    for ( i = 0; i < contentArray.length; i++ ) {
      buttons[ i ].dispose();
    }
  };

  // a11y - register component for binder docs
  assert && phet.chipper.queryParameters.binder && InstanceRegistry.registerDataURL( 'sun', 'RadioButtonGroup', this );
}

sun.register( 'RadioButtonGroup', RadioButtonGroup );

inherit( LayoutBox, RadioButtonGroup, {

  // @public
  dispose: function() {
    this.disposeRadioButtonGroup();
    LayoutBox.prototype.dispose.call( this );
  },

  // @public
  set enabled( value ) {
    assert && assert( typeof value === 'boolean', 'RadioButtonGroup.enabled must be a boolean value' );
    this.enabledProperty.set( value );
  },

  // @public
  get enabled() {
    return this.enabledProperty.get();
  }
} );
export default RadioButtonGroup;