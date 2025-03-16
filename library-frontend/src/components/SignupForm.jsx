// library-frontend/src/components/SignupForm.jsx
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_USER } from '../queries';

const SignupForm = ({ show, setPage, setError }) => {
  const [username, setUsername] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [createUser] = useMutation(CREATE_USER, {
    onError: (error) => {
      setError(error.graphQLErrors[0].message);
    },
    onCompleted: () => {
      setPage('login');
      setError('User created! Please log in.');
    }
  });

  if (!show) {
    return null;
  }

  const submit = async (event) => {
    event.preventDefault();

    if (!username || !favoriteGenre || !password || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 5) {
      setError('Password must be at least 5 characters long');
      return;
    }

    // Note: We're not sending the password to the backend as the exercise specifies
    // to use a hardcoded password. The password fields are just for UX consistency.
    // The actual hardcoded password check happens on the server.

    createUser({ variables: { username, favoriteGenre } });
  };

  return (
    <div>
      <h2>Sign Up</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom: '10px' }}>
          username
          <input
            value={username}
            onChange={({ target }) => setUsername(target.value)}
            style={{ marginLeft: '10px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          favorite genre
          <input
            value={favoriteGenre}
            onChange={({ target }) => setFavoriteGenre(target.value)}
            style={{ marginLeft: '10px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          password
          <input
            type="password"
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            style={{ marginLeft: '10px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={({ target }) => setConfirmPassword(target.value)}
            style={{ marginLeft: '10px' }}
          />
        </div>
        <button type="submit">create account</button>
      </form>
      <p style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>
        Note: For this demo, all accounts will use "secret" as the server-side password.
      </p>
    </div>
  );
};

export default SignupForm;