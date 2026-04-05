/**
 * CDC-style site footer with disclaimer and links.
 */
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__info">
          <p className="site-footer__agency">
            CS568 — Epidemic Forecasting Dashboard
          </p>
          <p className="site-footer__disclaimer">
            This is an academic project and not an official CDC product.
            Data sourced from CDC NHSN for educational purposes only.
          </p>
        </div>
        <div className="site-footer__links">
          <a
            href="https://data.cdc.gov/Public-Health-Surveillance/Weekly-United-States-Hospitalization-Metrics-by-Jur/mpgq-jmmr"
            target="_blank"
            rel="noopener noreferrer"
          >
            CDC NHSN Data
          </a>
          <span className="site-footer__sep">|</span>
          <a
            href="https://www.cdc.gov/forecast-outbreak-analytics/partners/cfa-flusight-forecast.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            CDC FluSight
          </a>
        </div>
      </div>
    </footer>
  );
}
