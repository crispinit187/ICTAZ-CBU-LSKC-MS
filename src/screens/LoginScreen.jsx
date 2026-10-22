import React from "react";

const renderDesktop = (v, props) => (
  <div
    className="scr-login"
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
        padding: "0 6%",
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
      <div
        style={{
          display: "flex",
          gap: "28px",
          fontSize: "14px",
          fontWeight: "600",
        }}
      >
        <a
          href={import.meta.env.BASE_URL + "executives"}
          onClick={(e) => {
            e.preventDefault();
            props.onExecutives && props.onExecutives();
          }}
          style={{ color: "#54adff" }}
        >
          Our executive
        </a>
        <a
          href={import.meta.env.BASE_URL + "terms"}
          onClick={(e) => {
            e.preventDefault();
            props.onTerms && props.onTerms();
          }}
          style={{ color: "#aaaaaa" }}
        >
          Terms of Use
        </a>
        <a
          href={import.meta.env.BASE_URL + "privacy"}
          onClick={(e) => {
            e.preventDefault();
            props.onPrivacy && props.onPrivacy();
          }}
          style={{ color: "#aaaaaa" }}
        >
          Privacy Notice
        </a>
        <a href="#" style={{ color: "#aaaaaa" }}>
          Help
        </a>
      </div>
    </nav>
    <main style={{ flexGrow: "1", display: "flex", flexWrap: "wrap" }}>
      <section
        style={{
          flex: "1 1 520px",
          minWidth: "0",
          boxSizing: "border-box",
          padding: "80px 8%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "36px",
          background:
            "radial-gradient(circle at 75% 25%, rgba(0,102,255,0.25), transparent 40%), linear-gradient(135deg, #050505 0%, #001b45 55%, #0052cc 100%)",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 22px",
              color: "#b9d4ff",
              fontSize: "13px",
              fontWeight: "bold",
              letterSpacing: "3px",
            }}
          >
            ICTAZ CBU LSKC CHAPTER
          </p>
          <h1
            style={{
              margin: "0",
              fontSize: "76px",
              lineHeight: "0.92",
              letterSpacing: "-3px",
            }}
          >
            Chapter
            <br />
            Management
            <br />
            System.
          </h1>
          <p
            style={{
              margin: "28px 0 0",
              maxWidth: "520px",
              color: "#d2d2d2",
              fontSize: "18px",
              lineHeight: "1.7",
            }}
          >
            One sign-in for everything the chapter runs. Attendance is the first
            module, with more on the way.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "22px",
            maxWidth: "520px",
          }}
        >
          <div
            style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
          >
            <div
              style={{
                flexShrink: "0",
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(84,173,255,0.12)",
                border: "1px solid rgba(84,173,255,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#54adff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3M21 14v.01M14 21h.01M17 21h4v-4" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                Scan to mark attendance
              </div>
              <div
                style={{
                  marginTop: "4px",
                  color: "#aebfda",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                Press Scan at the venue. The QR code changes every 45 seconds,
                so a photo of it stops working.
              </div>
            </div>
          </div>
          <div
            style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
          >
            <div
              style={{
                flexShrink: "0",
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(84,173,255,0.12)",
                border: "1px solid rgba(84,173,255,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#54adff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2 2 7l10 5 10-5-10-5z" />
                <path d="m2 12 10 5 10-5" />
                <path d="m2 17 10 5 10-5" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                One account, every module
              </div>
              <div
                style={{
                  marginTop: "4px",
                  color: "#aebfda",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                Sign in with your student number or email, or with Google. Your
                details carry across the whole platform.
              </div>
            </div>
          </div>
          <div
            style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
          >
            <div
              style={{
                flexShrink: "0",
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(84,173,255,0.12)",
                border: "1px solid rgba(84,173,255,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#54adff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                Private by design
              </div>
              <div
                style={{
                  marginTop: "4px",
                  color: "#aebfda",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                Only authorised staff can see member data, and every sign-in is
                recorded.
              </div>
            </div>
          </div>
        </div>
      </section>
      <section
        style={{
          flex: "1 1 480px",
          minWidth: "0",
          boxSizing: "border-box",
          padding: "60px 6%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "460px",
            boxSizing: "border-box",
            padding: "36px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#54adff",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "2px",
            }}
          >
            WELCOME BACK
          </p>
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "32px",
              letterSpacing: "-1px",
            }}
          >
            Sign in
          </h2>
          <p
            style={{
              margin: "0 0 24px",
              color: "#aebfda",
              fontSize: "15px",
              lineHeight: "1.6",
            }}
          >
            Use your student number or the email on your account.
          </p>
          <div role="status" aria-live="polite">
            {v.showInvalid && (
              <>
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    background: "rgba(255,107,107,0.1)",
                    border: "1px solid rgba(255,107,107,0.4)",
                    color: "#ffb3b3",
                    fontSize: "14px",
                    lineHeight: "1.55",
                  }}
                >
                  {v.invalidMsg}
                </div>
              </>
            )}
            {v.showWrong && (
              <>
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    background: "rgba(255,107,107,0.1)",
                    border: "1px solid rgba(255,107,107,0.4)",
                    color: "#ffb3b3",
                    fontSize: "14px",
                    lineHeight: "1.55",
                  }}
                >
                  <strong style={{ color: "#ffd0d0" }}>
                    Those details don't match an active account.
                  </strong>
                  <br />
                  Check them and try again, or reset your password. For security
                  we never say which part was wrong.
                </div>
              </>
            )}
            {v.showDelay && (
              <>
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    background: "rgba(255,176,32,0.1)",
                    border: "1px solid rgba(255,176,32,0.4)",
                    color: "#ffd98a",
                    fontSize: "14px",
                    lineHeight: "1.55",
                  }}
                >
                  <strong style={{ color: "#ffe6ad" }}>
                    Too many attempts.
                  </strong>
                  <br />
                  {"For your protection, wait "}
                  {v.countdown}
                  {
                    " seconds before trying again. Other accounts are not affected."
                  }
                </div>
              </>
            )}
            {v.showPending && (
              <>
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    background: "rgba(84,173,255,0.1)",
                    border: "1px solid rgba(84,173,255,0.4)",
                    color: "#bcd6ff",
                    fontSize: "14px",
                    lineHeight: "1.55",
                  }}
                >
                  <strong style={{ color: "#e8f0ff" }}>
                    Your account is waiting for approval.
                  </strong>
                  <br />
                  An Administrator checks each registration. You will get an
                  email as soon as it is approved.
                </div>
              </>
            )}
            {v.showSuspended && (
              <>
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    background: "rgba(255,107,107,0.1)",
                    border: "1px solid rgba(255,107,107,0.4)",
                    color: "#ffb3b3",
                    fontSize: "14px",
                    lineHeight: "1.55",
                  }}
                >
                  <strong style={{ color: "#ffd0d0" }}>
                    This account is suspended.
                  </strong>
                  <br />
                  Contact a chapter Administrator to find out why and how to get
                  back in.
                </div>
              </>
            )}
            {v.showSuccess && (
              <>
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    background: "rgba(61,220,151,0.1)",
                    border: "1px solid rgba(61,220,151,0.4)",
                    color: "#9df0c8",
                    fontSize: "14px",
                    lineHeight: "1.55",
                  }}
                >
                  <strong style={{ color: "#c4f7de" }}>Signed in.</strong>
                  <br />
                  Taking you to the scan screen...
                </div>
              </>
            )}
          </div>
          <form onSubmit={v.onSubmit} noValidate>
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="identifier"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Student number or email
              </label>
              <input
                className="field"
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="e.g. 12345678 or name@gmail.com"
                value={v.identifier}
                onChange={v.onIdentifier}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 15px",
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
                  marginTop: "8px",
                  fontSize: "13px",
                  lineHeight: "1.4",
                  color: v.idHintColor,
                }}
              >
                {v.idHint}
              </div>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="field"
                  id="password"
                  name="password"
                  type={v.pwType}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={v.password}
                  onChange={v.onPassword}
                  onKeyUp={v.onKey}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "14px 76px 14px 15px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "9px",
                    color: "#f1f6ff",
                    fontFamily: "inherit",
                    fontSize: "15px",
                  }}
                />
                <button
                  type="button"
                  className="link-btn"
                  aria-label={v.pwToggleLabel}
                  onClick={v.togglePw}
                  style={{
                    position: "absolute",
                    right: "6px",
                    top: "6px",
                    bottom: "6px",
                    padding: "0 12px",
                    background: "transparent",
                    border: "none",
                    borderRadius: "7px",
                    color: "#aebfda",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {v.pwToggleText}
                </button>
              </div>
              {v.caps && (
                <>
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "13px",
                      color: "#ffd98a",
                    }}
                  >
                    Caps Lock is on.
                  </div>
                </>
              )}
            </div>
            <div
              style={{
                margin: "14px 0 22px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <a
                href={import.meta.env.BASE_URL + "forgot-password"}
                onClick={(e) => {
                  e.preventDefault();
                  props.onForgot && props.onForgot(v.identifier);
                }}
                style={{ fontSize: "14px", fontWeight: "600" }}
              >
                Forgot password?
              </a>
            </div>
            <button
              className="btn-primary"
              type="submit"
              disabled={v.buttonDisabled}
              style={{
                width: "100%",
                padding: "15px 24px",
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
              {v.buttonLabel}
            </button>
          </form>
          <div
            style={{
              margin: "24px 0",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              color: "#75859e",
              fontSize: "12px",
              letterSpacing: "1px",
            }}
          >
            <div
              style={{
                flexGrow: "1",
                height: "1px",
                background: "rgba(255,255,255,0.12)",
              }}
            ></div>
            <span>OR</span>
            <div
              style={{
                flexGrow: "1",
                height: "1px",
                background: "rgba(255,255,255,0.12)",
              }}
            ></div>
          </div>
          <button
            className="btn-google"
            onClick={props.onGoogle}
            type="button"
            style={{
              width: "100%",
              padding: "14px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              background: "transparent",
              border: "1px solid #333333",
              borderRadius: "8px",
              color: "#ffffff",
              fontFamily: "inherit",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
          <p
            style={{
              margin: "10px 0 0",
              textAlign: "center",
              color: "#75859e",
              fontSize: "12px",
              lineHeight: "1.5",
            }}
          >
            Google works only with the email on your approved account.
          </p>
          <div
            style={{
              marginTop: "28px",
              paddingTop: "22px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center",
              color: "#aebfda",
              fontSize: "14px",
              lineHeight: "1.7",
            }}
          >
            {" New to the chapter? "}
            <a
              href={import.meta.env.BASE_URL + "register"}
              onClick={(e) => {
                e.preventDefault();
                props.onRegister && props.onRegister();
              }}
              style={{ fontWeight: "bold" }}
            >
              Create an account
            </a>
            <br />
            <span style={{ fontSize: "12px", color: "#75859e" }}>
              New accounts need Administrator approval before first sign-in.
            </span>
          </div>
          <p
            style={{
              margin: "18px 0 0",
              textAlign: "center",
              color: "#75859e",
              fontSize: "12px",
              lineHeight: "1.6",
            }}
          >
            {"By signing in you accept the "}
            <a
              href={import.meta.env.BASE_URL + "terms"}
              onClick={(e) => {
                e.preventDefault();
                props.onTerms && props.onTerms();
              }}
            >
              Terms of Use
            </a>
            {" and "}
            <a
              href={import.meta.env.BASE_URL + "privacy"}
              onClick={(e) => {
                e.preventDefault();
                props.onPrivacy && props.onPrivacy();
              }}
            >
              Privacy Notice
            </a>
            .
          </p>
        </div>
      </section>
    </main>
    <footer
      style={{
        padding: "24px 8%",
        background: "#000000",
        borderTop: "1px solid #1c1c1c",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        color: "#8a8a8a",
        fontSize: "13px",
      }}
    >
      <span>ICTAZ CBU LSKC Management System</span>
      <span>Copperbelt University, Lusaka Campus</span>
    </footer>
  </div>
);

const renderMobile = (v, props) => (
  <div
    className="scr-login-m"
    style={{
      width: "100%",
      minHeight: "100vh",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      background: "#050505",
      color: "#ffffff",
      fontFamily: "Arial, Helvetica, sans-serif",
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
      <a
        href="#"
        style={{ fontSize: "13px", fontWeight: "600", color: "#aaaaaa" }}
      >
        Help
      </a>
    </nav>
    <div
      style={{
        padding: "28px 20px 20px",
        background:
          "radial-gradient(circle at 80% 10%, rgba(0,102,255,0.28), transparent 45%), linear-gradient(135deg, #050505 0%, #001b45 70%, #0052cc 100%)",
      }}
    >
      <p
        style={{
          margin: "0 0 10px",
          color: "#b9d4ff",
          fontSize: "11px",
          fontWeight: "bold",
          letterSpacing: "2.5px",
        }}
      >
        ICTAZ CBU LSKC CHAPTER
      </p>
      <h1
        style={{
          margin: "0",
          fontSize: "34px",
          lineHeight: "1",
          letterSpacing: "-1.5px",
        }}
      >
        Sign in
      </h1>
      <p
        style={{
          margin: "10px 0 0",
          color: "#d2d2d2",
          fontSize: "14px",
          lineHeight: "1.55",
        }}
      >
        Use your student number or the email on your account.
      </p>
    </div>
    <div
      style={{
        flexGrow: "1",
        padding: "20px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div role="status" aria-live="polite">
        {v.showInvalid && (
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
                lineHeight: "1.5",
              }}
            >
              {v.invalidMsg}
            </div>
          </>
        )}
        {v.showWrong && (
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
                lineHeight: "1.5",
              }}
            >
              <strong style={{ color: "#ffd0d0" }}>
                Those details don't match an active account.
              </strong>
              <br />
              Check them and try again, or reset your password.
            </div>
          </>
        )}
        {v.showDelay && (
          <>
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(255,176,32,0.1)",
                border: "1px solid rgba(255,176,32,0.4)",
                color: "#ffd98a",
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              <strong style={{ color: "#ffe6ad" }}>Too many attempts.</strong>
              <br />
              {"For your protection, wait "}
              {v.countdown}
              {" seconds before trying again."}
            </div>
          </>
        )}
        {v.showPending && (
          <>
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(84,173,255,0.1)",
                border: "1px solid rgba(84,173,255,0.4)",
                color: "#bcd6ff",
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              <strong style={{ color: "#e8f0ff" }}>
                Your account is waiting for approval.
              </strong>
              <br />
              You will get an email as soon as an Administrator approves it.
            </div>
          </>
        )}
        {v.showSuspended && (
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
                lineHeight: "1.5",
              }}
            >
              <strong style={{ color: "#ffd0d0" }}>
                This account is suspended.
              </strong>
              <br />
              Contact a chapter Administrator.
            </div>
          </>
        )}
        {v.showSuccess && (
          <>
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(61,220,151,0.1)",
                border: "1px solid rgba(61,220,151,0.4)",
                color: "#9df0c8",
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              <strong style={{ color: "#c4f7de" }}>Signed in.</strong>
              <br />
              Taking you to the scan screen...
            </div>
          </>
        )}
      </div>
      <form onSubmit={v.onSubmit} noValidate>
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="identifier"
            style={{
              display: "block",
              marginBottom: "7px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Student number or email
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="e.g. 12345678 or name@gmail.com"
            value={v.identifier}
            onChange={v.onIdentifier}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              height: "48px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "9px",
              color: "#f1f6ff",
              fontFamily: "inherit",
              fontSize: "16px",
            }}
          />
          <div
            style={{ marginTop: "6px", fontSize: "12px", color: v.idHintColor }}
          >
            {v.idHint}
          </div>
        </div>
        <div style={{ marginBottom: "8px" }}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: "7px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              name="password"
              type={v.pwType}
              placeholder="Your password"
              value={v.password}
              onChange={v.onPassword}
              onKeyUp={v.onKey}
              autoComplete="current-password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px 76px 14px 14px",
                height: "48px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "9px",
                color: "#f1f6ff",
                fontFamily: "inherit",
                fontSize: "16px",
              }}
            />
            <button
              type="button"
              aria-label={v.pwToggleLabel}
              onClick={v.togglePw}
              style={{
                position: "absolute",
                right: "4px",
                top: "4px",
                bottom: "4px",
                padding: "0 14px",
                background: "transparent",
                border: "none",
                color: "#aebfda",
                fontFamily: "inherit",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              {v.pwToggleText}
            </button>
          </div>
          {v.caps && (
            <>
              <div
                style={{ marginTop: "6px", fontSize: "12px", color: "#ffd98a" }}
              >
                Caps Lock is on.
              </div>
            </>
          )}
        </div>
        <div
          style={{
            margin: "10px 0 18px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <a
            href={import.meta.env.BASE_URL + "forgot-password"}
            onClick={(e) => {
              e.preventDefault();
              props.onForgot && props.onForgot(v.identifier);
            }}
            style={{ fontSize: "14px", fontWeight: "600" }}
          >
            Forgot password?
          </a>
        </div>
        <button
          type="submit"
          disabled={v.buttonDisabled}
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
          }}
        >
          {v.buttonLabel}
        </button>
      </form>
      <div
        style={{
          margin: "18px 0",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "#75859e",
          fontSize: "12px",
          letterSpacing: "1px",
        }}
      >
        <div
          style={{
            flexGrow: "1",
            height: "1px",
            background: "rgba(255,255,255,0.12)",
          }}
        ></div>
        <span>OR</span>
        <div
          style={{
            flexGrow: "1",
            height: "1px",
            background: "rgba(255,255,255,0.12)",
          }}
        ></div>
      </div>
      <button
        onClick={props.onGoogle}
        type="button"
        style={{
          width: "100%",
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          background: "transparent",
          border: "1px solid #333333",
          borderRadius: "8px",
          color: "#ffffff",
          fontFamily: "inherit",
          fontSize: "15px",
          fontWeight: "bold",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>
      <p
        style={{
          margin: "20px 0 0",
          textAlign: "center",
          color: "#aebfda",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
      >
        {"New to the chapter? "}
        <a
          href={import.meta.env.BASE_URL + "register"}
          onClick={(e) => {
            e.preventDefault();
            props.onRegister && props.onRegister();
          }}
          style={{ fontWeight: "bold" }}
        >
          Create an account
        </a>
      </p>
      <p
        style={{
          margin: "14px 0 0",
          textAlign: "center",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        <a
          href={import.meta.env.BASE_URL + "executives"}
          onClick={(e) => {
            e.preventDefault();
            props.onExecutives && props.onExecutives();
          }}
        >
          Meet our executive
        </a>
      </p>
      <p
        style={{
          margin: "6px 0 0",
          textAlign: "center",
          color: "#75859e",
          fontSize: "12px",
          lineHeight: "1.5",
        }}
      >
        New accounts need Administrator approval.
        <br />
        {"By signing in you accept the "}
        <a
          href={import.meta.env.BASE_URL + "terms"}
          onClick={(e) => {
            e.preventDefault();
            props.onTerms && props.onTerms();
          }}
        >
          Terms
        </a>
        {" and "}
        <a
          href={import.meta.env.BASE_URL + "privacy"}
          onClick={(e) => {
            e.preventDefault();
            props.onPrivacy && props.onPrivacy();
          }}
        >
          Privacy Notice
        </a>
        .
      </p>
    </div>
  </div>
);

class Screen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      identifier: "",
      password: "",
      showPw: false,
      caps: false,
      outcome: null,
      invalidMsg: "",
      countdown: 0,
    };
    this.timer = null;
  }
  componentDidMount() {
    if (this.props.notice)
      this.setState({ outcome: "invalid", invalidMsg: this.props.notice });
  }
  componentWillUnmount() {
    this._gone = true;
    if (this.timer) clearInterval(this.timer);
  }
  startDelay(seconds) {
    if (this.timer) clearInterval(this.timer);
    this.setState({ outcome: "delay", countdown: seconds });
    this.timer = setInterval(() => {
      const n = Math.max(0, this.state.countdown - 1);
      this.setState({ countdown: n });
      if (n === 0) {
        clearInterval(this.timer);
        this.timer = null;
        this.setState({ outcome: null });
      }
    }, 1000);
  }
  async realSignIn(id, password) {
    this.setState({ outcome: "working" });
    let res;
    try {
      res = await this.props.onSignIn(id, password);
    } catch (err) {
      res = { error: "unavailable" };
    }
    if (this._gone) return;
    if (res.ok) {
      this.setState({ outcome: "success" });
      return;
    }
    const notes = {
      wrong: "wrong",
      pending: "pending",
      suspended: "suspended",
    };
    if (res.error === "delay") return this.startDelay(res.retryAfter || 30);
    if (notes[res.error]) return this.setState({ outcome: notes[res.error] });
    const msg = {
      invalid: "Enter both your student number or email and your password.",
      unconfirmed:
        "Confirm your email first. We sent you a link when you registered.",
      no_account:
        "That Google account is not linked to an approved account. You can register, or sign in with your password.",
      unavailable_student:
        "Signing in with a student number is not switched on yet. Use your email address for now.",
      unavailable:
        "We could not reach the sign-in service. Check your connection and try again.",
    }[res.error];
    this.setState({
      outcome: "invalid",
      invalidMsg: msg || "Something went wrong. Please try again.",
    });
  }
  idKind(v) {
    if (!v) return "empty";
    if (v.toLowerCase() === "admin") return "admin";
    if (/^\d+$/.test(v)) return v.length === 8 ? "student" : "digits";
    if (v.indexOf("@") > -1)
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "email" : "typing";
    return "bad";
  }
  renderVals() {
    const s = this.state;
    const v = (s.identifier || "").trim();
    const kind = this.idKind(v);
    const hints = {
      empty: ["Enter your 8-digit student number or your email.", "#8a99b3"],
      student: ["Student number detected.", "#3ddc97"],
      digits: [
        v.length + " of 8 digits. Student numbers have exactly 8.",
        "#ffd98a",
      ],
      email: ["Email address detected.", "#3ddc97"],
      typing: ["Keep typing your full email address.", "#8a99b3"],
      admin: ["Setup account sign-in.", "#8a99b3"],
      bad: [
        "Use an 8-digit student number, or an email containing @.",
        "#ffd98a",
      ],
    };
    const hint = hints[kind];
    const locked = s.countdown > 0;
    const o = s.outcome;
    return {
      identifier: s.identifier,
      password: s.password,
      idHint: hint[0],
      idHintColor: hint[1],
      pwType: s.showPw ? "text" : "password",
      pwToggleText: s.showPw ? "Hide" : "Show",
      pwToggleLabel: s.showPw ? "Hide password" : "Show password",
      caps: s.caps,
      showInvalid: o === "invalid",
      invalidMsg: s.invalidMsg,
      showWrong: o === "wrong",
      showDelay: o === "delay",
      showPending: o === "pending",
      showSuspended: o === "suspended",
      showSuccess: o === "success",
      countdown: s.countdown,
      buttonDisabled: locked || o === "success" || o === "working",
      buttonLabel:
        o === "working"
          ? "Checking..."
          : o === "success"
            ? "Signing you in..."
            : locked
              ? "Try again in " + s.countdown + "s"
              : "Sign in",
      onIdentifier: (e) =>
        this.setState({ identifier: e.target.value, outcome: null }),
      onPassword: (e) =>
        this.setState({ password: e.target.value, outcome: null }),
      onKey: (e) => {
        if (e.getModifierState)
          this.setState({ caps: e.getModifierState("CapsLock") });
      },
      togglePw: () => this.setState({ showPw: !this.state.showPw }),
      onSubmit: (e) => {
        e.preventDefault();
        const id = (this.state.identifier || "").trim();
        const k = this.idKind(id);
        if (!id || !this.state.password) {
          this.setState({
            outcome: "invalid",
            invalidMsg:
              "Enter both your student number or email and your password.",
          });
          return;
        }
        if (k === "digits" || k === "bad" || k === "typing") {
          this.setState({
            outcome: "invalid",
            invalidMsg:
              "That does not look like a student number (8 digits) or an email address.",
          });
          return;
        }
        if (this.props.onSignIn) {
          this.realSignIn(id, this.state.password);
          return;
        }
        const out = this.props.demoState || "wrong";
        this.setState({ outcome: out });
        if (out === "delay") {
          if (this.timer) clearInterval(this.timer);
          this.setState({ countdown: 30 });
          this.timer = setInterval(() => {
            const n = Math.max(0, this.state.countdown - 1);
            this.setState({ countdown: n });
            if (n === 0) {
              clearInterval(this.timer);
              this.timer = null;
              this.setState({ outcome: null });
            }
          }, 1000);
        }
      },
    };
  }

  render() {
    const v = this.renderVals();
    return this.props.compact
      ? renderMobile(v, this.props)
      : renderDesktop(v, this.props);
  }
}

export default Screen;
