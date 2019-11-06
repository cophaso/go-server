const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

function makeUsersArray() {
  return [
    {
      id: 1,
      user_name: 'test-user-1',
      first_name: 'Test user 1',
      last_name: 'TU1',
      password: 'password',
      date_created: '2029-01-22T16:28:32.615Z',
    },
    {
      id: 2,
      user_name: 'test-user-2',
      first_name: 'Test user 2',
      last_name: 'TU2',
      password: 'password',
      date_created: '2029-01-22T16:28:32.615Z',
    },
    {
      id: 3,
      user_name: 'test-user-3',
      first_name: 'Test user 3',
      last_name: 'TU3',
      password: 'password',
      date_created: '2029-01-22T16:28:32.615Z',
    },
    {
      id: 4,
      user_name: 'test-user-4',
      first_name: 'Test user 4',
      last_name: 'TU4',
      password: 'password',
      date_created: '2029-01-22T16:28:32.615Z',
    },
  ]
}

function makeItnerariesArray(users){
  return [
    {
      id: 1,
      title: 'Test 1',
      start_date: '2019-06-22T16:28:32.615Z',
      end_date: '2019-06-30T16:28:32.615Z',
      user_id: users[0].id
    },
    {
      id: 2,
      title: 'Test 2',
      start_date: '2019-07-22T16:28:32.615Z',
      end_date: '2019-07-30T16:28:32.615Z',
      user_id: users[0].id
    },
    {
      id: 3,
      title: 'Test 3',
      start_date: '2019-08-22T16:28:32.615Z',
      end_date: '2019-08-30T16:28:32.615Z',
      user_id: users[1].id
    }
  ]
}

function seedUsers(db, users) {
  const preppedUsers = users.map(user => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1)
  }))
  return db.into('users').insert(preppedUsers)
    .then(() =>
      // update the auto sequence to stay in sync
      db.raw(
        `SELECT setval('users_id_seq', ?)`,
        [users[users.length - 1].id],
      )
    )
}

function seedItinTables(db, users, itineraries, activity_items=[]) {
  // use a transaction to group the queries and auto rollback on any failure
  return db.transaction(async trx => {
    await seedUsers(trx, users)
    await trx.into('itineraries').insert(itineraries)
    // update the auto sequence to match the forced id values
    await trx.raw(
      `SELECT setval('itineraries_id_seq', ?)`,
      [itineraries[itineraries.length - 1].id],
    )
    // only insert activity_items if there are some, also update the sequence counter
    if (activity_items.length) {
      await trx.into('activity_items').insert(activity_items)
      await trx.raw(
        `SELECT setval('activity_items_id_seq', ?)`,
        [activity_items[activity_items.length - 1].id],
      )
    }
  })
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.id }, secret, {
    subject: user.user_name,
    algorithm: 'HS256',
  })
  return `Bearer ${token}`
}

function makeItinFixtures() {
  const testUsers = makeUsersArray()
  const testItineraries = makeItnerariesArray(testUsers)
  return { testUsers, testItineraries }
}

function cleanTables(db) {
  return db.raw(
    `TRUNCATE
        comments,
        activity_items,
        itineraries,
        users
      RESTART IDENTITY CASCADE`
  )
}

module.exports = {
  makeUsersArray,
  makeAuthHeader,

  makeItinFixtures,
  seedUsers,
  seedItinTables,
  cleanTables
}