import { Field, InputType } from 'type-graphql';
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
