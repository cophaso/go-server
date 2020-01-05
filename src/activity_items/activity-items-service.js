const xss = require('xss');

const ActivityItemsService = {
  getById(db, id) {
    return db
      .from('activity_items AS act_item')
      .select(
        'act_item.id',
        'act_item.travel_type',
        'act_item.title',
        'act_item.description',
        'act_item.start_date',
        'act_item.end_date',
        'act_item.start_time',
        'act_item.end_time',
        'act_item.cost',
        'act_item.url',
        'act_item.itinerary_id',
        'act_item.user_id',
        db.raw(
          `row_to_json(
            (SELECT tmp FROM (
              SELECT
              usr.id,
              usr.user_name,
              usr.first_name,
              usr.last_name,
              usr.date_created
            ) tmp)
          ) AS "user"`
        )
      )
      .leftJoin(
        'users AS usr',
        'act_item.user_id',
        'usr.id',
      )
      .where('act_item.id', id)
      .first()
  },

  insertActivityItem(db, newActivityItem) {
    return db
      .insert(newActivityItem)
      .into('activity_items')
      .returning('*')
      .then(([activity_item]) => activity_item)
      .then(activity_item =>
        ActivityItemsService.getById(db, activity_item.id)
      )
  },

  getCommentsForActivityItem(db, activity_item_id) {
    return db
      .from('comments AS comm')
      .select(
        'comm.id',
        'comm.description',
        db.raw(
          `json_strip_nulls(
            row_to_json(
              (SELECT tmp FROM (
                SELECT
                  usr.id,
                  usr.user_name,
                  usr.first_name,
                  usr.last_name,
                  usr.date_created
              ) tmp)
            )
          ) AS "user"`
        )
      )
      .where('comm.activity_item_id', activity_item_id)
      .leftJoin(
        'users AS usr',
        'act_item.user_id',
        'usr.id',
      )
      .groupBy('act_item.id', 'usr.id')
  },

  serializeActivityItem(activity_item) {
    const { user } = activity_item
    return {
      id: activity_item.id,
      travel_type: activity_item.travel_type,
      title: xss(activity_item.title),
      description: xss(activity_item.description),
      start_date: new Date(activity_item.start_date),
      end_date: new Date(activity_item.end_date),
      start_time: activity_item.start_time,
      end_time: activity_item.end_time,
      cost: activity_item.cost,
      url: xss(activity_item.url),
      itinerary_id: activity_item.itinerary_id,
      user: {
        id: user.id,
        user_name: user.user_name,
        first_name: user.first_name,
        last_name: user.last_name,
        date_created: new Date(user.date_created)
      },
    }
  },

  serializeActivityItemComment(comment) {
    const { user } = comment
    return {
      id: comment.id,
      description: comment.description,
      activity_item_id: comment.activity_item_id,
      user: {
        id: user.id,
        user_name: user.user_name,
        first_name: user.first_name,
        last_name: user.last_name,
        date_created: new Date(user.date_created)
      },
    }
  }
}

module.exports = ActivityItemsService;
