/**
 * "On This Page" sidebar navigation — CDC pattern.
 */

interface SidebarProps {
  agentsEnabled: boolean;
}

export default function Sidebar({ agentsEnabled }: SidebarProps) {
  const sections = [
    { id: "controls", label: "Controls" },
    { id: "summary", label: "Summary" },
    { id: "forecast", label: "Forecast Chart" },
    { id: "map", label: "Geographic Map" },
    { id: "data", label: "Data Table" },
  ];

  if (agentsEnabled) {
    sections.push({ id: "agents", label: "AI Advisory Panel" });
  }

  return (
    <aside className="sidebar">
      <h3 className="sidebar__heading">On This Page</h3>
      <ul className="sidebar__list">
        {sections.map((s) => (
          <li key={s.id} className="sidebar__item">
            <a href={`#${s.id}`} className="sidebar__link">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
