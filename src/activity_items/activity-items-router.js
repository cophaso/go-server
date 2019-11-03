const express = require('express')
const path = require('path')
const ActivityItemsService = require('./activity-items-service')
// const { requireAuth } = require('../middleware/basic-auth')
const { requireAuth } = require('../middleware/jwt-auth')

const activityItemsRouter = express.Router()
const jsonBodyParser = express.json()

activityItemsRouter
  .route('/')
  .get((req, res, next) => {
    ActivityItemsService.getAllActivityItems(req.app.get('db'))
      .then(activity_items => {
        res.json(activity_items.map(ActivityItemsService.serializeActivityItems))
      })
      .catch(next)
  })
  .post(requireAuth, jsonBodyParser, (req, res, next) => {
    const { user_id, title, itinerary_id } = req.body
    const newActivityItem = { user_id, title, itinerary_id }

    for (const [key, value] of Object.entries(newActivityItem))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        })

    newActivityItem.user_id = req.user.id

    ActivityItemsService.insertActivityItem(
      req.app.get('db'),
      newActivityItem
    )
      .then(activity_item => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${activity_item.id}`))
          .json(ActivityItemsService.serializeActivityItem(activity_item))
      })
      .catch(next)
    })

module.exports = activityItemsRouter
