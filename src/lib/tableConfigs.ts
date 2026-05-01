import type { BaseRow, FieldConfig } from "@ty/FieldConfig";
import type { CrudRegistryType } from "./crudRegistry";
import type {
  EventSelect,
  TicketSelect,
  LocationSelect,
  UserSelect,
} from "@ty/Schema";
import { prettyDateToLocale } from "./formatters";

const { DATALIST_CITIES, DATALIST_STATES, DATALIST_TIMEZONES } = import.meta
  .env;

const userRequiredConfig = {
  id: {
    label: "ID",
    type: "text",
    required: true,
    readonly: true,
  },
  first_name: {
    label: "First Name",
    type: "text",
    required: true,
    placeholder: "John...",
  },
  last_name: {
    label: "Last Name",
    type: "text",
    required: true,
    placeholder: "Doe...",
  },
  middle_initial: {
    label: "Middle Int.",
    type: "text",
  },
  phone: {
    label: "Phone",
    type: "tel",
    required: true,
    placeholder: "123-123-1234",
  },
  email: {
    label: "Email",
    type: "email",
    required: true,
    placeholder: "john@mail.lan",
  },
  address_1: {
    label: "Address",
    type: "text",
    required: true,
    placeholder: "123 West East St...",
  },
  address_2: {
    label: "P.O. Box",
    type: "text",
  },
  city: {
    type: "text",
    required: true,
    placeholder: "Naperville...",
    datalist: DATALIST_CITIES?.split(",").map((city) => ({
      value: city,
      label: city,
    })),
  },
  state: {
    type: "text",
    required: true,
    placeholder: "Illinois...",
    datalist: DATALIST_STATES?.split(",").map((state) => ({
      value: state,
      label: state,
    })),
  },
  zip: {
    type: "text",
    required: true,
    placeholder: "50505...",
  },
} as FieldConfig<BaseRow>;

export const userCreditCheckInConfig = {
  event_id: {
    label: "Event ID",
    type: "hidden",
    required: true,
  },
  user_id: {
    label: "User ID",
    type: "text"
  },
  email: {
    type: "email",
  },
  phone: {
    type: "tel",
  },
} as FieldConfig<BaseRow>;

// TODO ditch `tableConfigs` for more explicit ones like below
export const courseConfigRequired = (locations: LocationSelect[]) =>
  ({
    id: {
      label: "ID",
      type: "text",
      required: true,
      readonly: true,
    },
    wp_post_id: {
      type: "number",
      required: true,
      readonly: true,
    },
    subject: {
      label: "subject",
      type: "text",
      required: true,
      placeholder: "Event Studies IV...",
    },
    excerpt: {
      label: "excerpt",
      type: "text",
      placeholder: "...",
    },
    date_civil: {
      label: "Civil Date",
      type: "datetime-local",
      required: true,
    },
    location_id: {
      label: "Locations",
      type: "select",
      required: true,
      options: locations.map((loc) => ({
        value: String(loc.id),
        label: loc.name,
      })),
    },
  }) as FieldConfig<BaseRow> satisfies FieldConfig<EventSelect>;

const courseCreditsRequiredConfig = {
  id: {
    label: "ID",
    type: "text",
    required: true,
    readonly: true,
  },
  user_id: {
    label: "User ID",
    type: "text",
    required: true,
    readonly: true,
  },
  //? don't need it if passed with URL
  // event_id: {
  //   label: "Event ID",
  //   type: "hidden",
  //   value: courseId,
  //   readonly: true,
  // },
  first_name: {
    label: "First Name",
    type: "text",

    placeholder: "Jane Doe...",
  },
  last_name: {
    label: "Last Name",
    type: "text",

    placeholder: "Jane Doe...",
  },
  middle_initial: {
    label: "Middle Init.",
    type: "text",
  },
  email: {
    label: "Email",
    type: "email",

    placeholder: "jane@example.com...",
    autocomplete: "email",
  },
  phone: {
    label: "Phone",
    type: "tel",

    autocomplete: "phone",
  },
  address_1: {
    label: "Address",
    type: "text",
  },
  city: {
    label: "city",
    type: "text",
  },
  state: {
    label: "state",
    type: "text",
  },
  zip: {
    label: "zip",
    type: "text",
  },
  attended: {
    label: "attended",
    type: "checkbox",
  },
} as FieldConfig<BaseRow>;

export const ticketsConfigRequired = (
  users: UserSelect[],
  events: EventSelect[],
) =>
  ({
    id: {
      label: "ID",
      type: "text",
      required: true,
      readonly: true,
    },
    user_id: {
      label: "User",
      // type: "searchSelect",
      type: "select",
      required: true,
      options: users.map((item) => ({
        value: String(item.id),
        label: `${item.first_name} ${item.middle_initial ?? ""} ${item.last_name} <${item.email}>`,
      })),
    },
    // TODO if user data set is gt 5000, switch to dyamicaly searched and loaded data
    // user_id: {
    //   label: "User",
    //   type: "searchSelect",
    //   required: true,
    //   endpoint: "/api/users/search",
    //   valueKey: "id",
    //   primaryTemplate: "{firstName} {lastName}",
    //   secondaryTemplate: "{email}",
    // },
    event_id: {
      label: "Event",
      type: "select",
      required: true,
      options: events.map((item) => ({
        value: String(item.id),
        label:
          item.subject + " | " + prettyDateToLocale(new Date(item.date_civil)),
      })),
    },
    timestamp: {
      label: "Attended Date",
      type: "datetime-local",
      readonly: true,
    },
    grade: { type: "text" },
    attended: {
      type: "checkbox",
    },
  }) as FieldConfig<BaseRow> satisfies FieldConfig<TicketSelect>;

const locationRequiredConfig = {
  id: {
    label: "ID",
    type: "text",
    required: true,
    readonly: true,
  },
  name: {
    type: "text",
    required: true,
    placeholder: "Union Hall...",
  },
  address: {
    type: "text",
    required: true,
    placeholder: "123 West East St...",
  },
  city: {
    type: "text",
    required: true,
    placeholder: "Naperville...",
    datalist: DATALIST_CITIES?.split(",").map((li) => ({
      value: li,
      label: li,
    })),
  },
  state: {
    type: "text",
    required: true,
    placeholder: "Illinois...",
    datalist: DATALIST_STATES?.split(",").map((li) => ({
      value: li,
      label: li,
    })),
  },
  zip: {
    type: "text",
    required: true,
    placeholder: "50505",
  },
  timezone: {
    label: "Time Zone",
    // TODO needs to be select input field
    type: "text",
    required: true,
    datalist: DATALIST_TIMEZONES?.split(",").map((li) => ({
      value: li,
      label: li,
    })),
  },
  excerpt: {
    type: "text",
  },
} as FieldConfig<BaseRow>;

export const tableConfigs = {
  users: {
    // all: memberAllConfig,
    required: userRequiredConfig,
  },
  events: {
    // all: courseAllConfig,
    // required: {},
  },
  tickets: {
    // all: creditAllConfig,
    // required: creditConfigRequired(users, events),
  },
  locations: {
    // all: creditAllConfig,
    required: locationRequiredConfig,
  },
  courseCredits: {
    // all: creditAllConfig,
    required: courseCreditsRequiredConfig,
  },
} satisfies Record<
  CrudRegistryType,
  Partial<
    Record<"all" | "required", FieldConfig | ((arg: string) => FieldConfig)>
  >
>;

export const userCreditMap = (ticket: TicketSelect, user: UserSelect) => ({
  id: ticket.id,
  user_id: user.id,
  // event_id: ticket.courseId,
  first_name: user.first_name,
  last_name: user.last_name,
  middle_initial: user.middle_initial,
  phone: user.phone,
  email: user.email,
  address_1: user.address_1,
  city: user.city,
  state: user.state,
  zip: user.zip,
  attended: ticket.attended,
});
