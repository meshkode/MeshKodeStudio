// 🔴 INTENTIONAL FAILING TEST FOR CI TESTING 🔴
describe('CI Test Demo', () => {
  it('should fail to demonstrate CI catching test failures', () => {
    // This test will always fail
    expect(1 + 1).toBe(3); // Wrong! 1 + 1 = 2, not 3
  });

  it('should pass normally', () => {
    expect(true).toBe(true);
  });
});
