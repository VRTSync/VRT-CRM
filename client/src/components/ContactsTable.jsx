// Contacts table per spec 7.3. Contractor contacts sit in this same
// table, marked with a badge in the Role cell, never split out.
export default function ContactsTable({ contacts }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Role</th>
          <th>Organization</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Primary</th>
        </tr>
      </thead>
      <tbody>
        {contacts.length === 0 && (
          <tr>
            <td colSpan={6} className="t-sub">
              No contacts yet.
            </td>
          </tr>
        )}
        {contacts.map((c) => (
          <tr key={c.id}>
            <td className="t-strong">{c.name}</td>
            <td>
              {c.title}
              {c.contactType === "contractor" && (
                <>
                  {" "}
                  <span className="badge role">Contractor</span>
                </>
              )}
            </td>
            <td>{c.organization}</td>
            <td className="mono">{c.email}</td>
            <td className="mono">{c.phone}</td>
            <td>{c.isPrimary && <span className="badge accent">Primary</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
