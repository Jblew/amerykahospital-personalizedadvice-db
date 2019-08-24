/* tslint:disable:max-classes-per-file */
import { FirestoreRolesConfiguration } from "firestore-roles";
import "mocha";

import { RolesConfig } from "./RolesConfig";

describe("roles.config", () => {
    it("Passes FirestoreRolesConfiguration", () => {
        FirestoreRolesConfiguration.validate(RolesConfig);
    });
});
