import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@ObjectType()
@Entity() //It shows that this class is a db table
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn() //This shows that the fields below its one property tag are columns of the table
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column({ type: 'text' })
  title!: string;
}
