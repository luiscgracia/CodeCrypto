export default async function BlogRsc({params}: any) {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${params.idBlog}`)
  const blogs = await response.json()

  return (
    <div>
              <h2>{blogs.id} Título: {blog.title}</h2>
              <p>Body: {blog.body}</p>
            </tr>
    </div>
  );
}