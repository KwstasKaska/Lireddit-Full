import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { PaginatedPosts } from '../../generated/graphql';

const client = new ApolloClient({
  ssrMode: typeof window === 'undefined',
  link: new HttpLink({
    uri: 'http://localhost:4000/graphql',
    credentials: 'include',
  }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            // Don't cache separate results based on
            // any of this field's arguments.
            keyArgs: false,

            // Concatenate the incoming list items with
            // the existing list items.
            merge(
              existing: PaginatedPosts | undefined,
              incoming: PaginatedPosts
            ): PaginatedPosts {
              console.log(existing, incoming);
              return {
                ...incoming,
                posts: [...(existing?.posts || []), ...incoming?.posts],
              };
            },
          },
        },
      },
    },
  }),
});

export default client;
