/* eslint-disable */
import SimLauncher from '../../joist/js/SimLauncher.js';
const image = new Image();
const unlock = SimLauncher.createLock( image );
image.onload = unlock;
image.src = 'data:image/png;base64,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';
export default image;