/**
 * Breadcrumb navigation — CDC pattern.
 */

interface BreadcrumbProps {
  disease: string;
  jurisdiction: string;
}

export default function Breadcrumb({ disease, jurisdiction }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb__list">
        <li className="breadcrumb__item">
          <a href="/" className="breadcrumb__link">Home</a>
        </li>
        <li className="breadcrumb__item">
          <span className="breadcrumb__separator">/</span>
          <span className="breadcrumb__current">
            {disease === "flu" ? "Influenza" : "COVID-19"} — {jurisdiction}
          </span>
        </li>
      </ol>
    </nav>
  );
}
