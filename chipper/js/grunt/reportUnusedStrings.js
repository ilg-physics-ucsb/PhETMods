// Copyright 2015-2019, University of Colorado Boulder

/**
 * Report which translatable strings from a sim were not used in the simulation with a require statement.
 *
 * Each time a string is loaded by the plugin, it is added to a global list.  After all strings are loaded,
 * the global will contain the list of all strings that are actually used by the sim.  Comparing this list to
 * the strings in the translatable strings JSON file will identify which strings are unused.
 *
 * See https://github.com/phetsims/tasks/issues/460
 *
 * @author Jesse Greenberg
 */

'use strict';

const grunt = require( 'grunt' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );

/**
 * @param {string} repo
 * @param {string} requirejsNamespace
 */
module.exports = function( repo, requirejsNamespace ) {

  // get the strings for this sim
  const jsStrings = grunt.file.readJSON( `../${repo}/${repo}-strings_en.json` );

  // global.phet.chipper.strings is initialized by the string plugin
  const chipperStrings = global.phet.chipper.strings || {};

  ChipperStringUtils.forEachString( jsStrings, ( key, stringObject ) => {

    // If this string was not added to the global chipperStrings, it was not required in the sim
    if ( !chipperStrings.hasOwnProperty( `${requirejsNamespace}/${key}` ) ) {
      grunt.log.warn( `Unused string: key=${key}, value=${stringObject.value}` );
    }
  } );
};