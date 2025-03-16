// library-frontend/src/App.jsx
import { useState, useEffect } from "react";
import { useApolloClient, useQuery, useSubscription } from '@apollo/client';
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import BirthYearForm from "./components/BirthYearForm";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import RecommendedBooks from "./components/RecommendedBooks";
import { ME, ALL_BOOKS, ALL_AUTHORS, BOOK_ADDED } from './queries';

const Notify = ({ errorMessage }) => {
  if (!errorMessage) return null;
  return <div style={{ color: 'red', padding: '10px', border: '1px solid red', marginBottom: '10px' }}>{errorMessage}</div>;
};

const App = () => {
  const [page, setPage] = useState('login');
  const [errorMessage, setErrorMessage] = useState(null);
  const [token, setToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const client = useApolloClient();
  
  const userResult = useQuery(ME, {
    skip: !token
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('library-user-token');
    if (savedToken) {
      setToken(savedToken);
      setPage('authors');
    }
  }, []);

  const notify = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  // Function to update cache when a new book is added
  const updateCacheWith = (addedBook) => {
    try {
      // Helper function to check if the book is already in the cache
      const includedIn = (set, object) => 
        set.map(b => b.id).includes(object.id);
    
      // Try to update the unfiltered view
      try {
        const booksInCache = client.readQuery({ 
          query: ALL_BOOKS,
          variables: { genre: null }
        });
        
        if (booksInCache && !includedIn(booksInCache.allBooks, addedBook)) {
          client.writeQuery({
            query: ALL_BOOKS,
            variables: { genre: null },
            data: { 
              allBooks: [...booksInCache.allBooks, addedBook] 
            }
          });
        }
      } catch (e) {
        console.log('Cache not initialized for all books yet');
      }

      // Just to be extra safe, manually refetch queries
      // This ensures data is updated even if cache operations fail
      client.refetchQueries({
        include: ['allBooks', 'allAuthors']
      });
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  };
  
  // Set up subscription for new books
  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      try {
        const addedBook = data.data.bookAdded;
        
        // Notify user about the new book (Exercise 8.24)
        const notificationMsg = `New book added: ${addedBook.title} by ${addedBook.author.name}`;
        console.log(notificationMsg);
        showNotification(notificationMsg);
        
        // Update cache (Exercise 8.25)
        updateCacheWith(addedBook);
      } catch (error) {
        console.error('Error processing subscription data:', error);
      }
    },
    onError: (error) => {
      console.error('Subscription error:', error);
      notify('Error with book subscription');
    }
  });

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
    setPage('login');
    notify('You have been logged out successfully');
  };

  // Show login page as default if not logged in
  if (!token && page !== 'login' && page !== 'signup') {
    setPage('login');
  }

  return (
    <div>
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        {token ? (
          <>
            <button onClick={() => setPage("authors")}>authors</button>
            <button onClick={() => setPage("books")}>books</button>
            <button onClick={() => setPage("add")}>add book</button>
            <button onClick={() => setPage("birthyear")}>set birthyear</button>
            <button onClick={() => setPage("recommend")}>recommend</button>
            <button onClick={logout}>logout</button>
          </>
        ) : (
          <>
            <button onClick={() => setPage("login")}>login</button>
            <button onClick={() => setPage("signup")}>signup</button>
          </>
        )}
      </div>

      {/* Error messages */}
      <Notify errorMessage={errorMessage} />
      
      {/* Book added notification */}
      {notification && (
        <div style={{ color: 'green', padding: '10px', border: '1px solid green', marginBottom: '10px' }}>
          {notification}
        </div>
      )}

      <Authors show={token && page === "authors"} />
      <Books show={token && page === "books"} />
      <NewBook 
        show={token && page === "add"} 
        setError={notify} 
        updateCacheWith={updateCacheWith} 
      />
      <BirthYearForm show={token && page === "birthyear"} setError={notify} />
      <LoginForm 
        show={page === "login"} 
        setToken={setToken} 
        setPage={setPage} 
        setError={notify} 
      />
      <SignupForm show={page === "signup"} setPage={setPage} setError={notify} />
      <RecommendedBooks show={token && page === "recommend"} />
    </div>
  );
};

export default App;