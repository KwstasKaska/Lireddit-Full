import { Box, Heading } from '@chakra-ui/react';
import { NextPage } from 'next';
import Layout from '../../components/Layout';
import { useGetPostFromUrl } from '../../utils/useGetPostFromUrl';

// I need to do ssr on this too
const Post: NextPage = ({}) => {
  const { data, loading, error } = useGetPostFromUrl();

  if (loading) {
    return (
      <Layout>
        <div>loading...</div>
      </Layout>
    );
  }
  if (error) {
    return <div>{error.message}</div>;
  }
  if (!data?.post) {
    return (
      <Layout>
        <Box>could not find post</Box>
      </Layout>
    );
  }
  return (
    <Layout>
      <Heading>{data?.post?.title}</Heading>
      {data?.post?.text}
    </Layout>
  );
};

export default Post;
