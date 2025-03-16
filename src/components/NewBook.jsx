// library-frontend/src/components/NewBook.jsx
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_BOOK, ALL_BOOKS, ALL_AUTHORS } from "../queries";

const NewBook = ({ show, setError, updateCacheWith }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [published, setPublished] = useState("");
  const [genre, setGenre] = useState("");
  const [genres, setGenres] = useState([]);

  const [createBook] = useMutation(CREATE_BOOK, {
    refetchQueries: [{ query: ALL_BOOKS, variables: { genre: null } }, { query: ALL_AUTHORS }],
    onError: (error) => {
      if (error.graphQLErrors[0]) {
        setError(error.graphQLErrors[0].message);
      } else {
        setError('An error occurred while adding the book');
      }
    },
    update: (cache, { data }) => {
      const addedBook = data?.addBook;
      
      // Use the updateCacheWith function if provided (for subscription support)
      if (updateCacheWith && addedBook) {
        updateCacheWith(addedBook);
      }
      
      // Keep existing cache update logic for genre-specific queries
      if (addedBook) {
        genres.forEach(genre => {
          try {
            const existingBooks = cache.readQuery({ 
              query: ALL_BOOKS,
              variables: { genre }
            });
            
            if (existingBooks && addedBook.genres.includes(genre)) {
              cache.writeQuery({
                query: ALL_BOOKS,
                variables: { genre },
                data: {
                  allBooks: [...existingBooks.allBooks, addedBook]
                }
              });
            }
          } catch (e) {
            // Query not in cache yet, which is fine
          }
        });
      }
    }
  });

  if (!show) {
    return null;
  }

  const submit = async (event) => {
    event.preventDefault();
    
    if (!title || !author || !published) {
      setError('Please fill all required fields');
      return;
    }

    try {
      const publishedNum = parseInt(published, 10);
      
      await createBook({
        variables: { title, author, published: publishedNum, genres }
      });

      setTitle("");
      setPublished("");
      setAuthor("");
      setGenres([]);
      setGenre("");
    } catch (error) {
      console.error("Error adding book:", error);
    }
  };

  const addGenre = () => {
    if (genre && !genres.includes(genre)) {
      setGenres(genres.concat(genre));
    }
    setGenre("");
  };

  return (
    <div>
      <h2>Add book</h2>
      <form onSubmit={submit}>
        <div>
          title
          <input
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div>
          author
          <input
            value={author}
            onChange={({ target }) => setAuthor(target.value)}
          />
        </div>
        <div>
          published
          <input
            type="number"
            value={published}
            onChange={({ target }) => setPublished(target.value)}
          />
        </div>
        <div>
          <input
            value={genre}
            onChange={({ target }) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">
            add genre
          </button>
        </div>
        <div>genres: {genres.join(" ")}</div>
        <button type="submit">create book</button>
      </form>
    </div>
  );
};

export default NewBook;