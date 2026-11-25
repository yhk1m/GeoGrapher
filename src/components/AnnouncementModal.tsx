// © 2026 김용현
import { useEffect, useRef, useState } from 'react';
import { dismissAnnouncement } from './announcement';
import { withUi } from '../styles/ui';

interface Props {
  onClose: () => void;
}

export default function AnnouncementModal({ onClose }: Props) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => {
    if (dontShowAgain) dismissAnnouncement();
    onClose();
  };

  // Esc 로 닫기 — 최신 체크 상태를 읽도록 ref 로 넘긴다
  const closeLatest = useRef(handleClose);
  useEffect(() => { closeLatest.current = handleClose; });
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLatest.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={styles.backdrop} onClick={handleClose}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-title"
      >
        <div style={styles.header}>
          <span style={styles.badge}>업데이트</span>
          <h2 id="announcement-title" style={styles.title}>그래프가 수능 시험지 양식으로 바뀌었어요</h2>
        </div>

        <p style={styles.lead}>
          이제 그래프를 <strong>csat-chart.js 2.1</strong>로 그려요. 평가원 시험지에서 직접 잰
          글꼴과 선 굵기를 따라서, 실제 수능 그래프와 훨씬 비슷해졌어요.
        </p>

        <ul style={styles.list}>
          <li>
            예전 모양이 필요하면 오른쪽 입력 창 맨 위 <strong>「그림 양식」</strong>에서
            <strong> 「옛 모양(1.x)」</strong>을 고르세요.
          </li>
          <li>
            새 옵션도 생겼어요 — <strong>범례 오른쪽</strong> 자리, 꺾은선 이름을 오른쪽에 한 줄로
            세우는 <strong>「오른쪽 줄」</strong>과 <strong>열린 틀(L자)</strong>, <strong>눈금 방향</strong>(안쪽·바깥).
          </li>
          <li>
            시험지와 가장 가깝게 보려면 한컴오피스 글꼴(<strong>HY신명조·HY중고딕</strong>)이
            설치되어 있어야 해요. 없으면 Noto 글꼴로 그려져요.
          </li>
        </ul>

        <div style={styles.footer}>
          <label style={styles.checkRow}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>다시 보지 않기</span>
          </label>
          <button ref={closeRef} onClick={handleClose} style={styles.closeBtn}>닫기</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = withUi({
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(17, 24, 39, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
    padding: 16,
  },
  modal: {
    background: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90vh',
    overflow: 'auto',
    padding: '24px 26px 20px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
    boxSizing: 'border-box' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  badge: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 800,
    color: '#fff',
    background: '#1B2A4A',
    padding: '3px 9px',
    borderRadius: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: 800,
    color: '#1B2A4A',
    margin: 0,
    lineHeight: 1.4,
  },
  lead: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 1.7,
    marginTop: 4,
    marginBottom: 12,
  },
  list: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 1.7,
    margin: '0 0 16px',
    paddingLeft: 18,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid #F3F4F6',
    paddingTop: 12,
    marginTop: 4,
  },
  checkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#6B7280',
    cursor: 'pointer',
  },
  closeBtn: {
    height: 40,
    padding: '0 16px',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--on-accent)',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--r-control)',
    cursor: 'pointer',
  },
});
