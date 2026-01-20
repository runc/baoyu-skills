import { generateDoubaoImage } from './doubao-image-client.js';

const result = await generateDoubaoImage({
  prompt: 'A cute cat sitting on a windowsill, simple illustration style',
  model: 'doubao-seedream-4.5',
  outputPath: '/tmp/doubao-test.png',
  size: '2048x2048',
});

console.log('Result:', result);
