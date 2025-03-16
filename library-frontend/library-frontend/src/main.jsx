// library-frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { 
  ApolloClient, 
  InMemoryCache, 
  ApolloProvider, 
  createHttpLink
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Create HTTP link
const httpLink = createHttpLink({
  uri: 'http://localhost:4000',
});

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

// Create client with authentication
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          allBooks: {
            // Merge function for allBooks query with different variables
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
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);