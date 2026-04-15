// © 2026 김용현
import { useState } from 'react';
import { type GraphType } from '../data/types';

const STORAGE_KEY = 'geographer.announcement.maps-2026-04.dismissed';

export function shouldShowAnnouncement(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== '1';
  } catch {
    return true;
  }
}

interface Props {
  onClose: () => void;
  onNavigate: (type: GraphType) => void;
}

export default function AnnouncementModal({ onClose, onNavigate }: Props) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
    }
    onClose();
  };

  const go = (type: GraphType) => {
    if (dontShowAgain) {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
    }
    onNavigate(type);
    onClose();
  };

  return (
    <div style={styles.backdrop} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.badge}>NEW</span>
          <h2 style={styles.title}>통계지도 4종이 추가되었습니다</h2>
        </div>

        <p style={styles.lead}>
          수능·모의고사 출제에 자주 쓰이는 <strong>통계지도 4종</strong>을 GeoGrapher에서 바로 제작할 수 있습니다.
          시·도, 시·군·구, 시·군·구(광역 통합) 단위를 지원하며 고해상도 PNG로 내보낼 수 있습니다.
        </p>

        <div style={styles.cards}>
          <button style={styles.card} onClick={() => go('choropleth')}>
            <div style={styles.cardTitle}>단계구분도</div>
            <div style={styles.cardDesc}>행정구역을 등급별 색상·패턴으로 채워 분포를 표현</div>
          </button>
          <button style={styles.card} onClick={() => go('symbolmap')}>
            <div style={styles.cardTitle}>도형표현도</div>
            <div style={styles.cardDesc}>각 지역에 파이/막대 심볼을 배치하여 복수 항목 비교</div>
          </button>
          <button style={styles.card} onClick={() => go('isoline')}>
            <div style={styles.cardTitle}>등치선도</div>
            <div style={styles.cardDesc}>지점 관측값을 IDW 보간해 등치선 생성, 주곡선/간곡선</div>
          </button>
          <button style={styles.card} onClick={() => go('flowmap')}>
            <div style={styles.cardTitle}>유선도</div>
            <div style={styles.cardDesc}>지역 간 이동·물류를 값 비례 화살표로 표현</div>
          </button>
        </div>

        <div style={styles.footer}>
          <label style={styles.checkRow}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>다시 열지 않기</span>
          </label>
          <button onClick={handleClose} style={styles.closeBtn}>닫기</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(17, 24, 39, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 16,
  },
  modal: {
    background: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 520,
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
    fontSize: 11,
    fontWeight: 800,
    color: '#fff',
    background: '#DC2626',
    padding: '3px 9px',
    borderRadius: 10,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 18,
    fontWeight: 800,
    color: '#1B2A4A',
    margin: 0,
  },
  lead: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 1.7,
    marginTop: 4,
    marginBottom: 16,
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 16,
  },
  card: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    background: '#F9FAFB',
    cursor: 'pointer',
    font: 'inherit',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1B2A4A',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 1.5,
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
    padding: '8px 18px',
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    background: '#1B2A4A',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
};
