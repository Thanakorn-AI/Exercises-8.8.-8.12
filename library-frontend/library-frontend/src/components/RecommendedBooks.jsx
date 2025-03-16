// library-frontend/src/components/RecommendedBooks.jsx
import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { ALL_BOOKS, ME } from '../queries';

const RecommendedBooks = ({ show }) => {
  const userResult = useQuery(ME, {
    fetchPolicy: 'network-only' // Ensure we always get fresh data from server
  });
  
  const favoriteGenre = userResult.data?.me?.favoriteGenre;
  
  const booksResult = useQuery(ALL_BOOKS, {
    variables: { genre: favoriteGenre },
    skip: !favoriteGenre,
    fetchPolicy: 'cache-and-network' // Try cache but also fetch from network
  });

  // Force refetch when component becomes visible
  useEffect(() => {
    if (show) {
      userResult.refetch();
      if (favoriteGenre) {
        booksResult.refetch();
      }
    }
  }, [show, favoriteGenre]);

  if (!show) {
    return null;
  }

  if (userResult.loading) {
    return <div>loading user information...</div>;
  }

  if (!userResult.data?.me) {
    return <div>Please log in to see recommendations</div>;
  }

  if (booksResult.loading) {
    return <div>loading recommended books...</div>;
  }

  if (userResult.error) {
    return <div>Error loading user data: {userResult.error.message}</div>;
  }

  if (booksResult.error) {
    return <div>Error loading books: {booksResult.error.message}</div>;
  }

  const books = booksResult.data?.allBooks || [];

  return (
    <div>
      <h2>Recommendations</h2>
      <p>
        Books in your favorite genre: <strong>{favoriteGenre}</strong>
      </p>
      {books.length === 0 ? (
        <p>No books found in your favorite genre</p>
      ) : (
        <table>
          <tbody>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Published</th>
            </tr>
            {books.map((b) => (
              <tr key={b.id}>
                <td>{b.title}</td>
                <td>{b.author.name}</td>
                <td>{b.published}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RecommendedBooks;