import {
  Arg,
  Args,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import AppDataSource from '../app-data-source';
import { Post } from '../entities/Post';
import { Updoot } from '../entities/Updoot';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';
import { GetPostsArgs, PostInput, UpdatePostInput } from './types/post-input';
import { PaginatedPosts } from './types/post-object';

// Here i create the resolver for the Post entity and inside it, there gonna be the structure of the queries and mutations that afterwards i am gonna pass them through graphql to the client.
@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // the user has voted on the post before
    // an they are changing their vote
    if (updoot && updoot.value !== realValue) {
      await AppDataSource.transaction(async (tm) => {
        await tm.query(`
          update updoot 
          set value = ${realValue}
          where "postId" = ${postId} and "userId" = ${userId};
        `);
        await tm.query(`
          update post 
          set points = points + ${2 * realValue}
          where id = ${postId};
        `);
      });
    } else if (!updoot) {
      // has never voted before
      await AppDataSource.transaction(async (tm) => {
        await tm.query(` 
        insert into updoot("userId", "postId", value)
        values(${userId}, ${postId}, ${realValue});
        `);

        await tm.query(`
        update post 
        set points = points + ${realValue}
        where id = ${postId};
        `);
      });
    }

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Args() { limit, cursor }: GetPostsArgs,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];
    if (req.session.userId) {
      replacements.push(req.session.userId);
    }
    let cursorIdx = 3;
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
      cursorIdx = replacements.length;
    }
    const posts = await AppDataSource.query(
      ` select p.* ,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'email', u.email
          ) creator,
          ${
            req.session.userId
              ? '(select value from updoot where "userId" = $2 and "postId" = p.id ) "voteStatus"'
              : 'null as "voteStatus"'
          }
        from post p
        inner join public.user u ON u.id = p."creatorId"
        ${cursor ? `where p."createdAt" < $${cursorIdx}` : ''}
        order by p."createdAt" DESC
        limit $1
      `,
      replacements
    );

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id', () => Int) id: number): Promise<Post | null> {
    return Post.findOne({ where: { id }, relations: ['creator'] });
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('data') postInput: UpdatePostInput
  ): Promise<Post | null> {
    const post = await Post.findOne({ where: { id: postInput.id } });
    if (!post) {
      return null;
    }
    if (typeof postInput.title !== 'undefined') {
      await Post.update({ id: postInput.id }, { title: postInput.title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg('id') id: number): Promise<boolean> {
    await Post.delete(id);
    return true;
  }
}
