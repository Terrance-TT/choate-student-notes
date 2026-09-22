/**
 * Canonical announcement data for Choate Student Notes (design.md §8, §10).
 * Detail sheets, digest generation, search, and every page read from this
 * single source of truth.
 */

import clubFair from "@/assets/img-club-fair";
import bloodDriveFlyer from "@/assets/img-blood-drive";
import artsAuditions from "@/assets/img-arts-auditions";
import athleticsPhoto from "@/assets/img-athletics-photo";

export interface AnnouncementSection {
  /** Optional sub-section heading, e.g. "Yearbook" inside a combined note. */
  heading?: string;
  body: string;
  /** Optional image — data URI from src/assets/img.ts (or an uploaded data URL). */
  image?: string;
  /** Optional image caption shown below the image. */
  imageCaption?: string;
}

export interface Announcement {
  id: string;
  /** Must match a Department id from DEPARTMENTS. */
  department: string;
  title: string;
  /** ISO date string (yyyy-mm-dd). */
  date: string;
  /** e.g. "EVENT" — rendered as an event-red pill. */
  tag?: string;
  sections: AnnouncementSection[];
}

export interface Department {
  id: string;
  /** Display name used in group headers. */
  name: string;
  /** Short label used in chips/tags. */
  short: string;
  /** Accent color (left border + dot) per design.md §7.4. */
  color: string;
}

/** Canonical department order + accent colors (design.md §7.4). */
export const DEPARTMENTS: Department[] = [
  {
    id: "student-academic-life",
    name: "Head of Student & Academic Life",
    short: "Academic Life",
    color: "#D4A017",
  },
  {
    id: "student-activities",
    name: "Student Activities",
    short: "Activities",
    color: "#1B4FA0",
  },
  {
    id: "clubs-organizations",
    name: "Clubs & Organizations",
    short: "Clubs",
    color: "#7A5CFF",
  },
  {
    id: "student-services-kiosk",
    name: "Student Services Kiosk",
    short: "Kiosk",
    color: "#2E8B6E",
  },
  {
    id: "arts",
    name: "Arts Department",
    short: "Arts",
    color: "#B3392E",
  },
  {
    id: "athletics",
    name: "Athletics",
    short: "Athletics",
    color: "#C86A1B",
  },
];

export function getDepartment(id: string): Department {
  return (
    DEPARTMENTS.find((d) => d.id === id) ?? {
      id,
      name: id,
      short: id,
      color: "#5A6478",
    }
  );
}

/** Seed content — design.md §10 (week of Wed Sep 16). */
export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "start-of-term-reminders",
    department: "student-academic-life",
    title: "Start-of-Term Reminders",
    date: "2025-09-16",
    sections: [
      {
        body: "Welcome back! A few reminders from Will Gilyard, Head of Student and Academic Life, as the term gets underway.",
      },
      {
        heading: "Advisor Meetings",
        body: "First advisor meetings happen this Thursday. Check your advisor's posted location and come prepared with your course schedule.",
      },
      {
        heading: "Add/Drop Deadline",
        body: "The add/drop deadline is Friday at 4:00pm. No schedule changes will be processed after that time — see your advisor before then.",
      },
      {
        heading: "Quiet Hours",
        body: "Dorm quiet hours begin at 10:00pm on school nights. Please be respectful of your neighbors as everyone settles into the term.",
      },
    ],
  },
  {
    id: "club-fair-on-the-quad",
    department: "student-activities",
    title: "Club Fair on the Quad",
    date: "2025-09-16",
    tag: "EVENT",
    sections: [
      {
        body: "This Friday, September 19 from 3:30–5:00pm on the Science Center lawn: more than 60 clubs will be tabling at the annual Club Fair. Come find your people — sign up for as many as you like.",
        image: clubFair,
        imageCaption: "Last year's Club Fair on the quad",
      },
      {
        heading: "Rain Location",
        body: "If it rains, the fair moves indoors to St. John's gym. Same time, same clubs.",
      },
    ],
  },
  {
    id: "yearbook-blood-drive",
    department: "clubs-organizations",
    title: "Yearbook & Red Cross Blood Drive",
    date: "2025-09-16",
    sections: [
      {
        heading: "Yearbook",
        body: "Yearbooks are available to purchase for all members of the Choate community. Deadline to purchase is May 1, 2027. Seniors and PG students receive a book free — no need to fill out the order form unless you'd like a second copy.",
      },
      {
        heading: "Red Cross Blood Drive",
        body: "The Red Cross Club is hosting a blood drive on September 29, 10:00am–3:00pm in Ruutz-Rees, 108 Rosemary Lane, Wallingford CT 06492. One donation can save up to three lives — sign up with the Red Cross Club.",
        image: bloodDriveFlyer,
        imageCaption:
          "September 29 · 10:00am–3:00pm · Ruutz-Rees, 108 Rosemary Lane, Wallingford CT 06492",
      },
    ],
  },
  {
    id: "kiosk-hours-package-pickup",
    department: "student-services-kiosk",
    title: "Kiosk Hours & Package Pickup",
    date: "2025-09-16",
    sections: [
      {
        body: "The Student Services Kiosk is open weekdays 8:00am–6:00pm for mail, packages, and school-store essentials.",
      },
      {
        heading: "Saturday Window",
        body: "A Saturday pickup window runs 10:00am–12:00pm for packages only.",
      },
      {
        heading: "ID Required",
        body: "Bring your student ID for all package pickups — no exceptions.",
      },
    ],
  },
  {
    id: "fall-play-auditions",
    department: "arts",
    title: "Fall Play Auditions: Our Town",
    date: "2025-09-16",
    tag: "EVENT",
    sections: [
      {
        body: "Auditions for the fall play, Thornton Wilder's Our Town, are September 22–23 from 4:00–6:00pm in the Paul Mellon Arts Center theater. All students are welcome — absolutely no experience needed. Come as you are.",
        image: artsAuditions,
        imageCaption: "The Paul Mellon Arts Center theater",
      },
    ],
  },
  {
    id: "fall-sports-picture-day",
    department: "athletics",
    title: "Fall Sports Picture Day",
    date: "2025-09-16",
    sections: [
      {
        body: "Fall team and individual photos are Wednesday, September 24 right after practice at the Worthington Johnson Athletic Center. Bring your full uniform — coaches have the schedule for each team's time slot.",
        image: athleticsPhoto,
        imageCaption: "Worthington Johnson Athletic Center",
      },
    ],
  },
];

/** Full plain-text body of an announcement (first section, for card previews). */
export function previewText(a: Announcement): string {
  return a.sections[0]?.body ?? "";
}

/** First section image, if any (card thumbnails). */
export function firstImage(a: Announcement): string | undefined {
  return a.sections.find((s) => s.image)?.image;
}
