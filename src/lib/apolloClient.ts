import { useMemo } from 'react';
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
  NormalizedCacheObject,
} from '@apollo/client';
import merge from 'deepmerge';
import isEqual from 'lodash/isEqual';
import { SchemaLink } from '@apollo/client/link/schema';
import { PaginatedPosts } from '../generated/graphql';

export const APOLLO_STATE_PROP_NAME = '__APOLLO_STATE__';

let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

type SchemaContext =
  | SchemaLink.ResolverContext
  | SchemaLink.ResolverContextFunction
  | undefined;

// const createIsomorphicLink = async (ctx: SchemaContext | undefined) => {
//   // If we are on the server
//   if (typeof window === 'undefined') {
//     const { schema } = require('../generated/graphql');
//     return new SchemaLink({
//       schema,
//       context: ctx,
//     });
//   }
//   // if we are on client
//   const httpLink = new HttpLink({
//     uri: process.env.SCHEMA_PATH,
//     credentials: 'include',
//   });
//   return from([httpLink]);
// };

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include',
});

function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: from([httpLink]),
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
}

interface InitApollo {
  initialState?: any;
  ctx?: SchemaContext;
}

export function initializeApollo({ initialState }: InitApollo) {
  const _apolloClient = apolloClient ?? createApolloClient();

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract();

    // Merge the initialState from getStaticProps/getServerSideProps in the existing cache
    const data = merge(existingCache, initialState, {
      // combine arrays using object equality (like in sets)
      arrayMerge: (destinationArray, sourceArray) => [
        ...sourceArray,
        ...destinationArray.filter((d) =>
          sourceArray.every((s) => !isEqual(d, s))
        ),
      ],
    });

    // Restore the cache with the merged data
    _apolloClient.cache.restore(data);
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

export function addApolloState(
  client: ApolloClient<NormalizedCacheObject> | null,
  pageProps: { props: any }
) {
  pageProps.props[APOLLO_STATE_PROP_NAME] = client?.cache.extract();

  return pageProps;
}

export function useApollo(pageProps: any) {
  const state = pageProps[APOLLO_STATE_PROP_NAME];
  const store = useMemo(
    () => initializeApollo({ initialState: state }),
    [state]
  );
  return store;
}
