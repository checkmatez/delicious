const mongoose = require('mongoose')
mongoose.Promise = global.Promise
require('dotenv').config({ path: 'variables.env' })

// Connect to our Database and handle an bad connections
mongoose.connect(process.env.DATABASE)
mongoose.Promise = global.Promise // Tell Mongoose to use ES6 promises
mongoose.connection.on('error', err => {
  console.error(`🙅 🚫 🙅 🚫 🙅 🚫 🙅 🚫 → ${err.message}`)
})

require('./models/Store')
require('./models/User')
try {
  ;(async () => {
    try {
      const Store = mongoose.model('Store')
      const User = mongoose.model('User')
      const authorPromise = User.findOne(
        { email: 'davidovmk@yandex.ru' },
        '_id'
      )
      const storesWithoutAuthorPromise = Store.find({
        author: { $exists: false },
      })
      const [dmk, storesWithoutAuthor] = await Promise.all([
        authorPromise,
        storesWithoutAuthorPromise,
      ])
      console.log(dmk)
      console.log(storesWithoutAuthor)

      storesWithoutAuthor.forEach(store => {
        store.author = dmk._id
        store.save()
      })
    } catch (error) {
      console.error(error)
    }
  })()
} catch (error) {
  console.error(error)
}
