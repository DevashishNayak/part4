const _ = require('lodash')

const dummy = (blogs) => {
    if(blogs) {
        return 1
    }
}

const totalLikes = (blogs) => {
    const reducer = (sum, blog) => {
        return sum + blog.likes
    }

    return blogs.length === 0 ? 0 : blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
    const blog = blogs.find(blog => blog.likes === Math.max(...blogs.map(blog => blog.likes)))

    return blogs.length > 0 ?
        {
            title: blog.title,
            author: blog.author,
            likes: blog.likes
        }
        : null
}

const mostBlogs = (blogs) => {
    const result = _(_.map(blogs, 'author'))
        .countBy()
        .entries()
        .maxBy(_.last)

    return blogs.length > 0 ?
        {
            author: result[0],
            blogs: result[1]
        }
        : null
}

const mostLikes = (blogs) => {
    const author = _.uniq((_.map(blogs, 'author')))

    const reducer = (sum, blog) => {
        return sum + blog.likes
    }
    const likes = author.map(author => {
        const filter = blogs.filter(blog => blog.author === author)
        return filter.reduce(reducer, 0)
    })
    const result = likes.indexOf(Math.max(...likes))

    return blogs.length > 0 ?
        {
            author: author[result],
            likes: likes[result]
        }
        : null
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}