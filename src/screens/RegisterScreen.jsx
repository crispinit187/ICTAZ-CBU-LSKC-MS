import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AuthPage,
  BackLink,
  Banner,
  Card,
  CheckBox,
  Eyebrow,
  Field,
  GoogleButton,
  PasswordInput,
  PasswordRules,
  PrimaryButton,
  TextInput,
  inputStyle,
} from "../components/auth/AuthParts.jsx";
import ConfirmDialog, { UnsavedGuard } from "../components/ConfirmDialog.jsx";
import { passwordChecks } from "../lib/password.js";
import { findGroup, normalise, suggest } from "../lib/programs.js";

const EMPTY = {
  name: "",
  studentNumber: "",
  email: "",
  phone: "",
  program: "",
  year: "",
  semester: "",
  password: "",
  confirm: "",
  accept: false,
};

function validate(f, google) {
  const e = {};
  if (f.name.trim().length < 2) e.name = "Enter your full name.";
  if (!/^\d{8}$/.test(f.studentNumber))
    e.studentNumber = "A student number is exactly 8 digits.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()))
    e.email = "Enter a valid email address.";
  if (f.phone.trim() && !/^\+?[0-9 ]{9,15}$/.test(f.phone.trim()))
    e.phone = "Use digits only, for example +260 97 123 4567.";
  if (!normalise(f.program))
    e.program = "Enter your programme, for example Computer Engineering.";
  if (!f.year) e.year = "Choose your year of study.";
  if (!f.semester) e.semester = "Choose your semester.";
  if (!google) {
    const bad = passwordChecks(f.password, {
      studentNumber: f.studentNumber,
      email: f.email,
    }).some((c) => !c.ok);
    if (bad) e.password = "Your password does not meet all the rules yet.";
    if (f.confirm !== f.password) e.confirm = "The two passwords do not match.";
  }
  if (!f.accept)
    e.accept =
      "You need to accept the Terms of Use and Privacy Notice to register.";
  return e;
}

function ProgramField({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const list = suggest(value);
  const group = findGroup(value);
  const showList = open && list.length > 0;
  const pick = (p) => {
    onChange(p.name);
    setOpen(false);
    setActive(-1);
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(list.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && showList && active >= 0) {
      e.preventDefault();
      pick(list[active]);
    } else if (e.key === "Escape") setOpen(false);
  };
  let hint =
    "Type it your own way. We group spelling variations so reports stay accurate.";
  if (normalise(value)) {
    if (group && group.name.toLowerCase() !== value.trim().toLowerCase())
      hint = `Grouped with ${group.name}. Your spelling is kept exactly as typed.`;
    else if (!group && value.trim().length >= 3)
      hint =
        "This looks like a new programme. An Administrator will review it.";
  }
  return (
    <Field id="program" label="Programme" error={error} hint={hint}>
      <div style={{ position: "relative" }}>
        <TextInput
          id="program"
          value={value}
          error={error}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls="program-list"
          aria-autocomplete="list"
          placeholder="e.g. Computer Engineering"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKey}
        />
        {showList && (
          <ul
            id="program-list"
            role="listbox"
            style={{
              position: "absolute",
              zIndex: 5,
              left: 0,
              right: 0,
              top: "100%",
              margin: "4px 0 0",
              padding: "4px 0",
              listStyle: "none",
              background: "#0d0d0d",
              border: "1px solid #333333",
              borderRadius: 10,
              boxShadow: "0 14px 40px rgba(0,0,0,0.6)",
            }}
          >
            {list.map((p, i) => (
              <li
                key={p.name}
                role="option"
                aria-selected={i === active}
                className="opt"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(p);
                }}
              >
                <span>{p.name}</span>
                <span style={{ color: "#75859e", fontSize: 12 }}>
                  {p.count} members
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}

// While someone reads the Terms and comes back, keep what they typed. Passwords and the
// acceptance tick are never saved. The draft lives only in this browser tab.
const DRAFT = "ictaz-register-draft";
const loadDraft = () => {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT)) || {};
  } catch {
    return {};
  }
};
const saveDraft = (d) => {
  try {
    sessionStorage.setItem(DRAFT, JSON.stringify(d));
  } catch {
    /* storage unavailable: the form still works */
  }
};
const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT);
  } catch {
    /* ignore */
  }
};

export default function RegisterScreen() {
  const nav = useNavigate();
  const [f, setF] = useState(() => ({
    ...EMPTY,
    ...(loadDraft().f || {}),
    password: "",
    confirm: "",
    accept: false,
  }));
  const [google, setGoogle] = useState(() => !!loadDraft().google);
  const [confirm, setConfirm] = useState(null);
  const [touched, setTouched] = useState({});
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);
  const top = useRef(null);

  const set = (k) => (e) =>
    setF({
      ...f,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  const blur = (k) => () => setTouched({ ...touched, [k]: true });
  useEffect(() => {
    if (done) return;
    saveDraft({
      f: { ...f, password: "", confirm: "", accept: false },
      google,
    });
  }, [f, google, done]);
  const errs = validate(f, google);
  const show = (k) => (tried || touched[k]) && errs[k];
  const dirty = !done && JSON.stringify(f) !== JSON.stringify(EMPTY);

  const useGoogle = () => {
    setGoogle(true);
    setF({
      ...f,
      name: "Sample Member",
      email: "sample.member@gmail.com",
      password: "",
      confirm: "",
    });
  };
  const clearGoogle = () => {
    setGoogle(false);
    setF({ ...f, name: "", email: "" });
  };
  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    if (Object.keys(errs).length) {
      const first = document.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    clearDraft();
    setDone(true);
    window.scrollTo(0, 0);
  };

  if (done) {
    return (
      <AuthPage width={520}>
        <Card
          className="rise"
          style={{ textAlign: "center", padding: "40px 28px" }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              margin: "0 auto",
              borderRadius: "50%",
              background: "rgba(84,173,255,0.12)",
              border: "2px solid rgba(84,173,255,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#54adff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </div>
          <h1
            style={{
              margin: "22px 0 10px",
              fontSize: 28,
              letterSpacing: "-1px",
            }}
          >
            Registration received
          </h1>
          <p
            style={{
              margin: 0,
              color: "#aebfda",
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            Thanks, {f.name.split(" ")[0]}. Your account is{" "}
            <strong style={{ color: "#fff" }}>waiting for approval</strong>. An
            Administrator will check your details, and we will email {f.email}{" "}
            when it is done.
          </p>
          <p
            style={{
              margin: "14px 0 26px",
              color: "#75859e",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            You cannot sign in until you are approved.{" "}
            {google
              ? "When you are approved, sign in with Google using this same email."
              : "When you are approved, sign in with your student number or email."}
          </p>
          <PrimaryButton type="button" onClick={() => nav("/login")}>
            Back to sign in
          </PrimaryButton>
        </Card>
      </AuthPage>
    );
  }

  return (
    <AuthPage width={620}>
      <UnsavedGuard active={dirty} />
      <BackLink
        label="Back to sign in"
        to="/login"
        guard={(go) =>
          dirty
            ? setConfirm({
                title: "Discard what you have entered?",
                body: "Your registration has not been submitted. If you go back, the details you typed are cleared.",
                confirmLabel: "Discard and go back",
                cancelLabel: "Keep editing",
                tone: "warning",
                run: () => {
                  clearDraft();
                  go();
                },
              })
            : go()
        }
      />
      <div ref={top} />
      <Eyebrow>NEW MEMBER</Eyebrow>
      <h1
        style={{
          margin: "10px 0 8px",
          fontSize: 38,
          lineHeight: 1.05,
          letterSpacing: "-1.5px",
        }}
      >
        Create your account
      </h1>
      <p
        style={{
          margin: "0 0 24px",
          color: "#aebfda",
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        Register once with your student details. An Administrator approves new
        accounts, usually within a day, before you can sign in.
      </p>
      <Card>
        {!google ? (
          <>
            <GoogleButton onClick={useGoogle}>Fill in with Google</GoogleButton>
            <div
              style={{
                margin: "22px 0",
                display: "flex",
                alignItems: "center",
                gap: 14,
                color: "#75859e",
                fontSize: 12,
                letterSpacing: 1,
              }}
            >
              <div
                style={{
                  flexGrow: 1,
                  height: 1,
                  background: "rgba(255,255,255,0.12)",
                }}
              />
              <span>OR USE A PASSWORD</span>
              <div
                style={{
                  flexGrow: 1,
                  height: 1,
                  background: "rgba(255,255,255,0.12)",
                }}
              />
            </div>
          </>
        ) : (
          <Banner tone="ok">
            Your name and email came from Google. Finish the details below.
            Google does not approve your account, an Administrator still does.{" "}
            <button
              type="button"
              className="link-btn"
              onClick={clearGoogle}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#54adff",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Not you? Start again
            </button>
          </Banner>
        )}

        <form onSubmit={submit} noValidate>
          <Field id="name" label="Full name" error={show("name")}>
            <TextInput
              id="name"
              value={f.name}
              onChange={set("name")}
              onBlur={blur("name")}
              error={show("name")}
              autoComplete="name"
              readOnly={google}
            />
          </Field>
          <Field
            id="studentNumber"
            label="Student number"
            error={show("studentNumber")}
            hint="8 digits. You will use it to sign in."
          >
            <TextInput
              id="studentNumber"
              inputMode="numeric"
              maxLength={8}
              value={f.studentNumber}
              onChange={(e) =>
                setF({ ...f, studentNumber: e.target.value.replace(/\D/g, "") })
              }
              onBlur={blur("studentNumber")}
              error={show("studentNumber")}
              placeholder="e.g. 23144450"
            />
          </Field>
          <Field
            id="email"
            label="Email"
            error={show("email")}
            hint={
              google
                ? "From your Google account. This is the email you will use with Google."
                : "Use a personal email you will keep after you leave campus."
            }
          >
            <TextInput
              id="email"
              type="email"
              value={f.email}
              onChange={set("email")}
              onBlur={blur("email")}
              error={show("email")}
              autoComplete="email"
              readOnly={google}
              autoCapitalize="none"
              spellCheck="false"
            />
          </Field>
          <Field id="phone" label="Phone" optional error={show("phone")}>
            <TextInput
              id="phone"
              type="tel"
              value={f.phone}
              onChange={set("phone")}
              onBlur={blur("phone")}
              error={show("phone")}
              autoComplete="tel"
              placeholder="+260 97 123 4567"
            />
          </Field>
          <ProgramField
            value={f.program}
            onChange={(v) => setF({ ...f, program: v })}
            error={show("program")}
          />
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 160px" }}>
              <Field id="year" label="Year of study" error={show("year")}>
                <select
                  id="year"
                  className="field"
                  value={f.year}
                  onChange={set("year")}
                  onBlur={blur("year")}
                  aria-invalid={show("year") ? "true" : undefined}
                  aria-describedby="year-msg"
                  style={inputStyle}
                >
                  <option value="">Choose</option>
                  {[1, 2, 3, 4, 5].map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <Field id="semester" label="Semester" error={show("semester")}>
                <select
                  id="semester"
                  className="field"
                  value={f.semester}
                  onChange={set("semester")}
                  onBlur={blur("semester")}
                  aria-invalid={show("semester") ? "true" : undefined}
                  aria-describedby="semester-msg"
                  style={inputStyle}
                >
                  <option value="">Choose</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </Field>
            </div>
          </div>

          {!google ? (
            <>
              <Field id="password" label="Password" error={show("password")}>
                <PasswordInput
                  id="password"
                  value={f.password}
                  onChange={set("password")}
                  onBlur={blur("password")}
                  error={show("password")}
                  autoComplete="new-password"
                />
              </Field>
              <PasswordRules
                password={f.password}
                ctx={{ studentNumber: f.studentNumber, email: f.email }}
              />
              <Field
                id="confirm"
                label="Confirm password"
                error={show("confirm")}
              >
                <PasswordInput
                  id="confirm"
                  value={f.confirm}
                  onChange={set("confirm")}
                  onBlur={blur("confirm")}
                  error={show("confirm")}
                  autoComplete="new-password"
                />
              </Field>
            </>
          ) : (
            <Banner tone="info">
              You are signing up with Google, so you do not need a password. You
              can add one later from your account page if you want to.
            </Banner>
          )}

          <CheckBox
            id="accept"
            checked={f.accept}
            onChange={set("accept")}
            error={show("accept")}
          >
            I have read and accept the <Link to="/terms">Terms of Use</Link> and
            the <Link to="/privacy">Privacy Notice</Link>.
          </CheckBox>

          <div style={{ marginTop: 22 }}>
            <PrimaryButton type="submit">Submit registration</PrimaryButton>
          </div>
        </form>
        <p
          style={{
            margin: "20px 0 0",
            textAlign: "center",
            color: "#aebfda",
            fontSize: 14,
          }}
        >
          Already registered?{" "}
          <Link to="/login" style={{ fontWeight: "bold" }}>
            Sign in
          </Link>
        </p>
      </Card>
      {confirm && (
        <ConfirmDialog
          cfg={confirm}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const c = confirm;
            setConfirm(null);
            c.run();
          }}
        />
      )}
    </AuthPage>
  );
}
