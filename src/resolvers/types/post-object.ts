import { Field, ObjectType } from 'type-graphql';
import { Post } from '../../entities/Post';
import { FieldError } from './user-object';

@ObjectType()
export class PostResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Post)
  post?: Post;
}

@ObjectType()
export class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}
