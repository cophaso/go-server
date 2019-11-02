const knex = require('knex')
const bcrypt = require('bcryptjs')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Users Endpoints', function() {
  let db

  const { testUsers } = helpers.makeItinFixtures()
  const testUser = testUsers[0]

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

  describe(`POST /api/users`, () => {
    context(`User Validation`, () => {
      beforeEach('insert users', () =>
        helpers.seedUsers(
          db,
          testUsers,
        )
      )

      const requiredFields = ['user_name', 'first_name', 'last_name', 'password']

      requiredFields.forEach(field => {
        const registerAttemptBody = {
          user_name: 'test user_name',
          first_name: 'test first_name',
          last_name: 'test last_name',
          password: 'test password'
        }

        it(`responds with 400 required error when '${field}' is missing`, () => {
          delete registerAttemptBody[field]

          return supertest(app)
            .post('/api/users')
            .send(registerAttemptBody)
            .expect(400, {
              error: `Missing '${field}' in request body`,
            })
        })
      })

      it(`Responds 400 password must be longer than 8 characters when empty password`, () =>{
        const userShortPassword = {
          user_name: 'test user_name',
          password: '1234567',
          first_name: 'test first_name',
          last_name: 'test last_name',
        }

        return supertest(app)
          .post('/api/users')
          .send(userShortPassword)
          .expect(400, {
            error: 'Password must be longer than 8 characters'
          })
      })

      it(`Responds 400 password must be shorter than 72 characters when empty password`, () =>{
        const userLongPassword = {
          user_name: 'test user_name',
          password: '*'.repeat(73),
          first_name: 'test first_name',
          last_name: 'test last_name',
        }

        return supertest(app)
          .post('/api/users')
          .send(userLongPassword)
          .expect(400, {
            error: 'Password must be less than 72 characters'
          })
      })

      it(`Responds 400 when password starts with spaces`, () =>{
        const userStartsWithSpacesPassword = {
          user_name: 'test user_name',
          password: ' 1Aa!2Bb@',
          first_name: 'test first_name',
          last_name: 'test last_name',
        }

        return supertest(app)
          .post('/api/users')
          .send(userStartsWithSpacesPassword)
          .expect(400, {
            error: 'Password must not start or end with empty spaces'
          })
      })

      it(`Responds 400 when password ends with spaces`, () =>{
        const userEndsWithSpacesPassword = {
          user_name: 'test user_name',
          password: '1Aa!2Bb@ ',
          first_name: 'test first_name',
          last_name: 'test last_name',
        }

        return supertest(app)
          .post('/api/users')
          .send(userEndsWithSpacesPassword)
          .expect(400, {
            error: 'Password must not start or end with empty spaces'
          })
      })

      it(`Responds 400 when password isn't complex enough`, () =>{
        const userNotComplexPassword = {
          user_name: 'test user_name',
          password: '12345678',
          first_name: 'test first_name',
          last_name: 'test last_name',
        }

        return supertest(app)
          .post('/api/users')
          .send(userNotComplexPassword)
          .expect(400, {
            error: 'Password must contain 1 upper case, lower case, number and special character'
          })
      })

      it(`Responds 400 when user already exists`, () =>{
        const alreadyUser = {
          user_name: testUser.user_name,
          password: '1Aa!2Bb@',
          first_name: 'test first_name',
          last_name: 'test last_name',
        }

        return supertest(app)
          .post('/api/users')
          .send(alreadyUser)
          .expect(400, {
            error: `Username already taken`
          })
      })
    })

    context(`Happy path`, () => {
      it(`responds 201, serialized user, storing bcryped password`, () => {
        const newUser = {
          user_name: 'test user_name',
          password: '1Aa!2Bb@',
          first_name: 'test first_name',
          last_name: 'test last_name'
        }

        return supertest(app)
          .post('/api/users')
          .send(newUser)
          .expect(201)
          .expect(res =>{
            expect(res.body).to.have.property('id')
            expect(res.body.user_name).to.eql(newUser.user_name)
            expect(res.body.first_name).to.eql(newUser.first_name)
            expect(res.body.last_name).to.eql(newUser.last_name)
            expect(res.body).to.not.have.property(newUser.password)
            expect(res.headers.location).to.eql(`/api/users/${res.body.id}`)
          })
          .expect(res =>
            db
              .from('users')
              .select('*')
              .where({ id: res.body.id })
              .first()
              .then(row => {
                expect(row.user_name).to.eql(newUser.user_name)
                expect(row.first_name).to.eql(newUser.first_name)
                expect(row.last_name).to.eql(newUser.last_name)

                return bcrypt.compare(newUser.password, row.password)
              })
              .then(compareMatch =>{
                expect(compareMatch).to.be.true
              })
          )
      })
    })
  })
})