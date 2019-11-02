const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Itineraries Endpoints', function() {
  let db

  const {
    testUsers,
  } = helpers.makeItinFixtures()

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanTables(db))

  afterEach('cleanup', () => helpers.cleanTables(db))

  describe(`POST /api/itineraries`, () => {
    beforeEach('insert users', () =>
      helpers.seedUsers(
        db,
        testUsers
      )
    )

    it(`creates an itinerary, responding with 201 and the new itinerary`, function() {
      this.retries(3)
      const testUser = testUsers[0]
      const newItinerary = {
              title: 'Spec Test',
              start_date: '2019-06-22T00:00:00.000Z',
              end_date: '2019-06-30T00:00:00.000Z',
              user_id: testUser.id
            }
      return supertest(app)
        .post('/api/itineraries')
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .send(newItinerary)
        .expect(201)
        .expect(res => {
          expect(res.body).to.have.property('id')
          expect(res.body.title).to.eql(newItinerary.title)
          expect(res.body.start_date).to.eql(newItinerary.start_date)
          expect(res.body.end_date).to.eql(newItinerary.end_date)
          expect(res.body.user.id).to.eql(testUser.id)
          expect(res.headers.location).to.eql(`/api/itineraries/${res.body.id}`)
        })
        .expect(res =>
          db
            .from('itineraries')
            .select('*')
            .where({ id: res.body.id })
            .first()
            .then(row => {
              expect(row.title).to.eql(newItinerary.title)
              // expect(row.start_date).to.eql('Sat, 22 Jun 2019 00:00:00 GMT')
              // expect(row.end_date).to.eql(newItinerary.end_date)
              expect(row.user_id).to.eql(testUser.id)
            })
        )
    })

    const requiredFields = ['title', 'user_id']

    requiredFields.forEach(field => {
      const testUser = testUsers[0]
      const newItinerary = {
        title: 'Spec Test',
        start_date: '2019-06-22T00:00:00.000Z',
        end_date: '2019-06-30T00:00:00.000Z',
        user_id: testUser.id
      }

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newItinerary[field]

        return supertest(app)
          .post('/api/itineraries')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(newItinerary)
          .expect(400, {
            error: `Missing '${field}' in request body`,
          })
      })
    })
  })
})
