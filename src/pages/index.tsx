import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react';
import Link from 'next/link';
import { GetServerSidePropsContext, NextPage } from 'next';
import Layout from '../components/Layout';
import UpdootSection from '../components/UpdootSection';
import {
  PostsDocument,
  useDeletePostMutation,
  usePostsQuery,
} from '../generated/graphql';
import { addApolloState, initializeApollo } from '../lib/apolloClient';
import { DeleteIcon } from '@chakra-ui/icons';

// a function that i use in order to do SSR for the query of posts
export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const client = initializeApollo({ headers: context.req.headers });
  await client.query({
    query: PostsDocument,
  });
  return addApolloState(client, {
    props: {},
  });
};

const Index: NextPage = () => {
  const { data, loading, fetchMore, variables } = usePostsQuery({
    variables: {
      limit: 20,
      cursor: null,
    },
    notifyOnNetworkStatusChange: true,
  });

  const [deletePost] = useDeletePostMutation();

  if (!loading && !data) {
    return <div>you got query failed for some reason</div>;
  }

  return (
    <Layout>
      {!data && loading ? (
        <div>loading...</div>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((p) => (
            <Flex p={5} shadow="md" borderWidth="1px" key={p.id}>
              <UpdootSection post={p} />
              <Box flex={1}>
                <Link
                  href={{
                    pathname: '/post/[id]',
                    query: { id: p.id },
                  }}
                >
                  <Heading fontSize="xl">{p.title}</Heading>
                </Link>
                <Text>posted by {p.creator.username}</Text>
                <Flex align="center">
                  <Text flex={1} mt={4}>
                    {p.textSnippet}
                  </Text>
                  <IconButton
                    aria-label="Delete Post"
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    onClick={() => {
                      deletePost({
                        variables: { id: p.id },
                        // this gonna look like Post:1 or Post:505
                        update: (cache) => {
                          cache.evict({ id: 'Post:' + p.id });
                        },
                      });
                    }}
                  ></IconButton>
                </Flex>
              </Box>
            </Flex>
          ))}
        </Stack>
      )}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button
            onClick={() => {
              fetchMore({
                variables: {
                  limit: variables?.limit,
                  cursor:
                    data.posts.posts[data.posts.posts.length - 1].createdAt,
                },
              });
            }}
            isLoading={loading}
            m="auto"
            my={8}
          >
            Load more
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default Index;
