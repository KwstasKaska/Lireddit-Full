import { PostInput } from '../resolvers/types/post-input';

export const validatePost = (input: PostInput) => {
  if (!input.text) {
    return [
      {
        field: 'text',
        message: 'Insert a text',
      },
    ];
  }
  if (!input.title) {
    return [
      {
        field: 'title',
        message: 'Insert a title',
      },
    ];
  }
  return null;
};
