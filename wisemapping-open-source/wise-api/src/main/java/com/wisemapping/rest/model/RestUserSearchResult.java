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

package com.wisemapping.rest.model;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.wisemapping.model.Account;
import com.wisemapping.model.Collaborator;
import org.jetbrains.annotations.NotNull;

@JsonAutoDetect(
        fieldVisibility = JsonAutoDetect.Visibility.NONE,
        getterVisibility = JsonAutoDetect.Visibility.PUBLIC_ONLY,
        isGetterVisibility = JsonAutoDetect.Visibility.PUBLIC_ONLY)
public class RestUserSearchResult {
    private String email;
    private String firstname;
    private String lastname;
    private String fullName;
    private boolean isCollaborating;

    public RestUserSearchResult() {
    }

    public RestUserSearchResult(@NotNull Account user, boolean isCollaborating) {
        this.email = user.getEmail();
        this.firstname = user.getFirstname();
        this.lastname = user.getLastname();
        this.fullName = user.getFullName();
        this.isCollaborating = isCollaborating;
    }

    public RestUserSearchResult(@NotNull Collaborator collaborator, boolean isCollaborating) {
        this.email = collaborator.getEmail();
        if (collaborator instanceof Account) {
            final Account account = (Account) collaborator;
            this.firstname = account.getFirstname();
            this.lastname = account.getLastname();
            this.fullName = account.getFullName();
        } else {
            this.firstname = "";
            this.lastname = "";
            this.fullName = collaborator.getEmail();
        }
        this.isCollaborating = isCollaborating;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstname() {
        return firstname;
    }

    public void setFirstname(String firstname) {
        this.firstname = firstname;
    }

    public String getLastname() {
        return lastname;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public boolean isCollaborating() {
        return isCollaborating;
    }

    public void setCollaborating(boolean collaborating) {
        isCollaborating = collaborating;
    }
}
