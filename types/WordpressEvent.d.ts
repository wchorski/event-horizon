export type WordpressEvent = {
  id: number;
  title: string;
  timestamp: string;
  slug: string;
  link: string;
  event_timestamp: string;
  real_event_timestamp: string;
  location: string | null;
  where: string;
  description: string | null;
  event_description: string;
  _ame_cpe_post_policy: any;
};

// {
//     "id": 57836,
//     "title": "District 1 Union Meeting",
//     "date": "2023-01-09T22:13:58+00:00",
//     "slug": "district-1-union-meeting-2-2023",
//     "link": "https://local150.org/events/district-1-union-meeting-2-2023/",
//     "event_date": "Thursday, February 23, 2023 7:00 pm",
//     "real_event_date": "20230223190000",
//     "location": null,
//     "where": "District 1 Hall",
//     "excerpt": null,
//     "event_description": "Union card is required for entry.",
//     "_ame_cpe_post_policy": null
//   },
