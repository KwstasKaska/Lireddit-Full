import 'reflect-metadata';
import { __prod__ } from './constants';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import AppDataSource from './app-data-source';
import { UserResolver } from './resolvers/user';
import { createClient } from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { __secretKey__ } from './env-var';

const main = async () => {
  AppDataSource.initialize()
    .then(() => {
      console.log('Data Source has been initialized!');
    })
    .catch((err) => {
      console.error('Error during Data Source initialization', err);
    });

  const app = express();

  const RedisStore = connectRedis(session);
  const redisClient = createClient({ legacyMode: true });
  redisClient.connect().catch(console.error);

  app.use(
    session({
      name: 'qid',
      store: new RedisStore({ client: redisClient }),
      saveUninitialized: false,
      secret: __secretKey__,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground],
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log('Server started on localhost:4000');
  });
};

main().catch((err) => {
  console.error(err);
});
