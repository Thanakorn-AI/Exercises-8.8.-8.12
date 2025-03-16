// library-frontend/src/components/Books.jsx
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { ALL_BOOKS } from '../queries';

const Books = (props) => {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genres, setGenres] = useState([]);
  const [allGenres, setAllGenres] = useState([]);
  
  // Query for the currently selected genre (or all books if null)
  const result = useQuery(ALL_BOOKS, {
    variables: { genre: selectedGenre },
    fetchPolicy: 'cache-and-network' // This helps with real-time updates
  });

  // Execute a separate query to get all books for extracting all possible genres
  const allBooksResult = useQuery(ALL_BOOKS, {
    variables: { genre: null },
    fetchPolicy: 'cache-and-network'
  });

  // Extract all unique genres whenever allBooks changes
  useEffect(() => {
    if (allBooksResult.data && allBooksResult.data.allBooks) {
      // Collect all unique genres from all books
      const genreSet = allBooksResult.data.allBooks.reduce((genreSet, book) => {
        book.genres.forEach(genre => genreSet.add(genre));
        return genreSet;
      }, new Set());
      
      setAllGenres(Array.from(genreSet));
    }
  }, [allBooksResult.data]);

  if (!props.show) {
    return null;
  }

  const loading = result.loading || allBooksResult.loading;
  
  if (loading && !result.data && !allBooksResult.data) {
    return <div>loading...</div>;
  }

  if (result.error) {
    return <div>Error: {result.error.message}</div>;
  }

  const books = result.data?.allBooks || [];

  return (
    <div>
      <h2>Books</h2>
      
      {selectedGenre ? (
        <p>
          Genre: <strong>{selectedGenre}</strong>
        </p>
      ) : (
        <p>All genres</p>
      )}

      <table>
        <tbody>
          <tr>
            <th>Books</th>
            <th>Authors</th>
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
      
      <div style={{ marginTop: '20px' }}>
        {allGenres.map(genre => (
          <button 
            key={genre} 
            onClick={() => setSelectedGenre(genre)}
            style={{ margin: '0 5px 5px 0' }}
          >
            {genre}
          </button>
        ))}
        <button 
          onClick={() => setSelectedGenre(null)}
          style={{ margin: '0 5px 5px 0' }}
        >
          all genres
        </button>
      </div>
    </div>
  );
};

export default Books;