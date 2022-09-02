import { Arg, Mutation, Query, Resolver } from 'type-graphql';
import { Post } from '../entities/Post';
import { UpdatePostInput } from './types/post-input';

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts(): Promise<Post[]> {
    return Post.find();
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id') id: number): Promise<Post | null> {
    return Post.findOne({ where: { id } });
  }

  @Mutation(() => Post)
  async createPost(@Arg('title') title: string): Promise<Post> {
    return Post.create({ title }).save();
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(@Arg('data') postInput: UpdatePostInput): Promise<Post | null> {
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
