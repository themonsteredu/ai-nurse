"use client";

/**
 * 앱 전체에서 쓰는 큰 버튼.
 *
 * 태블릿에서 초등학생 손가락으로 눌러야 하므로 기본 크기가 큽니다.
 * (최소 크기는 styles/design-tokens.css 의 --touch-target-min 으로 정해져 있습니다)
 *
 * 어떤 데이터를 받나:
 *  - variant: 버튼 종류 (primary=주요, secondary=보조, ghost=조용한)
 *  - fullWidth: 가로를 꽉 채울지
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./PrimaryButton.module.css";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
  children: ReactNode;
};

export function PrimaryButton({
  variant = "primary",
  fullWidth = false,
  className,
  children,
  ...rest
}: PrimaryButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classNames} {...rest}>
      {children}
    </button>
  );
}
