import React from "react";
import ConfirmDialog, { UnsavedGuard } from "../components/ConfirmDialog.jsx";

const renderScreen = (v, props) => (
  <div
    className="scr-registrar"
    style={{
      minHeight: "900px",
      display: "flex",
      flexDirection: "column",
      background: "#050505",
      color: "#ffffff",
      fontFamily: "Arial, Helvetica, sans-serif",
    }}
  >
    <nav
      style={{
        height: "70px",
        padding: "0 5%",
        boxSizing: "border-box",
        background: "#000000",
        borderBottom: "1px solid #1c1c1c",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <a
          href="#"
          style={{
            fontSize: "21px",
            fontWeight: "bold",
            letterSpacing: "-0.5px",
            color: "#ffffff",
          }}
        >
          {"ICTAZ "}
          <span style={{ color: "#0066ff" }}>CBU</span>
        </a>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "20px",
            background: "rgba(0,102,255,0.14)",
            border: "1px solid rgba(84,173,255,0.4)",
            color: "#54adff",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          Registrar
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "22px",
          fontSize: "14px",
          fontWeight: "600",
        }}
      >
        <a href="#scan" onClick={v.goScan} style={{ color: "#aaaaaa" }}>
          Scan my own attendance
        </a>
        <span style={{ color: "#aebfda" }}>{v.userName}</span>
        <a href="#" onClick={v.signOut}>
          Sign out
        </a>
      </div>
    </nav>
    <main
      style={{
        flexGrow: "1",
        boxSizing: "border-box",
        padding: "28px 5% 40px",
        display: "flex",
        flexWrap: "wrap",
        gap: "22px",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          flex: "2 1 560px",
          minWidth: "0",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <section
          style={{
            padding: "22px 24px",
            borderRadius: "18px",
            background:
              "linear-gradient(160deg, rgba(0,102,255,0.16), rgba(255,255,255,0.025) 65%)",
            border: "1px solid rgba(84,173,255,0.35)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  color: "#54adff",
                  fontSize: "11px",
                  fontWeight: "bold",
                  letterSpacing: "1.5px",
                }}
              >
                MARKING SESSION
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background: "rgba(61,220,151,0.12)",
                  border: "1px solid rgba(61,220,151,0.4)",
                  color: "#9df0c8",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                <span
                  className="live-dot"
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#3ddc97",
                  }}
                ></span>
                {v.windowText}
              </span>
            </div>
            <h1
              style={{
                margin: "10px 0 4px",
                fontSize: "26px",
                letterSpacing: "-0.8px",
              }}
            >
              {v.sessTitle}
            </h1>
            <div style={{ color: "#aebfda", fontSize: "14px" }}>
              {v.sessWhen}
            </div>
            {v.sessions.length > 1 && (
              <select
                aria-label="Session to mark"
                value={v.sessionId}
                onChange={v.onSession}
                style={{
                  marginTop: "10px",
                  padding: "8px 10px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  color: "#f1f6ff",
                  fontFamily: "inherit",
                  fontSize: "13px",
                }}
              >
                {v.sessions.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div style={{ display: "flex", gap: "26px" }}>
            <div>
              <div
                style={{
                  fontSize: "38px",
                  fontWeight: "bold",
                  letterSpacing: "-1.5px",
                  lineHeight: "1",
                }}
              >
                {v.presentCount}
              </div>
              <div
                style={{ marginTop: "6px", color: "#8a99b3", fontSize: "12px" }}
              >
                PRESENT
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "38px",
                  fontWeight: "bold",
                  letterSpacing: "-1.5px",
                  lineHeight: "1",
                }}
              >
                {v.excusedCount}
              </div>
              <div
                style={{ marginTop: "6px", color: "#8a99b3", fontSize: "12px" }}
              >
                EXCUSED
              </div>
            </div>
          </div>
        </section>
        <section
          style={{
            padding: "24px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <label
            htmlFor="q"
            style={{
              display: "block",
              marginBottom: "10px",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Find a member by name
          </label>
          <input
            className="field"
            id="q"
            type="text"
            autoComplete="off"
            placeholder="Start typing a name, for example Mwila"
            value={v.query}
            onChange={v.onQuery}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "16px 18px",
              height: "56px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              color: "#f1f6ff",
              fontFamily: "inherit",
              fontSize: "17px",
            }}
          />
          <div style={{ marginTop: "8px", color: "#8a99b3", fontSize: "13px" }}>
            The student number is shown on every result, so members with the
            same name are easy to tell apart.
          </div>
          {v.errorText && (
            <div
              role="alert"
              style={{
                margin: "0 0 12px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(255,107,107,0.1)",
                border: "1px solid rgba(255,107,107,0.4)",
                color: "#ffb3b3",
                fontSize: "14px",
              }}
            >
              {v.errorText}
            </div>
          )}
          {v.showPrompt && (
            <>
              <div
                style={{
                  marginTop: "22px",
                  padding: "26px",
                  textAlign: "center",
                  borderRadius: "12px",
                  border: "1px dashed rgba(255,255,255,0.15)",
                  color: "#8a99b3",
                  fontSize: "14px",
                }}
              >
                Type at least 2 letters to search the member list.
              </div>
            </>
          )}
          {v.showNone && (
            <>
              <div
                style={{
                  marginTop: "22px",
                  padding: "26px",
                  textAlign: "center",
                  borderRadius: "12px",
                  border: "1px dashed rgba(255,255,255,0.15)",
                  color: "#ffd98a",
                  fontSize: "14px",
                }}
              >
                No Active member matches that name. Check the spelling, or ask
                the member to confirm their account is approved.
              </div>
            </>
          )}
          <div
            style={{
              marginTop: "18px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {v.results.map((m, $i) => (
              <React.Fragment key={$i}>
                <div
                  className="row"
                  style={{
                    padding: "16px 12px",
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "14px",
                    }}
                  >
                    <div style={{ minWidth: "0" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontSize: "17px", fontWeight: "bold" }}>
                          {m.name}
                        </span>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "20px",
                            background: m.chipBg,
                            border: `1px solid ${m.chipBorder}`,
                            color: m.chipColor,
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          {m.statusLabel}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: "5px",
                          color: "#aebfda",
                          fontSize: "13px",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {"Student no. "}
                        {m.no}
                        {" · "}
                        {m.prog}
                        {" · Year "}
                        {m.year}
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      {m.canMark && (
                        <>
                          <button
                            className="btn-mark"
                            type="button"
                            onClick={m.mark}
                            style={{
                              height: "44px",
                              padding: "0 20px",
                              border: "none",
                              borderRadius: "8px",
                              background: "#0066ff",
                              color: "#ffffff",
                              fontFamily: "inherit",
                              fontSize: "14px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            Mark present
                          </button>
                        </>
                      )}
                      {m.canExcuse && (
                        <>
                          <button
                            className="btn-warn"
                            type="button"
                            onClick={m.startExcuse}
                            style={{
                              height: "44px",
                              padding: "0 18px",
                              borderRadius: "8px",
                              background: "rgba(255,176,32,0.1)",
                              border: "1px solid rgba(255,176,32,0.45)",
                              color: "#ffd98a",
                              fontFamily: "inherit",
                              fontSize: "14px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            Excuse
                          </button>
                        </>
                      )}
                      {m.canUnmark && (
                        <>
                          <button
                            className="btn-danger"
                            type="button"
                            onClick={m.startUnmark}
                            style={{
                              height: "44px",
                              padding: "0 18px",
                              borderRadius: "8px",
                              background: "rgba(255,107,107,0.1)",
                              border: "1px solid rgba(255,107,107,0.4)",
                              color: "#ffb3b3",
                              fontFamily: "inherit",
                              fontSize: "14px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            Unmark
                          </button>
                        </>
                      )}
                      {m.canRemoveExcuse && (
                        <>
                          <button
                            className="btn-ghost"
                            type="button"
                            onClick={m.startRemoveExcuse}
                            style={{
                              height: "44px",
                              padding: "0 18px",
                              border: "1px solid #333333",
                              borderRadius: "8px",
                              background: "transparent",
                              color: "#ffffff",
                              fontFamily: "inherit",
                              fontSize: "14px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            Remove excuse
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {m.panelOpen && (
                    <>
                      <div
                        style={{
                          marginTop: "14px",
                          padding: "16px",
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.12)",
                        }}
                      >
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                          }}
                        >
                          {m.panelTitle}
                        </label>
                        <input
                          className="field"
                          type="text"
                          placeholder="Reason (required)"
                          value={m.reason}
                          onChange={m.onReason}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "12px 14px",
                            height: "46px",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: "9px",
                            color: "#f1f6ff",
                            fontFamily: "inherit",
                            fontSize: "15px",
                          }}
                        />
                        <div
                          style={{
                            marginTop: "10px",
                            color: "#8a99b3",
                            fontSize: "12px",
                            lineHeight: "1.5",
                          }}
                        >
                          {m.panelNote}
                        </div>
                        <div
                          style={{
                            marginTop: "12px",
                            display: "flex",
                            gap: "10px",
                          }}
                        >
                          <button
                            className="btn-primary"
                            type="button"
                            disabled={m.confirmDisabled}
                            onClick={m.confirm}
                            style={{
                              height: "42px",
                              padding: "0 20px",
                              border: "none",
                              borderRadius: "8px",
                              background: "#0066ff",
                              color: "#ffffff",
                              fontFamily: "inherit",
                              fontSize: "14px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn-ghost"
                            type="button"
                            onClick={m.cancel}
                            style={{
                              height: "42px",
                              padding: "0 18px",
                              border: "1px solid #333333",
                              borderRadius: "8px",
                              background: "transparent",
                              color: "#ffffff",
                              fontFamily: "inherit",
                              fontSize: "14px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>
      </div>
      <aside
        style={{
          flex: "1 1 300px",
          minWidth: "0",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <section
          style={{
            padding: "22px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2 style={{ margin: "0 0 4px", fontSize: "17px" }}>
            Your actions this session
          </h2>
          <p style={{ margin: "0 0 14px", color: "#8a99b3", fontSize: "13px" }}>
            Every action is saved with your name and the time.
          </p>
          {v.noActions && (
            <>
              <div
                style={{
                  padding: "18px 0",
                  color: "#75859e",
                  fontSize: "13px",
                }}
              >
                Nothing yet. Mark a member to see it here.
              </div>
            </>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {v.actions.map((a, $i) => (
              <React.Fragment key={$i}>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "10px 0",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span
                    style={{
                      marginTop: "6px",
                      flexShrink: "0",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: a.dot,
                    }}
                  ></span>
                  <div
                    style={{
                      flexGrow: "1",
                      minWidth: "0",
                      fontSize: "13px",
                      lineHeight: "1.45",
                    }}
                  >
                    {a.text}
                    <div
                      style={{
                        marginTop: "2px",
                        color: "#8a99b3",
                        fontSize: "12px",
                      }}
                    >
                      {a.reason}
                    </div>
                  </div>
                  <span
                    style={{
                      flexShrink: "0",
                      color: "#75859e",
                      fontSize: "12px",
                    }}
                  >
                    {a.time}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>
        <section
          style={{
            padding: "20px 22px",
            borderRadius: "18px",
            background: "rgba(84,173,255,0.06)",
            border: "1px solid rgba(84,173,255,0.25)",
            color: "#bcd6ff",
            fontSize: "13px",
            lineHeight: "1.65",
          }}
        >
          <strong style={{ color: "#e8f0ff", fontSize: "14px" }}>
            What a Registrar can do
          </strong>
          <br />
          {
            " Mark, unmark and excuse members while the window is open. Excusing works at any time. You cannot see analytics, exports, accounts or the audit log. If the window has closed, only an Administrator can reopen it. "
          }
        </section>
      </aside>
    </main>
  </div>
);

class Screen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: this.props.real ? "" : "mw",
      panel: null,
      reason: "",
      actions: [],
      members: [
        {
          id: 1,
          name: "Mwila Banda",
          no: "20481133",
          prog: "Computer Engineering",
          year: "2,1",
          status: "none",
        },
        {
          id: 2,
          name: "Mwila Chisenga",
          no: "22340915",
          prog: "Information Technology",
          year: "1,2",
          status: "present",
        },
        {
          id: 3,
          name: "Mwansa Phiri",
          no: "21773208",
          prog: "Software Engineering",
          year: "3,1",
          status: "none",
        },
        {
          id: 4,
          name: "Chanda Phiri",
          no: "21307752",
          prog: "Information Technology",
          year: "3,2",
          status: "excused",
        },
        {
          id: 5,
          name: "Natasha Mulenga",
          no: "22156490",
          prog: "Software Engineering",
          year: "1,2",
          status: "none",
        },
        {
          id: 6,
          name: "Joseph Zulu",
          no: "20983317",
          prog: "Cyber Security",
          year: "4,1",
          status: "none",
        },
      ],
    };
  }
  now() {
    return new Date().toTimeString().slice(0, 5);
  }
  async commitReal(m, text, reason, dot) {
    const r = this.props.real;
    const call = /^Unmarked|^Removed excuse/.test(text)
      ? () => r.unmark(m.id, reason.replace(/^Reason: /, ""))
      : /^Excused/.test(text)
        ? () => r.excuse(m.id, reason.replace(/^Reason: /, ""))
        : () => r.mark(m.id);
    const err = await call();
    if (err) {
      this.setState({ errorText: err, panel: null, reason: "" });
      return;
    }
    const actions = [{ text, reason, time: this.now(), dot }]
      .concat(this.state.actions)
      .slice(0, 8);
    this.setState({ actions, panel: null, reason: "", errorText: "" });
  }
  commit(m, status, text, reason, dot) {
    if (this.props.real) return this.commitReal(m, text, reason, dot);
    const members = this.state.members.map((x) =>
      x.id === m.id ? Object.assign({}, x, { status: status }) : x,
    );
    const actions = [{ text: text, reason: reason, time: this.now(), dot: dot }]
      .concat(this.state.actions)
      .slice(0, 8);
    this.setState({
      members: members,
      actions: actions,
      panel: null,
      reason: "",
    });
  }
  renderVals() {
    const s = this.state;
    const q = s.query.trim().toLowerCase();
    const chips = {
      none: [
        "Not marked",
        "rgba(255,255,255,0.06)",
        "rgba(255,255,255,0.18)",
        "#aebfda",
      ],
      present: [
        "Present",
        "rgba(61,220,151,0.12)",
        "rgba(61,220,151,0.45)",
        "#9df0c8",
      ],
      excused: [
        "Excused",
        "rgba(84,173,255,0.12)",
        "rgba(84,173,255,0.45)",
        "#bcd6ff",
      ],
    };
    const real = this.props.real;
    const pool = real
      ? real.results.map((x) => ({
          id: x.id,
          name: x.name,
          no: x.student_number,
          prog: x.program || "—",
          year: (x.year_of_study || "—") + "," + (x.semester_of_study || "—"),
          status: x.status,
        }))
      : s.members;
    const matches =
      q.length >= 2
        ? real
          ? pool
          : pool.filter((m) => m.name.toLowerCase().indexOf(q) > -1)
        : [];
    const results = matches.slice(0, 6).map((m) => {
      const c = chips[m.status];
      const open = s.panel && s.panel.id === m.id;
      const kind = open ? s.panel.kind : "";
      const titles = {
        unmark: "Why are you unmarking " + m.name + "?",
        excuse: "Why is " + m.name + " excused?",
        unexcuse: "Why are you removing the excuse?",
      };
      const notes = {
        unmark:
          "The record is voided, not deleted. It stops counting and stays in the audit log. You can mark them present again.",
        excuse:
          "An excused absence does not count against the member and is not shown to them. Only Registrars and Administrators can apply it.",
        unexcuse: "The session goes back to counting normally for this member.",
      };
      const rs = s.reason.trim();
      return {
        name: m.name,
        no: m.no,
        prog: m.prog,
        year: m.year,
        statusLabel: c[0],
        chipBg: c[1],
        chipBorder: c[2],
        chipColor: c[3],
        canMark: m.status === "none" && !open,
        canExcuse: m.status === "none" && !open,
        canUnmark: m.status === "present" && !open,
        canRemoveExcuse: m.status === "excused" && !open,
        panelOpen: !!open,
        panelTitle: titles[kind] || "",
        panelNote: notes[kind] || "",
        reason: open ? s.reason : "",
        confirmDisabled: rs.length < 3,
        onReason: (e) => this.setState({ reason: e.target.value }),
        mark: () =>
          this.commit(
            m,
            "present",
            "Marked " + m.name + " present",
            "Manual mark",
            "#3ddc97",
          ),
        startUnmark: () =>
          this.setState({ panel: { id: m.id, kind: "unmark" }, reason: "" }),
        startExcuse: () =>
          this.setState({ panel: { id: m.id, kind: "excuse" }, reason: "" }),
        startRemoveExcuse: () =>
          this.setState({ panel: { id: m.id, kind: "unexcuse" }, reason: "" }),
        cancel: () => this.setState({ panel: null, reason: "" }),
        confirm: () => {
          const r = this.state.reason.trim();
          if (r.length < 3) return;
          if (kind === "unmark")
            this.commit(
              m,
              "none",
              "Unmarked " + m.name,
              "Reason: " + r,
              "#ff6b6b",
            );
          else if (kind === "excuse")
            this.commit(
              m,
              "excused",
              "Excused " + m.name,
              "Reason: " + r,
              "#54adff",
            );
          else
            this.commit(
              m,
              "none",
              "Removed excuse for " + m.name,
              "Reason: " + r,
              "#ffb020",
            );
        },
      };
    });
    const present = real
      ? real.live.present
      : s.members.filter((m) => m.status === "present").length + 85;
    const excused = real
      ? real.live.excused
      : s.members.filter((m) => m.status === "excused").length + 2;
    return {
      userName: real ? real.userName : "Sample Registrar",
      windowText: real
        ? real.session.status === "Open"
          ? "Window open"
          : "Window closed"
        : "Window open",
      sessTitle: real ? real.session.title : "Weekly Chapter Meeting",
      sessWhen: real ? real.when : "Today · 16:00 to 17:30 · Main Hall",
      sessions: real ? real.sessions : [],
      sessionId: real ? real.session.id : "",
      onSession: (e) => real.onSession(e.target.value),
      errorText: s.errorText || "",
      goScan: (e) => {
        e.preventDefault();
        if (this.props.onNavigate) this.props.onNavigate("/scan");
      },
      query: s.query,
      onQuery: (e) => {
        this.setState({
          query: e.target.value,
          panel: null,
          reason: "",
          errorText: "",
        });
        if (real) real.onSearch(e.target.value);
      },
      results: results,
      showPrompt: q.length < 2,
      showNone: q.length >= 2 && matches.length === 0,
      presentCount: present,
      excusedCount: excused,
      actions: s.actions,
      noActions: s.actions.length === 0,
    };
  }

  ask = (cfg) => this.setState({ confirm: cfg });

  render() {
    const v = this.renderVals();
    const unsaved = !!(this.state.panel && this.state.reason.trim().length > 0);
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
