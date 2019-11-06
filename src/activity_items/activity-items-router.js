const express = require('express')
const path = require('path')
const ActivityItemsService = require('./activity-items-service')
// const { requireAuth } = require('../middleware/basic-auth')
const { requireAuth } = require('../middleware/jwt-auth')

const activityItemsRouter = express.Router()
const jsonBodyParser = express.json()

activityItemsRouter
  .route('/')
    // .post(requireAuth, jsonBodyParser, (req, res, next) => {
  .post(jsonBodyParser, (req, res, next) => {
    const { user_id, title, itinerary_id } = req.body
    const newActivityItem = { user_id, title, itinerary_id }

    for (const [key, value] of Object.entries(newActivityItem))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        })

    // newActivityItem.user_id = req.user.id

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

activityItemsRouter
  .route('/activity_items/:activity_items')
  // .all(requireAuth)
  .all(checkActivityItemsExists)
  .get((req, res) => {
    res.json(ActivityItemsService.serializeActivityItem(res.activity_item))
  })

activityItemsRouter.route('/:activity_items/comments')
    // .all(requireAuth)
    .all(checkActivityItemsExists)
    .get((req, res, next) => {
      ActivityItemsService.getCommentsForActivityItems(
        req.app.get('db'),
        req.params.activity_items_id
      )
        .then(comments => {
          res.json(comments.map(ActivityItemsService.serializeActivityItemComment))
        })
        .catch(next)
    })
  
  /* async/await syntax for promises */
  async function checkActivityItemsExists(req, res, next) {
    try {
      const activity_item = await ActivityItemsService.getById(
        req.app.get('db'),
        req.params.activity_item_id
      )
  
      if (!activity_item)
        return res.status(404).json({
          error: `activity item doesn't exist`
        })
  
      res.activity_item = activity_item
      next()
    } catch (error) {
      next(error)
    }
  }

module.exports = activityItemsRouter
