// @ts-nocheck
/**
 * Shaka Player reads browser globals (navigator.userAgent, navigator.vendor,
 * document, ...) the moment its file is loaded. Amazon's ShakaPlayer.ts
 * installs its polyfills only after importing Shaka, which crashes on Vega
 * ("Cannot read property 'includes' of undefined"). This file must be
 * imported before ShakaPlayer so everything exists first.
 */
import Document from '../polyfills/DocumentPolyfill';
import Element from '../polyfills/ElementPolyfill';
import TextDecoderPolyfill from '../polyfills/TextDecoderPolyfill';
import W3CMediaPolyfill from '../polyfills/W3CMediaPolyfill';
import MiscPolyfill from '../polyfills/MiscPolyfill';

declare const global: any;

global.navigator = global.navigator ?? {};
global.navigator.userAgent = global.navigator.userAgent || 'AFTCA001';
global.navigator.vendor = global.navigator.vendor || '';
global.navigator.platform = global.navigator.platform || '';
global.navigator.appVersion = global.navigator.appVersion || '';

Document.install();
Element.install();
TextDecoderPolyfill.install();
W3CMediaPolyfill.install();
MiscPolyfill.install();
