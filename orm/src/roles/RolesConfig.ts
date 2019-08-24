import { RoleKey } from "amerykahospital-personalizedadvice-businesslogic";
import { FirestoreRolesConfiguration } from "firestore-roles";

import { FirestoreCollectionKeys } from "../../../FirestoreCollectionKeys";

export const RolesConfig: FirestoreRolesConfiguration = Object.freeze({
    accountsCollection: FirestoreCollectionKeys.ACCOUNTS_COLLECTION_KEY,
    roleCollectionPrefix: "role_",
    roleRequestsCollectionPrefix: "rolereq_",
    roles: {
        [RoleKey.admin]: {
            manages: [RoleKey.provisioner, RoleKey.medicalprofessional],
        },
        [RoleKey.provisioner]: {
            manages: [RoleKey.medicalprofessional],
        },
        [RoleKey.medicalprofessional]: {
            manages: [],
        },
    },
});
