import { SentSMSRepository } from "amerykahospital-personalizedadvice-businesslogic";

import { FirestoreEquivalent } from "../../types/FirestoreEquivalent";

import { SentSMSRepositoryImpl } from "./SentSMSRepositoryImpl";

export namespace SentSMSRepositoryFactory {
    export function make(firestore: FirestoreEquivalent): SentSMSRepository {
        return new SentSMSRepositoryImpl(firestore);
    }
}
