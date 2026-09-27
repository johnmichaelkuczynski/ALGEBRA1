import { Download } from "lucide-react";

const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

// The 29 course topics, in the order used by the course PDF.
export const COURSE_TOPICS = [
  "Real numbers and operations",
  "Order of operations and algebraic expressions",
  "Properties and simplifying expressions",
  "Solving one- and two-step equations",
  "Multi-step equations",
  "Literal equations and formulas",
  "Ratios, proportions, and percent",
  "Linear inequalities",
  "Compound and absolute-value statements",
  "Relations and functions",
  "Slope and rate of change",
  "Slope-intercept and point-slope forms",
  "Standard form, parallel and perpendicular lines",
  "Linear models and scatter plots",
  "Systems of equations by graphing",
  "Substitution and elimination",
  "Systems of linear inequalities",
  "Laws of exponents",
  "Scientific notation and exponential functions",
  "Polynomials and their operations",
  "Special products",
  "Factoring: GCF and grouping",
  "Factoring trinomials",
  "Solving quadratics by factoring",
  "Graphing quadratic functions",
  "Completing the square and the quadratic formula",
  "Radicals and the Pythagorean theorem",
  "Rational expressions",
  "Capstone synthesis",
];

// Small, unobtrusive vertical topics list that sits at the top-left of the
// landing page and dashboard, with course download links underneath.
export function TopicsList({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`w-56 shrink-0 ${className}`}
      aria-label="Topics covered in this course"
    >
      <h2 className="font-serif font-bold text-sm mb-0.5">Course map</h2>
      <p className="text-[11px] text-muted-foreground mb-2">
        {COURSE_TOPICS.length} topics
      </p>
      <ul className="flex flex-col gap-1.5">
        {COURSE_TOPICS.map((t) => (
          <li
            key={t}
            className="text-[11px] leading-snug text-muted-foreground"
          >
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-col gap-1.5">
        <a
          href={`${apiBase}/course/download?format=pdf`}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          data-testid="link-download-pdf"
        >
          <Download className="w-3.5 h-3.5" />
          Download Course (PDF)
        </a>
        <a
          href={`${apiBase}/course/download?format=txt`}
          className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 text-center"
          data-testid="link-download-txt"
        >
          or download as plain text (.txt)
        </a>
        <p className="text-[10px] text-muted-foreground text-center leading-snug">
          Lecture notes, practice homework, and exam problems.
        </p>
      </div>
    </aside>
  );
}
