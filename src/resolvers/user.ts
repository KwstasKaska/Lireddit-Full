import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { UsernamePasswordInput } from './types/user-input';
import argon2 from 'argon2';
import { User } from '../entities/User';
import { UserResponse } from './types/user-object';
import { MyContext } from '../types';
import AppDataSource from '../app-data-source';

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext) {
    // you are not logged in
    if (!req.session.userId) {
      return null;
    }
    const user = await User.findOne({ where: { id: req.session.userId } });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
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
    if (options.password.length <= 2) {
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
    let user;

    try {
      const result = await AppDataSource.createQueryBuilder()
        .insert()
        .into(User)
        .values({ username: options.username, password: hashedPassword })
        .returning('*')
        .execute();

      user = result.raw[0];
    } catch (err) {
      // duplicate username error
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

    //store user id session
    // this will set a cookie on the user
    // keep them logged in
    req.session.userId = user.id;
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
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

    req.session.userId = user!.id;

    return { user } as any;
  }

  @Mutation(() => Boolean)
  logout() {}
}
