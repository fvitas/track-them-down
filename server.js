const express = require('express')
const logger = require('morgan')
const compression = require('compression')

const app = express();
let router = express.Router();

app.use(compression())
app.use(logger('dev'))
app.disable("x-powered-by")

router
    .all('*', function (request, response) {
        response.sendFile(__dirname + '/app/index.html')
    })

app.use(router)

app.listen(3000, function() {
    console.log('listening on 3000')
})
