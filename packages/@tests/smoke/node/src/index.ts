import '@fluencelabs/js-client.node';
import { runTest } from '@test/aqua_for_test';

runTest().then(() => console.log('Smoke tests succeed!'));
