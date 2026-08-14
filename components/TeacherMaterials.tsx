"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import styles from "./TeacherMaterials.module.css";

type MaterialId = "nurse" | "emt";

const MATERIALS: Array<{
  id: MaterialId;
  eyebrow: string;
  title: string;
  description: string;
}> = [
  {
    id: "nurse",
    eyebrow: "CAREER GUIDE 01",
    title: "간호사 진로 교안",
    description: "관찰·판단·처치·협업과 면허 취득 경로",
  },
  {
    id: "emt",
    eyebrow: "CAREER GUIDE 02",
    title: "응급구조사 진로 교안",
    description: "현장 평가·응급처치·이송·인계와 자격 경로",
  },
];

export function TeacherMaterials() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"verify" | MaterialId | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !unlocked) passwordRef.current?.focus();
  }, [open, unlocked]);

  function close() {
    setOpen(false);
    setPassword("");
    setUnlocked(false);
    setError("");
    setBusy(null);
  }

  async function postMaterial(material: MaterialId | "verify") {
    return fetch(`/api/teacher-materials/${material}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ password }),
    });
  }

  async function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length !== 4 || busy !== null) return;

    setBusy("verify");
    setError("");

    try {
      const response = await postMaterial("verify");
      if (!response.ok) {
        setError("비밀번호가 맞지 않습니다.");
        return;
      }
      setUnlocked(true);
    } catch {
      setError("교사용 자료 서버에 연결하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownload(material: MaterialId) {
    if (!unlocked || busy !== null) return;

    setBusy(material);
    setError("");

    try {
      const response = await postMaterial(material);
      if (!response.ok) {
        setUnlocked(false);
        setError("접근 권한을 다시 확인해주세요.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = material === "nurse"
        ? "골든타임_간호사_진로교안.pptx"
        : "골든타임_응급구조사_진로교안.pptx";
      link.href = url;
      link.download = fileName;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("파일을 내려받지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
        <span>교사용 자료</span>
        <small>LOCKED</small>
      </button>

      {open ? (
        <div className={styles.backdrop} role="presentation" onMouseDown={close}>
          <section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-material-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.header}>
              <div>
                <span>TEACHER ACCESS</span>
                <h2 id="teacher-material-title">교사용 진로 교안</h2>
                <p>수업 진행자 전용 자료입니다.</p>
              </div>
              <button type="button" className={styles.close} onClick={close} aria-label="교사용 자료 닫기">×</button>
            </header>

            {!unlocked ? (
              <form className={styles.passwordForm} onSubmit={handleUnlock}>
                <label htmlFor="teacher-password">교사용 비밀번호</label>
                <input
                  ref={passwordRef}
                  id="teacher-password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value.replace(/\D/g, "").slice(0, 4));
                    setError("");
                  }}
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  autoComplete="off"
                  aria-describedby={error ? "teacher-password-error" : "teacher-password-help"}
                />
                <p id="teacher-password-help">비밀번호 확인 후에만 교안을 열 수 있습니다.</p>
                {error ? <p id="teacher-password-error" className={styles.error} role="alert">{error}</p> : null}
                <button type="submit" className={styles.unlock} disabled={password.length !== 4 || busy !== null}>
                  {busy === "verify" ? "확인 중" : "교안 열기"}
                </button>
              </form>
            ) : (
              <div className={styles.materialList}>
                <p className={styles.accessGranted}>ACCESS GRANTED · 수업용 PPT를 내려받으세요.</p>
                {MATERIALS.map((material) => (
                  <article key={material.id} className={styles.material}>
                    <div>
                      <span>{material.eyebrow}</span>
                      <h3>{material.title}</h3>
                      <p>{material.description}</p>
                    </div>
                    <button type="button" onClick={() => handleDownload(material.id)} disabled={busy !== null}>
                      {busy === material.id ? "준비 중" : "PPT 받기"}
                    </button>
                  </article>
                ))}
                {error ? <p className={styles.error} role="alert">{error}</p> : null}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
