// library-frontend/src/components/NewBook.jsx
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_BOOK, ALL_BOOKS, ALL_AUTHORS } from "../queries";

const NewBook = ({ show, setError }) => {
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
    update: (cache, { data: { addBook } }) => {
      // Update the cache for genre-specific queries
      genres.forEach(genre => {
        try {
          const existingBooks = cache.readQuery({ 
            query: ALL_BOOKS,
            variables: { genre }
          });
          
          if (existingBooks && addBook.genres.includes(genre)) {
            cache.writeQuery({
              query: ALL_BOOKS,
              variables: { genre },
              data: {
                allBooks: [...existingBooks.allBooks, addBook]
              }
            });
          }
        } catch (e) {
          // Query not in cache yet, which is fine
        }
      });
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