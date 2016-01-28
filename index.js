var restify = require('restify')
var reportData = require('./lib/report-data')

var server = restify.createServer()
server.get('/report-data.json', reportData)
server.get(/\/?.*/, restify.serveStatic({
  directory: __dirname + '/public',
  default: 'index.html'
}))

server.listen(8080, function() {
  console.log('Server runing at: %s', server.url)
})
