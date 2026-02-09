/**
 * ERP/BSC_CMB iframe 연동용 userId 저장소.
 *
 * - 부모 프레임이 iframe URL에 `?userId=xxx`를 붙여 전달한다.
 * - WiseMapping 프론트는 최초 로드 시 userId를 읽어 sessionStorage에 저장하고,
 *   이후 API 호출 시 `X-User-Id` 헤더로 항상 전달한다. (서버 세션/JWT 미사용)
 */
export const ERP_USER_ID_STORAGE_KEY = 'erp.userId';

export function captureErpUserIdFromUrl(urlStr?: string): string | null {
  try {
    const url = new URL(urlStr || window.location.href);
    const userId = url.searchParams.get('userId');
    if (userId && userId.trim().length > 0) {
      const normalized = userId.trim();
      window.sessionStorage.setItem(ERP_USER_ID_STORAGE_KEY, normalized);
      return normalized;
    }
  } catch {
    // ignore
  }
  return null;
}

export function getErpUserId(): string | null {
  const v = window.sessionStorage.getItem(ERP_USER_ID_STORAGE_KEY);
  return v && v.trim().length > 0 ? v : null;
}

export function clearErpUserId(): void {
  window.sessionStorage.removeItem(ERP_USER_ID_STORAGE_KEY);
}

