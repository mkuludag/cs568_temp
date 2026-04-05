/**
 * Blue .gov banner with US flag — matches CDC / USWDS pattern.
 */
export default function GovBanner() {
  return (
    <div className="gov-banner">
      <div className="gov-banner__inner">
        <img
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='11'%3E%3Crect width='16' height='11' fill='%23002664'/%3E%3Crect y='1' width='16' height='1' fill='white'/%3E%3Crect y='3' width='16' height='1' fill='white'/%3E%3Crect y='5' width='16' height='1' fill='white'/%3E%3Crect y='7' width='16' height='1' fill='white'/%3E%3Crect y='9' width='16' height='1' fill='white'/%3E%3Crect width='7' height='5' fill='%23002664'/%3E%3C/svg%3E"
          alt="U.S. flag"
          className="gov-banner__flag"
        />
        <span className="gov-banner__text">
          An official website of the United States government
        </span>
      </div>
    </div>
  );
}
