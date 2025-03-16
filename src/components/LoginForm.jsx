// library-frontend/src/components/LoginForm.jsx
import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN } from '../queries';

const LoginForm = ({ show, setToken, setPage, setError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [login, result] = useMutation(LOGIN, {
    onError: (error) => {
      // Add a safety check for when error or error.message is undefined
      if (error && error.graphQLErrors && error.graphQLErrors.length > 0) {
        setError(error.graphQLErrors[0].message);
      } else if (error && error.message) {
        setError(error.message);
      } else if (error && error.networkError) {
        setError(`Network error: ${error.networkError.message}`);
      } else {
        setError('Login failed. Please check your connection and try again.');
      }
    }
  });

  // Clear form fields when component is shown/hidden
  useEffect(() => {
    // Clear fields whenever the visibility changes
    // This ensures fields are cleared on logout when the form becomes visible again
    setUsername('');
    setPassword('');
  }, [show]);

  // Handle successful login
  useEffect(() => {
    if (result.data) {
      const token = result.data.login.value;
      setToken(token);
      localStorage.setItem('library-user-token', token);
      setPage('authors');
      
      // Clear fields after successful login
      setUsername('');
      setPassword('');
    }
  }, [result.data, setToken, setPage]);

  if (!show) {
    return null;
  }

  const submit = async (event) => {
    event.preventDefault();

    try {
      await login({
        variables: { username, password }
      });
    } catch (e) {
      // The onError callback will handle error reporting
      console.error('Login error caught:', e);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom: '10px' }}>
          username
          <input
            value={username}
            onChange={({ target }) => setUsername(target.value)}
            style={{ marginLeft: '10px' }}
            autoComplete="username"
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          password
          <input
            type="password"
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            style={{ marginLeft: '10px' }}
            autoComplete="current-password"
          />
        </div>
        <button type='submit'>login</button>
      </form>
    </div>
  );
};

export default LoginForm;