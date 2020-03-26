// Copyright 2013-2020, University of Colorado Boulder

/**
 * Arbitrary-dimensional matrix, based on Jama (http://math.nist.gov/javanumerics/jama/)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import isArray from '../../phet-core/js/isArray.js';
import dot from './dot.js';
import './EigenvalueDecomposition.js';
import './LUDecomposition.js';
import './QRDecomposition.js';
import './SingularValueDecomposition.js';
import './Vector2.js';
import './Vector3.js';
import './Vector4.js';

const ArrayType = window.Float64Array || Array;


/**
 *
 * @param {number} m - number of rows
 * @param {number} n - number of columns
 * @param {number[]} [filler]
 * @param {boolean} [fast]
 * @constructor
 */
function Matrix( m, n, filler, fast ) {
  this.m = m;
  this.n = n;

  const size = m * n;
  this.size = size;
  let i;

  if ( fast ) {
    this.entries = filler;
  }
  else {
    if ( !filler ) {
      filler = 0;
    }

    // entries stored in row-major format
    this.entries = new ArrayType( size );

    if ( isArray( filler ) ) {
      assert && assert( filler.length === size );

      for ( i = 0; i < size; i++ ) {
        this.entries[ i ] = filler[ i ];
      }
    }
    else {
      for ( i = 0; i < size; i++ ) {
        this.entries[ i ] = filler;
      }
    }
  }
}

dot.register( 'Matrix', Matrix );

/** sqrt(a^2 + b^2) without under/overflow. **/
Matrix.hypot = function hypot( a, b ) {
  let r;
  if ( Math.abs( a ) > Math.abs( b ) ) {
    r = b / a;
    r = Math.abs( a ) * Math.sqrt( 1 + r * r );
  }
  else if ( b !== 0 ) {
    r = a / b;
    r = Math.abs( b ) * Math.sqrt( 1 + r * r );
  }
  else {
    r = 0.0;
  }
  return r;
};

Matrix.prototype = {
  constructor: Matrix,

  copy: function() {
    const result = new Matrix( this.m, this.n );
    for ( let i = 0; i < this.size; i++ ) {
      result.entries[ i ] = this.entries[ i ];
    }
    return result;
  },

  getArray: function() {
    return this.entries;
  },

  getArrayCopy: function() {
    return new ArrayType( this.entries );
  },

  getRowDimension: function() {
    return this.m;
  },

  getColumnDimension: function() {
    return this.n;
  },

  // TODO: inline this places if we aren't using an inlining compiler! (check performance)
  index: function( i, j ) {
    return i * this.n + j;
  },

  /**
   * get the matrix element (i,j)
   * with the convention that row and column indices start at zero
   * @param {number} i - row index
   * @param {number} j - column index
   * @returns {number}
   */
  get: function( i, j ) {
    return this.entries[ this.index( i, j ) ];
  },

  /**
   * set the matrix element (i,j) to a value s
   * with the convention that row and column indices start at zero
   * @param {number} i - row index
   * @param {number} j - column index
   * @param {number} s - value of the matrix element
   */
  set: function( i, j, s ) {
    this.entries[ this.index( i, j ) ] = s;
  },

  getMatrix: function( i0, i1, j0, j1 ) {
    const result = new Matrix( i1 - i0 + 1, j1 - j0 + 1 );
    for ( let i = i0; i <= i1; i++ ) {
      for ( let j = j0; j <= j1; j++ ) {
        result.entries[ result.index( i - i0, j - j0 ) ] = this.entries[ this.index( i, j ) ];
      }
    }
    return result;
  },

  // getMatrix (int[] r, int j0, int j1)
  getArrayRowMatrix: function( r, j0, j1 ) {
    const result = new Matrix( r.length, j1 - j0 + 1 );
    for ( let i = 0; i < r.length; i++ ) {
      for ( let j = j0; j <= j1; j++ ) {
        result.entries[ result.index( i, j - j0 ) ] = this.entries[ this.index( r[ i ], j ) ];
      }
    }
    return result;
  },

  // allow passing in a pre-constructed matrix
  transpose: function( result ) {
    result = result || new Matrix( this.n, this.m );
    assert && assert( result.m === this.n );
    assert && assert( result.n === this.m );
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        result.entries[ result.index( j, i ) ] = this.entries[ this.index( i, j ) ];
      }
    }
    return result;
  },

  norm1: function() {
    let f = 0;
    for ( let j = 0; j < this.n; j++ ) {
      let s = 0;
      for ( let i = 0; i < this.m; i++ ) {
        s += Math.abs( this.entries[ this.index( i, j ) ] );
      }
      f = Math.max( f, s );
    }
    return f;
  },

  norm2: function() {
    return ( new dot.SingularValueDecomposition( this ).norm2() );
  },

  normInf: function() {
    let f = 0;
    for ( let i = 0; i < this.m; i++ ) {
      let s = 0;
      for ( let j = 0; j < this.n; j++ ) {
        s += Math.abs( this.entries[ this.index( i, j ) ] );
      }
      f = Math.max( f, s );
    }
    return f;
  },

  normF: function() {
    let f = 0;
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        f = Matrix.hypot( f, this.entries[ this.index( i, j ) ] );
      }
    }
    return f;
  },

  uminus: function() {
    const result = new Matrix( this.m, this.n );
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        result.entries[ result.index( i, j ) ] = -this.entries[ this.index( i, j ) ];
      }
    }
    return result;
  },

  plus: function( matrix ) {
    this.checkMatrixDimensions( matrix );
    const result = new Matrix( this.m, this.n );
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        const index = result.index( i, j );
        result.entries[ index ] = this.entries[ index ] + matrix.entries[ index ];
      }
    }
    return result;
  },

  plusEquals: function( matrix ) {
    this.checkMatrixDimensions( matrix );
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        const index = this.index( i, j );
        this.entries[ index ] = this.entries[ index ] + matrix.entries[ index ];
      }
    }
    return this;
  },

  /**
   * A linear interpolation between this Matrix (ratio=0) and another Matrix (ratio=1).
   * @public
   *
   * @param {Matrix} matrix
   * @param {number} ratio - Not necessarily constrained in [0, 1]
   * @returns {Matrix}
   */
  blendEquals: function( matrix, ratio ) {
    this.checkMatrixDimensions( matrix );
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        const index = this.index( i, j );
        const a = this.entries[ index ];
        const b = matrix.entries[ index ];
        this.entries[ index ] = a + ( b - a ) * ratio;
      }
    }
    return this;
  },

  minus: function( matrix ) {
    this.checkMatrixDimensions( matrix );
    const result = new Matrix( this.m, this.n );
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        const index = this.index( i, j );
        result.entries[ index ] = this.entries[ index ] - matrix.entries[ index ];
      }
    }
    return result;
  },

  minusEquals: function( matrix ) {
    this.checkMatrixDimensions( matrix );
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        const index = this.index( i, j );
        this.entries[ index ] = this.entries[ index ] - matrix.entries[ index ];
      }
    }
    return this;
  },

  arrayTimes: function( matrix ) {
    this.checkMatrixDimensions( matrix );
    const result = new Matrix( this.m, this.n );
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        const index = result.index( i, j );
        result.entries[ index ] = this.entries[ index ] * matrix.entries[ index ];
      }
    }
    return result;
  },

  arrayTimesEquals: function( matrix ) {
    this.checkMatrixDimensions( matrix );
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        const index = this.index( i, j );
        this.entries[ index ] = this.entries[ index ] * matrix.entries[ index ];
      }
    }
    return this;
  },

  arrayRightDivide: function( matrix ) {
    this.checkMatrixDimensions( matrix );
    const result = new Matrix( this.m, this.n );
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        const index = this.index( i, j );
        result.entries[ index ] = this.entries[ index ] / matrix.entries[ index ];
      }
    }
    return result;
  },

  arrayRightDivideEquals: function( matrix ) {
    this.checkMatrixDimensions( matrix );
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        const index = this.index( i, j );
        this.entries[ index ] = this.entries[ index ] / matrix.entries[ index ];
      }
    }
    return this;
  },

  arrayLeftDivide: function( matrix ) {
    this.checkMatrixDimensions( matrix );
    const result = new Matrix( this.m, this.n );
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        const index = this.index( i, j );
        result.entries[ index ] = matrix.entries[ index ] / this.entries[ index ];
      }
    }
    return result;
  },

  arrayLeftDivideEquals: function( matrix ) {
    this.checkMatrixDimensions( matrix );
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        const index = this.index( i, j );
        this.entries[ index ] = matrix.entries[ index ] / this.entries[ index ];
      }
    }
    return this;
  },

  times: function( matrixOrScalar ) {
    let result;
    let i;
    let j;
    let k;
    let s;
    let matrix;
    if ( matrixOrScalar.isMatrix ) {
      matrix = matrixOrScalar;
      if ( matrix.m !== this.n ) {
        throw new Error( 'Matrix inner dimensions must agree.' );
      }
      result = new Matrix( this.m, matrix.n );
      const matrixcolj = new ArrayType( this.n );
      for ( j = 0; j < matrix.n; j++ ) {
        for ( k = 0; k < this.n; k++ ) {
          matrixcolj[ k ] = matrix.entries[ matrix.index( k, j ) ];
        }
        for ( i = 0; i < this.m; i++ ) {
          s = 0;
          for ( k = 0; k < this.n; k++ ) {
            s += this.entries[ this.index( i, k ) ] * matrixcolj[ k ];
          }
          result.entries[ result.index( i, j ) ] = s;
        }
      }
      return result;
    }
    else {
      s = matrixOrScalar;
      result = new Matrix( this.m, this.n );
      for ( i = 0; i < this.m; i++ ) {
        for ( j = 0; j < this.n; j++ ) {
          result.entries[ result.index( i, j ) ] = s * this.entries[ this.index( i, j ) ];
        }
      }
      return result;
    }
  },

  timesEquals: function( s ) {
    for ( let i = 0; i < this.m; i++ ) {
      for ( let j = 0; j < this.n; j++ ) {
        const index = this.index( i, j );
        this.entries[ index ] = s * this.entries[ index ];
      }
    }
    return this;
  },

  solve: function( matrix ) {
    return ( this.m === this.n ? ( new dot.LUDecomposition( this ) ).solve( matrix ) :
             ( new dot.QRDecomposition( this ) ).solve( matrix ) );
  },

  solveTranspose: function( matrix ) {
    return this.transpose().solve( matrix.transpose() );
  },

  inverse: function() {
    return this.solve( Matrix.identity( this.m, this.m ) );
  },

  det: function() {
    return new dot.LUDecomposition( this ).det();
  },

  rank: function() {
    return new dot.SingularValueDecomposition( this ).rank();
  },

  cond: function() {
    return new dot.SingularValueDecomposition( this ).cond();
  },

  trace: function() {
    let t = 0;
    for ( let i = 0; i < Math.min( this.m, this.n ); i++ ) {
      t += this.entries[ this.index( i, i ) ];
    }
    return t;
  },

  checkMatrixDimensions: function( matrix ) {
    if ( matrix.m !== this.m || matrix.n !== this.n ) {
      throw new Error( 'Matrix dimensions must agree.' );
    }
  },

  toString: function() {
    let result = '';
    result += 'dim: ' + this.getRowDimension() + 'x' + this.getColumnDimension() + '\n';
    for ( let row = 0; row < this.getRowDimension(); row++ ) {
      for ( let col = 0; col < this.getColumnDimension(); col++ ) {
        result += this.get( row, col ) + ' ';
      }
      result += '\n';
    }
    return result;
  },

  // returns a vector that is contained in the specified column
  extractVector2: function( column ) {
    assert && assert( this.m === 2 ); // rows should match vector dimension
    return new dot.Vector2( this.get( 0, column ), this.get( 1, column ) );
  },

  // returns a vector that is contained in the specified column
  extractVector3: function( column ) {
    assert && assert( this.m === 3 ); // rows should match vector dimension
    return new dot.Vector3( this.get( 0, column ), this.get( 1, column ), this.get( 2, column ) );
  },

  // returns a vector that is contained in the specified column
  extractVector4: function( column ) {
    assert && assert( this.m === 4 ); // rows should match vector dimension
    return new dot.Vector4( this.get( 0, column ), this.get( 1, column ), this.get( 2, column ), this.get( 3, column ) );
  },

  // Sets the current matrix to the values of the listed column vectors (Vector3).
  setVectors3: function( vectors ) {
    const m = 3;
    const n = vectors.length;

    assert && assert( this.m === m );
    assert && assert( this.n === n );

    for ( let i = 0; i < n; i++ ) {
      const vector = vectors[ i ];
      this.entries[ i ] = vector.x;
      this.entries[ i + n ] = vector.y;
      this.entries[ i + 2 * n ] = vector.z;
    }

    return this;
  },

  isMatrix: true
};

Matrix.identity = function( m, n ) {
  const result = new Matrix( m, n );
  for ( let i = 0; i < m; i++ ) {
    for ( let j = 0; j < n; j++ ) {
      result.entries[ result.index( i, j ) ] = ( i === j ? 1.0 : 0.0 );
    }
  }
  return result;
};

/**
 * Returns a square diagonal matrix, whose entries along the diagonal are specified by the passed-in array, and the
 * other entries are 0.
 * @public
 *
 * @param {Array.<number>} diagonalValues
 * @returns {Matrix}
 */
Matrix.diagonalMatrix = function( diagonalValues ) {
  const n = diagonalValues.length;
  const result = new Matrix( n, n ); // Should fill in zeros
  for ( let i = 0; i < n; i++ ) {
    result.entries[ result.index( i, i ) ] = diagonalValues[ i ];
  }
  return result;
};

Matrix.rowVector2 = function( vector ) {
  return new Matrix( 1, 2, [ vector.x, vector.y ] );
};

Matrix.rowVector3 = function( vector ) {
  return new Matrix( 1, 3, [ vector.x, vector.y, vector.z ] );
};

Matrix.rowVector4 = function( vector ) {
  return new Matrix( 1, 4, [ vector.x, vector.y, vector.z, vector.w ] );
};

Matrix.rowVector = function( vector ) {
  if ( vector.isVector2 ) {
    return Matrix.rowVector2( vector );
  }
  else if ( vector.isVector3 ) {
    return Matrix.rowVector3( vector );
  }
  else if ( vector.isVector4 ) {
    return Matrix.rowVector4( vector );
  }
  else {
    throw new Error( 'undetected type of vector: ' + vector.toString() );
  }
};

Matrix.columnVector2 = function( vector ) {
  return new Matrix( 2, 1, [ vector.x, vector.y ] );
};

Matrix.columnVector3 = function( vector ) {
  return new Matrix( 3, 1, [ vector.x, vector.y, vector.z ] );
};

Matrix.columnVector4 = function( vector ) {
  return new Matrix( 4, 1, [ vector.x, vector.y, vector.z, vector.w ] );
};

Matrix.columnVector = function( vector ) {
  if ( vector.isVector2 ) {
    return Matrix.columnVector2( vector );
  }
  else if ( vector.isVector3 ) {
    return Matrix.columnVector3( vector );
  }
  else if ( vector.isVector4 ) {
    return Matrix.columnVector4( vector );
  }
  else {
    throw new Error( 'undetected type of vector: ' + vector.toString() );
  }
};

/**
 * Create a Matrix where each column is a vector
 */

Matrix.fromVectors2 = function( vectors ) {
  const dimension = 2;
  const n = vectors.length;
  const data = new ArrayType( dimension * n );

  for ( let i = 0; i < n; i++ ) {
    const vector = vectors[ i ];
    data[ i ] = vector.x;
    data[ i + n ] = vector.y;
  }

  return new Matrix( dimension, n, data, true );
};

Matrix.fromVectors3 = function( vectors ) {
  const dimension = 3;
  const n = vectors.length;
  const data = new ArrayType( dimension * n );

  for ( let i = 0; i < n; i++ ) {
    const vector = vectors[ i ];
    data[ i ] = vector.x;
    data[ i + n ] = vector.y;
    data[ i + 2 * n ] = vector.z;
  }

  return new Matrix( dimension, n, data, true );
};

Matrix.fromVectors4 = function( vectors ) {
  const dimension = 4;
  const n = vectors.length;
  const data = new ArrayType( dimension * n );

  for ( let i = 0; i < n; i++ ) {
    const vector = vectors[ i ];
    data[ i ] = vector.x;
    data[ i + n ] = vector.y;
    data[ i + 2 * n ] = vector.z;
    data[ i + 3 * n ] = vector.w;
  }

  return new Matrix( dimension, n, data, true );
};

export default Matrix;