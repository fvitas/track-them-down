const puppeteer = require('puppeteer')
let browser, page

const options = {
    args: [
        '--disable-accelerated-video',
        '--disable-gpu',
        '--disable-local-storage'
    ],
    headless: true,
    ignoreHTTPSErrors: true
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

async function chooseEconomy() {
    // economy container button
    await page.waitFor('#offer-container-0-0 button')
    await page.click('#offer-container-0-0 button')

    // 'Economy Deal' button
    await page.waitFor('tbody > tr.flight-offers-comparison.cabinOffersVisible.comparisonVisible > td > table > tbody > tr:nth-child(13) > td:nth-child(2) > button')
    await page.click('tbody > tr.flight-offers-comparison.cabinOffersVisible.comparisonVisible > td > table > tbody > tr:nth-child(13) > td:nth-child(2) > button')
}

async function enterNumberOfPersonsAndSubmit(number) {
    await page.type('#adultNum', number, { delay: 50 })
    await page.click('#classes-submit button[type=submit]')
}

async function deleteAllCookiesFor(url) {
    let cookies = await page.cookies(url)
    await page.deleteCookie(...cookies)
}

async function trackThemDown() {
    try {
        console.log('Opening browser...')
        browser = await puppeteer.launch(options)

        console.log('Opening new page...')
        page = await browser.newPage()

        page.setViewport({ width: 1280, height: 720 })

        console.log(`Going to https://airserbia.com/en/`)
        await page.goto('https://airserbia.com/en/', { timeout: 30 * 1000 })

        await deleteAllCookiesFor('https://airserbia.com/en/')

        console.log('Entering flight origin and destination')
        await enterFlightCities('Belgrade', 'Rome')

        console.log('Entering dates')
        await enterFlightDates('08/02/2018', '12/02/2018') // modify to: '05/04/2018' - '09/04/2018'

        await enterNumberOfPersonsAndSubmit('2')

        // Wait for flight results
        console.log('Waiting for flights')
        await page.waitFor('.flights-table')

        console.log('Choose economy departure')
        await chooseEconomy()

        // Wait for submission of economy departure
        await page.waitFor('.dxp-selected-flight', { timeout: 50 * 1000 })

        console.log('Choose economy return')
        await chooseEconomy()

        // Wait for submission of economy return
        console.log('Waiting for total amount')
        await page.waitFor('.dxp-trip-total .total-amount-item', { timeout: 50 * 1000 })

        await deleteAllCookiesFor('https://booking.airserbia.com')

        return await page.evaluate(() => {
            return {
                currency: document.querySelector('.total-amount-item .price .currency').textContent.trim(),
                amount: document.querySelector('.total-amount-item .price .amount .integer').textContent.trim()
            }
        })

    } catch (o_O) {

        console.error(o_O)

    } finally {

        await page.close().catch(error => console.log(`Error closing page: ${error}.`))
        await browser.close()

    }
}

trackThemDown()
    .then(money => console.log(`${money.currency} ${money.amount}`))
    // store to db
