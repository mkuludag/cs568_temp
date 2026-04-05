/**
 * Site header with CDC-style logo area and navigation links.
 */
export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__logo">
          <span className="site-header__agency">CDC</span>
          <span className="site-header__title">
            Epidemic Forecasting Dashboard
          </span>
        </div>
        <nav className="site-header__nav">
          <a href="#forecast" className="site-header__link">
            Forecast
          </a>
          <a href="#map" className="site-header__link">
            Map
          </a>
          <a href="#data" className="site-header__link">
            Data
          </a>
          <a href="#about" className="site-header__link">
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
