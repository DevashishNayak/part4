const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})

describe('when there is initially some blogs saved', () => {
    test('blogs are returned as json', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })

    test('all blogs are returned', async () => {
        const response = await api.get('/api/blogs')

        expect(response.body).toHaveLength(helper.initialBlogs.length)
    })

    test('a specific blog is within the returned blogs', async () => {
        const blogsAtStart = await helper.blogsInDb()

        const blogToView = blogsAtStart[0]

        const resultBlog = await api.get('/api/blogs')

        expect(resultBlog.body[0]).toEqual(blogToView)
    })

    test('verifies the unique identifier property of the blog posts is named id', async () => {
        const response = await api.get('/api/blogs')

        response.body.forEach(blog => expect(blog.id).toBeDefined())
    })
})

describe('viewing a specific blog', () => {
    test('succeeds with a valid id', async () => {
        const blogsAtStart = await helper.blogsInDb()

        const blogToView = blogsAtStart[0]

        const resultBlog = await api
            .get(`/api/blogs/${blogToView.id}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        expect(resultBlog.body).toEqual(blogToView)
    })

    test('fails with statuscode 404 if blog does not exist', async () => {
        const validNonexistingId = await helper.nonExistingId()

        await api
            .get(`/api/blogs/${validNonexistingId}`)
            .expect(404)
    })

    test('fails with statuscode 400 id is invalid', async () => {
        const invalidId = '5a3d5da59070081a82a3445'

        await api
            .get(`/api/blogs/${invalidId}`)
            .expect(400)
    })
})

describe('addition of a new blog', () => {
    test('succeeds with valid data', async () => {
        const newBlog = {
            title: 'Canonical string reduction',
            author: 'Edsger W. Dijkstra',
            url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
            likes: 12
        }

        const response = await api
            .post('/api/login')
            .send({ username: 'root', password: 'sekret'  })

        await api
            .post('/api/blogs')
            .set('Authorization', `bearer ${response.body.token}`)
            .send(newBlog)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

        const title = blogsAtEnd.map(n => n.title)
        expect(title).toContain('Canonical string reduction')
    })

    test('verifies that if the likes property is missing from the request, it will default to the value 0', async () => {
        const newBlog = {
            title: 'First class tests',
            author: 'Robert C. Martin',
            url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll'
        }

        const response = await api
            .post('/api/login')
            .send({ username: 'root', password: 'sekret'  })


        await api
            .post('/api/blogs')
            .set('Authorization', `bearer ${response.body.token}`)
            .send(newBlog)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd[helper.initialBlogs.length].likes).toBe(0)
    })

    test('fails with status code 400 if data invaild', async () => {
        const newBlog = {
            author: 'Robert C. Martin',
            likes: 0
        }

        await api
            .post('/api/blogs')
            .set('Authorization', 'bearer ')
            .send(newBlog)
            .expect(401)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })

    test('fails with status code 401 if token is not provided', async () => {
        const newBlog = {
            author: 'Robert C. Martin',
            likes: 0
        }

        const response = await api
            .post('/api/login')
            .send({ username: 'root', password: 'sekret'  })


        await api
            .post('/api/blogs')
            .set('Authorization', `bearer ${response.body.token}`)
            .send(newBlog)
            .expect(400)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })
})

describe('deletion of a blog', () => {
    test('succeeds with status code 204 if id is valid', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        const response = await api
            .post('/api/login')
            .send({ username: 'root', password: 'sekret'  })

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('Authorization', `bearer ${response.body.token}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

        expect(blogsAtEnd).not.toContainEqual(blogToDelete)
    })
})

describe('updation of a blog', () => {
    test('updating the information of an individual blog post', async () => {
        const blogsAtStart = await helper.blogsInDb()

        const updatedBlog = {
            ...blogsAtStart[0],
            likes: blogsAtStart[0].likes + 1
        }

        await api
            .put(`/api/blogs/${blogsAtStart[0].id}`)
            .send(updatedBlog)
            .expect(200)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd[0]).toEqual(updatedBlog)
    })

    test('fails with status code 400 if data invaild', async () => {
        const blogsAtStart = await helper.blogsInDb()

        await api
            .put(`/api/blogs/${blogsAtStart[0].id}`)
            .send({})
            .expect(400)
    })
})

afterAll(() => {
    mongoose.connection.close()
})