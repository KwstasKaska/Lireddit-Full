import {
  Arg,
  Args,
  Ctx,
  FieldResolver,
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

// Here i create the resolver for the Post entity and inside it, there gonna be the structure of the queries and mutations that afterwards i am gonna pass them through graphql to the client.
@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Args() { limit, cursor }: GetPostsArgs
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    const posts = await AppDataSource.query(
      ` select p.* ,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'email', u.email
          ) creator
        from post p
        inner join public.user u ON u.id = p."creatorId"
        ${cursor ? 'where p."createdAt" < $2' : ''}
        order by p."createdAt" DESC
        limit $1
      `,
      replacements
    );

    // console.log(posts);

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
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
