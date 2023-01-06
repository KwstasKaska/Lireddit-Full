import { useApolloClient } from '@apollo/client';
import { Box, Button, Flex, Heading, Link } from '@chakra-ui/react';
import React from 'react';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';

interface NavBarProps {}

const NavBar: React.FC<NavBarProps> = ({}) => {
  const [logout, { loading: logoutLoading }] = useLogoutMutation();
  const { loading, data } = useMeQuery();
  const apolloClient = useApolloClient();

  let body = null;
  // data is loading
  if (loading) {
  }
  // user not logged in
  else if (!data?.me) {
    body = (
      <>
        <Link color={'white'} mr={2} href="/login">
          Login
        </Link>
        <Link color={'white'} href="/register">
          Register
        </Link>
      </>
    );
  }
  // user is logged in
  else {
    body = (
      <Flex align="center">
        <Button mr={4} as={Link}>
          Create Post
        </Button>
        <Box>{data.me.username}</Box>
        <Button
          onClick={async () => {
            await logout();
            apolloClient.resetStore();
          }}
          isLoading={logoutLoading}
          variant="link"
        >
          Logout
        </Button>
      </Flex>
    );
  }
  return (
    <Flex zIndex={1} position="sticky" top={0} bg="tan" p={4} align="center">
      <Link href="/">
        <Heading>LiReddit</Heading>
      </Link>
      <Box ml={'auto'}>{body}</Box>
    </Flex>
  );
};

export default NavBar;
