import { changePasswordSchema } from '@/core/schemas/auth.schemas';

const valid = {
  currentPassword: 'Old12345',
  newPassword: 'Brandnew123',
  confirmPassword: 'Brandnew123',
};
const errorPaths = (values: object) => {
  const result = changePasswordSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
};

describe('changePasswordSchema', () => {
  it('accepts a good new password that is typed twice', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('asks for the current password and applies the sign-up password rules', () => {
    expect(errorPaths({ ...valid, currentPassword: '' })).toContain('currentPassword');
    expect(errorPaths({ ...valid, newPassword: 'short1', confirmPassword: 'short1' })).toContain(
      'newPassword',
    );
    expect(
      errorPaths({ ...valid, newPassword: 'nodigitshere', confirmPassword: 'nodigitshere' }),
    ).toContain('newPassword');
  });

  it('flags a confirmation that does not match', () => {
    expect(errorPaths({ ...valid, confirmPassword: 'Different123' })).toEqual(['confirmPassword']);
  });
});
