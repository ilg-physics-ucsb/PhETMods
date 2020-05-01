// Copyright 2018-2020, University of Colorado Boulder

/**
 * ProjectorModeCheckbox is a checkbox used to switch between 'default' and 'projector' color profiles.
 * It is most commonly used in the Options dialog, accessed from the PhET menu in some sims.
 *
 * @author John Blanco
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanProperty from '../../axon/js/BooleanProperty.js';
import merge from '../../phet-core/js/merge.js';
import ColorProfile from '../../scenery-phet/js/ColorProfile.js';
import Text from '../../scenery/js/nodes/Text.js';
import Checkbox from '../../sun/js/Checkbox.js';
import Tandem from '../../tandem/js/Tandem.js';
import joistStrings from './joistStrings.js';
import joist from './joist.js';
import OptionsDialog from './OptionsDialog.js';

const projectorModeString = joistStrings.projectorMode;

class ProjectorModeCheckbox extends Checkbox {

  /**
   * @param {ColorProfile} colorProfile
   * @param {Object} [options]
   */
  constructor( colorProfile, options ) {

    assert && assert( colorProfile instanceof ColorProfile, `invalid colorProfile: ${colorProfile}` );

    options = merge( {

      // {string} name of the color profile to use when not in projector mode
      defaultColorProfileName: ColorProfile.DEFAULT_COLOR_PROFILE_NAME,

      font: OptionsDialog.DEFAULT_FONT,
      maxTextWidth: 350, // empirically determined, works reasonably well for long strings
      tandem: Tandem.REQUIRED
    }, options );

    // verify that colorProfile has the required profiles
    assert && assert( colorProfile.hasProfile( ColorProfile.PROJECTOR_COLOR_PROFILE_NAME ),
      `colorProfile must have a profile named ${ColorProfile.PROJECTOR_COLOR_PROFILE_NAME}` );
    assert && assert( colorProfile.hasProfile( options.defaultColorProfileName ),
      `colorProfile must have a profile named ${options.defaultColorProfileName}` );

    const labelNode = new Text( projectorModeString, {
      font: options.font,
      maxWidth: options.maxTextWidth
    } );

    // Internal adapter Property, to map between the string value needed by colorProfile.profileNameProperty
    // and the boolean value needed by superclass Checkbox.
    const projectorModeEnabledProperty = new BooleanProperty( colorProfile.profileNameProperty.value === ColorProfile.PROJECTOR_COLOR_PROFILE_NAME, {
      tandem: options.tandem.createTandem( 'projectorModeEnabledProperty' )
    } );
    projectorModeEnabledProperty.link( isProjectorMode => {
      colorProfile.profileNameProperty.value =
        ( isProjectorMode ? ColorProfile.PROJECTOR_COLOR_PROFILE_NAME : options.defaultColorProfileName );
    } );

    const profileNameListener = profileName => {
      projectorModeEnabledProperty.value = ( profileName === 'projector' );
    };
    colorProfile.profileNameProperty.link( profileNameListener );

    super( labelNode, projectorModeEnabledProperty, options );

    // @private - dispose function
    this.disposeProjectorModeCheckbox = function() {
      colorProfile.profileNameProperty.unlink( profileNameListener );
    };
  }

  /**
   * @public
   * @override
   */
  dispose() {
    this.disposeProjectorModeCheckbox();
    super.dispose();
  }
}

joist.register( 'ProjectorModeCheckbox', ProjectorModeCheckbox );
export default ProjectorModeCheckbox;