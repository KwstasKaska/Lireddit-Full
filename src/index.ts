import 'reflect-metadata';
import { COOKIE_NAME, __prod__ } from './constants';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import bodyParser from 'body-parser';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import AppDataSource from './app-data-source';
import { UserResolver } from './resolvers/user';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { createClient } from 'redis';
import { __secretKey__ } from './env-var';
import cors from 'cors';
import { createServer } from 'http';
import { MyContext } from './types';

const main = async () => {
  // In order to interact with the database and hold my db connection settings, i have to initialize dataSource
  AppDataSource.initialize()
    .then(() => {
      console.log('Data Source has been initialized!');
    })
    .catch((err) => {
      console.error('Error during Data Source initialization', err);
    });

  // I create the express server
  const app = express();
  const httpServer = createServer(app);

  // I connect with redis in order to make faster queries in the server side in addition with my cookie
  let RedisStore = connectRedis(session);
  let redisClient = createClient({
    url: process.env.REDIS_URL,
    legacyMode: true,
  });
  redisClient.connect().then(async () => {
    console.log('connected');
  });

  // I define my cookie and it's settings
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redisClient,
        disableTTL: true,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10years
        httpOnly: true,
        sameSite: 'lax', //csrf
        secure: __prod__, // cookie only works in https
      },
      saveUninitialized: false,
      secret: __secretKey__,
      resave: false,
    })
  );

  // I create an apollo server instance in order to create my schema and the resolvers using typegraphql

  const apolloServer = new ApolloServer<MyContext>({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
      emitSchemaFile: {
        path: __dirname + '/schema.gql',
        sortedSchema: false, // by default the printed schema is sorted alphabetically
      },
    }),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  // I start my server
  await apolloServer.start();

  // I declare my cors and expressMiddleware in order for me to use apollo-express-server
  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: 'http://localhost:3000',
      credentials: true,
    }),
    bodyParser.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => ({ req, res }),
    })
  );

  // I define the port of the server
  httpServer.listen(4000, () => {
    console.log('Server started on localhost:4000/graphql');
  });
};

main().catch((err) => {
  console.error(err);
});
