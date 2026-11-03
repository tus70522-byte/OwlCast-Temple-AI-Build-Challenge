/**
 * Temple support resources shown on the forecast's support card.
 *
 * TODO: verify URL — temple.edu could not be reached from the build environment, so none of the
 * specific pages below could be checked. Per the build spec we do not guess: every link points to
 * the Temple homepage (https://www.temple.edu/), and `suggestedUrl` records the page we expect the
 * team to confirm and paste into `url` before Demo Day.
 */
export interface SupportResource {
  name: string;
  description: string;
  url: string;
  /** TODO: verify URL, then move into `url`. */
  suggestedUrl: string;
  verified: boolean;
}

export const SUPPORT_RESOURCES: SupportResource[] = [
  {
    name: "Academic advising",
    description: "Talk through a heavy week, your course load, or your options before deadlines.",
    url: "https://www.temple.edu/", // TODO: verify URL
    suggestedUrl: "https://advising.temple.edu/",
    verified: false,
  },
  {
    name: "Tutoring and academic support",
    description: "Free tutoring, study groups, and writing help for your courses.",
    url: "https://www.temple.edu/", // TODO: verify URL
    suggestedUrl: "https://studentsuccess.temple.edu/",
    verified: false,
  },
  {
    name: "Counseling services",
    description: "Free, confidential support when stress builds up. Same-day options are available.",
    url: "https://www.temple.edu/", // TODO: verify URL
    suggestedUrl: "https://counseling.temple.edu/",
    verified: false,
  },
  {
    name: "Basic needs support",
    description: "Help with food, housing, and emergency costs, so school can stay the focus.",
    url: "https://www.temple.edu/", // TODO: verify URL
    suggestedUrl: "https://basicneeds.temple.edu/",
    verified: false,
  },
];
