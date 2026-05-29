// Export the platform's native DOMException as recommended by Node.js 18+
module.exports = typeof globalThis !== 'undefined' && globalThis.DOMException 
  ? globalThis.DOMException 
  : typeof global !== 'undefined' && global.DOMException 
    ? global.DOMException 
    : Error;
