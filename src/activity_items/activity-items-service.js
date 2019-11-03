const xss = require('xss')

const ActivityItemsService = {
  getAllActivityItems(db) {
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
          `json_strip_nulls(
            json_build_object(
              'id', usr.id,
              'user_name', usr.user_name,
              'first_name', usr.first_name,
              'last_name', usr.last_name,
              'date_created', usr.date_created
            )
          ) AS "user"`
        ),
      )
      .leftJoin(
        'activity_items AS act_item',
        'itin.id',
        'act_item.itinerary_id',
      )
      .leftJoin(
        'users AS usr',
        'itin.user_id',
        'usr.id',
      )
      .groupBy('itin.id', 'usr.id')
  },

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

  serializeActivityItem(activity_item) {
    const { user } = activity_item
    return {
      id: activity_items.id,
      travel_type: activity_items.travel_type,
      title: xss(activity_items.title),
      description: xss(activity_items.description),
      start_date: new Date(activity_items.start_date),
      end_date: new Date(activity_items.end_date),
      start_time: new Date().getTime(activity_items.start_time),
      end_time: new Date().getTime(activity_items.end_time),
      cost: activity_items.cost,
      url: xss(activity_items.url),
      itinerary_id: activity_items.itinerary_id,
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

module.exports = ActivityItemsService
