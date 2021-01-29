import { Effection } from '../src/index';
import { beforeEach } from 'mocha';

beforeEach(async () => {
  await Effection.reset();
});

