import React from "react";
import QRCode from "qrcode";

const renderScreen = (v, props) => (
  <div
    className="scr-qr"
    style={{
      width: "1440px",
      height: "810px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      background:
        "radial-gradient(circle at 78% 30%, rgba(0,102,255,0.3), transparent 45%), linear-gradient(135deg, #050505 0%, #001b45 60%, #0047b3 100%)",
      color: "#ffffff",
      fontFamily: "Arial, Helvetica, sans-serif",
    }}
  >
    <header
      style={{
        height: "76px",
        flexShrink: "0",
        padding: "0 56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          letterSpacing: "-0.5px",
        }}
      >
        {"ICTAZ "}
        <span style={{ color: "#54adff" }}>CBU</span>
        {" LSKC"}
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 16px",
          borderRadius: "20px",
          background: v.statusBg,
          border: `1px solid ${v.statusBorder}`,
          color: v.statusColor,
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        <span
          className="live-dot"
          style={{
            width: "9px",
            height: "9px",
            borderRadius: "50%",
            background: v.statusColor,
          }}
        ></span>
        {v.statusText}
      </span>
    </header>
    <main
      style={{
        flexGrow: "1",
        padding: "6px 56px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "48px",
      }}
    >
      <section
        style={{
          flex: "1 1 0",
          minWidth: "0",
          display: "flex",
          flexDirection: "column",
          gap: "34px",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 14px",
              color: "#b9d4ff",
              fontSize: "14px",
              fontWeight: "bold",
              letterSpacing: "3px",
            }}
          >
            ATTENDANCE OPEN
          </p>
          <h1
            style={{
              margin: "0",
              fontSize: v.titleSize,
              lineHeight: "0.98",
              letterSpacing: "-2.5px",
            }}
          >
            {v.title}
          </h1>
          <p style={{ margin: "18px 0 0", color: "#d2d2d2", fontSize: "20px" }}>
            {v.when}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <span
              style={{
                flexShrink: "0",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(84,173,255,0.15)",
                border: "1px solid rgba(84,173,255,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "bold",
                color: "#bcd6ff",
              }}
            >
              1
            </span>
            <span style={{ fontSize: "22px" }}>Sign in on your phone</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <span
              style={{
                flexShrink: "0",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(84,173,255,0.15)",
                border: "1px solid rgba(84,173,255,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "bold",
                color: "#bcd6ff",
              }}
            >
              2
            </span>
            <span style={{ fontSize: "22px" }}>
              {"Press "}
              <strong>Scan</strong>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <span
              style={{
                flexShrink: "0",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(84,173,255,0.15)",
                border: "1px solid rgba(84,173,255,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "bold",
                color: "#bcd6ff",
              }}
            >
              3
            </span>
            <span style={{ fontSize: "22px" }}>
              Point the camera at this code
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "16px",
            paddingTop: "6px",
          }}
        >
          <span
            style={{
              fontSize: "84px",
              fontWeight: "bold",
              letterSpacing: "-4px",
              lineHeight: "0.85",
            }}
          >
            {v.present}
          </span>
          <span
            style={{
              paddingBottom: "6px",
              color: "#d2d2d2",
              fontSize: "20px",
              lineHeight: "1.3",
            }}
          >
            members
            <br />
            marked present
          </span>
        </div>
      </section>
      <section
        style={{
          flex: "0 0 600px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "22px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "600px",
            height: "600px",
            boxSizing: "border-box",
            padding: "26px",
            borderRadius: "28px",
            background: "#ffffff",
            boxShadow: "0 24px 70px rgba(0,0,0,0.55)",
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <svg
              viewBox={v.viewBox}
              shapeRendering="crispEdges"
              role="img"
              aria-label="Attendance QR code, changes automatically"
              style={{
                position: "absolute",
                left: "0",
                top: "0",
                width: "100%",
                height: "100%",
                opacity: v.prevOpacity,
                transition: "opacity 0.3s ease",
              }}
            >
              <path d={v.prevPath} fill="#000000" />
            </svg>
            <svg
              viewBox={v.viewBox}
              shapeRendering="crispEdges"
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "0",
                top: "0",
                width: "100%",
                height: "100%",
                opacity: v.curOpacity,
                transition: "opacity 0.3s ease",
              }}
            >
              <path d={v.curPath} fill="#000000" />
            </svg>
          </div>
        </div>
        <div style={{ width: "600px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "9px",
              fontSize: "16px",
              color: "#d2d2d2",
            }}
          >
            <span>Code changes automatically</span>
            <strong
              style={{ color: v.barColor, fontVariantNumeric: "tabular-nums" }}
            >
              {v.remaining}s
            </strong>
          </div>
          <div
            style={{
              height: "10px",
              borderRadius: "5px",
              background: "rgba(255,255,255,0.18)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${v.barWidth}%`,
                background: v.barColor,
                borderRadius: "5px",
                transition: "width 1s linear",
              }}
            ></div>
          </div>
        </div>
      </section>
    </main>
    <footer
      style={{
        height: "64px",
        flexShrink: "0",
        padding: "0 56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "#9fb4d6",
        fontSize: "14px",
      }}
    >
      <span>{v.footerText}</span>
      {v.showDemoBtn && (
        <button
          className="btn-ghost"
          type="button"
          onClick={v.toggleDrop}
          style={{
            padding: "8px 14px",
            border: "1px solid #3d4d68",
            borderRadius: "8px",
            background: "transparent",
            color: "#cfe0ff",
            fontFamily: "inherit",
            fontSize: "13px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {v.dropLabel}
        </button>
      )}
    </footer>
  </div>
);

class Screen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cur: 7,
      prev: 6,
      fadeIn: true,
      remaining: 12,
      present: 87,
      dropped: false,
    };
    this.timer = null;
  }
  period() {
    return Math.max(5, Number(this.props.demoSeconds) || 12);
  }
  qrPath(text) {
    // a real QR code: one square per dark module
    const q = QRCode.create(text, { errorCorrectionLevel: "M" });
    const n = q.modules.size;
    let d = "";
    for (let y = 0; y < n; y++)
      for (let c = 0; c < n; c++)
        if (q.modules.data[y * n + c]) d += "M" + c + " " + y + "h1v1h-1z";
    return { d, n };
  }
  componentDidUpdate(prev) {
    const r = this.props.real;
    if (r && r.token && (!prev.real || prev.real.token !== r.token)) {
      const next = this.qrPath(r.token);
      this.setState((s) => ({
        prevPath: s.curPath || next.d,
        curPath: next.d,
        size: next.n,
        fadeIn: false,
      }));
      setTimeout(() => this.setState({ fadeIn: true }), 40);
    }
  }
  componentDidMount() {
    const r = this.props.real;
    if (r) {
      if (r.token) {
        const first = this.qrPath(r.token);
        this.setState({ curPath: first.d, prevPath: first.d, size: first.n });
      }
      return;
    }
    this.setState({ remaining: this.period() });
    this.timer = setInterval(() => {
      const s = this.state;
      if (s.dropped) return;
      let rem = s.remaining - 1;
      const next = {
        present:
          s.present < 150 && Math.random() < 0.7 ? s.present + 1 : s.present,
      };
      if (rem <= 0) {
        rem = this.period();
        next.prev = s.cur;
        next.cur = s.cur + 1;
        next.fadeIn = false;
        setTimeout(() => this.setState({ fadeIn: true }), 40);
      }
      next.remaining = rem;
      this.setState(next);
    }, 1000);
  }
  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }
  build(seed) {
    let x = (seed * 9301 + 49297) % 233280;
    const rnd = () => {
      x = (x * 9301 + 49297) % 233280;
      return x / 233280;
    };
    const N = 29;
    const corners = [
      [0, 0],
      [N - 7, 0],
      [0, N - 7],
    ];
    let d = "";
    for (let y = 0; y < N; y++) {
      for (let c = 0; c < N; c++) {
        let dark = false;
        let reserved = false;
        for (let k = 0; k < corners.length; k++) {
          const dx = c - corners[k][0];
          const dy = y - corners[k][1];
          if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) {
            reserved = true;
            if (dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6) {
              const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
              dark = ring === 3 || ring <= 1;
            }
          }
        }
        if (!reserved) {
          if (y === 6) dark = c % 2 === 0;
          else if (c === 6) dark = y % 2 === 0;
          else dark = rnd() > 0.52;
        }
        if (dark) d += "M" + c + " " + y + "h1v1h-1z";
      }
    }
    return d;
  }
  realVals() {
    const s = this.state;
    const r = this.props.real;
    const period = r.period || 45;
    const low = r.remaining <= 5;
    const st = r.dropped
      ? {
          bg: "rgba(255,176,32,0.14)",
          border: "rgba(255,176,32,0.5)",
          color: "#ffd98a",
          text: "Reconnecting. Showing the last valid code.",
        }
      : {
          bg: "rgba(61,220,151,0.12)",
          border: "rgba(61,220,151,0.45)",
          color: "#9df0c8",
          text: "Live and connected",
        };
    const n = s.size || 29;
    return {
      statusBg: st.bg,
      statusBorder: st.border,
      statusColor: st.color,
      statusText: st.text,
      present: r.present,
      curPath: s.curPath || "",
      prevPath: s.prevPath || "",
      curOpacity: s.fadeIn ? 1 : 0,
      prevOpacity: s.fadeIn ? 0 : 1,
      remaining: r.remaining,
      barWidth: Math.max(0, Math.min(100, (r.remaining / period) * 100)),
      barColor: low ? "#ff6b6b" : "#54adff",
      viewBox: "-2 -2 " + (n + 4) + " " + (n + 4),
      title: r.title,
      titleSize: r.title.length > 28 ? "44px" : "62px",
      when: r.when,
      footerText:
        "A new code appears every " +
        period +
        " seconds. Each old code still works for 10 seconds, so a scan during the change is not lost.",
      showDemoBtn: false,
    };
  }
  renderVals() {
    if (this.props.real) return this.realVals();
    const s = this.state;
    const period = this.period();
    const low = s.remaining <= 5;
    const st = s.dropped
      ? {
          bg: "rgba(255,176,32,0.14)",
          border: "rgba(255,176,32,0.5)",
          color: "#ffd98a",
          text: "Reconnecting. Showing the last valid code.",
        }
      : {
          bg: "rgba(61,220,151,0.12)",
          border: "rgba(61,220,151,0.45)",
          color: "#9df0c8",
          text: "Live and connected",
        };
    return {
      statusBg: st.bg,
      statusBorder: st.border,
      statusColor: st.color,
      statusText: st.text,
      present: s.present,
      curPath: this.build(s.cur),
      prevPath: this.build(s.prev),
      curOpacity: s.fadeIn ? 1 : 0,
      prevOpacity: s.fadeIn ? 0 : 1,
      remaining: s.remaining,
      barWidth: Math.max(0, Math.min(100, (s.remaining / period) * 100)),
      barColor: low ? "#ff6b6b" : "#54adff",
      viewBox: "-2 -2 33 33",
      title: (
        <>
          Weekly Chapter
          <br />
          Meeting
        </>
      ),
      titleSize: "62px",
      when: "Today · 16:00 to 17:30 · Main Hall",
      footerText:
        "A new code appears every 45 seconds. Each old code still works for 10 seconds, so a scan during the change is not lost.",
      showDemoBtn: true,
      dropLabel: s.dropped
        ? "Demo: restore connection"
        : "Demo: drop connection",
      toggleDrop: () => this.setState({ dropped: !this.state.dropped }),
    };
  }

  render() {
    return renderScreen(this.renderVals(), this.props);
  }
}

export default Screen;
