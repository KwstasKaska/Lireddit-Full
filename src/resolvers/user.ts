import { Arg, Mutation, Resolver } from 'type-graphql';
import { UsernamePasswordInput } from './types/user-input';
// import { MyContext } from '../types';
import argon2 from 'argon2';
import { User } from '../entities/User';
import { UserResponse } from './types/user-object';

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput
    // @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: 'username',
            message: 'length must be greater than 2',
          },
        ],
      };
    }
    if (options.password.length <= 3) {
      return {
        errors: [
          {
            field: 'password',
            message: 'length must be greater than 2',
          },
        ],
      };
    }
    const hashedPassword = await argon2.hash(options.password);
    const user = User.create({
      username: options.username,
      password: hashedPassword,
    });

    try {
      await user.save();
    } catch (err) {
      if (err.code === '23505') {
        return {
          errors: [
            {
              field: 'username',
              message: 'username already taken',
            },
          ],
        };
      }
    }
    return { user } as any;
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: UsernamePasswordInput
    // @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { username: options.username } });
    if (!user) {
      errors: [
        {
          field: 'username',
          message: 'That username doesnt exist',
        },
      ];
    }
    const valid = await argon2.verify(user!.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password',
          },
        ],
      };
    }

    return { user } as any;
  }
}
