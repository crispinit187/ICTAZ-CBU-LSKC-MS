import React from "react";
import { actionText, ago } from "../lib/api.js";
import ConfirmDialog, { UnsavedGuard } from "../components/ConfirmDialog.jsx";
import {
  AccountMenu,
  AdminSidebar,
  isBuilt,
} from "../components/admin/AdminShell.jsx";

const renderScreen = (v, props) => (
  <div
    className="scr-admin"
    style={{
      minHeight: "1100px",
      display: "flex",
      flexWrap: "wrap",
      background: "#050505",
      color: "#ffffff",
      fontFamily: "Arial, Helvetica, sans-serif",
    }}
  >
    <AdminSidebar active="dashboard" pending={v.sidebarPending} accountTop />
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
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div>
          <h1 style={{ margin: "0", fontSize: "30px", letterSpacing: "-1px" }}>
            Dashboard
          </h1>
          <p style={{ margin: "6px 0 0", color: "#aebfda", fontSize: "14px" }}>
            {v.subtitle}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "20px",
              background: "rgba(61,220,151,0.1)",
              border: "1px solid rgba(61,220,151,0.35)",
              color: "#9df0c8",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            <span
              className="live-dot"
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#3ddc97",
              }}
            ></span>
            Live
          </span>
          <label
            htmlFor="sem"
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              overflow: "hidden",
              clip: "rect(0 0 0 0)",
            }}
          >
            Semester
          </label>
          <select
            id="sem"
            style={{
              padding: "11px 14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "9px",
              color: "#f1f6ff",
              fontFamily: "inherit",
              fontSize: "14px",
            }}
          >
            {v.semesters.map((o) => (
              <option key={o.id}>{o.name}</option>
            ))}
          </select>
          {v.showSessions && (
            <button
              className="btn-primary"
              type="button"
              onClick={() => v.go("/admin/sessions")}
              style={{
                padding: "12px 20px",
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
              Create session
            </button>
          )}
          <AccountMenu className="adm-acct-desk" />
        </div>
      </header>
      {v.toast && (
        <>
          <div
            role="status"
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(61,220,151,0.1)",
              border: "1px solid rgba(61,220,151,0.4)",
              color: "#9df0c8",
              fontSize: "14px",
            }}
          >
            {v.toast}
          </div>
        </>
      )}
      <section
        className="adm-tiles"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "16px",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              color: "#54adff",
              fontSize: "11px",
              fontWeight: "bold",
              letterSpacing: "1.5px",
            }}
          >
            ACTIVE MEMBERS
          </div>
          <div
            style={{
              marginTop: "12px",
              fontSize: "38px",
              fontWeight: "bold",
              letterSpacing: "-1.5px",
            }}
          >
            {v.activeMembers}
          </div>
          <div style={{ marginTop: "6px", color: "#8a99b3", fontSize: "13px" }}>
            {v.joinedText}
          </div>
        </div>
        <div
          style={{
            padding: "20px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              color: "#54adff",
              fontSize: "11px",
              fontWeight: "bold",
              letterSpacing: "1.5px",
            }}
          >
            PENDING APPROVALS
          </div>
          <div
            style={{
              marginTop: "12px",
              fontSize: "38px",
              fontWeight: "bold",
              letterSpacing: "-1.5px",
            }}
          >
            {v.pendingCount}
          </div>
          <div style={{ marginTop: "6px", color: "#8a99b3", fontSize: "13px" }}>
            Waiting for an Administrator
          </div>
        </div>
        <div
          style={{
            padding: "20px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              color: "#54adff",
              fontSize: "11px",
              fontWeight: "bold",
              letterSpacing: "1.5px",
            }}
          >
            SESSIONS THIS SEMESTER
          </div>
          <div
            style={{
              marginTop: "12px",
              fontSize: "38px",
              fontWeight: "bold",
              letterSpacing: "-1.5px",
            }}
          >
            {v.sessionsCount}
          </div>
          <div style={{ marginTop: "6px", color: "#8a99b3", fontSize: "13px" }}>
            {v.sessionsText}
          </div>
        </div>
        <div
          style={{
            padding: "20px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              color: "#54adff",
              fontSize: "11px",
              fontWeight: "bold",
              letterSpacing: "1.5px",
            }}
          >
            AVERAGE ATTENDANCE
          </div>
          <div
            style={{
              marginTop: "12px",
              fontSize: "38px",
              fontWeight: "bold",
              letterSpacing: "-1.5px",
            }}
          >
            {v.avgText}
          </div>
          <div style={{ marginTop: "6px", color: "#8a99b3", fontSize: "13px" }}>
            Excused absences not counted
          </div>
        </div>
      </section>
      <section style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        <div
          style={{
            flex: "2 1 520px",
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
            <h2 style={{ margin: "0", fontSize: "18px" }}>
              Attendance rate by session
            </h2>
            <span style={{ color: "#8a99b3", fontSize: "12px" }}>
              Attended ÷ (eligible − excused)
            </span>
          </div>
          <div style={{ marginTop: "22px", display: "flex", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "220px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "flex-end",
                color: "#8a99b3",
                fontSize: "11px",
                lineHeight: "1",
              }}
            >
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            <div style={{ flex: "1 1 0", minWidth: "0" }}>
              <div style={{ position: "relative", height: "220px" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "0",
                    right: "0",
                    top: "0",
                    bottom: "0",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      height: "1px",
                      background: "rgba(255,255,255,0.08)",
                    }}
                  ></div>
                  <div
                    style={{
                      height: "1px",
                      background: "rgba(255,255,255,0.08)",
                    }}
                  ></div>
                  <div
                    style={{
                      height: "1px",
                      background: "rgba(255,255,255,0.08)",
                    }}
                  ></div>
                  <div
                    style={{
                      height: "1px",
                      background: "rgba(255,255,255,0.08)",
                    }}
                  ></div>
                  <div
                    style={{
                      height: "1px",
                      background: "rgba(255,255,255,0.2)",
                    }}
                  ></div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: "0",
                    right: "0",
                    top: "0",
                    bottom: "0",
                    display: "flex",
                    alignItems: "stretch",
                    gap: "10px",
                    padding: "0 6px",
                  }}
                >
                  {v.bars.map((b, $i) => (
                    <React.Fragment key={$i}>
                      <div
                        style={{
                          flex: "1 1 0",
                          minWidth: "0",
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-end",
                        }}
                        onMouseEnter={b.enter}
                        onMouseLeave={b.leave}
                      >
                        {b.hover && (
                          <>
                            <div
                              style={{
                                position: "absolute",
                                left: "50%",
                                bottom: `${b.tipBottom}px`,
                                transform: "translateX(-50%)",
                                zIndex: "5",
                                padding: "9px 12px",
                                whiteSpace: "nowrap",
                                borderRadius: "9px",
                                background: "#10213d",
                                border: "1px solid rgba(84,173,255,0.45)",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                                fontSize: "12px",
                                lineHeight: "1.5",
                                color: "#f1f6ff",
                              }}
                            >
                              <strong style={{ fontSize: "13px" }}>
                                {b.title}
                              </strong>
                              <br />
                              <span style={{ color: "#aebfda" }}>{b.date}</span>
                              <br />
                              {b.present}
                              {" present · "}
                              {b.rate}%
                            </div>
                          </>
                        )}
                        <div
                          style={{
                            height: `${b.h}px`,
                            background: b.bg,
                            borderRadius: "4px 4px 0 0",
                          }}
                        ></div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div
                style={{ display: "flex", gap: "10px", padding: "8px 6px 0" }}
              >
                {v.bars.map((b, $i) => (
                  <React.Fragment key={$i}>
                    <div
                      style={{
                        flex: "1 1 0",
                        minWidth: "0",
                        textAlign: "center",
                        color: "#8a99b3",
                        fontSize: "11px",
                      }}
                    >
                      {b.n}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            flex: "1 1 300px",
            minWidth: "0",
            boxSizing: "border-box",
            padding: "24px",
            borderRadius: "18px",
            background:
              "linear-gradient(160deg, rgba(0,102,255,0.16), rgba(255,255,255,0.025) 60%)",
            border: "1px solid rgba(84,173,255,0.35)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "#54adff",
                fontSize: "11px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
              }}
            >
              OPEN SESSION
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "4px 10px",
                borderRadius: "20px",
                background: v.badgeBg,
                border: `1px solid ${v.badgeLine}`,
                color: v.badgeColor,
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              <span
                className={v.windowClosed ? "" : "live-dot"}
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: v.badgeColor,
                }}
              ></span>
              {v.windowClosed ? "Closed" : "Open"}
            </span>
          </div>
          <h2
            style={{
              margin: "14px 0 4px",
              fontSize: "22px",
              letterSpacing: "-0.5px",
            }}
          >
            {v.openTitle}
          </h2>
          <div
            style={{ color: "#aebfda", fontSize: "13px", lineHeight: "1.6" }}
          >
            {v.openWhen}
            <br />
            {v.openFac}
          </div>
          <div
            style={{
              margin: "22px 0 6px",
              display: "flex",
              alignItems: "baseline",
              gap: "10px",
            }}
          >
            <span
              style={{
                fontSize: "54px",
                fontWeight: "bold",
                letterSpacing: "-2px",
                lineHeight: "1",
              }}
            >
              {v.livePresent}
            </span>
            <span style={{ color: "#aebfda", fontSize: "14px" }}>
              present now
            </span>
          </div>
          <div
            style={{
              height: "8px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${v.liveWidth}%`,
                background: "#54adff",
                borderRadius: "4px",
              }}
            ></div>
          </div>
          <div style={{ marginTop: "8px", color: "#8a99b3", fontSize: "12px" }}>
            {v.livePct}% of {v.activeMembers} active members · updating live
          </div>
          <div style={{ flexGrow: "1", minHeight: "20px" }}></div>
          {v.showOpenButtons && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                className="btn-primary"
                type="button"
                onClick={() => v.go(v.displayPath)}
                style={{
                  flex: "1 1 140px",
                  padding: "12px 16px",
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
                Open QR display
              </button>
              <button
                className="btn-ghost"
                onClick={v.closeWindow}
                disabled={v.windowClosed}
                type="button"
                style={{
                  flex: "1 1 120px",
                  padding: "12px 16px",
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
                {v.closeLabel}
              </button>
            </div>
          )}
        </div>
      </section>
      <section style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        <div
          style={{
            flex: "2 1 520px",
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
            <h2 style={{ margin: "0", fontSize: "18px" }}>
              Registrations waiting for approval
            </h2>
            <a
              href="#approvals"
              onClick={(e) => {
                e.preventDefault();
                v.go("/admin/approvals");
              }}
              style={{ fontSize: "13px", fontWeight: "600" }}
            >
              {"View all "}
              {v.pendingCount}
            </a>
          </div>
          <p
            style={{ margin: "6px 0 14px", color: "#8a99b3", fontSize: "13px" }}
          >
            Confirm the person is a genuine member before approving. A decline
            needs a reason.
          </p>
          <div
            className="q-head"
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1.3fr) auto",
              gap: "12px",
              padding: "0 4px 10px",
              color: "#75859e",
              fontSize: "11px",
              fontWeight: "bold",
              letterSpacing: "1.2px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span>NAME</span>
            <span>STUDENT NO.</span>
            <span>PROGRAM · YEAR</span>
            <span style={{ width: "170px" }}>ACTION</span>
          </div>
          {v.queue.map((r, $i) => (
            <React.Fragment key={$i}>
              <div
                className="q-row"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1.3fr) auto",
                  gap: "12px",
                  alignItems: "center",
                  padding: "12px 4px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  fontSize: "14px",
                }}
              >
                <div style={{ minWidth: "0" }}>
                  <div style={{ fontWeight: "bold" }}>{r.name}</div>
                  <div
                    style={{
                      marginTop: "2px",
                      color: "#8a99b3",
                      fontSize: "12px",
                    }}
                  >
                    {r.email}
                    {r.email && r.method ? " · " : ""}
                    {r.method}
                  </div>
                </div>
                <span
                  style={{
                    color: "#dce8f8",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {r.no}
                </span>
                <span style={{ color: "#dce8f8" }}>
                  {r.prog}
                  {" · "}
                  {r.year}
                </span>
                {v.canApprove ? (
                  <div
                    className="q-actions"
                    style={{ display: "flex", gap: "8px", width: "170px" }}
                  >
                    <button
                      className="btn-approve"
                      type="button"
                      onClick={r.approve}
                      style={{
                        flex: "1",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        background: "rgba(61,220,151,0.12)",
                        border: "1px solid rgba(61,220,151,0.45)",
                        color: "#9df0c8",
                        fontFamily: "inherit",
                        fontSize: "13px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-decline"
                      type="button"
                      onClick={r.decline}
                      style={{
                        flex: "1",
                        padding: "9px 12px",
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
                      Decline
                    </button>
                  </div>
                ) : (
                  <span
                    style={{
                      color: "#8a99b3",
                      fontSize: "12px",
                      width: "170px",
                    }}
                  >
                    Read only
                  </span>
                )}
              </div>
            </React.Fragment>
          ))}
          {v.queueEmpty && (
            <>
              <div
                style={{
                  padding: "28px 0 10px",
                  textAlign: "center",
                  color: "#8a99b3",
                  fontSize: "14px",
                }}
              >
                {v.queueEmptyText}
              </div>
            </>
          )}
        </div>
        <div
          style={{
            flex: "1 1 300px",
            minWidth: "0",
            boxSizing: "border-box",
            padding: "24px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2 style={{ margin: "0", fontSize: "18px" }}>Consistency bands</h2>
          <p
            style={{ margin: "6px 0 18px", color: "#8a99b3", fontSize: "13px" }}
          >
            Members by semester attendance rate. Visible to staff only.
          </p>
          {v.bands.high + v.bands.good + v.bands.fair + v.bands.low === 0 && (
            <p
              style={{
                margin: "-8px 0 14px",
                color: "#ffd98a",
                fontSize: "13px",
              }}
            >
              No sessions have been held this semester yet, so there is nothing
              to show.
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: "2px",
              height: "14px",
              borderRadius: "7px",
              overflow: "hidden",
            }}
          >
            <div
              style={{ flex: `${v.bands.high} 1 0`, background: "#3ddc97" }}
            ></div>
            <div
              style={{ flex: `${v.bands.good} 1 0`, background: "#54adff" }}
            ></div>
            <div
              style={{ flex: `${v.bands.fair} 1 0`, background: "#ffb020" }}
            ></div>
            <div
              style={{ flex: `${v.bands.low} 1 0`, background: "#ff6b6b" }}
            ></div>
          </div>
          <div
            style={{
              marginTop: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              fontSize: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "3px",
                    background: "#3ddc97",
                  }}
                ></span>
                80% and above
              </span>
              <strong>{v.bands.high}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "3px",
                    background: "#54adff",
                  }}
                ></span>
                60% to 79%
              </span>
              <strong>{v.bands.good}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "3px",
                    background: "#ffb020",
                  }}
                ></span>
                40% to 59%
              </span>
              <strong>{v.bands.fair}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "3px",
                    background: "#ff6b6b",
                  }}
                ></span>
                Below 40%
              </span>
              <strong>{v.bands.low}</strong>
            </div>
          </div>
          <p
            style={{
              margin: "18px 0 0",
              paddingTop: "14px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              color: "#8a99b3",
              fontSize: "12px",
              lineHeight: "1.6",
            }}
          >
            Excused sessions and sessions held while a member was not Active are
            left out of each rate.
          </p>
        </div>
      </section>
      <section style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        <div
          style={{
            flex: "1 1 420px",
            minWidth: "0",
            boxSizing: "border-box",
            padding: "24px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>
            Attendance by program
          </h2>
          <p style={{ margin: "0 0 18px", color: "#8a99b3", fontSize: "13px" }}>
            Average rate this semester, using each member's program at the time.
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {v.programs.map((g, $i) => (
              <React.Fragment key={$i}>
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                      fontSize: "13px",
                    }}
                  >
                    <span>{g.name}</span>
                    <strong>{g.rate}%</strong>
                  </div>
                  <div
                    style={{
                      height: "10px",
                      borderRadius: "5px",
                      background: "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${g.rate}%`,
                        background: "#0066ff",
                        borderRadius: "5px",
                      }}
                    ></div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
          {v.reviewCount > 0 && (
            <div
              style={{
                marginTop: "18px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(255,176,32,0.08)",
                border: "1px solid rgba(255,176,32,0.35)",
                color: "#ffd98a",
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              {v.reviewCount +
                (v.reviewCount === 1
                  ? " new program spelling needs"
                  : " new program spellings need") +
                " review before they join a group. "}
              {isBuilt("programs") && (
                <a
                  href="#programs"
                  onClick={(e) => {
                    e.preventDefault();
                    v.go("/admin/programs");
                  }}
                  style={{ fontWeight: "bold" }}
                >
                  Review
                </a>
              )}
            </div>
          )}
        </div>
        <div
          style={{
            flex: "1 1 360px",
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
            }}
          >
            <h2 style={{ margin: "0", fontSize: "18px" }}>Recent activity</h2>
            {isBuilt("audit") && v.canAudit && (
              <a
                href="#audit"
                onClick={(e) => {
                  e.preventDefault();
                  v.go("/admin/audit");
                }}
                style={{ fontSize: "13px", fontWeight: "600" }}
              >
                Open audit log
              </a>
            )}
          </div>
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {v.activity.map((a, $i) => (
              <React.Fragment key={$i}>
                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    padding: "11px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span
                    style={{
                      marginTop: "6px",
                      flexShrink: "0",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#54adff",
                    }}
                  ></span>
                  <div style={{ flexGrow: "1", minWidth: "0" }}>
                    <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
                      {a.text}
                    </div>
                    <div
                      style={{
                        marginTop: "3px",
                        color: "#8a99b3",
                        fontSize: "12px",
                      }}
                    >
                      {a.who}
                    </div>
                  </div>
                  <span
                    style={{
                      flexShrink: "0",
                      color: "#75859e",
                      fontSize: "12px",
                    }}
                  >
                    {a.when}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
      {v.showExport && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            className="btn-ghost"
            type="button"
            style={{
              padding: "12px 20px",
              border: "1px solid #333333",
              borderRadius: "8px",
              background: "transparent",
              color: "#ffffff",
              fontFamily: "inherit",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={() => v.exportGo && v.go("/admin/reports")}
          >
            {v.exportGo ? "Reports and exports" : "Export attendance (CSV)"}
          </button>
          {!v.exportGo && (
            <button
              className="btn-ghost"
              type="button"
              style={{
                padding: "12px 20px",
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
              Export report (Excel)
            </button>
          )}
        </div>
      )}
    </main>
  </div>
);

class Screen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: -1,
      present: 87,
      toast: "",
      queue: [
        {
          id: 1,
          name: "Mwila Banda",
          no: "20481133",
          email: "mwila.b@gmail.com",
          method: "Google",
          prog: "Computer Engineering",
          year: "2,1",
        },
        {
          id: 2,
          name: "Chanda Phiri",
          no: "21307752",
          email: "chanda.p@gmail.com",
          method: "Password",
          prog: "Information Technology",
          year: "3,2",
        },
        {
          id: 3,
          name: "Natasha Mulenga",
          no: "22156490",
          email: "natasha.m@gmail.com",
          method: "Google",
          prog: "Software Engineering",
          year: "1,2",
        },
        {
          id: 4,
          name: "Joseph Zulu",
          no: "20983317",
          email: "joseph.z@gmail.com",
          method: "Password",
          prog: "Cyber Security",
          year: "4,1",
        },
        {
          id: 5,
          name: "Tendai Mwansa",
          no: "23014468",
          email: "tendai.m@gmail.com",
          method: "Password",
          prog: "Data Science",
          year: "1,1",
        },
      ],
    };
    this.timer = null;
  }
  componentDidMount() {
    this.timer = setInterval(() => {
      if (this.state.present < 140 && !this.state.windowClosed)
        this.setState({ present: this.state.present + 1 });
    }, 2200);
  }
  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }
  /* Whether the signed-in person holds a permission. The sample dashboard allows everything. */
  can(code) {
    const real = this.props.real;
    return !real || !real.can || real.can(code);
  }
  act(r, approved, reason) {
    const real = this.props.real;
    if (real) {
      const call = approved
        ? real.onApprove(r.id)
        : real.onDecline(r.id, reason);
      call.then((err) =>
        this.setState({
          toast: err
            ? err
            : approved
              ? "Approved " +
                r.name +
                ". They have been emailed and can sign in now."
              : "Declined " + r.name + ". The decision is in the audit log.",
        }),
      );
      return;
    }
    const q = this.state.queue.filter((x) => x.id !== r.id);
    this.setState({
      queue: q,
      toast: approved
        ? "Approved " + r.name + ". They have been emailed and can sign in now."
        : "Declined " +
          r.name +
          ". The reason has been emailed to them and the decision is in the audit log.",
    });
  }
  realVals() {
    const s = this.state;
    const real = this.props.real;
    const d = real.data || {};
    const open = d.open || null;
    const bars = (d.bars || []).map((b, i) => ({
      n: String(i + 1),
      title: b.title,
      date: b.date_label,
      rate: Number(b.rate),
      present: Number(b.present),
      h: Math.round(Number(b.rate) * 2.2),
      tipBottom: Math.round(Number(b.rate) * 2.2) + 8,
      bg: s.hover === i ? "#54adff" : "#0066ff",
      hover: s.hover === i,
      enter: () => this.setState({ hover: i }),
      leave: () => this.setState({ hover: -1 }),
    }));
    const queue = (real.pending || []).slice(0, 5).map((r) => ({
      id: r.id,
      name: r.name,
      no: r.student_number,
      email: r.email,
      method: !r.method ? "" : r.method === "google" ? "Google" : "Password",
      prog: r.program || "—",
      year: (r.year_of_study || "—") + "," + (r.semester_of_study || "—"),
    }));
    const active = Number(d.active_members || 0);
    const present = open ? Number(open.present) : 0;
    const pct = active ? Math.round((present / active) * 1000) / 10 : 0;
    const when = open
      ? new Date(open.start_at).toLocaleString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }) + (open.venue ? " · " + open.venue : "")
      : "";
    const fm = open ? Number(open.facilitator_members) : 0;
    const fg = open ? Number(open.facilitator_guests) : 0;
    return {
      bars,
      queue,
      queueEmpty: queue.length === 0,
      queueEmptyText: "No registrations are waiting. Everyone is up to date.",
      pendingCount: Number(d.pending_count || 0),
      sidebarPending: Number(d.pending_count || 0),
      toast: s.toast,
      livePresent: present,
      livePct: pct,
      liveWidth: Math.min(100, pct),
      programs: d.programs || [],
      activity: (d.activity || []).map((a) => ({
        text: actionText(a.action),
        who: a.who,
        when: ago(a.at),
      })),
      subtitle: d.semester
        ? "Chapter overview for " + d.semester.name + "."
        : "Chapter overview. No current semester is set yet.",
      semesters:
        d.semesters && d.semesters.length
          ? d.semesters
          : [{ id: "-", name: "No semester set" }],
      activeMembers: active,
      joinedText: Number(d.joined_this_semester || 0) + " joined this semester",
      sessionsCount: Number(d.sessions_count || 0),
      sessionsText:
        Number(d.sessions_open || 0) +
        " open now, " +
        Number(d.sessions_scheduled || 0) +
        " scheduled",
      avgText: Number(d.average_rate || 0) + "%",
      openTitle: open ? open.title : "No session is open",
      openWhen: open ? when : "Open a session to start taking attendance.",
      openFac: open
        ? "Facilitators: " +
          fm +
          (fm === 1 ? " member, " : " members, ") +
          fg +
          (fg === 1 ? " guest" : " guests")
        : "",
      bands: d.bands || { high: 0, good: 0, fair: 0, low: 0 },
      reviewCount: this.can("program.manage")
        ? Number(d.review_programs || 0)
        : 0,
      showSessions: isBuilt("sessions") && this.can("session.create"),
      showOpenButtons:
        !!open && isBuilt("sessions") && this.can("session.create"),
      showExport: isBuilt("reports") && this.can("analytics.export"),
      canApprove: this.can("account.approve"),
      canAudit: this.can("audit.view"),
      exportGo: true,
      windowOpen: !!open,
      openId: open ? open.id : "",
      displayPath: open ? "/display?session=" + open.id : "/display",
    };
  }

  renderVals() {
    if (this.props.real) return this.realVals();
    const s = this.state;
    const data = [
      ["Orientation", "03 Feb", 69],
      ["Git workshop", "10 Feb", 74],
      ["Chapter meeting", "17 Feb", 71],
      ["Guest talk", "24 Feb", 82],
      ["Chapter meeting", "03 Mar", 66],
      ["Web basics", "10 Mar", 78],
      ["Chapter meeting", "17 Mar", 72],
      ["Career panel", "24 Mar", 86],
      ["Chapter meeting", "31 Mar", 70],
      ["Hack night", "07 Apr", 77],
    ];
    const bars = data.map((d, i) => ({
      n: String(i + 1),
      title: d[0],
      date: d[1],
      rate: d[2],
      present: Math.round(d[2] * 4.12),
      h: Math.round(d[2] * 2.2),
      tipBottom: Math.round(d[2] * 2.2) + 8,
      bg: s.hover === i ? "#54adff" : "#0066ff",
      hover: s.hover === i,
      enter: () => this.setState({ hover: i }),
      leave: () => this.setState({ hover: -1 }),
    }));
    const queue = s.queue.map((r) =>
      Object.assign({}, r, {
        approve: () => this.act(r, true),
        decline: () => this.act(r, false),
      }),
    );
    const pct = Math.round((s.present / 412) * 1000) / 10;
    return {
      bars: bars,
      queue: queue,
      queueEmpty: s.queue.length === 0,
      pendingCount: s.queue.length + 2,
      sidebarPending: s.queue.length + 2,
      queueEmptyText:
        "No registrations on this screen. Everyone is up to date.",
      subtitle:
        "Chapter overview for the current semester. Sample data for the design demo.",
      semesters: [
        { id: 1, name: "Semester 1, 2026/27" },
        { id: 2, name: "Semester 2, 2025/26" },
      ],
      activeMembers: 412,
      joinedText: "18 joined this semester",
      sessionsCount: 10,
      sessionsText: "1 open now, 1 scheduled",
      avgText: "74.6%",
      openTitle: "Weekly Chapter Meeting",
      openWhen: "Today · 16:00 to 17:30 · Main Hall",
      openFac: "Facilitators: 2 members, 1 guest",
      bands: { high: 188, good: 121, fair: 64, low: 39 },
      reviewCount: 3,
      showSessions: true,
      showOpenButtons: true,
      canApprove: true,
      canAudit: true,
      displayPath: "/display",
      showExport: true,
      toast: s.toast,
      livePresent: s.present,
      livePct: pct,
      liveWidth: Math.min(100, pct),
      programs: [
        { name: "Computer Engineering", rate: 79 },
        { name: "Information Technology", rate: 76 },
        { name: "Software Engineering", rate: 74 },
        { name: "Cyber Security", rate: 71 },
        { name: "Data Science", rate: 66 },
      ],
      activity: [
        {
          text: "Registrar marked 3 members present",
          who: "Registrar · Weekly Chapter Meeting",
          when: "2 min ago",
        },
        {
          text: "Excused 2 absences with a reason",
          who: "Registrar · Career panel",
          when: "18 min ago",
        },
        {
          text: "Approved a registration",
          who: "Administrator",
          when: "1 h ago",
        },
        {
          text: "Password reset issued for a member",
          who: "Administrator",
          when: "3 h ago",
        },
        {
          text: "Sign-in delay applied after repeated failures",
          who: "System · one student number",
          when: "5 h ago",
        },
        {
          text: "Session created: Hack night",
          who: "Administrator",
          when: "Yesterday",
        },
      ],
    };
  }

  ask = (cfg) => this.setState({ confirm: cfg });

  render() {
    const v = this.renderVals();
    v.go = (to) => this.props.onNavigate && this.props.onNavigate(to);
    const unsaved = false;
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
    v.windowClosed = this.props.real
      ? !v.windowOpen
      : !!this.state.windowClosed;
    v.closeLabel = v.windowClosed ? "Window closed" : "Close window";
    v.badgeBg = v.windowClosed
      ? "rgba(255,255,255,0.06)"
      : "rgba(61,220,151,0.12)";
    v.badgeLine = v.windowClosed
      ? "rgba(255,255,255,0.25)"
      : "rgba(61,220,151,0.4)";
    v.badgeColor = v.windowClosed ? "#aebfda" : "#9df0c8";
    v.closeWindow = () =>
      this.ask({
        title: "Close the attendance window?",
        body:
          v.openTitle +
          " will stop accepting scans. Members who scan after this are told attendance is closed, and a Registrar must mark them by hand.",
        confirmLabel: "Close window",
        tone: "warning",
        run: () => {
          if (this.props.real) {
            this.props.real.onClose(v.openId).then((err) =>
              this.setState({
                toast:
                  err ||
                  "Attendance window closed for " +
                    v.openTitle +
                    ". The change is in the audit log.",
              }),
            );
            return;
          }
          this.setState({
            windowClosed: true,
            toast:
              "Attendance window closed for Weekly Chapter Meeting. The change is in the audit log.",
          });
        },
      });
    v.queue.forEach((q) => {
      q.approve = () => this.act(q, true);
      q.decline = () =>
        this.ask({
          title: "Decline " + q.name + "?",
          body: "Their registration is declined and they are emailed the reason you give. They cannot sign in.",
          reasonLabel: "Reason (sent to the member)",
          confirmLabel: "Decline registration",
          tone: "danger",
          run: (reason) => this.act(q, false, reason),
        });
    });
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
