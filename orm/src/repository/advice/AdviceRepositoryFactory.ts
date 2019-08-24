import { AdviceRepository } from "amerykahospital-personalizedadvice-businesslogic";

import { FirestoreEquivalent } from "../../types/FirestoreEquivalent";

import { AdviceRepositoryImpl } from "./AdviceRepository";

export namespace AdviceRepositoryFactory {
    export function make(firestore: FirestoreEquivalent): AdviceRepository {
        return new AdviceRepositoryImpl(firestore);
    }
}
