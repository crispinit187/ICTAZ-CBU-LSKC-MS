import React from "react";
import ConfirmDialog, { UnsavedGuard } from "../components/ConfirmDialog.jsx";

const renderScreen = (v, props) => (
  <div
    className="scr-scan"
    style={{
      width: "100%",
      height: "100%",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      background: "#050505",
      color: "#ffffff",
      fontFamily: "Arial, Helvetica, sans-serif",
      overflow: "hidden",
    }}
  >
    <nav
      style={{
        height: "60px",
        flexShrink: "0",
        padding: "0 20px",
        boxSizing: "border-box",
        background: "#000000",
        borderBottom: "1px solid #1c1c1c",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <a
        href="#"
        style={{
          fontSize: "20px",
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
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: "13px",
          fontWeight: "600",
        }}
      >
        <a href="#" style={{ color: "#aaaaaa" }}>
          My account
        </a>
        <a href="#" onClick={v.signOut}>
          Sign out
        </a>
      </div>
    </nav>
    {v.isIdle && (
      <>
        <div
          style={{
            flexGrow: "1",
            display: "flex",
            flexDirection: "column",
            padding: "28px 20px 24px",
            boxSizing: "border-box",
            background:
              "radial-gradient(circle at 80% 8%, rgba(0,102,255,0.25), transparent 45%), #050505",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                padding: "4px 11px",
                borderRadius: "20px",
                background: "rgba(61,220,151,0.12)",
                border: "1px solid rgba(61,220,151,0.4)",
                color: "#9df0c8",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              Active member
            </span>
          </div>
          <h1
            style={{
              margin: "16px 0 8px",
              fontSize: "32px",
              lineHeight: "1.05",
              letterSpacing: "-1.2px",
            }}
          >
            Hello, Sample.
          </h1>
          <p
            style={{
              margin: "0",
              color: "#aebfda",
              fontSize: "15px",
              lineHeight: "1.6",
            }}
          >
            Scan the code shown on the screen at the venue to mark yourself
            present.
          </p>
          <div
            style={{
              flexGrow: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              className="btn-primary"
              type="button"
              onClick={v.startScan}
              aria-label="Scan the attendance code"
              style={{
                width: "220px",
                height: "220px",
                border: "none",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 35% 30%, #2d86ff, #0066ff 55%, #0047b3)",
                boxShadow:
                  "0 0 0 14px rgba(0,102,255,0.14), 0 0 0 34px rgba(0,102,255,0.07), 0 18px 50px rgba(0,102,255,0.45)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                color: "#ffffff",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
                <rect x="8" y="8" width="3" height="3" />
                <rect x="13" y="8" width="3" height="3" />
                <rect x="8" y="13" width="3" height="3" />
                <path d="M13 13h3v3" />
              </svg>
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  letterSpacing: "-0.5px",
                }}
              >
                Scan
              </span>
            </button>
          </div>
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#aebfda",
              fontSize: "13px",
              lineHeight: "1.6",
            }}
          >
            <strong style={{ color: "#ffffff" }}>Can't scan?</strong>
            {
              " Ask a Registrar at the door. They can mark you present by searching your name. "
            }
          </div>
        </div>
      </>
    )}
    {v.isScanning && (
      <>
        <div
          style={{
            flexGrow: "1",
            display: "flex",
            flexDirection: "column",
            padding: "20px",
            boxSizing: "border-box",
            background: "#000000",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "18px",
            }}
          >
            <h2
              style={{ margin: "0", fontSize: "20px", letterSpacing: "-0.5px" }}
            >
              Point at the code
            </h2>
            <button
              className="btn-ghost"
              type="button"
              onClick={v.cancel}
              style={{
                height: "40px",
                padding: "0 16px",
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
          <div
            style={{
              position: "relative",
              flexGrow: "1",
              borderRadius: "20px",
              overflow: "hidden",
              background:
                "linear-gradient(180deg, #0b1424, #0d1a30 50%, #07101e)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "250px",
                height: "250px",
                margin: "-125px 0 0 -125px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "0",
                  top: "0",
                  width: "44px",
                  height: "44px",
                  borderLeft: "4px solid #54adff",
                  borderTop: "4px solid #54adff",
                  borderRadius: "12px 0 0 0",
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  right: "0",
                  top: "0",
                  width: "44px",
                  height: "44px",
                  borderRight: "4px solid #54adff",
                  borderTop: "4px solid #54adff",
                  borderRadius: "0 12px 0 0",
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  left: "0",
                  bottom: "0",
                  width: "44px",
                  height: "44px",
                  borderLeft: "4px solid #54adff",
                  borderBottom: "4px solid #54adff",
                  borderRadius: "0 0 0 12px",
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  right: "0",
                  bottom: "0",
                  width: "44px",
                  height: "44px",
                  borderRight: "4px solid #54adff",
                  borderBottom: "4px solid #54adff",
                  borderRadius: "0 0 12px 0",
                }}
              ></div>
              <div
                className="scanline"
                style={{
                  position: "absolute",
                  left: "8px",
                  right: "8px",
                  height: "3px",
                  borderRadius: "2px",
                  background: "#54adff",
                  boxShadow: "0 0 14px rgba(84,173,255,0.9)",
                }}
              ></div>
            </div>
            <div
              style={{
                position: "absolute",
                left: "0",
                right: "0",
                bottom: "22px",
                textAlign: "center",
                color: "#aebfda",
                fontSize: "13px",
                lineHeight: "1.5",
                padding: "0 24px",
              }}
            >
              Hold your phone steady. The code on the screen changes every 45
              seconds.
            </div>
          </div>
          <button
            className="btn-primary"
            type="button"
            onClick={v.finishScan}
            style={{
              marginTop: "16px",
              height: "52px",
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
            Demo: simulate a scan
          </button>
          <div
            style={{
              marginTop: "10px",
              textAlign: "center",
              color: "#75859e",
              fontSize: "12px",
            }}
          >
            In the real app the camera reads the code automatically.
          </div>
        </div>
      </>
    )}
    {v.isResult && (
      <>
        <div
          style={{
            flexGrow: "1",
            display: "flex",
            flexDirection: "column",
            padding: "28px 20px 24px",
            boxSizing: "border-box",
            background: "#050505",
          }}
        >
          <div
            style={{
              flexGrow: "1",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "104px",
                height: "104px",
                borderRadius: "50%",
                background: v.resBg,
                border: `2px solid ${v.resBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="52"
                height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke={v.resColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={v.resIcon} />
              </svg>
            </div>
            <h1
              style={{
                margin: "26px 0 10px",
                fontSize: "28px",
                lineHeight: "1.1",
                letterSpacing: "-1px",
              }}
            >
              {v.resTitle}
            </h1>
            <p
              style={{
                margin: "0",
                maxWidth: "300px",
                color: "#aebfda",
                fontSize: "15px",
                lineHeight: "1.6",
              }}
            >
              {v.resBody}
            </p>
            {v.resDetails && (
              <>
                <div
                  style={{
                    marginTop: "24px",
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "16px 18px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.035)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    textAlign: "left",
                    fontSize: "14px",
                    lineHeight: "1.7",
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
                    SESSION
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                    Weekly Chapter Meeting
                  </div>
                  <div style={{ color: "#aebfda" }}>
                    {"Main Hall · "}
                    {v.resTime}
                  </div>
                  <div
                    style={{
                      marginTop: "8px",
                      color: "#8a99b3",
                      fontSize: "12px",
                    }}
                  >
                    Saved with your program and year at the time of the session.
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            className="btn-primary"
            type="button"
            onClick={v.startScan}
            style={{
              height: "52px",
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
            Scan again
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={v.cancel}
            style={{
              marginTop: "10px",
              height: "52px",
              border: "1px solid #333333",
              borderRadius: "8px",
              background: "transparent",
              color: "#ffffff",
              fontFamily: "inherit",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Done
          </button>
          <p
            style={{
              margin: "14px 0 0",
              textAlign: "center",
              color: "#75859e",
              fontSize: "12px",
              lineHeight: "1.5",
            }}
          >
            There is no attendance history on this app. Your Registrar keeps the
            records.
          </p>
        </div>
      </>
    )}
  </div>
);

class Screen extends React.Component {
  constructor(props) {
    super(props);
    this.state = { screen: "idle", outcome: "success", time: "16:12" };
  }
  renderVals() {
    const s = this.state;
    const R = {
      success: {
        bg: "rgba(61,220,151,0.12)",
        border: "rgba(61,220,151,0.5)",
        color: "#3ddc97",
        icon: "M5 12.5l4.5 4.5L19 7.5",
        title: "You're marked present",
        body: "Your attendance has been recorded. You can put your phone away.",
        details: true,
      },
      already: {
        bg: "rgba(84,173,255,0.12)",
        border: "rgba(84,173,255,0.5)",
        color: "#54adff",
        icon: "M5 12.5l4.5 4.5L19 7.5",
        title: "Already marked present",
        body: "You scanned this session earlier, so nothing more is needed. No duplicate was created.",
        details: true,
      },
      expired: {
        bg: "rgba(255,176,32,0.12)",
        border: "rgba(255,176,32,0.5)",
        color: "#ffb020",
        icon: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
        title: "That code has expired",
        body: "Codes change every 45 seconds. Scan the code that is on the screen now.",
        details: false,
      },
      closed: {
        bg: "rgba(255,107,107,0.12)",
        border: "rgba(255,107,107,0.5)",
        color: "#ff6b6b",
        icon: "M6 6l12 12M18 6L6 18",
        title: "Attendance is closed",
        body: "This session is no longer taking attendance. If you were there, ask a Registrar to mark you.",
        details: false,
      },
    };
    const r = R[s.outcome] || R.success;
    return {
      isIdle: s.screen === "idle",
      isScanning: s.screen === "scanning",
      isResult: s.screen === "result",
      startScan: () => this.setState({ screen: "scanning" }),
      cancel: () => this.setState({ screen: "idle" }),
      finishScan: () =>
        this.setState({
          screen: "result",
          outcome: this.props.demoState || "success",
        }),
      resBg: r.bg,
      resBorder: r.border,
      resColor: r.color,
      resIcon: r.icon,
      resTitle: r.title,
      resBody: r.body,
      resDetails: r.details,
      resTime: s.time,
    };
  }

  ask = (cfg) => this.setState({ confirm: cfg });

  render() {
    const v = this.renderVals();
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
