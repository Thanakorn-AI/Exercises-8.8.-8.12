// library-frontend/src/components/LoginForm.jsx
import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN } from '../queries';

const LoginForm = ({ show, setToken, setPage, setError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [login, result] = useMutation(LOGIN, {
    onError: (error) => {
      setError(error.graphQLErrors[0].message);
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
      localStorage.setItem('library-user-token', token);
      setToken(token);
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

    login({ variables: { username, password } });
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
        <button type="submit">login</button>
      </form>
    </div>
  );
};

export default LoginForm;