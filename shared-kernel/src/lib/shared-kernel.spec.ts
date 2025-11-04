import { sharedKernel } from './shared-kernel';

describe('sharedKernel', () => {
  it('should work', () => {
    expect(sharedKernel()).toEqual('shared-kernel');
  });
});
