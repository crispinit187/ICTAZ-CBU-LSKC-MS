import React from "react";
import ConfirmDialog, { UnsavedGuard } from "../components/ConfirmDialog.jsx";
import Toast from "../components/Toast.jsx";

const renderScreen = (v, props) => (
  <div className="scr-roles">
    <main
      style={{
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
          Only a Super Admin can give or remove roles. Any Active member can be
          given a role. A person has one main role, and can also hold Registrar
          privileges on top of it.{v.sampleNote}
        </p>
      </header>
      {v.toast && (
        <Toast tone={v.toastKind} sig={v.toastSig}>
          {v.toast}
        </Toast>
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
            className="roles-head"
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
                className="roles-row"
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
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    justifyContent: "flex-start",
                  }}
                >
                  {p.items.map((it, $j) => (
                    <span
                      key={$j}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "20px",
                        background: it.chipBg,
                        border: `1px solid ${it.chipBorder}`,
                        color: it.chipColor,
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {it.role}
                    </span>
                  ))}
                </div>
                <div
                  className="roles-actions"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    width: "190px",
                  }}
                >
                  {p.items.map((it, $j) => (
                    <button
                      key={$j}
                      className="btn-danger"
                      type="button"
                      disabled={it.removeDisabled}
                      onClick={it.remove}
                      title={it.removeTitle}
                      style={{
                        padding: "9px 10px",
                        borderRadius: "8px",
                        background: "rgba(255,107,107,0.1)",
                        border: "1px solid rgba(255,107,107,0.4)",
                        color: "#ffb3b3",
                        fontFamily: "inherit",
                        fontSize: "13px",
                        fontWeight: "bold",
                        cursor: it.removeDisabled ? "not-allowed" : "pointer",
                        opacity: it.removeDisabled ? 0.5 : 1,
                      }}
                    >
                      {p.items.length > 1 ? "Remove " + it.role : "Remove role"}
                    </button>
                  ))}
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
            {v.real && (
              <input
                type="search"
                aria-label="Search for a member"
                placeholder="Search by name or student number to find someone else"
                value={v.search}
                onChange={v.onSearch}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  marginBottom: "8px",
                  padding: "11px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "9px",
                  color: "#f1f6ff",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            )}
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
                Registrar: mark attendance (can be added on top of another role)
              </option>
              <option value="Reviewer">Reviewer: read-only oversight</option>
              <option value="Administrator">
                Administrator: run sessions and accounts
              </option>
              <option value="Super Admin">
                Super Admin: everything, including roles
              </option>
              {v.extraRoles.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
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
          How roles work
        </strong>
        <br />
        {
          " A role does not depend on being an executive, and it is not removed when an executive profile ends. It stays until a Super Admin removes it, and the person is emailed. Super Admin and Administrator already include Registrar duties. Adding Registrar privileges to a Reviewer gives them the Registrar mode section in the side panel. "
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
  people() {
    const r = this.props.real;
    if (!r) return this.state.people;
    return r.people.map((p) => ({
      id: p.id,
      name: p.name,
      no: p.student_number,
      position: p.position || "",
      role: p.role,
      roles: p.roles || (p.role && p.role !== "Member" ? [p.role] : []),
      profileId: p.profile_id,
    }));
  }
  renderVals() {
    const s = Object.assign({}, this.state, {
      people: this.people().map((p) =>
        p.roles
          ? p
          : Object.assign({}, p, {
              roles: p.role && p.role !== "Member" ? [p.role] : [],
            }),
      ),
    });
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
    const plain = [
      "rgba(255,255,255,0.06)",
      "rgba(255,255,255,0.18)",
      "#dce8f8",
    ];
    const superCount = s.people.filter((p) =>
      p.roles.includes("Super Admin"),
    ).length;
    const staff = s.people
      .filter((p) => p.roles.length)
      .map((p) => ({
        name: p.name,
        no: p.no,
        position: p.position || "Not an executive",
        items: p.roles.map((role) => {
          const c = colors[role] || plain;
          const lastSuper = role === "Super Admin" && superCount <= 1;
          const addOn = role === "Registrar" && p.roles.length > 1;
          const label = addOn ? "Registrar privileges" : role;
          return {
            role: label,
            chipBg: c[0],
            chipBorder: c[1],
            chipColor: c[2],
            removeDisabled: lastSuper,
            removeTitle: lastSuper
              ? "The last Active Super Admin cannot be removed"
              : "Remove " + label,
            remove: (reason) => {
              const msg =
                "Removed the " +
                label +
                " role from " +
                p.name +
                ". They have been emailed and the change is in the audit log.";
              return this.props.real
                ? this.setRoleReal(p, "Member", msg, "ok", reason, false, role)
                : this.setRole(p.id, role, msg, "ok");
            },
          };
        }),
      }));
    const cur = s.people.find((p) => String(p.id) === s.selMember) ||
      (this.props.real && s.people.find((p) => p.roles.length === 0)) ||
      s.people[0] || {
        id: "",
        name: "Nobody",
        no: "",
        position: "",
        role: "Member",
        roles: [],
      };
    const blocked =
      s.selRole === "Registrar" &&
      (cur.roles.includes("Super Admin") ||
        cur.roles.includes("Administrator"));
    const same = cur.roles.includes(s.selRole);
    const notes = {
      Registrar:
        "Can search members, mark present, unmark and excuse. No analytics, exports or accounts.",
      Reviewer:
        "Can view lists, analytics and full executive details. Cannot change or export anything.",
      Administrator:
        "Runs sessions, accounts, executives and reports. Cannot assign roles or change system settings.",
      "Super Admin":
        "Highest role. Can also assign roles and change settings, email templates and the Terms.",
    };
    notes.Registrar +=
      " Can be added on top of another role, which adds the Registrar mode section.";
    return {
      staff: staff,
      staffCount: s.people.filter((p) => p.roles.length).length,
      toast: s.toast,
      toastKind: s.toastKind,
      toastSig: s.toastN,
      real: !!this.props.real,
      sampleNote: this.props.real ? "" : " Sample data.",
      search: s.search || "",
      onSearch: (e) => {
        this.setState({ search: e.target.value });
        this.props.real.onSearch(e.target.value);
      },
      selMember: String(cur.id),
      selRole: s.selRole,
      reason: s.reason,
      memberOptions: s.people.map((p) => ({
        id: String(p.id),
        label:
          p.name +
          " · " +
          (p.position || "not an executive") +
          " · " +
          (p.roles.length ? p.roles.join(" + ") : "Member"),
      })),
      roleNote: notes[s.selRole] || "",
      extraRoles: ((this.props.real && this.props.real.roleNames) || []).filter(
        (n) =>
          ["Registrar", "Reviewer", "Administrator", "Super Admin"].indexOf(n) <
          0,
      ),
      blocked: blocked,
      blockedMsg:
        cur.name +
        " already has Registrar duties through their role, so Registrar privileges do not need to be added.",
      assignDisabled: blocked || same || s.reason.trim().length < 3,
      onMember: (e) => this.setState({ selMember: e.target.value }),
      onRole: (e) => this.setState({ selRole: e.target.value }),
      onReason: (e) => this.setState({ reason: e.target.value }),
      assign: () => {
        if (blocked || same || this.state.reason.trim().length < 3) return;
        const msg =
          "Assigned the " +
          this.state.selRole +
          " role to " +
          cur.name +
          ". They have been emailed and the change is in the audit log.";
        if (this.props.real)
          this.setRoleReal(
            cur,
            this.state.selRole,
            msg,
            "ok",
            this.state.reason.trim(),
          );
        else this.setRole(cur.id, this.state.selRole, msg, "ok");
        this.setState({ reason: "" });
      },
    };
  }
  async setRoleReal(p, role, msg, kind, reason, ending, removeName) {
    const r = this.props.real;
    const err = ending
      ? await r.endProfile(p.profileId, reason)
      : role === "Member"
        ? await r.removeRole(p.id, reason, removeName)
        : await r.assignRole(p.id, role, reason);
    this.setState(
      err
        ? { toast: err, toastKind: "error", toastN: Date.now() }
        : { toast: msg, toastKind: kind, toastN: Date.now() },
    );
  }
  setRole(id, role, msg, kind, clearPosition) {
    const people = this.state.people.map((p) =>
      p.id === id
        ? Object.assign({}, p, {
            role: role,
            roles: role === "Member" ? [] : [role],
            position: clearPosition ? "" : p.position,
          })
        : p,
    );
    this.setState({
      people: people,
      toast: msg,
      toastKind: kind,
      toastN: Date.now(),
    });
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
      p.items.forEach((it) => {
        const rm = it.remove;
        it.remove = () =>
          this.ask({
            title: "Remove the " + it.role + " role?",
            body:
              p.name +
              " loses this role straight away and is emailed. The change is recorded in the audit log.",
            confirmLabel: "Remove role",
            reasonLabel: this.props.real
              ? "Reason (recorded in the audit log)"
              : undefined,
            tone: "danger",
            run: rm,
          });
      });
    });
    const doAssign = v.assign;
    v.assign = () => {
      const role = this.state.selRole;
      if (role === "Administrator" || role === "Super Admin") {
        const who = (
          this.people().find((p) => String(p.id) === v.selMember) ||
          this.people()[0] || { name: "them" }
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
