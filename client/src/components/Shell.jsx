import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function Shell({ user, title, subtitle, action, children }) {
  return (
    <div className="shell">
      <Sidebar user={user} />
      <main className="main">
        <Topbar title={title} subtitle={subtitle} action={action} />
        <div className="content stack">{children}</div>
      </main>
    </div>
  );
}
