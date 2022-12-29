import { ApolloCache, gql } from '@apollo/client';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import React, { useState } from 'react';
import {
  RegularPostFragment,
  useVoteMutation,
  VoteMutation,
} from '../generated/graphql';

interface UpdootSectionProps {
  post: RegularPostFragment;
}

const updateAfterVote = (
  value: number,
  postId: number,
  cache: ApolloCache<VoteMutation>
) => {
  const data = cache.readFragment<{
    id: number;
    points: number;
    voteStatus: null | number;
  }>({
    id: 'Post:' + postId,
    fragment: gql`
      fragment _ on Post {
        id
        points
        voteStatus
      }
    `,
  });

  if (data) {
    if (data.voteStatus === value) {
      return;
    }
    const newPoints =
      (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
    cache.writeFragment({
      id: 'Post:' + postId,
      fragment: gql`
        fragment __ on Post {
          points
          voteStatus
        }
      `,
      data: { points: newPoints, voteStatus: value },
    });
  }
};

const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
  const [vote] = useVoteMutation();
  const [loadingState, setLoadingState] = useState<
    'updoot-loading' | 'downdoot-loading' | 'not-loading'
  >('not-loading');

  return (
    <Flex direction="column" justifyContent="center" alignItems="center" mr={4}>
      <IconButton
        onClick={async () => {
          if (post.voteStatus === 1) {
            return;
          }
          setLoadingState('updoot-loading');
          await vote({
            variables: {
              postId: post.id,
              value: 1,
            },
            update: (cache) => updateAfterVote(1, post.id, cache),
          });
          setLoadingState('not-loading');
        }}
        isLoading={loadingState === 'updoot-loading'}
        aria-label="updoot post"
        colorScheme={post.voteStatus === 1 ? 'green' : undefined}
        icon={<ChevronUpIcon></ChevronUpIcon>}
      />
      {post.points}
      <IconButton
        onClick={async () => {
          if (post.voteStatus === -1) {
            return;
          }
          setLoadingState('downdoot-loading');
          await vote({
            variables: {
              postId: post.id,
              value: -1,
            },
            update: (cache) => updateAfterVote(-1, post.id, cache),
          });
          setLoadingState('not-loading');
        }}
        colorScheme={post.voteStatus === -1 ? 'red' : undefined}
        isLoading={loadingState === 'downdoot-loading'}
        aria-label="downdoot post"
        icon={<ChevronDownIcon></ChevronDownIcon>}
      />
    </Flex>
  );
};

export default UpdootSection;
