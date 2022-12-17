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
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';
import { GetPostsArgs, PostInput, UpdatePostInput } from './types/post-input';
import { PaginatedPosts } from './types/post-object';

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @Query(() => PaginatedPosts)
  async posts(
    // @Arg('limit', () => Int) limit: number,
    // @Arg('cursor', () => String, { nullable: true }) cursor: string | null
    @Args() { limit, cursor }: GetPostsArgs
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    // const replacements: any[] = [realLimitPlusOne];
    // if (cursor) {
    //   replacements.push(new Date(parseInt(cursor)));
    // }

    const qb = AppDataSource.getRepository(Post)
      .createQueryBuilder('p')
      .orderBy('"createdAt"', 'DESC')
      .take(realLimitPlusOne);

    if (cursor) {
      qb.where('"createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }
    const posts = await qb.getMany();
    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
    // const posts = await AppDataSource.query(
    //   `
    //   select p.*
    // from post p
    // ${cursor ? 'where p."createdAt" < $2' : null}
    // order by p."createdAt" DESC
    // limit $1
    // `,
    //   replacements
    // );

    // return {
    //   posts: posts.slice(0, realLimit),
    //   hasMore: posts.length === realLimitPlusOne,
    // };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id') id: number): Promise<Post | null> {
    return Post.findOne({ where: { id } });
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
