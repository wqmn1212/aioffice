/**
 * 보고서 본문 렌더러.
 *
 * 모델이 쓴 마크다운을 화면에 올린다. 라이브러리를 들이지 않고 보고서에
 * 실제로 쓰이는 문법(제목·표·목록·인용·굵게)만 처리한다.
 *
 * 중요: dangerouslySetInnerHTML을 쓰지 않는다. 본문은 모델 출력이고, 모델
 * 출력은 우리가 통제하지 못하는 입력이다. React 엘리먼트로만 만들면
 * 마크다운 안에 HTML이 섞여 들어와도 그냥 글자로 보인다.
 */

import type { ReactNode } from "react";

/** **굵게**만 인라인으로 처리한다. 나머지는 원문 그대로 둔다. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={`${keyPrefix}-b${i}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function splitRow(line: string): string[] {
  return line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

/** 구분선(|---|---|)인지. 표의 머리와 몸을 가르는 줄이다. */
function isDivider(line: string): boolean {
  return /^\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes("-");
}

export default function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];

  let paragraph: string[] = [];
  let bullets: string[] = [];
  let numbers: string[] = [];
  let quote: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ");
    blocks.push(<p key={`p${blocks.length}`}>{inline(text, `p${blocks.length}`)}</p>);
    paragraph = [];
  }

  function flushBullets() {
    if (bullets.length === 0) return;
    const items = bullets;
    blocks.push(
      <ul key={`ul${blocks.length}`}>
        {items.map((item, i) => (
          <li key={i}>{inline(item, `ul${blocks.length}-${i}`)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  }

  function flushNumbers() {
    if (numbers.length === 0) return;
    const items = numbers;
    blocks.push(
      <ol key={`ol${blocks.length}`}>
        {items.map((item, i) => (
          <li key={i}>{inline(item, `ol${blocks.length}-${i}`)}</li>
        ))}
      </ol>,
    );
    numbers = [];
  }

  function flushQuote() {
    if (quote.length === 0) return;
    const text = quote.join(" ");
    blocks.push(
      <blockquote key={`q${blocks.length}`}>{inline(text, `q${blocks.length}`)}</blockquote>,
    );
    quote = [];
  }

  /** 문단·목록·인용을 모두 닫는다. 새 블록이 시작될 때 부른다. */
  function flushAll() {
    flushParagraph();
    flushBullets();
    flushNumbers();
    flushQuote();
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (trimmed === "") {
      flushAll();
      continue;
    }

    // 표 — 헤더 줄 다음에 구분선이 와야 표로 본다.
    if (trimmed.startsWith("|") && isDivider(lines[i + 1]?.trim() ?? "")) {
      flushAll();
      const header = splitRow(trimmed);
      const rows: string[][] = [];
      i += 2; // 헤더와 구분선을 건너뛴다.
      while (i < lines.length && lines[i]!.trim().startsWith("|")) {
        rows.push(splitRow(lines[i]!.trim()));
        i++;
      }
      i--; // 바깥 루프가 한 번 더 증가시키므로 되돌린다.

      blocks.push(
        <div className="md-table-wrap" key={`t${blocks.length}`}>
          <table>
            <thead>
              <tr>
                {header.map((cell, c) => (
                  <th key={c}>{inline(cell, `th${c}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>{inline(cell, `td${r}-${c}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushAll();
      const level = heading[1]!.length;
      const text = heading[2]!;
      const key = `h${blocks.length}`;
      // 보고서 안에서 h1은 과하다. 한 단계씩 낮춰 h2~h4로만 쓴다.
      if (level <= 2) blocks.push(<h2 key={key}>{inline(text, key)}</h2>);
      else if (level === 3) blocks.push(<h3 key={key}>{inline(text, key)}</h3>);
      else blocks.push(<h4 key={key}>{inline(text, key)}</h4>);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph();
      flushBullets();
      flushNumbers();
      quote.push(trimmed.slice(2));
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
    if (bullet) {
      flushParagraph();
      flushNumbers();
      flushQuote();
      bullets.push(bullet[1]!);
      continue;
    }

    const numbered = /^\d+\.\s+(.*)$/.exec(trimmed);
    if (numbered) {
      flushParagraph();
      flushBullets();
      flushQuote();
      numbers.push(numbered[1]!);
      continue;
    }

    flushBullets();
    flushNumbers();
    flushQuote();
    paragraph.push(trimmed);
  }

  flushAll();

  return <div className="md">{blocks}</div>;
}
