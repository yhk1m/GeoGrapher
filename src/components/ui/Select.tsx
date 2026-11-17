// © 2026 김용현
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * 고르기 칸 (당토 디자인).
 *
 * `<select>` 의 펼친 목록은 운영체제가 그려서 꾸밀 수 없다. 그래서 목록을 직접 그린다.
 * 쓰는 법은 `<select>` 와 같다: `<Select value onChange={(e) => ...e.target.value} style>`
 * 안에 `<option>` 을 넣는다. 값이 '' 인 disabled 옵션은 안내 글로만 쓴다.
 * 목록은 body 에 그린다(오른쪽 패널이 스크롤 영역이라 그 안에 두면 잘린다).
 * 키보드: 열기(Enter, Space, 위아래), 옮기기(위아래, Home, End, 첫 글자), 고르기(Enter), 닫기(Esc, Tab).
 */

interface OptionData {
  value: string;
  label: ReactNode;
  text: string;
  disabled: boolean;
}

interface SelectProps {
  value: string | number;
  onChange: (e: { target: { value: string } }) => void;
  children: ReactNode;
  style?: CSSProperties;
  disabled?: boolean;
  title?: string;
  'aria-label'?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return '';
}

function readOptions(children: ReactNode): OptionData[] {
  const out: OptionData[] = [];
  const visit = (nodes: ReactNode) => {
    Children.toArray(nodes).forEach((child) => {
      if (!isValidElement(child)) return;
      if (child.type !== 'option') {
        // <>...</> 로 묶인 옵션
        visit((child.props as { children?: ReactNode }).children);
        return;
      }
      const p = (child as ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>).props;
      out.push({
        value: p.value === undefined ? textOf(p.children) : String(p.value),
        label: p.children,
        text: textOf(p.children),
        disabled: !!p.disabled,
      });
    });
  };
  visit(children);
  return out;
}

const MENU_MAX_H = 300;
const GAP = 4;

export default function Select({
  value,
  onChange,
  children,
  style,
  disabled = false,
  title,
  'aria-label': ariaLabel,
  onClick,
}: SelectProps) {
  const all = readOptions(children);
  const placeholder = all.find((o) => o.value === '' && o.disabled);
  const options = all.filter((o) => !(o.value === '' && o.disabled));
  const current = String(value ?? '');
  const selected = options.find((o) => o.value === current);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<{ left: number; top: number; width: number; maxHeight: number; up: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const place = useCallback(() => {
    const t = triggerRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - GAP - 8;
    const above = r.top - GAP - 8;
    const up = below < Math.min(MENU_MAX_H, 160) && above > below;
    const maxHeight = Math.min(MENU_MAX_H, up ? above : below);
    setPos({ left: r.left, top: up ? r.top - GAP : r.bottom + GAP, width: r.width, maxHeight, up });
  }, []);

  const openMenu = () => {
    if (disabled || options.length === 0) return;
    place();
    const i = options.findIndex((o) => o.value === current);
    setActive(i >= 0 ? i : options.findIndex((o) => !o.disabled));
    setOpen(true);
  };

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const choose = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    if (o.value !== current) onChange({ target: { value: o.value } });
    close();
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (listRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (open) listRef.current?.focus({ preventScroll: true });
  }, [open]);
  useLayoutEffect(() => {
    if (!open || active < 0) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
    // optionId 는 baseId 로만 정해진다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  const step = (from: number, dir: 1 | -1) => {
    for (let i = from + dir; i >= 0 && i < options.length; i += dir) {
      if (!options[i].disabled) return i;
    }
    return from;
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openMenu();
    }
  };

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => step(a, 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => step(a, -1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(step(-1, 1)); }
    else if (e.key === 'End') { e.preventDefault(); setActive(step(options.length, -1)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') { close(false); }
    else if (e.key.length === 1) {
      const k = e.key.toLowerCase();
      const n = options.length;
      for (let d = 1; d <= n; d++) {
        const i = (active + d) % n;
        if (!options[i].disabled && options[i].text.trim().toLowerCase().startsWith(k)) { setActive(i); break; }
      }
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="gg-select"
        style={style}
        title={title}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={(e) => {
          onClick?.(e);
          if (open) close();
          else openMenu();
        }}
        onKeyDown={onTriggerKey}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selected ? undefined : 'var(--muted)' }}>
          {selected ? selected.label : placeholder?.label ?? ''}
        </span>
        <svg className="gg-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && pos &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel}
            aria-activedescendant={active >= 0 ? optionId(active) : undefined}
            onKeyDown={onListKey}
            className="gg-select-menu"
            style={{
              left: pos.left,
              top: pos.top,
              minWidth: Math.max(pos.width, 96),
              maxHeight: pos.maxHeight,
              transform: pos.up ? 'translateY(-100%)' : undefined,
            }}
          >
            {options.map((o, i) => {
              const isSel = o.value === current;
              return (
                <li
                  key={`${o.value}-${i}`}
                  id={optionId(i)}
                  role="option"
                  className="gg-select-option"
                  aria-selected={isSel}
                  aria-disabled={o.disabled || undefined}
                  data-active={i === active}
                  onPointerEnter={() => !o.disabled && setActive(i)}
                  onClick={(e) => { e.stopPropagation(); choose(i); }}
                >
                  <span style={{ flex: 1 }}>{o.label}</span>
                  {isSel && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
