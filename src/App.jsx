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

  // Function to update cache when a new book is added
  const updateCacheWith = (addedBook) => {
    // Helper function to check if the book is already in the cache
    const includedIn = (set, object) => 
      set.map(b => b.id).includes(object.id);
    
    try {
      // Update allBooks cache
      const booksInCache = client.readQuery({ 
        query: ALL_BOOKS,
        variables: { genre: null } // Update the unfiltered view
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
    } catch (error) {
      console.error('Error updating unfiltered cache:', error);
      // This might fail if the query hasn’t been run yet, which is okay
    }

    // 2. Update all genre-specific views that match the new book's genres
    addedBook.genres.forEach(genre => {
      try {
        const genreBooks = client.readQuery({ 
          query: ALL_BOOKS,
          variables: { genre }
        });
        if (genreBooks && !includedIn(genreBooks.allBooks, addedBook)) {
          client.writeQuery({
            query: ALL_BOOKS,
            variables: { genre },
            data: { 
              allBooks: [...genreBooks.allBooks, addedBook] 
            }
          });
        }
      } catch (error) {
        // Cache might not exist for this genre yet, so we ignore the error
      }
    });

    // 3. Update author's book count in ALL_AUTHORS (keeping your existing logic)
    try {
      const authorsInCache = client.readQuery({ query: ALL_AUTHORS });
      if (authorsInCache) {
        const updatedAuthors = authorsInCache.allAuthors.map(author => {
          if (author.name === addedBook.author.name) {
            return { ...author, bookCount: author.bookCount + 1 };
          }
          return author;
        });
        client.writeQuery({
          query: ALL_AUTHORS,
          data: { allAuthors: updatedAuthors }
        });
      }
    } catch (error) {
      console.error('Error updating authors cache:', error);
    }
  };
  
  // Set up subscription for new books
  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      const addedBook = data.data.bookAdded;
      
      // Notify user about the new book (Exercise 8.24)
      window.alert(`New book added: ${addedBook.title} by ${addedBook.author.name}`);
      
      // Update cache to keep views in sync (Exercise 8.25)
      updateCacheWith(addedBook);
    }
  });

  const logout = () => {
    // Clear token state
    setToken(null);
    
    // Clear local storage
    localStorage.clear();
    
    // Reset Apollo store
    client.resetStore();
    
    // Navigate to login page
    setPage('login');
    
    // Show logout confirmation (optional)
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

      <Notify errorMessage={errorMessage} />

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