// library-frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { 
  ApolloClient, 
  InMemoryCache, 
  ApolloProvider, 
  createHttpLink,
  split
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

// Create HTTP link with explicit URL
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

// Create WebSocket link for subscriptions - with better error handling
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql',
    connectionParams: () => {
      const token = localStorage.getItem('library-user-token');
      return token ? { authorization: `bearer ${token}` } : {};
    },
    // Add retry logic and better error handling
    retryAttempts: 5,
    retryWait: (retries) => new Promise((resolve) => 
      setTimeout(resolve, Math.min(1000 * (2 ** retries), 10000))
    ),
    shouldRetry: (error) => true,
    keepAlive: 10000, // Every 10 seconds
    on: {
      error: (error) => {
        console.error('WebSocket error:', error);
      },
      connected: () => {
        console.log('WebSocket connected');
      }
    }
  })
);

// Add authentication to requests
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('library-user-token');
  return {
    headers: {
      ...headers,
      authorization: token ? `bearer ${token}` : null,
    }
  };
});

// Split link based on operation type
// Use WebSocket link for subscriptions and HTTP link for queries/mutations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

// Create client with authentication and subscription support
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          allBooks: {
            // Make sure this correctly handles partial cache responses
            keyArgs: ['genre'],
            merge(existing = [], incoming) {
              return [...incoming];
            },
          },
          me: {
            // Don't cache the me query to ensure fresh data
            read(existing, { readField }) {
              return existing;
            }
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
  connectToDevTools: true // Enable Apollo dev tools
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);