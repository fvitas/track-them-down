const puppeteer = require('puppeteer')
let browser, page

const options = {
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu'
    ],
    headless: true
}

async function enterFlightCities(origin, destination) {
    await page.waitFor('#s2id_origin .select2-choices')
    await page.click('#s2id_origin .select2-choices')
    await page.type('#s2id_autogen1', origin, { delay: 30 })

    await page.waitFor('#s2id_destination .select2-choices')
    await page.click('#s2id_destination .select2-choices')
    await page.type('#s2id_autogen2', destination, { delay: 30 })
}

async function enterFlightDates(departureDate, returnDate) {
    await page.type('#departure_date', departureDate, { delay: 30 })
    await page.type('#return_date', returnDate, { delay: 30 })
}

async function enterNumberOfPersonsAndSubmit(number) {
    await page.type('#adultNum', number, { delay: 50 })
    await page.click('#classes-submit button[type=submit]')
}

async function chooseEconomy() {
    // economy container button
    let economyContainerSelector = '#offer-container-0-0 button'
    await page.waitFor(500)
    await page.waitFor(economyContainerSelector, { visible: true })
    await page.click(economyContainerSelector)

    // 'Economy Deal/Saver/Value/Freedom' button - first which is not sold out
    let economyButtonSelector = '.comparison-table .ff-offer-select-button:not(.sold-out)'
    await page.waitFor(500)
    await page.waitFor(economyButtonSelector, { visible: true })
    await page.click(economyButtonSelector)
}

async function deleteAllCookiesFor(url) {
    let cookies = await page.cookies(url)
    await page.deleteCookie(...cookies)
}

async function trackThemDown(originCity, destinationCity, departureDate, returnDate, numberOfPersons) {
    console.log('Opening browser...')
    browser = await puppeteer.launch(options)

    console.log('Opening new page...')
    page = await browser.newPage()

    page.setViewport({ width: 1280, height: 720 })

    console.log(`Going to https://airserbia.com/en/`)
    await page.goto('https://airserbia.com/en/', { waitUntil: 'networkidle' })

    await deleteAllCookiesFor('https://airserbia.com/en/')

    console.log('Entering flight origin and destination')
    await enterFlightCities(originCity, destinationCity)

    console.log('Entering dates')
    await enterFlightDates(departureDate, returnDate)

    await enterNumberOfPersonsAndSubmit(numberOfPersons)

    // Wait for flight results
    console.log('Waiting for flights')
    await page.waitFor('.flights-table')

    console.log('Choose economy departure')
    await chooseEconomy()

    // Wait for submission of economy departure
    await page.waitFor('.dxp-selected-flight')

    console.log('Choose economy return')
    await chooseEconomy()

    // Wait for submission of economy return
    console.log('Waiting for total amount')
    await page.waitFor('.dxp-trip-total .total-amount-item')

    await deleteAllCookiesFor('https://booking.airserbia.com')

    let result = await page.evaluate(
        x => ({
            currency: document.querySelector('.total-amount-item .dxp-price .currency').textContent.trim(),
            amount: document.querySelector('.total-amount-item .dxp-price .amount .integer').textContent.trim()
        })
    )

    await page.close().catch(error => console.log(`Error closing page: ${error}.`))
    await browser.close()

    return result
}

// trackThemDown('Belgrade', 'Rome', '05/04/2018', '09/04/2018', '2')
//     .then(money => {
//         let time = new Date()
//         console.log(`${time} ${time.valueOf()} : ${money.currency} ${money.amount}`)
//     })
//     .catch(o_O => console.error(o_O))


module.exports = trackThemDown