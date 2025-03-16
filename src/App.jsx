// library-frontend/src/App.jsx
import { useState, useEffect } from "react";
import { useApolloClient, useQuery } from '@apollo/client';
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import BirthYearForm from "./components/BirthYearForm";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import RecommendedBooks from "./components/RecommendedBooks";
import { ME } from './queries';

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
      <NewBook show={token && page === "add"} setError={notify} />
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