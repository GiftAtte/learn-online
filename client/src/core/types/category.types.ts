/** Course categories. */

export interface Category {
  id: string;
  name: string;
  /** Number of published courses, when the API includes it. */
  courseCount?: number;
}
