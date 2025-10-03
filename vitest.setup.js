// JSDOM fetch mock will be provided in individual tests as needed.
// Ensure TextEncoder/TextDecoder exist for some environments.
import { TextEncoder, TextDecoder } from 'node:util';
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

