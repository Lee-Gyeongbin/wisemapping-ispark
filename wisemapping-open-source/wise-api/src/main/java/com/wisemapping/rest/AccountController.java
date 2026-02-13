/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 *   It is basically the Apache License, Version 2.0 (the "License") plus the
 *   "powered by wisemapping" text requirement on every single page;
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the license at
 *
 *       https://github.com/wisemapping/wisemapping-open-source/blob/main/LICENSE.md
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

package com.wisemapping.rest;

import com.wisemapping.exceptions.PasswordTooLongException;
import com.wisemapping.exceptions.PasswordTooShortException;
import com.wisemapping.exceptions.PasswordChangeNotAllowedException;
import com.wisemapping.exceptions.WiseMappingException;
import com.wisemapping.model.Collaboration;
import com.wisemapping.model.MindmapLabel;
import com.wisemapping.model.Mindmap;
import com.wisemapping.model.Account;
import com.wisemapping.rest.model.RestUser;
import com.wisemapping.security.Utils;
import com.wisemapping.service.LabelService;
import com.wisemapping.service.MindmapService;
import com.wisemapping.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restful/account")
public class AccountController {
    @Qualifier("userService")
    @Autowired
    private UserService userService;

    @Qualifier("mindmapService")
    @Autowired
    private MindmapService mindmapService;

    @Qualifier("labelService")
    @Autowired
    private LabelService labelService;

    @Value("${app.admin.user:}")
    private String adminUser;

    private boolean isAdmin(String email) {
        return email != null && adminUser != null && email.trim().endsWith(adminUser);
    }

    /**
     * Resolve current user from CurrentUserHolder or from request (X-User-Id header / userId param).
     * Fallback for ERP integration when filter did not set the user.
     */
    private Account resolveUser(HttpServletRequest request) {
        Account user = Utils.getUser();
        if (user != null) {
            return user;
        }
        String userId = request.getHeader("X-User-Id");
        if (userId == null || userId.isBlank()) {
            userId = request.getParameter("userId");
        }
        if (userId != null && !userId.isBlank()) {
            return userService.findOrCreateAccountByEmail(userId.trim().toLowerCase());
        }
        throw new IllegalStateException("User could not be retrieved (missing userId)");
    }

    @RequestMapping(method = RequestMethod.PUT, value = "/password", consumes = {"text/plain"})
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    public void changePassword(@RequestBody String password, HttpServletRequest request) throws PasswordTooShortException, PasswordTooLongException, PasswordChangeNotAllowedException {
        if (password == null) {
            throw new IllegalArgumentException("Password can not be null");
        }

        if (password.length() < Account.MIN_PASSWORD_LENGTH_SIZE) {
            throw new PasswordTooShortException();
        }

        if (password.length() > Account.MAX_PASSWORD_LENGTH_SIZE) {
            throw new PasswordTooLongException();
        }

        final Account user = resolveUser(request);
        
        // Check if password changes are allowed for this user's authentication type
        if (!user.isPasswordChangeAllowed()) {
            throw new PasswordChangeNotAllowedException();
        }
        
        user.setPassword(password);
        userService.changePassword(user);
    }

    @RequestMapping(method = RequestMethod.GET, value = "", produces = {"application/json"})
    public RestUser fetchAccount(HttpServletRequest request) {
        final Account user = resolveUser(request);
        return new RestUser(user, isAdmin(user.getEmail()));
    }

    @RequestMapping(method = RequestMethod.PUT, value = "/firstname", consumes = {"text/plain"})
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    public void changeFirstname(@RequestBody String firstname, HttpServletRequest request) {
        if (firstname == null) {
            throw new IllegalArgumentException("Firstname can not be null");
        }

        final Account user = resolveUser(request);
        user.setFirstname(firstname);
        userService.updateUser(user);
    }

    @RequestMapping(method = RequestMethod.PUT, value = "/lastname", consumes = {"text/plain"})
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    public void changeLastName(@RequestBody String lastname, HttpServletRequest request) {
        if (lastname == null) {
            throw new IllegalArgumentException("lastname can not be null");

        }
        final Account user = resolveUser(request);
        user.setLastname(lastname);
        userService.updateUser(user);
    }

    @RequestMapping(method = RequestMethod.PUT, value = "/locale", consumes = {"text/plain"})
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    public void changeLanguage(@RequestBody String language, HttpServletRequest request) {
        if (language == null) {
            throw new IllegalArgumentException("language can not be null");

        }

        final Account user = resolveUser(request);
        user.setLocale(language);
        userService.updateUser(user);
    }

    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    @RequestMapping(method = RequestMethod.DELETE, value = "")
    public void deleteUser(HttpServletRequest request) throws WiseMappingException {
        // Delete collaborations ...
        final Account user = resolveUser(request);
        final List<Collaboration> collaborations = mindmapService.findCollaborations(user);
        final java.util.Set<Integer> processedMindmapIds = new java.util.HashSet<>();
        
        for (Collaboration collaboration : collaborations) {
            final Mindmap mindmap = collaboration.getMindMap();
            // Skip if this mindmap was already processed (user was creator and mindmap was fully deleted)
            if (processedMindmapIds.contains(mindmap.getId())) {
                continue;
            }
            
            // Track mindmaps where user is creator (will be fully deleted)
            final boolean isCreator = mindmap.getCreator().identityEquality(user);
            if (isCreator) {
                processedMindmapIds.add(mindmap.getId());
            }
            
            mindmapService.removeMindmap(mindmap, user);
        }

        // Delete labels ....
        final List<MindmapLabel> labels = labelService.getAll(user);
        labels.forEach(l -> {
            try {
                labelService.removeLabel(l, user);
            } catch (WiseMappingException e) {
                throw new IllegalStateException(e);
            }
        });

        // Finally, delete user ...
        userService.removeUser(user);
    }
}
