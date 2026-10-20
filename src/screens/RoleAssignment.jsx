import React from "react";
import ConfirmDialog, { UnsavedGuard } from "../components/ConfirmDialog.jsx";

const renderScreen = (v, props) => (
  <div
    className="scr-roles"
    style={{
      minHeight: "1000px",
      display: "flex",
      flexWrap: "wrap",
      background: "#050505",
      color: "#ffffff",
      fontFamily: "Arial, Helvetica, sans-serif",
    }}
  >
    <aside
      style={{
        flex: "0 0 248px",
        boxSizing: "border-box",
        padding: "22px 16px",
        background: "#000000",
        borderRight: "1px solid #1c1c1c",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <a
        href="#"
        style={{
          padding: "4px 14px 22px",
          fontSize: "21px",
          fontWeight: "bold",
          letterSpacing: "-0.5px",
          color: "#ffffff",
        }}
      >
        {"ICTAZ "}
        <span style={{ color: "#0066ff" }}>CBU</span>
      </a>
      <div
        style={{
          padding: "0 14px 8px",
          color: "#75859e",
          fontSize: "11px",
          fontWeight: "bold",
          letterSpacing: "2px",
        }}
      >
        MANAGE
      </div>
      <a className="nav-item" href="#">
        <span>Dashboard</span>
      </a>
      <a className="nav-item" href="#">
        <span>Sessions</span>
      </a>
      <a className="nav-item" href="#">
        <span>Members</span>
      </a>
      <a className="nav-item" href="#">
        <span>Approvals</span>
      </a>
      <a className="nav-item" href="#">
        <span>Executives</span>
      </a>
      <a className="nav-item" href="#">
        <span>Programs</span>
      </a>
      <div
        style={{
          padding: "18px 14px 8px",
          color: "#75859e",
          fontSize: "11px",
          fontWeight: "bold",
          letterSpacing: "2px",
        }}
      >
        INSIGHTS
      </div>
      <a className="nav-item" href="#">
        <span>Analytics</span>
      </a>
      <a className="nav-item" href="#">
        <span>Reports and exports</span>
      </a>
      <a className="nav-item" href="#">
        <span>Audit log</span>
      </a>
      <div
        style={{
          padding: "18px 14px 8px",
          color: "#54adff",
          fontSize: "11px",
          fontWeight: "bold",
          letterSpacing: "2px",
        }}
      >
        SUPER ADMIN
      </div>
      <a
        className="nav-item"
        href="#"
        style={{ background: "rgba(0,102,255,0.14)", color: "#54adff" }}
      >
        <span>Roles</span>
      </a>
      <a className="nav-item" href="#">
        <span>System settings</span>
      </a>
      <a className="nav-item" href="#">
        <span>Email templates</span>
      </a>
      <a className="nav-item" href="#">
        <span>Terms and privacy</span>
      </a>
      <a className="nav-item" href="#">
        <span>Anonymise a member</span>
      </a>
      <div style={{ flexGrow: "1" }}></div>
      <div
        style={{
          padding: "14px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: "bold" }}>
          Sample Super Admin
        </div>
        <div style={{ marginTop: "3px", color: "#8a99b3", fontSize: "12px" }}>
          Super Admin · Executive
        </div>
        <a
          href="#"
          onClick={v.signOut}
          style={{
            display: "inline-block",
            marginTop: "10px",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          Sign out
        </a>
      </div>
    </aside>
    <main
      style={{
        flex: "1 1 680px",
        minWidth: "0",
        boxSizing: "border-box",
        padding: "28px 32px 40px",
        display: "flex",
        flexDirection: "column",
        gap: "22px",
      }}
    >
      <header>
        <h1 style={{ margin: "0", fontSize: "30px", letterSpacing: "-1px" }}>
          Roles
        </h1>
        <p
          style={{
            margin: "6px 0 0",
            color: "#aebfda",
            fontSize: "14px",
            lineHeight: "1.6",
            maxWidth: "760px",
          }}
        >
          Only a Super Admin can give or remove staff roles. Registrar, Reviewer
          and Administrator go to current executive members only, and end
          automatically when their executive profile ends. Sample data.
        </p>
      </header>
      {v.toast && (
        <>
          <div
            role="status"
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background: v.toastBg,
              border: `1px solid ${v.toastBorder}`,
              color: v.toastColor,
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            {v.toast}
          </div>
        </>
      )}
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "18px",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            flex: "2 1 560px",
            minWidth: "0",
            boxSizing: "border-box",
            padding: "24px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <h2 style={{ margin: "0", fontSize: "18px" }}>Staff with a role</h2>
            <span style={{ color: "#8a99b3", fontSize: "12px" }}>
              {v.staffCount}
              {" accounts"}
            </span>
          </div>
          <div
            style={{
              marginTop: "16px",
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1.5fr) minmax(0, 1.3fr) minmax(0, 1fr) auto",
              gap: "12px",
              padding: "0 4px 10px",
              color: "#75859e",
              fontSize: "11px",
              fontWeight: "bold",
              letterSpacing: "1.2px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span>MEMBER</span>
            <span>EXECUTIVE POSITION</span>
            <span>ROLE</span>
            <span style={{ width: "190px" }}>ACTIONS</span>
          </div>
          {v.staff.map((p, $i) => (
            <React.Fragment key={$i}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1.5fr) minmax(0, 1.3fr) minmax(0, 1fr) auto",
                  gap: "12px",
                  alignItems: "center",
                  padding: "14px 4px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  fontSize: "14px",
                }}
              >
                <div style={{ minWidth: "0" }}>
                  <div style={{ fontWeight: "bold" }}>{p.name}</div>
                  <div
                    style={{
                      marginTop: "2px",
                      color: "#8a99b3",
                      fontSize: "12px",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {p.no}
                  </div>
                </div>
                <span style={{ color: "#dce8f8" }}>{p.position}</span>
                <span
                  style={{
                    justifySelf: "start",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: p.chipBg,
                    border: `1px solid ${p.chipBorder}`,
                    color: p.chipColor,
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {p.role}
                </span>
                <div style={{ display: "flex", gap: "8px", width: "190px" }}>
                  <button
                    className="btn-danger"
                    type="button"
                    disabled={p.removeDisabled}
                    onClick={p.remove}
                    title={p.removeTitle}
                    style={{
                      flex: "1",
                      padding: "9px 10px",
                      borderRadius: "8px",
                      background: "rgba(255,107,107,0.1)",
                      border: "1px solid rgba(255,107,107,0.4)",
                      color: "#ffb3b3",
                      fontFamily: "inherit",
                      fontSize: "13px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Remove role
                  </button>
                  {p.canEnd && (
                    <>
                      <button
                        className="btn-ghost"
                        type="button"
                        onClick={p.endProfile}
                        style={{
                          flex: "1",
                          padding: "9px 10px",
                          border: "1px solid #333333",
                          borderRadius: "8px",
                          background: "transparent",
                          color: "#ffffff",
                          fontFamily: "inherit",
                          fontSize: "12px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        Demo: end profile
                      </button>
                    </>
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}
          <p
            style={{
              margin: "14px 0 0",
              color: "#8a99b3",
              fontSize: "12px",
              lineHeight: "1.6",
            }}
          >
            The last Active Super Admin can never be removed. Administrators
            cannot assign roles, and cannot change, suspend or reset a Super
            Admin account.
          </p>
        </div>
        <div
          style={{
            flex: "1 1 340px",
            minWidth: "0",
            boxSizing: "border-box",
            padding: "24px",
            borderRadius: "18px",
            background:
              "linear-gradient(160deg, rgba(0,102,255,0.14), rgba(255,255,255,0.025) 60%)",
            border: "1px solid rgba(84,173,255,0.35)",
          }}
        >
          <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>Assign a role</h2>
          <p
            style={{
              margin: "0 0 18px",
              color: "#aebfda",
              fontSize: "13px",
              lineHeight: "1.55",
            }}
          >
            The person is emailed, and the change is saved in the audit log with
            your reason.
          </p>
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="mem"
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Member
            </label>
            <select
              className="field"
              id="mem"
              value={v.selMember}
              onChange={v.onMember}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "9px",
                color: "#f1f6ff",
                fontFamily: "inherit",
                fontSize: "14px",
              }}
            >
              {v.memberOptions.map((o, $i) => (
                <React.Fragment key={$i}>
                  <option value={o.id}>{o.label}</option>
                </React.Fragment>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="role"
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Role
            </label>
            <select
              className="field"
              id="role"
              value={v.selRole}
              onChange={v.onRole}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "9px",
                color: "#f1f6ff",
                fontFamily: "inherit",
                fontSize: "14px",
              }}
            >
              <option value="Registrar">
                Registrar: mark members manually
              </option>
              <option value="Reviewer">Reviewer: read-only oversight</option>
              <option value="Administrator">
                Administrator: run sessions and accounts
              </option>
              <option value="Super Admin">
                Super Admin: everything, including roles
              </option>
            </select>
            <div
              style={{
                marginTop: "8px",
                color: "#8a99b3",
                fontSize: "12px",
                lineHeight: "1.5",
              }}
            >
              {v.roleNote}
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="why"
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Reason
            </label>
            <input
              className="field"
              id="why"
              type="text"
              placeholder="For example: appointed Treasurer 2026/27"
              value={v.reason}
              onChange={v.onReason}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "9px",
                color: "#f1f6ff",
                fontFamily: "inherit",
                fontSize: "14px",
              }}
            />
          </div>
          {v.blocked && (
            <>
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(255,107,107,0.1)",
                  border: "1px solid rgba(255,107,107,0.4)",
                  color: "#ffb3b3",
                  fontSize: "13px",
                  lineHeight: "1.55",
                }}
              >
                <strong style={{ color: "#ffd0d0" }}>Not allowed.</strong>{" "}
                {v.blockedMsg}
              </div>
            </>
          )}
          <button
            className="btn-primary"
            type="button"
            disabled={v.assignDisabled}
            onClick={v.assign}
            style={{
              width: "100%",
              height: "48px",
              border: "none",
              borderRadius: "8px",
              background: "#0066ff",
              color: "#ffffff",
              fontFamily: "inherit",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Assign role
          </button>
        </div>
      </section>
      <section
        style={{
          padding: "22px 24px",
          borderRadius: "18px",
          background: "rgba(84,173,255,0.06)",
          border: "1px solid rgba(84,173,255,0.25)",
          color: "#bcd6ff",
          fontSize: "13px",
          lineHeight: "1.7",
        }}
      >
        <strong style={{ color: "#e8f0ff", fontSize: "14px" }}>
          What happens when an executive profile ends
        </strong>
        <br />
        {
          " Their Registrar, Reviewer or Administrator role is removed automatically, their account goes back to Member, and they are emailed. The change is saved in the audit log as an automatic removal. A Super Admin role is not removed automatically, because a Super Admin does not need to be an executive. "
        }
      </section>
    </main>
  </div>
);

class Screen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selMember: "5",
      selRole: "Registrar",
      reason: "",
      toast: "",
      toastKind: "ok",
      people: [
        {
          id: 1,
          name: "Sample Super Admin",
          no: "21112233",
          position: "President",
          role: "Super Admin",
        },
        {
          id: 2,
          name: "Mutale Chola",
          no: "21557788",
          position: "Secretary General",
          role: "Administrator",
        },
        {
          id: 3,
          name: "Bwalya Tembo",
          no: "22003344",
          position: "Treasurer",
          role: "Reviewer",
        },
        {
          id: 4,
          name: "Namukolo Siame",
          no: "22118899",
          position: "Vice President",
          role: "Registrar",
        },
        {
          id: 5,
          name: "Kelvin Mumba",
          no: "22440011",
          position: "Events Coordinator",
          role: "Member",
        },
        {
          id: 6,
          name: "Mwila Banda",
          no: "20481133",
          position: "",
          role: "Member",
        },
        {
          id: 7,
          name: "Natasha Mulenga",
          no: "22156490",
          position: "",
          role: "Member",
        },
      ],
    };
  }
  renderVals() {
    const s = this.state;
    const colors = {
      "Super Admin": [
        "rgba(84,173,255,0.16)",
        "rgba(84,173,255,0.55)",
        "#bcd6ff",
      ],
      Administrator: ["rgba(0,102,255,0.16)", "rgba(0,102,255,0.6)", "#8fbcff"],
      Reviewer: ["rgba(61,220,151,0.12)", "rgba(61,220,151,0.45)", "#9df0c8"],
      Registrar: ["rgba(255,176,32,0.12)", "rgba(255,176,32,0.45)", "#ffd98a"],
      Member: ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.18)", "#aebfda"],
    };
    const staffRows = s.people.filter((p) => p.role !== "Member");
    const superCount = s.people.filter((p) => p.role === "Super Admin").length;
    const staff = staffRows.map((p) => {
      const c = colors[p.role];
      const lastSuper = p.role === "Super Admin" && superCount <= 1;
      return {
        name: p.name,
        no: p.no,
        position: p.position || "Not an executive",
        role: p.role,
        chipBg: c[0],
        chipBorder: c[1],
        chipColor: c[2],
        removeDisabled: lastSuper,
        removeTitle: lastSuper
          ? "The last Active Super Admin cannot be removed"
          : "Return this person to Member",
        canEnd: p.role !== "Super Admin" && !!p.position,
        remove: () =>
          this.setRole(
            p.id,
            "Member",
            "Removed the " +
              p.role +
              " role from " +
              p.name +
              ". They have been emailed and the change is in the audit log.",
            "ok",
          ),
        endProfile: () =>
          this.setRole(
            p.id,
            "Member",
            "The executive profile for " +
              p.name +
              " ended, so the " +
              p.role +
              " role was removed automatically. They have been emailed.",
            "info",
            true,
          ),
      };
    });
    const cur =
      s.people.find((p) => String(p.id) === s.selMember) || s.people[0];
    const staffRole =
      s.selRole === "Registrar" ||
      s.selRole === "Reviewer" ||
      s.selRole === "Administrator";
    const isExec = !!cur.position;
    const blocked = staffRole && !isExec;
    const same = cur.role === s.selRole;
    const notes = {
      Registrar:
        "Can search members, mark present, unmark and excuse. No analytics, exports or accounts.",
      Reviewer:
        "Can view lists, analytics and full executive details. Cannot change or export anything.",
      Administrator:
        "Runs sessions, accounts, executives and reports. Cannot assign roles or change system settings.",
      "Super Admin":
        "Highest role. Can also assign roles and change settings, email templates and the Terms. Does not need to be an executive.",
    };
    const tone = {
      ok: ["rgba(61,220,151,0.1)", "rgba(61,220,151,0.4)", "#9df0c8"],
      info: ["rgba(84,173,255,0.1)", "rgba(84,173,255,0.4)", "#bcd6ff"],
    }[s.toastKind] || [
      "rgba(61,220,151,0.1)",
      "rgba(61,220,151,0.4)",
      "#9df0c8",
    ];
    return {
      staff: staff,
      staffCount: staff.length,
      toast: s.toast,
      toastBg: tone[0],
      toastBorder: tone[1],
      toastColor: tone[2],
      selMember: s.selMember,
      selRole: s.selRole,
      reason: s.reason,
      memberOptions: s.people.map((p) => ({
        id: String(p.id),
        label:
          p.name + " · " + (p.position || "not an executive") + " · " + p.role,
      })),
      roleNote: notes[s.selRole],
      blocked: blocked,
      blockedMsg:
        cur.name +
        " has no current executive profile. Registrar, Reviewer and Administrator can only be given to current executives. Add an executive profile first.",
      assignDisabled: blocked || same || s.reason.trim().length < 3,
      onMember: (e) => this.setState({ selMember: e.target.value }),
      onRole: (e) => this.setState({ selRole: e.target.value }),
      onReason: (e) => this.setState({ reason: e.target.value }),
      assign: () => {
        if (blocked || same || this.state.reason.trim().length < 3) return;
        this.setRole(
          cur.id,
          this.state.selRole,
          "Assigned the " +
            this.state.selRole +
            " role to " +
            cur.name +
            ". They have been emailed and the change is in the audit log.",
          "ok",
        );
        this.setState({ reason: "" });
      },
    };
  }
  setRole(id, role, msg, kind, clearPosition) {
    const people = this.state.people.map((p) =>
      p.id === id
        ? Object.assign({}, p, {
            role: role,
            position: clearPosition ? "" : p.position,
          })
        : p,
    );
    this.setState({ people: people, toast: msg, toastKind: kind });
  }

  ask = (cfg) => this.setState({ confirm: cfg });

  render() {
    const v = this.renderVals();
    const unsaved = this.state.reason.trim().length > 0;
    v.signOut = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      this.ask({
        title: "Sign out?",
        body: "You will need to sign in again to continue.",
        warning: unsaved
          ? "You have a reason typed that has not been saved. Signing out will discard it."
          : null,
        confirmLabel: "Sign out",
        tone: "info",
        run: () => this.props.onSignOut && this.props.onSignOut(),
      });
    };
    v.staff.forEach((p) => {
      const rm = p.remove;
      const end = p.endProfile;
      p.remove = () =>
        this.ask({
          title: "Remove the " + p.role + " role?",
          body:
            p.name +
            " goes back to Member straight away and is emailed. The change is recorded in the audit log.",
          confirmLabel: "Remove role",
          tone: "danger",
          run: rm,
        });
      p.endProfile = () =>
        this.ask({
          title: "End the executive profile?",
          body:
            p.name +
            " stops being an executive, so the " +
            p.role +
            " role is removed automatically.",
          confirmLabel: "End profile",
          tone: "danger",
          run: end,
        });
    });
    const doAssign = v.assign;
    v.assign = () => {
      const role = this.state.selRole;
      if (role === "Administrator" || role === "Super Admin") {
        const who = (
          this.state.people.find(
            (p) => String(p.id) === this.state.selMember,
          ) || this.state.people[0]
        ).name;
        this.ask({
          title: "Give " + who + " the " + role + " role?",
          body:
            role === "Super Admin"
              ? "A Super Admin can do everything an Administrator can, and can also assign roles and change system settings."
              : "An Administrator runs sessions, accounts, executives and reports.",
          confirmLabel: "Assign " + role,
          tone: "warning",
          run: doAssign,
        });
      } else doAssign();
    };
    const c = this.state.confirm;
    return (
      <>
        {renderScreen(v, this.props)}
        <UnsavedGuard active={!!unsaved} />
        {c && (
          <ConfirmDialog
            cfg={c}
            onCancel={() => this.setState({ confirm: null })}
            onConfirm={(reason) => {
              this.setState({ confirm: null });
              c.run(reason);
            }}
          />
        )}
      </>
    );
  }
}

export default Screen;
