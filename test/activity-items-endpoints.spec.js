const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Activity Items Endpoints', function () {
  let db;

  const {
    testItineraries,
    testUsers,
  } = helpers.makeItinFixtures()

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    })
    app.set('db', db)
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  describe(`POST /api/activity_items`, () => {
    beforeEach('insert itineraries', () =>
      helpers.seedItinTables(
        db,
        testUsers,
        testItineraries,
      )
    )

    it(`creates an activity_items, responding with 201 and the new activity_items`, function () {
      // this.retries(3)
      const testItinerary = testItineraries[0]
      const testUser = testUsers[0]
      const d = new Date();
      const n = d.getTime();
      const newActivityItem = {
        travel_type: 'Activity',
        title: 'Test new Activity',
        description: 'Test description',
        cost: "1234",
        url: 'test.com',
        itinerary_id: testItinerary.id,
        user_id: testUser.id
      }
      return supertest(app)
        .post(`/api/itineraries/${testItinerary.id}/activity_items`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .send(newActivityItem)
        .expect(201)
        .expect(res => {
          expect(res.body).to.have.property('id')
          expect(res.body.title).to.eql(newActivityItem.title)
          expect(res.body.travel_type).to.eql(newActivityItem.travel_type)
          expect(res.body.description).to.eql(newActivityItem.description)
          expect(res.body.cost).to.eql(newActivityItem.cost)
          expect(res.body.url).to.eql(newActivityItem.url)
          expect(res.body.itinerary_id).to.eql(testItinerary.id)
          expect(res.body.user.id).to.eql(testUser.id)
          expect(res.headers.location).to.eql(`/api/itineraries/${res.body.itinerary_id}/activity_items/${res.body.id}`)
        })
        .expect(res =>
          db
            .from('activity_items')
            .select('*')
            .where({ id: res.body.id })
            .first()
            .then(row => {
              expect(row.title).to.eql(newActivityItem.title)
              expect(row.travel_type).to.eql(newActivityItem.travel_type)
              expect(row.description).to.eql(newActivityItem.description)
              expect(row.cost).to.eql(newActivityItem.cost)
              expect(row.url).to.eql(newActivityItem.url)
              expect(row.itinerary_id).to.eql(testItinerary.id)
              const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
              const actualDate = new Date(row.date_created).toLocaleString()
              expect(actualDate).to.eql(expectedDate)
            })
        )
    })

    const requiredFields = ['title']

    requiredFields.forEach(field => {
      const testItinerary = testItineraries[0]
      const testUser = testUsers[0]
      const newActivityItem = {
        travel_type: 'Activity',
        title: 'Test new Activity',
        description: 'Test description',
        cost: 1234,
        url: 'test.com',
        itinerary_id: testItinerary.id,
        user_id: testUser.id
      }

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newActivityItem[field]

        return supertest(app)
          .post(`/api/itineraries/${testItinerary.id}/activity_items`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(newActivityItem)
          .expect(400, {
            error: `Missing '${field}' in request body`,
          })
      })
    })
  })
})
