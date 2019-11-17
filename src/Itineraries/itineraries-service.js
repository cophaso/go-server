const xss = require('xss')

const ItinerariesService = {
  getAllItineraries(db) {
    return db
      .from('itineraries AS itin')
      .select(
        'itin.id',
        'itin.title',
        'itin.start_date',
        'itin.end_date',
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
    return ItinerariesService.getAllItineraries(db)
      .where('itin.id', id)
      .first()
  },

  insertItinerary(db, newItinerary) {
    return db
      .insert(newItinerary)
      .into('itineraries')
      .returning('*')
      .then(([itinerary]) => itinerary)
      .then(itinerary =>
        ItinerariesService.getById(db, itinerary.id)
      )
  },

  deleteItinerary(knex, id){
    return knex('itineraries')
      .where({ id })
      .delete()
  },

  getActivityItemsForItinerary(db, itinerary_id) {
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
      .where('act_item.itinerary_id', itinerary_id)
      .leftJoin(
        'users AS usr',
        'act_item.user_id',
        'usr.id',
      )
      .groupBy('act_item.id', 'usr.id')
  },

  serializeItinerary(itinerary) {
    const { user } = itinerary
    return {
      id: itinerary.id,
      title: xss(itinerary.title),
      start_date: new Date(itinerary.start_date),
      end_date: new Date(itinerary.end_date),
      number_of_activity_items: Number(itinerary.number_of_activity_items) || 0,
      user: {
        id: user.id,
        user_name: user.user_name,
        first_name: user.first_name,
        last_name: user.last_name,
        date_created: new Date(user.date_created)
      },
    }
  },

  serializeItineraryActivityItem(activity_items) {
    const { user } = activity_items
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
  },
}

module.exports = ItinerariesService
