/**
 * "Earlier notes" archive — design/departments.md §3.
 * Plausible older entries (3 per department) shown as a compact dotted-rule
 * list under each department's weekly feed. Archive rows open the shared
 * DetailSheet, so entries are full Announcement objects.
 */
import type { Announcement } from "@/data/announcements";

export const ARCHIVE: Announcement[] = [
  /* ---- Head of Student & Academic Life ---- */
  {
    id: "arch-advisor-survey",
    department: "student-academic-life",
    title: "Advisor Program Survey",
    date: "2025-09-09",
    sections: [
      {
        body: "Tell us how your first advisor meetings are going — a two-minute survey from the Head of Student and Academic Life's office.",
      },
    ],
  },
  {
    id: "arch-welcome-back-wildcats",
    department: "student-academic-life",
    title: "Welcome Back, Wildcats",
    date: "2025-09-02",
    sections: [
      {
        body: "Opening-week schedule, registration locations, and where to find your advisor on day one.",
      },
    ],
  },
  {
    id: "arch-convocation-seating",
    department: "student-academic-life",
    title: "Convocation Seating Chart",
    date: "2025-08-29",
    sections: [
      {
        body: "Form-level seating for Opening Convocation. Find your section posted outside the dean's office.",
      },
    ],
  },
  /* ---- Student Activities ---- */
  {
    id: "arch-club-fair-signup",
    department: "student-activities",
    title: "Club Fair Signup Reminder",
    date: "2025-09-09",
    sections: [
      {
        body: "Club heads: reserve your Club Fair table by Wednesday — tables are assigned first come, first served.",
      },
    ],
  },
  {
    id: "arch-welcome-back-picnic",
    department: "student-activities",
    title: "Welcome-Back Picnic",
    date: "2025-09-02",
    sections: [
      {
        body: "Hot dogs, lawn games, and music on the quad to kick off the year. All students welcome.",
      },
    ],
  },
  {
    id: "arch-fall-trip-survey",
    department: "student-activities",
    title: "Fall Weekend Trip Survey",
    date: "2025-08-29",
    sections: [
      {
        body: "Vote on this fall's off-campus trips — NYC museums, a hiking weekend, or a ballgame?",
      },
    ],
  },
  /* ---- Clubs & Organizations ---- */
  {
    id: "arch-club-heads-recap",
    department: "clubs-organizations",
    title: "Club Heads Meeting Recap",
    date: "2025-09-10",
    sections: [
      {
        body: "Notes from the first club heads meeting: budgets are due September 30, and every club needs a faculty advisor on file.",
      },
    ],
  },
  {
    id: "arch-new-club-applications",
    department: "clubs-organizations",
    title: "New Club Applications Open",
    date: "2025-09-04",
    sections: [
      {
        body: "Have an idea for a new club? Applications are open through October 1 — pick up a form from the Student Activities office.",
      },
    ],
  },
  {
    id: "arch-activities-fair-wrap",
    department: "clubs-organizations",
    title: "Activities Fair Wrap-Up",
    date: "2025-08-30",
    sections: [
      {
        body: "A record 74 clubs tabled at this year's activities fair. Send roster corrections to the Clubs & Organizations office.",
      },
    ],
  },
  /* ---- Student Services Kiosk ---- */
  {
    id: "arch-mail-notifications",
    department: "student-services-kiosk",
    title: "New Package Notification System",
    date: "2025-09-08",
    sections: [
      {
        body: "You'll now get an email the moment your package is scanned in at the kiosk — no more guessing.",
      },
    ],
  },
  {
    id: "arch-kiosk-fall-schedule",
    department: "student-services-kiosk",
    title: "Kiosk Fall Schedule",
    date: "2025-09-01",
    sections: [
      {
        body: "Fall term hours begin Monday: weekdays 8:00am–6:00pm, with a Saturday package window 10:00am–12:00pm.",
      },
    ],
  },
  {
    id: "arch-id-card-reprints",
    department: "student-services-kiosk",
    title: "ID Card Reprints",
    date: "2025-08-28",
    sections: [
      {
        body: "Lost your ID over the summer? Reprints are available at the kiosk — the first reprint is free.",
      },
    ],
  },
  /* ---- Arts Department ---- */
  {
    id: "arch-fall-concert-date",
    department: "arts",
    title: "Fall Concert Date Announced",
    date: "2025-09-11",
    sections: [
      {
        body: "The fall orchestral and choral concert is set for October 17 in the Paul Mellon Arts Center. Rehearsals begin next week.",
      },
    ],
  },
  {
    id: "arch-arts-supply-pickup",
    department: "arts",
    title: "Arts Supply Pickup",
    date: "2025-09-03",
    sections: [
      {
        body: "Visual arts students: pick up your supply kits in the PMAC lobby during free periods this week.",
      },
    ],
  },
  {
    id: "arch-summer-arts-showcase",
    department: "arts",
    title: "Summer Arts Showcase Recap",
    date: "2025-08-27",
    sections: [
      {
        body: "Photos and the program from the summer arts showcase are now posted outside the arts office.",
      },
    ],
  },
  /* ---- Athletics ---- */
  {
    id: "arch-preseason-recap",
    department: "athletics",
    title: "Fall Preseason Recap",
    date: "2025-09-12",
    sections: [
      {
        body: "Thanks to everyone who made preseason a success — full practice schedules are now posted in the athletic center.",
      },
    ],
  },
  {
    id: "arch-team-store-hours",
    department: "athletics",
    title: "Team Store Hours",
    date: "2025-09-05",
    sections: [
      {
        body: "The team store in Worthington Johnson is open weekdays 3:00–5:30pm for gear and uniforms.",
      },
    ],
  },
  {
    id: "arch-baseline-testing",
    department: "athletics",
    title: "Baseline Testing Reminder",
    date: "2025-08-31",
    sections: [
      {
        body: "All fall athletes must complete baseline concussion testing before their first contest. Sign up with the training room.",
      },
    ],
  },
];

/** Archive entries for one department, newest first. */
export function archiveFor(deptId: string): Announcement[] {
  return ARCHIVE.filter((a) => a.department === deptId).sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
}
