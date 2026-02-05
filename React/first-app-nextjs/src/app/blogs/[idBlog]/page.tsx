"use client";
import { use, useEffect, useState } from "react"
import { useParams } from "next/navigation";

export default function Blog() {
  const [blog, setBlogs] = useState<any>(null);
  const params = useParams();
  console.log("params", params);

  useEffect(() => {
    fetch(`https://jsonplaceholder.typicode.com/posts/${params.idBlog}`)
      .then((response) => response.json())
      .then((data) => setBlogs(data));
    }, []);

    if (!blog) {
      return <div>Cargando...</div>
    }

  return (
    <div>
      <h1>Blog</h1>
      <h2>Título: {blog.title}</h2>
      <p>Body: {blog.body}</p>
    </div>
  );
}