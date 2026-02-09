package com.wisemapping.security;

import com.wisemapping.model.Account;
import org.jetbrains.annotations.Nullable;

/**
 * Stateless current-user holder for ERP iframe integration.
 *
 * <p>WiseMapping을 부모 프레임(ERP/BSC_CMB)에서 iframe으로 호출하는 구조에서는
 * 서버 간 HttpSession 공유가 불가능하므로, 요청마다 전달된 userId로 현재 사용자를 결정한다.</p>
 *
 * <p>이 holder는 ThreadLocal 기반이며, 반드시 요청 처리 종료 시 clear 되어야 한다.</p>
 */
public final class CurrentUserHolder {
    private static final ThreadLocal<Account> CURRENT = new ThreadLocal<>();

    private CurrentUserHolder() {}

    public static void set(@Nullable Account account) {
        if (account == null) {
            CURRENT.remove();
        } else {
            CURRENT.set(account);
        }
    }

    @Nullable
    public static Account get() {
        return CURRENT.get();
    }

    public static void clear() {
        CURRENT.remove();
    }
}

