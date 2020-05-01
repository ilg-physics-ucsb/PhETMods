// Copyright 2016-2020, University of Colorado Boulder

/**
 * SVG drawable for Image nodes.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Poolable from '../../../../phet-core/js/Poolable.js';
import inherit from '../../../../phet-core/js/inherit.js';
import platform from '../../../../phet-core/js/platform.js';
import scenery from '../../scenery.js';
import svgns from '../../util/svgns.js';
import xlinkns from '../../util/xlinkns.js';
import SVGSelfDrawable from '../SVGSelfDrawable.js';
import ImageStatefulDrawable from './ImageStatefulDrawable.js';

// TODO: change this based on memory and performance characteristics of the platform
const keepSVGImageElements = true; // whether we should pool SVG elements for the SVG rendering states, or whether we should free them when possible for memory

/**
 * A generated SVGSelfDrawable whose purpose will be drawing our Image. One of these drawables will be created
 * for each displayed instance of a Image.
 * @constructor
 *
 * @param {number} renderer - Renderer bitmask, see Renderer's documentation for more details.
 * @param {Instance} instance
 */
function ImageSVGDrawable( renderer, instance ) {
  // Super-type initialization
  this.initializeSVGSelfDrawable( renderer, instance, false, keepSVGImageElements ); // usesPaint: false

  sceneryLog && sceneryLog.ImageSVGDrawable && sceneryLog.ImageSVGDrawable( this.id + ' initialized for ' + instance.toString() );
  const self = this;

  // @protected {SVGImageElement} - Sole SVG element for this drawable, implementing API for SVGSelfDrawable
  this.svgElement = this.svgElement || document.createElementNS( svgns, 'image' );
  this.svgElement.setAttribute( 'x', '0' );
  this.svgElement.setAttribute( 'y', '0' );

  // Whether we have an opacity attribute specified on the DOM element.
  this.hasOpacity = false;

  this._usingMipmap = false;
  this._mipmapLevel = -1; // will always be invalidated

  // if mipmaps are enabled, this listener will be added to when our relative transform changes
  this._mipmapTransformListener = this._mipmapTransformListener || function() {
    sceneryLog && sceneryLog.ImageSVGDrawable && sceneryLog.ImageSVGDrawable( self.id + ' Transform dirties mipmap' );
    self.markDirtyMipmap();
  };

  this._mipmapListener = this._mipmapListener || function() {
    // sanity check
    self.markDirtyMipmap();

    // update our mipmap usage status
    self.updateMipmapStatus( self.node._mipmap );
  };
  this.node.mipmapEmitter.addListener( this._mipmapListener );
  this.updateMipmapStatus( instance.node._mipmap );
}

scenery.register( 'ImageSVGDrawable', ImageSVGDrawable );

inherit( SVGSelfDrawable, ImageSVGDrawable, {
  /**
   * Updates the SVG elements so that they will appear like the current node's representation.
   * @protected
   *
   * Implements the interface for SVGSelfDrawable (and is called from the SVGSelfDrawable's update).
   */
  updateSVGSelf: function() {
    const image = this.svgElement;

    if ( this.dirtyImage ) {
      sceneryLog && sceneryLog.ImageSVGDrawable && sceneryLog.ImageSVGDrawable( this.id + ' Updating dirty image' );
      if ( this.node._image ) {
        // like <image xlink:href='http://phet.colorado.edu/images/phet-logo-yellow.png' x='0' y='0' height='127px' width='242px'/>
        this.updateURL( image, true );
      }
      else {
        image.setAttribute( 'width', '0' );
        image.setAttribute( 'height', '0' );
        image.setAttributeNS( xlinkns, 'xlink:href', '//:0' ); // see http://stackoverflow.com/questions/5775469/whats-the-valid-way-to-include-an-image-with-no-src
      }
    }
    else if ( this.dirtyMipmap && this.node._image ) {
      sceneryLog && sceneryLog.ImageSVGDrawable && sceneryLog.ImageSVGDrawable( this.id + ' Updating dirty mipmap' );
      this.updateURL( image, false );
    }

    if ( this.dirtyImageOpacity ) {
      if ( this.node._imageOpacity === 1 ) {
        if ( this.hasOpacity ) {
          this.hasOpacity = false;
          image.removeAttribute( 'opacity' );
        }
      }
      else {
        this.hasOpacity = true;
        image.setAttribute( 'opacity', this.node._imageOpacity );
      }
    }
  },

  updateURL: function( image, forced ) {
    // determine our mipmap level, if any is used
    let level = -1; // signals a default of "we are not using mipmapping"
    if ( this.node._mipmap ) {
      level = this.node.getMipmapLevel( this.instance.relativeTransform.matrix );
      sceneryLog && sceneryLog.ImageSVGDrawable && sceneryLog.ImageSVGDrawable( this.id + ' Mipmap level: ' + level );
    }

    // bail out if we would use the currently-used mipmap level (or none) and there was no image change
    if ( !forced && level === this._mipmapLevel ) {
      return;
    }

    // if we are switching to having no mipmap
    if ( this._mipmapLevel >= 0 && level === -1 ) {
      // IE guard needed since removeAttribute fails, see https://github.com/phetsims/scenery/issues/395
      ( platform.ie9 || platform.ie10 ) ? image.setAttribute( 'transform', '' ) : image.removeAttribute( 'transform' );
    }
    this._mipmapLevel = level;

    if ( this.node._mipmap && this.node.hasMipmaps() ) {
      sceneryLog && sceneryLog.ImageSVGDrawable && sceneryLog.ImageSVGDrawable( this.id + ' Setting image URL to mipmap level ' + level );
      const url = this.node.getMipmapURL( level );
      const canvas = this.node.getMipmapCanvas( level );
      image.setAttribute( 'width', canvas.width + 'px' );
      image.setAttribute( 'height', canvas.height + 'px' );
      // Since SVG doesn't support parsing scientific notation (e.g. 7e5), we need to output fixed decimal-point strings.
      // Since this needs to be done quickly, and we don't particularly care about slight rounding differences (it's
      // being used for display purposes only, and is never shown to the user), we use the built-in JS toFixed instead of
      // Dot's version of toFixed. See https://github.com/phetsims/kite/issues/50
      image.setAttribute( 'transform', 'scale(' + Math.pow( 2, level ).toFixed( 20 ) + ')' );
      image.setAttributeNS( xlinkns, 'xlink:href', url );
    }
    else {
      sceneryLog && sceneryLog.ImageSVGDrawable && sceneryLog.ImageSVGDrawable( this.id + ' Setting image URL' );
      image.setAttribute( 'width', this.node.getImageWidth() + 'px' );
      image.setAttribute( 'height', this.node.getImageHeight() + 'px' );
      image.setAttributeNS( xlinkns, 'xlink:href', this.node.getImageURL() );
    }
  },

  updateMipmapStatus: function( usingMipmap ) {
    if ( this._usingMipmap !== usingMipmap ) {
      this._usingMipmap = usingMipmap;

      if ( usingMipmap ) {
        sceneryLog && sceneryLog.ImageSVGDrawable && sceneryLog.ImageSVGDrawable( this.id + ' Adding mipmap compute/listener needs' );
        this.instance.relativeTransform.addListener( this._mipmapTransformListener ); // when our relative tranform changes, notify us in the pre-repaint phase
        this.instance.relativeTransform.addPrecompute(); // trigger precomputation of the relative transform, since we will always need it when it is updated
      }
      else {
        sceneryLog && sceneryLog.ImageSVGDrawable && sceneryLog.ImageSVGDrawable( this.id + ' Removing mipmap compute/listener needs' );
        this.instance.relativeTransform.removeListener( this._mipmapTransformListener );
        this.instance.relativeTransform.removePrecompute();
      }

      // sanity check
      this.markDirtyMipmap();
    }
  },

  /**
   * Disposes the drawable.
   * @public
   * @override
   */
  dispose: function() {
    sceneryLog && sceneryLog.ImageSVGDrawable && sceneryLog.ImageSVGDrawable( this.id + ' disposing' );

    // clean up mipmap listeners and compute needs
    this.updateMipmapStatus( false );
    this.node.mipmapEmitter.removeListener( this._mipmapListener );

    SVGSelfDrawable.prototype.dispose.call( this );
  }
} );
ImageStatefulDrawable.mixInto( ImageSVGDrawable );

Poolable.mixInto( ImageSVGDrawable );

export default ImageSVGDrawable;