import { ArgsType, Field, InputType, Int } from 'type-graphql';
import { Post } from '../../entities/Post';

@InputType()
export class UpdatePostInput implements Partial<Post> {
  @Field()
  id: number;

  @Field({ nullable: true })
  title: string;
}

@InputType()
export class PostInput implements Partial<Post> {
  @Field()
  title: string;

  @Field()
  text: string;
}

@ArgsType()
export class GetPostsArgs {
  @Field(() => Int, { nullable: true, defaultValue: 10 })
  limit: number;

  @Field(() => String, { nullable: true })
  cursor: string | null;
}
