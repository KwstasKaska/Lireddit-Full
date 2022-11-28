import { UsernamePasswordInput } from '../resolvers/types/user-input';

export const validateRegister = (options: UsernamePasswordInput) => {
  if (!options.email.includes('@')) {
    return [
      {
        field: 'email',
        message: 'You must specify a correct email',
      },
    ];
  }

  if (options.username.length <= 2) {
    return [
      {
        field: 'username',
        message: 'length must be greater than 2',
      },
    ];
  }
  if (options.username.includes('@')) {
    return [
      {
        field: 'username',
        message: 'cannot include an @ sign',
      },
    ];
  }
  if (options.password.length <= 2) {
    return [
      {
        field: 'password',
        message: 'length must be greater than 2',
      },
    ];
  }
  return null;
};
