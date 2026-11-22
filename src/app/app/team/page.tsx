import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Flash } from "@/components/Flash";
import {
  canManage,
  getMembership,
  listMembers,
  listPendingInvites,
  requireUser,
  ROLE_LABEL,
  seatsUsed,
} from "@/lib/teams";
import { inviteMember, leaveTeam, removeMember, revokeInvite, setSeats } from "../actions";

export const metadata: Metadata = { title: "Team" };

const dateFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;
  const user = await requireUser("/app/team");
  const membership = await getMembership(user.id);
  if (!membership) redirect("/app");

  const { team, role } = membership;
  const manage = canManage(role);
  const [members, invites, used] = await Promise.all([
    listMembers(team.id),
    manage ? listPendingInvites(team.id) : Promise.resolve([]),
    seatsUsed(team.id),
  ]);
  const full = used >= team.seats;

  return (
    <div className="app-wide">
      <Flash error={error} notice={notice} />

      <div className="enter d1" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="eyebrow">Team</span>
          <h1 className="app-h1">{team.name}</h1>
        </div>
        <span className="seat-pill">
          <strong>{used}</strong> of {team.seats} seat{team.seats === 1 ? "" : "s"} in use
        </span>
      </div>

      <section className="card enter d2 panel" aria-labelledby="members-h">
        <h2 id="members-h" className="panel-h">People</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Joined</th>
                {manage && <th scope="col"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody>
              {members.map((mb) => {
                const removable = manage && mb.userId !== user.id && mb.role !== "owner" && (mb.role !== "admin" || role === "owner");
                return (
                  <tr key={mb.userId}>
                    <td>{mb.name || "—"}{mb.userId === user.id && <span className="you"> (you)</span>}</td>
                    <td className="mono">{mb.email}</td>
                    <td>{ROLE_LABEL[mb.role]}</td>
                    <td>{dateFmt.format(mb.joined)}</td>
                    {manage && (
                      <td style={{ textAlign: "right" }}>
                        {removable && (
                          <form action={removeMember}>
                            <input type="hidden" name="userId" value={mb.userId} />
                            <button type="submit" className="link-btn danger">Remove</button>
                          </form>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {role !== "owner" && (
          <form action={leaveTeam}>
            <button type="submit" className="link-btn danger">Leave team</button>
          </form>
        )}
      </section>

      {manage && (
        <section className="card enter d3 panel" aria-labelledby="invite-h">
          <h2 id="invite-h" className="panel-h">Invite a colleague</h2>
          {full ? (
            <p className="lead" style={{ fontSize: 15 }}>
              All seats are in use. {role === "owner" ? "Add a seat below to invite someone." : "Ask the owner to add a seat."}
            </p>
          ) : (
            <form action={inviteMember} className="invite-form">
              <div className="field" style={{ flex: "2 1 260px" }}>
                <label htmlFor="inv-email">Work email</label>
                <input className="input" id="inv-email" name="email" type="email" required maxLength={200} autoComplete="off" />
              </div>
              <div className="field" style={{ flex: "1 1 160px" }}>
                <label htmlFor="inv-role">Role</label>
                <select className="input" id="inv-role" name="role" defaultValue="member">
                  <option value="member">Member</option>
                  {role === "owner" && <option value="admin">Admin</option>}
                </select>
              </div>
              <button type="submit" className="btn btn-solid btn-sm" style={{ alignSelf: "flex-end", minHeight: 48 }}>
                Send invite
              </button>
            </form>
          )}

          {invites.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 8 }}>
              <table className="table">
                <caption className="table-caption">Waiting to accept</caption>
                <thead>
                  <tr>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                    <th scope="col">Expires</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((inv) => (
                    <tr key={inv.id}>
                      <td className="mono">{inv.email}</td>
                      <td>{ROLE_LABEL[inv.role]}</td>
                      <td>{dateFmt.format(inv.expiresAt)}</td>
                      <td style={{ textAlign: "right" }}>
                        <form action={revokeInvite}>
                          <input type="hidden" name="inviteId" value={inv.id} />
                          <button type="submit" className="link-btn danger">Revoke</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {role === "owner" && (
        <section className="card enter d4 panel" aria-labelledby="seats-h">
          <h2 id="seats-h" className="panel-h">Seats</h2>
          <p className="lead" style={{ fontSize: 15 }}>
            Each person or waiting invite uses one seat. Partner is $500 USD per seat per month. Billing isn’t connected
            yet, so you can set the number of seats here for now.
          </p>
          <form action={setSeats} className="invite-form">
            <div className="field" style={{ flex: "0 1 160px" }}>
              <label htmlFor="seats">Seats</label>
              <input className="input" id="seats" name="seats" type="number" min={Math.max(1, used)} max={100} defaultValue={team.seats} inputMode="numeric" />
            </div>
            <button type="submit" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-end", minHeight: 48 }}>
              Update seats
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
