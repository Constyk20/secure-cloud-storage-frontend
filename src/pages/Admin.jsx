import { useEffect, useState } from "react";
import api from "../services/api";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/admin/stats"), api.get("/admin/users")])
      .then(([statsResponse, usersResponse]) => {
        setStats(statsResponse.data);
        setUsers(usersResponse.data);
      })
      .catch(() => setError("Admin access is required."));
  }, []);

  return (
    <section>
      <h1 className="text-2xl font-semibold">Admin</h1>
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
      {stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Users", stats.users],
            ["Files", stats.files],
            ["Security events", stats.security_events],
          ].map(([label, value]) => (
            <article key={label} className="rounded-xl bg-card p-5 ring-1 ring-line">
              <h2 className="text-sm text-muted">{label}</h2>
              <strong className="mt-2 block text-xl">{value}</strong>
            </article>
          ))}
        </div>
      )}
      {users.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl bg-card ring-1 ring-line">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="font-normal">Email</th>
                <th className="font-normal">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{user.full_name}</td>
                  <td className="text-muted">{user.email}</td>
                  <td className="text-muted">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}