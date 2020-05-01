// Copyright 2019-2020, University of Colorado Boulder

/**
 * A trait for subtypes of Node. Meant for Nodes with a value that "run" on a NumberProperty and handles formatting,
 * mapping, and aria-valuetext updating.
 *
 * Also implements the listeners that respond to accessible input, such as keydown, keyup, input, and change
 * events, which may come from a keyboard or other assistive device. Bind and add these as input listeners to the
 * node mixing in this trait.
 *
 * Browsers have limitations for the interaction of a slider when the range is not evenly divisible by the step size.
 * Rather than allow the browser to natively change the valueProperty with an input event, this trait implements a
 * totally custom interaction keeping the general slider behavior the same.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jesse Greenberg
 */

import Property from '../../../axon/js/Property.js';
import Utils from '../../../dot/js/Utils.js';
import extend from '../../../phet-core/js/extend.js';
import inheritance from '../../../phet-core/js/inheritance.js';
import merge from '../../../phet-core/js/merge.js';
import KeyboardUtils from '../../../scenery/js/accessibility/KeyboardUtils.js';
import Node from '../../../scenery/js/nodes/Node.js';
import Utterance from '../../../utterance-queue/js/Utterance.js';
import sun from '../sun.js';

// constants
const DEFAULT_TAG_NAME = 'input';
const toString = v => v + '';

const AccessibleValueHandler = {

  /**
   * Implement functionality for a number spinner.
   * @public
   * @trait {Node}
   *
   * @param {function} type - The type (constructor) whose prototype that is modified.
   */
  mixInto: type => {
    assert && assert( _.includes( inheritance( type ), Node ), 'must be mixed into a Node' );

    const proto = type.prototype;

    extend( proto, {

      /**
       * This should be called in the constructor to initialize the accessible input features for the node.
       *
       * @param {Property.<number>} valueProperty
       * @param {Property.<Range>} rangeProperty - Property whose value constricts the range of valueProperty
       * @param {BooleanProperty} enabledProperty
       * @param {Object} [options] - note, does not mutate the Node
       *
       * @protected
       */
      initializeAccessibleValueHandler( valueProperty, rangeProperty, enabledProperty, options ) {

        // if rounding to keyboard step, keyboardStep must be defined so values aren't skipped and the slider
        // doesn't get stuck while rounding to the nearest value, see https://github.com/phetsims/sun/issues/410
        if ( assert && options.roundToStepSize ) {
          assert( options.keyboardStep, 'rounding to keyboardStep, define appropriate keyboardStep to round to' );
        }

        const defaults = {

          // other
          startChange: _.noop, // called when a value change sequence starts
          endChange: _.noop, // called when a value change sequence ends

          // Called at the beginning of any event that would change the value and before any other changes to
          // valueProperty. Useful for "press and hold" keyboard input. However, be aware that other some devices
          // as switch will only trigger one change per input, and no concept of "press and hold". This function
          // will still be called once per input in those cases.
          change: _.noop,

          constrainValue: _.identity, // called before valueProperty is set

          // keyboard steps for various keys/interactions
          keyboardStep: ( rangeProperty.get().max - rangeProperty.get().min ) / 20,
          shiftKeyboardStep: ( rangeProperty.get().max - rangeProperty.get().min ) / 100,
          pageKeyboardStep: ( rangeProperty.get().max - rangeProperty.get().min ) / 10,

          // TODO: this should be an enumeration, https://github.com/phetsims/gravity-force-lab-basics/issues/134
          ariaOrientation: 'horizontal', // specify orientation, read by assistive technology

          // {boolean} - When setting the Property value from the PDOM input, this option controls whether or not to
          // round the value to a multiple of the keyboardStep. This will only round the value on normal key presses,
          // rounding will not occur on large jumps like page up/page down/home/end.
          // see https://github.com/phetsims/gravity-force-lab-basics/issues/72
          roundToStepSize: false,

          /**
           * Map the valueProperty value to another number that will be read by the assistive device on
           * valueProperty changes. This is used to set the values for aria-valuetext and the on change alert, as well
           * as the following attributes on the PDOM input:
           *    value
           *    aria-valuenow
           *    min
           *    max
           *    step
           *
           * For this reason, it is important that the mapped "min" would not be bigger than the mapped "max" from the
           * rangeProperty.
           *
           * @type {function(number):number}
           */
          a11yMapValue: _.identity,

          /**
           * If true, the aria-valuetext will be spoken every value change, even if the aria-valuetext doesn't
           * actually change. By default, screen readers won't speak aria-valuetext if it remains the same for
           * multiple values.
           * @type {boolean}
           */
          a11yRepeatEqualValueText: true,

          /**
           * aria-valuetext creation function, called when the valueProperty changes.
           * This string is read by AT every time the slider value changes.
           * @type {Function}
           * @param {number} mappedValue
           * @param {number} newValue - the new value, unformatted
           * @param {number} previousValue - just the "oldValue" from the property listener
           * @property {function} reset - if this function needs resetting, include a `reset` field on this function
           *                              to be called when the AccessibleValueHandler is reset.
           * @returns {string} - aria-valuetext to be set to the primarySibling
           */
          a11yCreateAriaValueText: toString, // by default make sure it returns a string

          /**
           * Create content for an alert that will be sent to the utteranceQueue when the user finishes interacting
           * with the input. Is not generated every change, but on every "drag" interaction, this is called with
           * endChange. With a keyboard, this will be called even with no value change (on the key up event ending the
           * interaction), On a touch system like iOS with Voice Over however, input and change events will only fire
           * when there is a Property value change, so "edge" alerts will not fire, see https://github.com/phetsims/gravity-force-lab-basics/issues/185
           * @type {Function}
           * @param {number} mappedValue
           * @param {number} newValue - the new value, unformatted
           * @param {number} previousValue - just the "oldValue" from the property listener
           * @returns {string|null} - if null, then no alert will be sent
           */
          a11yCreateValueChangeAlert: null,

          /**
           * List the dependencies this Node's PDOM descriptions have. This should not include the valueProperty, but
           * should list any Properties who's change should trigger description update for this Node.
           * @type {Property[]}
           */
          a11yDependencies: []
        };

        options = merge( {}, defaults, options );

        assert && assert( options.ariaOrientation === 'horizontal' || options.ariaOrientation === 'vertical',
          'invalid ariaOrientation: ' + options.ariaOrientation );

        // Some options were already mutated in the constructor, only apply the accessibility-specific options here
        // so options are not doubled up, see https://github.com/phetsims/sun/issues/330
        const optionsToMutate = _.pick( options, _.keys( defaults ) );

        // cannot be set by client
        assert && assert( options.tagName === undefined, 'AccessibleValueHandler sets tagName' );
        optionsToMutate.tagName = DEFAULT_TAG_NAME;

        assert && assert( options.inputType === undefined, 'AccessibleValueHandler sets inputType' );
        optionsToMutate.inputType = 'range';

        this.mutate( optionsToMutate );

        // @private {Property.<number>}
        this._valueProperty = valueProperty;

        // @private {Property.<Range>}
        this._rangeProperty = rangeProperty;

        // @private{Property.<boolean>}
        this._enabledProperty = enabledProperty;

        // @private {function} - called when value change input is starts
        this._startChange = options.startChange;

        // @private {function}
        this._change = options.change;

        // @private {function} - called when value change input ends
        this._endChange = options.endChange;

        // @private {function} - called before valueProperty is set
        this._constrainValue = options.constrainValue;

        // @private (a11y) - delta for the valueProperty when using keyboard to interact with slider,
        // initialized with setKeyboardStep which does some validating
        this._keyboardStep = null;
        this.setKeyboardStep( options.keyboardStep );

        // @private (a11y) - delta for valueProperty when holding shift and using the keyboard to interact with slider
        this._shiftKeyboardStep = null;
        this.setShiftKeyboardStep( options.shiftKeyboardStep );

        // @private (a11y) - delta for valueProperty when pressing page up/page down
        this._pageKeyboardStep = null;
        this.setPageKeyboardStep( options.pageKeyboardStep );

        // @private (a11y) - whether or not 'shift' key is currently held down
        this._shiftKey = false;

        // initialize slider attributes
        this.ariaOrientation = options.ariaOrientation;

        // @private - track previous values for callbacks outside of Property listeners
        this.oldValue = null;

        // @private {null|function} see options for doc
        this.a11yCreateValueChangeAlert = options.a11yCreateValueChangeAlert;

        // @private {number} - number of times the input has changed in value before the utterance made
        // was able to be spoken, only applicable if using a11yCreateValueChangeAlert
        this.timesValueTextChangedBeforeAlerting = 0;

        // @private - The utterance sent to the utteranceQueue when the value changes, alert content generated by
        // optional a11yCreateValueChangeAlert. The alertStableDelay on this utterance will increase if the input
        // receives many interactions before the utterance can be announced so that VoiceOver has time to read the
        // aria-valuetext before the alert.
        this.endInteractionUtterance = new Utterance();

        // @private (a11y) - whether or not an input event has been handled. If handled, we will not respond to the
        // change event. An AT (particularly VoiceOver) may send a change event (and not an input event) to the
        // browser in response to a user gesture. We need to handle that change event, whithout also handling the
        // input event in case a device sends both events to the browser.
        this.a11yInputHandled = false;

        // @private (a11y) - some browsers will receive `input` events when the user tabs away from the slider or
        // on some key presses - if we receive a keydown event, we do not want the value to change twice, so we
        // block input event after handling the keydown event
        this.blockInput = false;

        // @private - entries like { {number}: {boolean} }, key is range key code, value is whether it is down
        this.rangeKeysDown = {};

        // @private - setting to enable/disable rounding to the step size
        this.roundToStepSize = options.roundToStepSize;

        // @private {function}
        this.a11yMapValue = options.a11yMapValue;

        // @private {function}
        this.a11yCreateAriaValueText = options.a11yCreateAriaValueText;

        // @private {Multilink}
        this._dependenciesMultilink = null;

        // @private {boolean} see options for doc
        this._a11yRepeatEqualValueText = options.a11yRepeatEqualValueText;

        this.setA11yDependencies( options.a11yDependencies );

        // listeners, must be unlinked in dispose
        const enabledRangeObserver = enabledRange => {

          const mappedMin = this.getMappedValue( enabledRange.min );
          const mappedMax = this.getMappedValue( enabledRange.max );

          // TODO: should this assert be added back in? Right now area model fails it, see https://github.com/phetsims/sun/issues/530
          // assert && assert( mappedMin <= mappedMax, 'min should be less than max' );

          // pdom - update enabled slider range for AT, required for screen reader events to behave correctly
          this.setAccessibleAttribute( 'min', mappedMin );
          this.setAccessibleAttribute( 'max', mappedMax );

          // update the step attribute slider element - this attribute is only added because it is required to
          // receive accessibility events on all browsers, and is totally separate from the step values above that
          // will modify the valueProperty. See function for more information.
          this.updateSiblingStepAttribute();
        };
        this._rangeProperty.link( enabledRangeObserver );

        // when the property changes, be sure to update the accessible input value and aria-valuetext which is read
        // by assistive technology when the value changes
        const valuePropertyListener = () => {

          const mappedValue = this.getMappedValue();

          // set the aria-valuenow attribute in case the AT requires it to read the value correctly, some may
          // fall back on this from aria-valuetext see
          // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-valuetext_attribute#Possible_effects_on_user_agents_and_assistive_technology
          this.setAccessibleAttribute( 'aria-valuenow', mappedValue );

          // update the PDOM input value on Property change
          this.inputValue = mappedValue;
        };
        this._valueProperty.link( valuePropertyListener );

        // @private - called by disposeAccessibleValueHandler to prevent memory leaks
        this._disposeAccessibleValueHandler = () => {
          this._rangeProperty.unlink( enabledRangeObserver );
          this._valueProperty.unlink( valuePropertyListener );
          this._dependenciesMultilink && this._dependenciesMultilink.dispose();
        };
      },

      /**
       * There are some features of AccessibleValueHandler that support updating when more than just the valueProperty
       * changes. Use this method to set the dependency Properties for this value handler. This will blow away the
       * previous list (like Node.children).
       * @public
       * @param {Property[]} dependencies
       */
      setA11yDependencies( dependencies ) {
        assert && assert( Array.isArray( dependencies ) );
        assert && assert( dependencies.indexOf( this._valueProperty ) === -1,
          'The value Property is already a dependency, and does not need to be added to this list' );
        assert && dependencies.forEach( property => {
          assert && assert( property instanceof Property, `${property} is not an instance of Property` );
        } );

        // dispose the previous multilink, there is only one set of dependencies, though they can be overwritten.
        this._dependenciesMultilink && this._dependenciesMultilink.dispose();

        this._dependenciesMultilink = Property.multilink( dependencies.concat( this._valueProperty ), () => {

          this.updateAriaValueText( this.oldValue );
          this.oldValue = this._valueProperty.value;
        } );
      },

      /**
       * @param {*} oldPropertyValue - the old value of the valueProperty, can be null
       * @private
       */
      updateAriaValueText( oldPropertyValue ) {
        const mappedValue = this.getMappedValue();

        // create the dynamic aria-valuetext from a11yCreateAriaValueText.
        let newAriaValueText = this.a11yCreateAriaValueText( mappedValue, this._valueProperty.value, oldPropertyValue );
        assert && assert( typeof newAriaValueText === 'string' );

        if ( this._a11yRepeatEqualValueText && newAriaValueText === this.ariaValueText ) {

          // use a "hair space" because it won't be spoken by a screen reader when appended to the valuetext string
          newAriaValueText += '\u200A';
        }

        this.ariaValueText = newAriaValueText + '';
      },

      /**
       * If generating an alert when the user changes the slider value, create the alert content and send it
       * to the utterancQueue. For VoiceOver, it is important that if the value is changed multiple times before
       * the alert can be spoken, we provide more time for the AT to finish speaking aria-valuetext. Otherwise, the
       * alert may be lost. See https://github.com/phetsims/gravity-force-lab-basics/issues/146.
       * @private
       */
      setUtteranceAndAlert() {
        if ( this.a11yCreateValueChangeAlert ) {
          const utteranceQueue = phet.joist.sim.utteranceQueue;

          this.endInteractionUtterance.resetTimingVariables();

          const mappedValue = this.getMappedValue();
          const endInteractionAlert = this.a11yCreateValueChangeAlert( mappedValue, this._valueProperty.value, this.oldValue );

          // only if it returned an alert
          if ( endInteractionAlert ) {
            this.endInteractionUtterance.alert = endInteractionAlert;

            if ( utteranceQueue.hasUtterance( this.endInteractionUtterance ) ) {
              this.timesChangedBeforeAlerting++;
            }
            else {
              this.timesChangedBeforeAlerting = 1;
            }

            // 700 and 2000 ms are arbitrary values but sound good with limited testing. We want to give enough time
            // for VO to read aria-valuetext but don't want to have too much silence before the alert is spoken.
            this.endInteractionUtterance.alertStableDelay = Math.min( this.timesChangedBeforeAlerting * 700, 2000 );

            utteranceQueue.addToBack( this.endInteractionUtterance );
          }
        }
      },

      /**
       * Should be called after the model dependencies have been reset
       * @public
       */
      reset() {

        // reset the aria-valuetext creator if it supports that
        this.a11yCreateAriaValueText.reset && this.a11yCreateAriaValueText.reset();

        // on reset, make sure that the PDOM descriptions are completely up to date.
        this.updateAriaValueText( null );
      },

      /**
       * Set the a11yMapValueFunction
       * @param {function(number):number} mapValueFunction
       * @public
       */
      setMapValueFunction( mapValueFunction ) {
        assert && assert( typeof mapValueFunction === 'function', 'a11yMapValue function must be a function' );
        this.a11yMapValue = mapValueFunction;
      },

      /**
       * get the formatted value based on the current value of the Property.
       * @param {number} [value] - if not provided, will use the current value of the valueProperty
       * @returns {number}
       * @private
       */
      getMappedValue( value = this._valueProperty.value ) {
        const mappedValue = this.a11yMapValue( value );
        assert && assert( typeof mappedValue === 'number', 'a11yMapValue must return a number' );

        return mappedValue;
      },

      /**
       * Return the input listener that could be attached to mixed in types of AccessibleValueHandler to support
       * interaction.
       * @public
       *
       * @returns {Object}
       */
      getAccessibleValueHandlerInputListener() {
        return {
          keydown: this.handleKeyDown.bind( this ),
          keyup: this.handleKeyUp.bind( this ),
          input: this.handleInput.bind( this ),
          change: this.handleChange.bind( this ),
          blur: this.handleBlur.bind( this )
        };
      },

      /**
       * Handle a keydown event so that the value handler behaves like a traditional input that modifies
       * a number. We expect the following:
       *   - Up Arrow/Right Arrow increments value by keyboardStep
       *   - Down Arrow/Left Arrow decrements value by step size
       *   - Page up/Page down will increment/decrement value pageKeyboardStep
       *   - Home/End will set value to min/max value for the range
       *   - Pressing shift with an arrow key will increment/decrement value by shiftKeyboardStep
       *
       * Add this as an input listener to the `keydown` event to the Node mixing in AccessibleValueHandler.
       */
      handleKeyDown( event ) {
        const domEvent = event.domEvent;
        const code = domEvent.keyCode;
        this._shiftKey = domEvent.shiftKey;

        // if we receive a keydown event, we shouldn't handle any input events (which should only be provided
        // directly by an assistive device)
        this.blockInput = true;

        if ( this._enabledProperty.get() ) {

          // Prevent default so browser doesn't change input value automatically
          if ( KeyboardUtils.isRangeKey( code ) ) {
            domEvent.preventDefault(); // this should do the same thing as this.a11yInputHandled for "change" and "input"

            // if this is the first keydown this is the start of the drag interaction
            if ( !this.anyKeysDown() ) {
              this._startChange( event );
            }

            this._change( event );

            // track that a new key is being held down
            this.rangeKeysDown[ code ] = true;

            let newValue = this._valueProperty.get();
            if ( code === KeyboardUtils.KEY_END || code === KeyboardUtils.KEY_HOME ) {

              // on 'end' and 'home' snap to max and min of enabled range respectively (this is typical browser
              // behavior for sliders)
              if ( code === KeyboardUtils.KEY_END ) {
                newValue = this._rangeProperty.get().max;
              }
              else if ( code === KeyboardUtils.KEY_HOME ) {
                newValue = this._rangeProperty.get().min;
              }
            }
            else {
              let stepSize;
              if ( code === KeyboardUtils.KEY_PAGE_UP || code === KeyboardUtils.KEY_PAGE_DOWN ) {
                // on page up and page down, the default step size is 1/10 of the range (this is typical browser behavior)
                stepSize = this.pageKeyboardStep;

                if ( code === KeyboardUtils.KEY_PAGE_UP ) {
                  newValue = this._valueProperty.get() + stepSize;
                }
                else if ( code === KeyboardUtils.KEY_PAGE_DOWN ) {
                  newValue = this._valueProperty.get() - stepSize;
                }
              }
              else if ( KeyboardUtils.isArrowKey( code ) ) {

                // if the shift key is pressed down, modify the step size (this is atypical browser behavior for sliders)
                stepSize = domEvent.shiftKey ? this.shiftKeyboardStep : this.keyboardStep;

                if ( code === KeyboardUtils.KEY_RIGHT_ARROW || code === KeyboardUtils.KEY_UP_ARROW ) {
                  newValue = this._valueProperty.get() + stepSize;
                }
                else if ( code === KeyboardUtils.KEY_LEFT_ARROW || code === KeyboardUtils.KEY_DOWN_ARROW ) {
                  newValue = this._valueProperty.get() - stepSize;
                }

                if ( this.roundToStepSize ) {
                  newValue = roundValue( newValue, this._valueProperty.get(), stepSize );
                }
              }

              // limit the value to the enabled range
              newValue = Utils.clamp( newValue, this._rangeProperty.get().min, this._rangeProperty.get().max );
            }

            // optionally constrain the value further
            this._valueProperty.set( this._constrainValue( newValue ) );
          }
        }
      },

      /**
       * Handle key up event on this accessible slider, managing the shift key, and calling an optional endDrag
       * function on release. Add this as an input listener to the node mixing in AccessibleValueHandler.
       * @private
       *
       * @param {SceneryEvent} event
       */
      handleKeyUp( event ) {
        const domEvent = event.domEvent;

        // handle case where user tabbed to this input while an arrow key might have been held down
        if ( this.allKeysUp() ) {
          return;
        }

        // reset shift key flag when we release it
        if ( domEvent.keyCode === KeyboardUtils.KEY_SHIFT ) {
          this._shiftKey = false;
        }

        if ( this._enabledProperty.get() ) {
          if ( KeyboardUtils.isRangeKey( domEvent.keyCode ) ) {
            this.rangeKeysDown[ domEvent.keyCode ] = false;

            // when all range keys are released, we are done dragging
            if ( this.allKeysUp() ) {
              this.onInteractionEnd( event );
            }
          }
        }
      },

      /**
       * VoiceOver sends a "change" event to the slider (NOT an input event), so we need to handle the case when
       * a change event is sent but an input event ins't handled. Guarded against the case that BOTH change and
       * input are sent to the browser by the AT.
       *
       * Add this as a listener to the 'change' input event on the Node that is mixing in AccessibleValueHandler.
       *
       * @private
       *
       * @param {SceneryEvent} event
       */
      handleChange( event ) {

        if ( !this.a11yInputHandled ) {
          this.handleInput( event );
        }

        this.a11yInputHandled = false;
      },

      /**
       * Handle a direct 'input' event that might come from assistive technology. It is possible that the user agent
       * (particularly VoiceOver, or a switch device) will initiate an input event directly without going through
       * keydown. In that case, handle the change depending on which direction the user tried to go. We determine
       * this by detecting how the input value changed in response to the `input` event relative to the current
       * value of the valueProperty.
       *
       * Note that it is important to handle the "input" event, rather than the "change" event. The "input" will
       * fire when the value changes from a gesture, while the "change" will only happen on submission, like as
       * navigating away from the element.
       *
       * Add this as a listener to the `input` event on the Node that is mixing in AccessibleValueHandler.
       *
       * @private
       *
       * @param {SceneryEvent} event
       */
      handleInput( event ) {
        if ( this._enabledProperty.get() && !this.blockInput ) {

          // don't handle again on "change" event
          this.a11yInputHandled = true;

          let newValue = this._valueProperty.get();

          const inputValue = event.domEvent.target.value;
          const stepSize = this._shiftKey ? this.shiftKeyboardStep : this.keyboardStep;
          const mappedValue = this.getMappedValue();

          // start of change event is start of drag
          this._startChange( event );

          // only one change per input, but still call optional change function
          this._change( event );

          if ( inputValue > mappedValue ) {
            newValue = this._valueProperty.get() + stepSize;
          }
          else if ( inputValue < mappedValue ) {
            newValue = this._valueProperty.get() - stepSize;
          }

          if ( this.roundToStepSize ) {
            newValue = roundValue( newValue, this._valueProperty.get(), stepSize );
          }

          // limit to enabled range
          newValue = Utils.clamp( newValue, this._rangeProperty.get().min, this._rangeProperty.get().max );

          // optionally constrain value
          this._valueProperty.set( this._constrainValue( newValue ) );

          // end of change is the end of a drag
          this.onInteractionEnd( event );
        }
      },

      /**
       * Fires when the accessible slider loses focus.
       *
       * Add this as a listener on the `blur` event to the Node that is mixing in AccessibleValueHandler.
       * @private
       *
       * @param {SceneryEvent} event
       */
      handleBlur( event ) {

        // if any range keys are currently down, call end drag because user has stopped dragging to do something else
        if ( this.anyKeysDown() ) {
          this.onInteractionEnd( event );
        }

        // reset flag in case we shift-tabbed away from slider
        this._shiftKey = false;

        // reset counter for range keys down
        this.rangeKeysDown = {};
      },

      /**
       * Interaction with this input has completed, generate an utterance describing changes if necessary and call
       * optional "end" function.
       * @private
       *
       * @param {SceneryEvent} event
       */
      onInteractionEnd( event ) {
        this.setUtteranceAndAlert();
        this._endChange( event );
      },

      /**
       * Set the delta for the value Property when using arrow keys to interact with the Node.
       * @public
       *
       * @param {number} keyboardStep
       */
      setKeyboardStep( keyboardStep ) {
        assert && assert( keyboardStep >= 0, 'keyboard step must be non-negative' );

        this._keyboardStep = keyboardStep;
      },
      set keyboardStep( keyboardStep ) { this.setKeyboardStep( keyboardStep ); },

      /**
       * Get the delta for value Property when using arrow keys.
       * @public
       *
       * @returns {number}
       */
      getKeyboardStep() {
        return this._keyboardStep;
      },
      get keyboardStep() { return this.getKeyboardStep(); },

      /**
       * Set the delta for value Property when using arrow keys with shift to interact with the Node.
       * @public
       *
       * @param {number} shiftKeyboardStep
       */
      setShiftKeyboardStep( shiftKeyboardStep ) {
        assert && assert( shiftKeyboardStep >= 0, 'shift keyboard step must be non-negative' );

        this._shiftKeyboardStep = shiftKeyboardStep;
      },
      set shiftKeyboardStep( shiftKeyboardStep ) { this.setShiftKeyboardStep( shiftKeyboardStep ); },

      /**
       * Get the delta for value Property when using arrow keys with shift to interact with the Node.
       * @public
       */
      getShiftKeyboardStep() {
        return this._shiftKeyboardStep;
      },
      get shiftKeyboardStep() { return this.getShiftKeyboardStep(); },

      /**
       * Returns whether or not the shift key is currently held down on this slider, changing the size of step.
       * @public
       *
       * @returns {boolean}
       */
      getShiftKeyDown() {
        return this._shiftKey;
      },
      get shiftKeyDown() { return this.getShiftKeyDown(); },

      /**
       * Set the delta for value Property when using page up/page down to interact with the Node.
       * @public
       *
       * @param {number} pageKeyboardStep
       */
      setPageKeyboardStep( pageKeyboardStep ) {
        assert && assert( pageKeyboardStep >= 0, 'page keyboard step must be non-negative' );

        this._pageKeyboardStep = pageKeyboardStep;
      },
      set pageKeyboardStep( pageKeyboardStep ) { this.setPageKeyboardStep( pageKeyboardStep ); },

      /**
       * Get the delta for value Property when using page up/page down to interact with the Node.
       * @public
       */
      getPageKeyboardStep() {
        return this._pageKeyboardStep;
      },
      get pageKeyboardStep() { return this.getPageKeyboardStep(); },

      /**
       * Set the orientation for the slider as specified by https://www.w3.org/TR/wai-aria-1.1/#aria-orientation.
       * Depending on the value of this attribute, a screen reader will give different indications about which
       * arrow keys should be used
       *
       * @param {string} orientation - one of "horizontal" or "vertical"
       */
      setAriaOrientation: function( orientation ) {
        assert && assert( orientation === 'horizontal' || orientation === 'vertical' );

        this._ariaOrientation = orientation;
        this.setAccessibleAttribute( 'aria-orientation', orientation );
      },
      set ariaOrientation( orientation ) { this.setAriaOrientation( orientation ); },

      /**
       * Get the orientation of the accessible slider, see setAriaOrientation for information on the behavior of this
       * attribute.
       *
       * @returns {string}
       */
      getAriaOrientation: function() {
        return this._ariaOrientation;
      },
      get ariaOrientation() { return this._ariaOrientation; },

      /**
       * Call when disposing the type that this trait is mixed into.
       * @public
       */
      disposeAccessibleValueHandler() {
        this._disposeAccessibleValueHandler();
      },

      /**
       * Returns true if all range keys are currently up (not held down).
       * @returns {boolean}
       * @private
       */
      allKeysUp() {
        return _.every( this.rangeKeysDown, function( entry ) { return !entry; } );
      },

      /**
       * Returns true if any range keys are currently down on this slider. Useful for determining when to call
       * startDrag or endDrag based on interaction.
       *
       * @returns {boolean}
       * @private
       */
      anyKeysDown() {
        return !!_.find( this.rangeKeysDown, function( entry ) { return entry; } );
      },

      /**
       * Set the `step` attribute on accessible siblings for this Node. The step attribute must be non zero
       * for the accessible input to receive accessibility events and only certain slider input values are
       * allowed depending on `step`, `min`, and `max` attributes. Only values which are equal to min value plus
       * the basis of step are allowed. In other words, the following must always be true:
       * value = min + n * step where value <= max and n is an integer.
       *
       * If the input value is set to anything else, the result is confusing
       * keyboard behavior and the screen reader will say "Invalid" when the value changes.
       * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number#step
       *
       * This limitation is too restrictive for PhET as many sliders span physical ranges with keyboard steps that
       * are design to be convenient or pedagogically useful. For example, a slider that spans 0.01 to 15 requires
       * a step of 1, but DOM specification would only allow values 0.01, 1.01, 2.01, ...
       * This restriction is why `step` attribute cannot equal keyboardStep of this trait.
       *
       * We tried to use the `any` attribute which is valid according to DOM specification but screen readers
       * generally don't support it. See https://github.com/phetsims/sun/issues/413.
       *
       * Also, if the step attribute is too small relative to the entire range of the slider VoiceOver doesn't allow
       * any input events because...VoiceOver is just interesting like that.
       *
       * Current workaround for all of this is to set the step size to support the precision of the value required
       * by the client so that all values are allowed. If we encounter the VoiceOver case described above we fall
       * back to setting the step size at 1/100th of the max value since the keyboard step generally evenly divides
       * the max value rather than the full range.
       * @private
       */
      updateSiblingStepAttribute() {
        const smallestStep = Math.min( Math.min( this.keyboardStep, this.shiftKeyboardStep ), this.pageKeyboardStep );
        let stepValue = Math.pow( 10, -Utils.numberOfDecimalPlaces( smallestStep ) );

        const mappedMin = this.getMappedValue( this._rangeProperty.get().min );
        const mappedMax = this.getMappedValue( this._rangeProperty.get().max );
        const mappedLength = mappedMax - mappedMin;

        // step is too small relative to full range for VoiceOver to receive input, fall back to portion of
        // the max value as a workaround
        if ( stepValue / mappedLength < 1e-5 ) {
          stepValue = mappedMax / 100;
        }

        this.setAccessibleAttribute( 'step', stepValue );
      }
    } );
  }
};

sun.register( 'AccessibleValueHandler', AccessibleValueHandler );

/**
 * Round the value to the nearest step size.
 *
 * @param {number} newValue - value to be rounded
 * @param {number} currentValue - current value of the Property associated with this slider
 * @param {number} stepSize - the delta for this manipulation
 *
 * @returns {number}
 */
var roundValue = function( newValue, currentValue, stepSize ) {
  let roundValue = newValue;
  if ( stepSize !== 0 ) {

    // round the value to the nearest keyboard step
    roundValue = Utils.roundSymmetric( roundValue / stepSize ) * stepSize;

    // go back a step if we went too far due to rounding
    roundValue = correctRounding( roundValue, currentValue, stepSize );
  }
  return roundValue;
};

/**
 * Helper function, it is possible due to rounding to go up or down a step if we have passed the nearest step during
 * keyboard interaction. This function corrects that.
 *
 * @param {number} newValue - potential value of the Property associated with this slider
 * @param {number} currentValue - current value of the Property associated with this slider
 * @param {number} stepSize - the delta for this manipulation
 *
 * @returns {number}
 */
var correctRounding = function( newValue, currentValue, stepSize ) {
  let correctedValue = newValue;

  const proposedStep = Math.abs( newValue - currentValue );
  const stepToFar = proposedStep > stepSize;

  // it is possible that proposedStep will be larger than the stepSize but only because of precision
  // constraints with floating point values, don't correct if that is the cases
  const stepsAboutEqual = Utils.equalsEpsilon( proposedStep, stepSize, 1e-14 );
  if ( stepToFar && !stepsAboutEqual ) {
    correctedValue += ( newValue > currentValue ) ? ( -1 * stepSize ) : stepSize;
  }
  return correctedValue;
};

// @public {string}
AccessibleValueHandler.DEFAULT_TAG_NAME = DEFAULT_TAG_NAME;

export default AccessibleValueHandler;