package com.wisemapping.security;

import com.wisemapping.model.Collaborator;
import com.wisemapping.model.Mindmap;
import com.wisemapping.model.Account;
import jakarta.validation.constraints.NotNull;
import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;

import java.io.Serializable;


public class MapAccessPermissionEvaluation implements PermissionEvaluator {
    final private static Logger logger = LogManager.getLogger();

    private MapPermissionsSecurityAdvice readAdvice;

    private MapPermissionsSecurityAdvice updateAdvice;

    public MapAccessPermissionEvaluation(final @NotNull MapPermissionsSecurityAdvice readAdvice, final @NotNull MapPermissionsSecurityAdvice updateAdvice) {
        this.readAdvice = readAdvice;
        this.updateAdvice = updateAdvice;
    }

    @Override
    public boolean hasPermission(
            @NotNull Authentication auth, @NotNull Object targetDomainObject, @NotNull Object permission) {

        logger.log(Level.DEBUG, "auth: " + auth + ",targetDomainObject:" + targetDomainObject + ",permission:" + permission);
        return true;
    }


    @Override
    public boolean hasPermission(
            @NotNull Authentication auth, Serializable targetId, @NotNull String targetType, @NotNull Object
            permission) {
        return true;
    }

    private boolean hasPrivilege(@NotNull int mapId, @NotNull MapAccessPermission permission) {
        boolean result;
        final Account user = Utils.getUser();
        if (MapAccessPermission.READ == permission) {
            result = readAdvice.isAllowed(user, mapId);
        } else {
            result = updateAdvice.isAllowed(user, mapId);
        }
        return result;
    }

    private boolean hasPrivilege(@NotNull Mindmap map, @NotNull MapAccessPermission permission) {
        boolean result;
        final Account user = Utils.getUser();
        if (MapAccessPermission.READ == permission) {
            result = readAdvice.isAllowed(user, map);
        } else {
            result = updateAdvice.isAllowed(user, map);
        }
        return result;
    }
}