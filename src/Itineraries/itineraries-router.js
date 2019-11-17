const express = require('express')
const path = require('path')
const ItinerariesService = require('./itineraries-service')
const ActivityItemsService = require('../activity_items/activity-items-service')
// const { requireAuth } = require('../middleware/basic-auth')
const { requireAuth } = require('../middleware/jwt-auth')

const activityItemsRouter = express.Router()
const itinerariesRouter = express.Router()
const jsonBodyParser = express.json()

itinerariesRouter
  .route('/')
  .get((req, res, next) => {
    ItinerariesService.getAllItineraries(req.app.get('db'))
      .then(itineraries => {
        res.json(itineraries.map(ItinerariesService.serializeItinerary))
      })
      .catch(next)
  })
  .post(requireAuth, jsonBodyParser, (req, res, next) => {
    const { title, start_date, end_date, user_id } = req.body
    const newItinerary = { title, start_date, end_date, user_id }

    for (const [key, value] of Object.entries(newItinerary))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        })

    newItinerary.user_id = req.user.id

    ItinerariesService.insertItinerary(
      req.app.get('db'),
      newItinerary
    )
      .then(itinerary => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${itinerary.id}`))
          .json(ItinerariesService.serializeItinerary(itinerary))
      })
      .catch(next)
    })

itinerariesRouter
  .route('/:itinerary_id')
  // .all(requireAuth)
  .all(checkItineraryExists)
  .get((req, res) => {
    res.json(ItinerariesService.serializeItinerary(res.itinerary))
  })
  .delete((req, res, next) => {
    ItinerariesService.deleteItinerary(
      req.app.get('db'),
      req.params.itinerary_id
    )
    .then(() => {
      res.json({});
    })
    .catch(next)
  })
  // .post(requireAuth, jsonBodyParser, (req, res, next) => {
  //   // .post(jsonBodyParser, (req, res, next) => {
  //     const { user_id, title, itinerary_id } = req.body
  //     const newActivityItem = { user_id, title, itinerary_id }
  
  //     for (const [key, value] of Object.entries(newActivityItem))
  //       if (value == null)
  //         return res.status(400).json({
  //           error: `Missing '${key}' in request body`
  //         })
  
  //     newActivityItem.user_id = req.user.id
  
  //     ActivityItemsService.insertActivityItem(
  //       req.app.get('db'),
  //       newActivityItem
  //     )
  //       .then(activity_item => {
  //         res
  //           .status(201)
  //           .location(path.posix.join(req.originalUrl))
  //           .json(ActivityItemsService.serializeActivityItem(activity_item))
  //       })
  //       .catch(next)
  //     })


itinerariesRouter.route('/:itinerary_id/activity_items')
  .all(requireAuth)
  .all(checkItineraryExists)
  .get((req, res, next) => {
    ItinerariesService.getActivityItemsForItinerary(
      req.app.get('db'),
      req.params.itinerary_id
    )
      .then(activity_items => {
        res.json(activity_items.map(ItinerariesService.serializeItineraryActivityItem))
      })
      .catch(next)
  })

/* async/await syntax for promises */
async function checkItineraryExists(req, res, next) {
  try {
    const itinerary = await ItinerariesService.getById(
      req.app.get('db'),
      req.params.itinerary_id
    )

    if (!itinerary)
      return res.status(404).json({
        error: `Itinerary doesn't exist`
      })

    res.itinerary = itinerary
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = itinerariesRouter
