import { isBrowser } from 'browser-or-node';
import { Buffer as BufferPolyfill } from 'buffer';

export default isBrowser ? Buffer : BufferPolyfill;
