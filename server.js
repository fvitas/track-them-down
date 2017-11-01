const express = require('express')
const logger = require('morgan')
const compression = require('compression')
const bodyParser = require('body-parser')
const moment = require('moment')
const timezone = require('moment-timezone')
const huntThemDown = require('./track')

const app = express()
let router = express.Router()

let Datastore = require('nedb-promise')
let sync = new Datastore({ filename: './db/sync.db', autoload: true })
let flights = new Datastore({ filename: './db/flight.db', autoload: true })

sync.insert({ next: moment().tz('Europe/Belgrade').valueOf() })

app.use(compression())
app.use(logger('dev'))
app.disable('x-powered-by')

router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())

router
    .all('/', async (request, response) => {
        response.sendFile(__dirname + '/app/index.html')

        let check = await sync.findOne({})
        let currentTime = moment().tz('Europe/Belgrade')

        if (check.timing < currentTime.valueOf()) {
            let result = {
                currency: 0,
                amount: 0,
            }

            let retry = 3
            while (retry > 0) {
                try {
                    result = await huntThemDown()
                    break
                } catch (o_O) {
                    retry--
                }
            }

            currentTime = moment().tz('Europe/Belgrade')

            result.timing = {
                timing: currentTime.valueOf(),
                full: currentTime.format('DD/MM/YYYY, dddd, HH:mm:ss')
            }

            flights.insert(result)

            sync.remove({})
            sync.insert({ next: currentTime.add(6, 'h').valueOf() })
        } else {
            console.log('its not the time to check, yet')
        }
    })
    .get('/flights', async (request, response) => {
        let allFlights = await flights.find({})
        response.json(allFlights)
    })

app.use(router)

let port = process.env.PORT || 3000
let hostname = process.env.HOST_NAME || 'localhost'

app.listen(port, function() {
    console.info(`Magic is happening on ${port}`)
})
