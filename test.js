let http = require('.')
http.get('https://api.heroku.com', {
  debug: 2,
  headers: {
    'Accept': 'application/vnd.heroku+json; version=3'
  }
})
.then(rsp => {
  console.dir(rsp)
})
.catch(console.error)
